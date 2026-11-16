import type { Metadata } from "next"
import { Sun } from "lucide-react"

import { ComingSoon } from "@/components/app-shell/coming-soon"
import { PageHeader } from "@/components/app-shell/page-header"

export const metadata: Metadata = { title: "Today · Closetify" }

export default function TodayPage() {
  return (
    <>
      <PageHeader title="Today" />
      <ComingSoon icon={Sun} description="An outfit for today's weather, every morning." />
    </>
  )
}
