import type { Metadata } from "next"
import { Layers } from "lucide-react"

import { ComingSoon } from "@/components/app-shell/coming-soon"
import { PageHeader } from "@/components/app-shell/page-header"

export const metadata: Metadata = { title: "Outfits · Closetify" }

export default function OutfitsPage() {
  return (
    <>
      <PageHeader title="Outfits" />
      <ComingSoon icon={Layers} description="Build outfits and keep your favorites." />
    </>
  )
}
