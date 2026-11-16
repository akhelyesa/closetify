import type { Metadata } from "next"

import { PageHeader } from "@/components/app-shell/page-header"

export const metadata: Metadata = { title: "Closet · Closetify" }

// Step 3 adds the + button and add flow, step 4 the grid and filters.
export default function ClosetPage() {
  return (
    <>
      <PageHeader title="Closet" />
      <div className="rounded-2xl bg-card px-6 py-16 text-center">
        <p className="font-medium">Your closet is empty</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Your clothes will show up here.
        </p>
      </div>
    </>
  )
}
