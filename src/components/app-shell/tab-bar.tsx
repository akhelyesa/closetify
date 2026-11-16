"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { isTabActive, TABS } from "@/components/app-shell/tabs"
import { cn } from "@/lib/utils"

export function TabBar() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
    >
      <ul className="mx-auto grid h-16 max-w-md grid-cols-5">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = isTabActive(pathname, href)

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors duration-150",
                  "outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon
                  aria-hidden
                  className="size-[22px]"
                  strokeWidth={active ? 2.25 : 1.75}
                />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
