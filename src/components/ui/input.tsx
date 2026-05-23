import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-12 w-full rounded-xl border-[1.5px] border-border bg-surface px-4 py-3 text-base shadow-sm font-body transition-all duration-[180ms]",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:border-accent focus-visible:ring-[3px] focus-visible:ring-accent/15",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}
Input.displayName = "Input"

export { Input }
