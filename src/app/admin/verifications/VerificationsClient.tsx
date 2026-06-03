"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { 
  ShieldCheck, 
  XCircle, 
  AlertCircle, 
  User, 
  Mail, 
  Phone,
  School, 
  BookOpen, 
  Award,
  Loader2,
  ExternalLink,
  Check
} from "lucide-react"
import { resolveVerification } from "@/features/admin/actions"
import { cn } from "@/lib/utils"

interface VerificationItem {
  id: string
  document_url: string
  status: string
  created_at: string
  user: {
    id: string
    full_name: string | null
    email: string | null
    phone: string | null
    phone_verified: boolean | null
    university: string | null
    department: string | null
    trust_score: number | null
  } | null
}

interface VerificationsClientProps {
  initialVerifications: VerificationItem[]
}

const submittedDateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
})

export function VerificationsClient({ initialVerifications }: VerificationsClientProps) {
  const router = useRouter()
  const [verifications, setVerifications] = useState<VerificationItem[]>(initialVerifications)
  const [isPending, startTransition] = useTransition()
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({})

  const handleResolve = (id: string, action: "approve" | "reject") => {
    setMessage(null)
    setProcessingId(id)

    startTransition(async () => {
      const notes = adminNotes[id] || ""
      const res = await resolveVerification(id, action, notes)

      if (res.success) {
        setMessage({
          text: `Verification request successfully ${action === "approve" ? "approved" : "rejected"}.`,
          type: "success"
        })
        // Remove from list
        setVerifications(prev => prev.filter(item => item.id !== id))
        router.refresh()
      } else {
        setMessage({
          text: res.error || "Failed to resolve verification request.",
          type: "error"
        })
      }
      setProcessingId(null)
    })
  }

  return (
    <div className="flex flex-col gap-6 text-left">
      {message && (
        <div className={cn(
          "p-4 rounded-xl border font-body text-xs font-semibold flex items-center gap-2 max-w-2xl",
          message.type === "success" ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-red-50 border-red-100 text-red-700"
        )}>
          {message.type === "success" ? <ShieldCheck className="text-emerald-600 size-5" /> : <AlertCircle className="text-red-500 size-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {verifications.length === 0 ? (
        <div className="bg-white border border-outline-variant/15 rounded-3xl p-12 text-center shadow-sm max-w-2xl">
          <ShieldCheck className="size-16 text-primary/20 mx-auto mb-4" />
          <h3 className="font-display text-lg font-extrabold text-slate-800">Verification Queue is Empty</h3>
          <p className="text-on-surface-variant text-xs mt-1.5 leading-relaxed">
            There are currently no student ID card submissions pending review.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 max-w-4xl">
          {verifications.map((item) => {
            const user = item.user || {
              id: "",
              full_name: "Unknown User",
              email: "unknown@student",
              phone: null,
              phone_verified: false,
              university: "AMU",
              department: "Physics",
              trust_score: 50
            }

            return (
              <div 
                key={item.id} 
                className="bg-white border border-outline-variant/20 rounded-[2rem] p-6 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 relative overflow-hidden"
              >
                {/* 1. Student Details (Left 5 cols) */}
                <div className="md:col-span-5 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                      {user.full_name?.slice(0, 2).toUpperCase() || "US"}
                    </div>
                    <div>
                      <h4 className="font-display font-extrabold text-slate-800 text-sm">{user.full_name || "Campus Student"}</h4>
                      <span className="text-[10px] text-on-surface-variant font-medium">
                        Submitted {submittedDateFormatter.format(new Date(item.created_at))}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 text-xs text-on-surface-variant font-body">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-primary shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-primary shrink-0" />
                      <span className="truncate">{user.phone || "No phone on profile"}</span>
                      {user.phone_verified ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
                          Verified
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">
                          Unverified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <School size={14} className="text-primary shrink-0" />
                      <span className="truncate">{user.university}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen size={14} className="text-primary shrink-0" />
                      <span className="truncate">{user.department || "No Department"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award size={14} className="text-secondary shrink-0" />
                      <span className="font-semibold text-secondary">Current Trust: {user.trust_score || 50} / 100</span>
                    </div>
                  </div>

                  {/* Notes Field */}
                  <div className="mt-2">
                    <label className="text-[10px] font-semibold text-slate-700 block mb-1">Review Notes (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Expired ID, clear photo needed"
                      value={adminNotes[item.id] || ""}
                      onChange={(e) => setAdminNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                      disabled={isPending && processingId === item.id}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-primary text-slate-800 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* 2. Image Document Preview (Middle 4 cols) */}
                <div className="md:col-span-4 flex flex-col gap-2">
                  <span className="text-[10px] font-semibold text-slate-700 block">ID Document Image</span>
                  <div className="relative border border-slate-100 rounded-xl overflow-hidden aspect-video bg-slate-50 flex items-center justify-center group">
                    <img 
                      src={item.document_url} 
                      alt="Student ID Card" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-all"
                    />
                    <a 
                      href={item.document_url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white text-[10px] font-bold"
                    >
                      <ExternalLink size={12} /> View Fullscreen
                    </a>
                  </div>
                </div>

                {/* 3. Action Buttons (Right 3 cols) */}
                <div className="md:col-span-3 flex flex-col justify-center gap-3">
                  <button
                    onClick={() => handleResolve(item.id, "approve")}
                    disabled={isPending}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer text-xs transition-all flex items-center justify-center gap-1 hover:shadow-md disabled:opacity-50"
                  >
                    {isPending && processingId === item.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Check size={12} />
                    )}
                    <span>Approve (+30 Points)</span>
                  </button>

                  <button
                    onClick={() => handleResolve(item.id, "reject")}
                    disabled={isPending}
                    className="w-full py-2.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 font-bold rounded-xl cursor-pointer text-xs transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    {isPending && processingId === item.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <XCircle size={12} />
                    )}
                    <span>Reject Submission</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
