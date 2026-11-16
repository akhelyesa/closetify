import type { LucideIcon } from "lucide-react"

export function ComingSoon({
  icon: Icon,
  description,
}: {
  icon: LucideIcon
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-card px-6 py-16 text-center">
      <Icon aria-hidden className="size-8 text-muted-foreground" strokeWidth={1.5} />
      <p className="mt-4 font-medium">Coming soon</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
