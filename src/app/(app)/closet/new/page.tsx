import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { PageHeader } from "@/components/app-shell/page-header"
import { AddItemFlow } from "@/components/items/add-item-flow"
import { buttonVariants } from "@/components/ui/button"
import { uniqueBrands } from "@/lib/items/brands"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Add item · Closetify" }

export default function NewItemPage() {
  return (
    <>
      <PageHeader
        title="Add item"
        action={
          <Link href="/closet" className={buttonVariants({ variant: "ghost", size: "lg" })}>
            Cancel
          </Link>
        }
      />
      <div className="mx-auto w-full max-w-xl">
        <Suspense fallback={<div className="aspect-square animate-pulse rounded-2xl bg-card" />}>
          <AddItemLoader />
        </Suspense>
      </div>
    </>
  )
}

async function AddItemLoader() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub
  if (!userId) redirect("/login")

  // Brand suggestions come from your own items, newest first.
  const { data: rows } = await supabase
    .from("items")
    .select("brand")
    .not("brand", "is", null)
    .order("created_at", { ascending: false })
    .limit(500)

  return <AddItemFlow userId={userId} brands={uniqueBrands((rows ?? []).map((r) => r.brand))} />
}
