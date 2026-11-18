import type { SupabaseClient } from "@supabase/supabase-js"

import { PHOTO_CACHE_SECONDS } from "@/lib/images/sizes"
import { itemPhotoPaths, ITEMS_BUCKET } from "@/lib/items/paths"

export type ItemPhotoBlobs = { original: Blob; cutout: Blob; thumb: Blob }

/**
 * Uploads the 3 photos straight from the browser into <user_id>/<item_id>/.
 * If one fails, the ones already uploaded are removed again (best effort).
 */
export async function uploadItemPhotos(
  supabase: SupabaseClient,
  userId: string,
  itemId: string,
  photos: ItemPhotoBlobs,
) {
  const paths = itemPhotoPaths(userId, itemId)
  const done: string[] = []

  try {
    for (const key of ["original", "cutout", "thumb"] as const) {
      const { error } = await supabase.storage.from(ITEMS_BUCKET).upload(paths[key], photos[key], {
        contentType: "image/webp",
        cacheControl: String(PHOTO_CACHE_SECONDS),
        upsert: false,
      })
      if (error) throw error
      done.push(paths[key])
    }
  } catch (error) {
    if (done.length > 0) {
      const { error: cleanupError } = await supabase.storage.from(ITEMS_BUCKET).remove(done)
      if (cleanupError) console.error("uploadItemPhotos: cleanup failed", cleanupError.message)
    }
    throw error
  }
}
