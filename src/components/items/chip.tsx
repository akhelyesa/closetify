import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

/** A toggle pill for picking one or more options. */
export function Chip({
  selected,
  className,
  ...props
}: ComponentProps<"button"> & { selected: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "h-9 shrink-0 rounded-full border px-3.5 text-sm transition-colors duration-150",
        "outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        selected
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-card text-foreground hover:bg-muted",
        className,
      )}
      {...props}
    />
  )
}
