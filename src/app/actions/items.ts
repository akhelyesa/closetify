"use server"

import { revalidatePath } from "next/cache"

import { canonicalBrand } from "@/lib/items/brands"
import { itemFolder, itemPhotoPaths, ITEMS_BUCKET } from "@/lib/items/paths"
import { newItemSchema, type NewItemInput } from "@/lib/items/schema"
import { createClient } from "@/lib/supabase/server"

export type CreateItemResult =
  | { ok: true; id: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }

type Supabase = Awaited<ReturnType<typeof createClient>>

/**
 * Saves a new item after the browser has uploaded its 3 photos to
 * <user_id>/<item_id>/. If saving fails, the uploaded photos are removed.
 */
export async function createItem(input: NewItemInput): Promise<CreateItemResult> {
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims?.sub
  if (!userId) return { ok: false, error: "You're signed out. Sign in and try again." }

  const parsed = newItemSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = String(issue.path.at(-1) ?? "form")
      fieldErrors[field] ??= issue.message
    }
    return { ok: false, error: "Check the highlighted fields.", fieldErrors }
  }

  const { id, hasCutout, details } = parsed.data

  // Paths are built here from the signed-in user, never taken from the browser.
  const paths = itemPhotoPaths(userId, id)

  const uploaded = await hasAllPhotos(supabase, userId, id)
  if (!uploaded) {
    await removePhotos(supabase, userId, id)
    return { ok: false, error: "The photos didn't finish uploading. Try again." }
  }

  const brand = details.brand
    ? canonicalBrand(details.brand, await existingBrands(supabase, details.brand))
    : null

  const { error } = await supabase.from("items").insert({
    id,
    user_id: userId,
    category: details.category,
    subcategory: details.subcategory,
    colors: details.colors,
    pattern: details.pattern,
    name: details.name,
    brand,
    size: details.size,
    notes: details.notes,
    has_cutout: hasCutout,
    original_path: paths.original,
    cutout_path: paths.cutout,
    thumb_path: paths.thumb,
  })

  if (error) {
    console.error("createItem: insert failed", { itemId: id, code: error.code })
    await removePhotos(supabase, userId, id)
    return { ok: false, error: "Couldn't save the item. Try again." }
  }

  revalidatePath("/closet")
  return { ok: true, id }
}

async function hasAllPhotos(supabase: Supabase, userId: string, itemId: string) {
  const { data, error } = await supabase.storage
    .from(ITEMS_BUCKET)
    .list(itemFolder(userId, itemId))
  if (error || !data) return false

  const names = new Set(data.map((file) => file.name))
  return ["original.webp", "cutout.webp", "thumb.webp"].every((name) => names.has(name))
}

/** Best effort: a failure is logged for later cleanup, never hidden as success. */
async function removePhotos(supabase: Supabase, userId: string, itemId: string) {
  const paths = Object.values(itemPhotoPaths(userId, itemId))
  const { error } = await supabase.storage.from(ITEMS_BUCKET).remove(paths)
  if (error) {
    console.error("createItem: photo cleanup failed", { itemId, message: error.message })
  }
}

/** Brands the user already has that match the typed one, ignoring case. */
async function existingBrands(supabase: Supabase, brand: string) {
  const escaped = brand.replace(/[\\%_]/g, (char) => `\\${char}`)
  const { data } = await supabase
    .from("items")
    .select("brand")
    .ilike("brand", escaped)
    .order("created_at", { ascending: false })
    .limit(1)
  return (data ?? []).map((row) => row.brand).filter((b): b is string => Boolean(b))
}
