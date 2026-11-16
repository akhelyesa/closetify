import { CalendarDays, Layers, Shirt, Sun, UserRound, type LucideIcon } from "lucide-react"

export type Tab = {
  href: string
  label: string
  icon: LucideIcon
}

export const TABS: readonly Tab[] = [
  { href: "/today", label: "Today", icon: Sun },
  { href: "/closet", label: "Closet", icon: Shirt },
  { href: "/outfits", label: "Outfits", icon: Layers },
  { href: "/planner", label: "Planner", icon: CalendarDays },
  { href: "/profile", label: "Profile", icon: UserRound },
]

/** A tab is active on its own page and on any page below it (e.g. /closet/123). */
export function isTabActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}
