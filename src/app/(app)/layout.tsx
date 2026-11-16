import type { ReactNode } from "react"

import { TabBar } from "@/components/app-shell/tab-bar"

// Shared shell for the 5 tabs. One layout for every screen size:
// centered content, bottom tab bar everywhere.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:px-6">
        {children}
      </main>
      <TabBar />
    </>
  )
}
