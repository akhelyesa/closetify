import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { Plus } from "lucide-react"

import { PageHeader } from "@/components/app-shell/page-header"
import { buttonVariants } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Closet · Closetify" }

// Step 4 replaces the count with the grid and filters.
export default function ClosetPage() {
  return (
    <>
      <PageHeader
        title="Closet"
        action={
          <Link
            href="/closet/new"
            aria-label="Add item"
            className={cn(buttonVariants({ size: "icon-lg" }), "size-10 rounded-full")}
          >
            <Plus className="size-5" />
          </Link>
        }
      />
      <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-card" />}>
        <ClosetSummary />
      </Suspense>
    </>
  )
}

async function ClosetSummary() {
  const supabase = await createClient()
  const { count } = await supabase
    .from("items")
    .select("id", { count: "exact", head: true })
    .neq("status", "archived")

  if (!count) {
    return (
      <div className="flex flex-col items-center rounded-2xl bg-card px-6 py-16 text-center">
        <p className="font-medium">Your closet is empty</p>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Start with the 20 pieces you wear most.
        </p>
        <Link href="/closet/new" className={cn(buttonVariants({ size: "lg" }), "mt-6 h-11 px-5")}>
          Add your first item
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-card px-6 py-16 text-center">
      <p className="font-medium">
        {count} {count === 1 ? "item" : "items"} in your closet
      </p>
      <p className="mt-1 text-sm text-muted-foreground">The grid comes in the next step.</p>
    </div>
  )
}
