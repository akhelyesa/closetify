import type { ReactNode } from "react"

export function PageHeader({
  title,
  action,
}: {
  title: string
  action?: ReactNode
}) {
  return (
    <header className="flex items-center justify-between gap-4 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-6">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {action}
    </header>
  )
}
