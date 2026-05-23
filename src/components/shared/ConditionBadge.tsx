import { cn } from "@/lib/utils"

export type Condition = "new" | "like_new" | "good" | "fair" | "poor"

interface ConditionBadgeProps {
  condition: Condition
  className?: string
}

const conditionStyles: Record<Condition, string> = {
  new: "bg-[#DCFCE7] text-[#166534]",
  like_new: "bg-[#DBEAFE] text-[#1E40AF]",
  good: "bg-[#FEF9C3] text-[#854D0E]",
  fair: "bg-[#FEE2E2] text-[#991B1B]",
  poor: "bg-muted text-muted-foreground",
}

const conditionLabels: Record<Condition, string> = {
  new: "New",
  like_new: "Like New",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
}

export function ConditionBadge({ condition, className }: ConditionBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] uppercase tracking-wide font-semibold",
        conditionStyles[condition],
        className
      )}
    >
      {conditionLabels[condition]}
    </span>
  )
}
