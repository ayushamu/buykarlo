"use client"

import { useState, useTransition } from "react"
import { AlertCircle, CheckCircle2, Loader2, X } from "lucide-react"
import { flagListingByStudent } from "@/features/admin/actions"

interface ReportListingButtonProps {
  listingId: string
}

export function ReportListingButton({ listingId }: ReportListingButtonProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const trimmedReason = reason.trim()

  const handleSubmit = () => {
    setMessage(null)

    if (trimmedReason.length < 10) {
      setMessage({ type: "error", text: "Please add a short reason so the admin can review it." })
      return
    }

    startTransition(async () => {
      const res = await flagListingByStudent(listingId, trimmedReason)

      if (res.success) {
        setMessage({ type: "success", text: "Report submitted. Admin will review this listing." })
        setReason("")
      } else {
        setMessage({ type: "error", text: res.error || "Could not submit the report." })
      }
    })
  }

  return (
    <>
      <button
        onClick={() => {
          setOpen(true)
          setMessage(null)
        }}
        className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-base font-semibold text-error transition-colors hover:bg-error/5"
      >
        <AlertCircle size={16} />
        Report Listing
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md rounded-[1.75rem] border border-outline-variant/20 bg-white p-5 text-left shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-xl font-extrabold text-on-surface">Report Listing</h3>
                <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
                  Tell us what seems unsafe, misleading, or against campus trading rules.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                aria-label="Close report dialog"
              >
                <X size={16} />
              </button>
            </div>

            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={500}
              placeholder="Example: suspicious price, misleading photos, duplicate listing, unsafe meetup request..."
              className="mt-5 min-h-32 w-full resize-none rounded-2xl border border-outline-variant/25 bg-slate-50 px-4 py-3 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/15"
            />

            <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-on-surface-variant">
              <span>{trimmedReason.length < 10 ? "Minimum 10 characters" : "Ready to submit"}</span>
              <span>{reason.length}/500</span>
            </div>

            {message && (
              <div className={`mt-4 flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-bold ${
                message.type === "success"
                  ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                  : "border-red-100 bg-red-50 text-red-700"
              }`}>
                {message.type === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                <span>{message.text}</span>
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-full border border-outline-variant/20 px-4 py-2 text-xs font-bold text-on-surface-variant transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending || trimmedReason.length < 10}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-error px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? <Loader2 size={14} className="animate-spin" /> : <AlertCircle size={14} />}
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
