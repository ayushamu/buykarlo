import { BadgeCheck } from "lucide-react"

export function VerifiedBadge() {
  return (
    <div className="inline-flex items-center gap-1 bg-verified-bg text-verified px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase shadow-sm">
      <BadgeCheck size={14} className="text-verified" />
      <span>Verified Student</span>
    </div>
  )
}
