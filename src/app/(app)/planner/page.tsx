import type { Metadata } from "next"
import { CalendarDays } from "lucide-react"

import { ComingSoon } from "@/components/app-shell/coming-soon"
import { PageHeader } from "@/components/app-shell/page-header"

export const metadata: Metadata = { title: "Planner · Closetify" }

export default function PlannerPage() {
  return (
    <>
      <PageHeader title="Planner" />
      <ComingSoon icon={CalendarDays} description="Plan what you'll wear this week." />
    </>
  )
}
