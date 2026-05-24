"use client"

import { useState, useEffect, useTransition } from "react"
import Link from "next/link"
import { Search, Loader2, ShieldCheck, CheckCircle2, AlertTriangle, UserCheck, Flame, Ban, Trash2, ArrowUpRight } from "lucide-react"
import { getModerationReports, resolveReport, adjustUserTrustScore } from "@/features/admin/actions"
import { cn } from "@/lib/utils"

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("pending")
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  const loadReports = async () => {
    setLoading(true)
    const res = await getModerationReports()
    if (res.success && res.reports) {
      setReports(res.reports)
    } else {
      setMessage({ text: res.error || "Failed to load reports.", type: "error" })
    }
    setLoading(false)
  }

  useEffect(() => {
    loadReports()
  }, [])

  const handleResolve = (reportId: string, action: "dismiss" | "unlist") => {
    setMessage(null)
    startTransition(async () => {
      const res = await resolveReport(reportId, action)
      if (res.success) {
        setMessage({
          text: `Report successfully resolved with action: ${action.toUpperCase()}`,
          type: "success"
        })
        // Refresh local state
        setReports(prev =>
          prev.map(r => {
            if (r.id === reportId) {
              return { ...r, status: action === "dismiss" ? "dismissed" : "resolved" }
            }
            // If we unlisted, resolve all other reports for that listing too
            if (action === "unlist" && r.listing?.id === reports.find(x => x.id === reportId)?.listing?.id) {
              return { ...r, status: "resolved" }
            }
            return r
          })
        )
      } else {
        setMessage({ text: res.error || "Action failed.", type: "error" })
      }
    })
  }

  const handleAdjustTrust = (userId: string, currentName: string) => {
    setMessage(null)
    const penalty = -15
    startTransition(async () => {
      const res = await adjustUserTrustScore(userId, penalty, `Moderator report penalty`)
      if (res.success) {
        setMessage({
          text: `Successfully deducted 15 Trust points from ${currentName}. New score is ${res.newScore}/100.`,
          type: "success"
        })
      } else {
        setMessage({ text: res.error || "Action failed.", type: "error" })
      }
    })
  }

  // Filter reports list
  const filteredReports = reports.filter((r) => {
    const matchesSearch = 
      (r.listing?.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.reporter?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.listing?.seller?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = 
      statusFilter === "all" || 
      r.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-slate-800">
            Reports &amp; Safety Queue
          </h2>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Resolve student flags, audit chat context, and manage seller reputation scores.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div className={cn(
          "p-4 rounded-2xl border font-body text-xs font-semibold flex items-center gap-2",
          message.type === "success" 
            ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
            : "bg-error/5 border-error/15 text-error"
        )}>
          {message.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-outline-variant/20 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between select-none">
        {/* Search */}
        <div className="relative w-full md:w-80 shadow-sm rounded-full bg-slate-50 border border-outline-variant/30 px-4 py-1.5 focus-within:ring-2 focus-within:ring-primary/20 transition-all flex items-center">
          <Search size={16} className="text-outline shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reports or listings..."
            className="flex-1 bg-transparent border-none outline-none font-body text-xs px-2.5 py-1.5 text-on-surface"
          />
        </div>

        {/* Status Filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: "pending", label: "Pending Reviews" },
            { id: "resolved", label: "Resolved" },
            { id: "dismissed", label: "Dismissed" },
            { id: "all", label: "All Logs" }
          ].map((status) => (
            <button
              key={status.id}
              onClick={() => setStatusFilter(status.id)}
              className={cn(
                "px-4 py-2 rounded-full font-body text-xs font-semibold cursor-pointer transition-all border whitespace-nowrap",
                statusFilter === status.id
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-slate-50 border-outline-variant/20 text-on-surface-variant hover:bg-slate-100 hover:text-on-surface"
              )}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Catalog */}
      <div className="flex flex-col gap-6">
        {loading ? (
          <div className="bg-white border border-outline-variant/20 rounded-[2rem] p-20 flex flex-col items-center justify-center gap-2 text-on-surface-variant shadow-sm">
            <Loader2 className="animate-spin text-primary" size={24} />
            <span className="font-body text-xs font-semibold">Loading report workspace...</span>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="bg-white border border-outline-variant/20 rounded-[2rem] p-20 flex flex-col items-center justify-center text-center gap-2 shadow-sm">
            <ShieldCheck className="text-emerald-500 bg-emerald-50 border border-emerald-100 p-2.5 rounded-full" size={48} />
            <h4 className="font-body text-sm font-bold text-on-surface mt-2">All clear! No reports pending</h4>
            <p className="font-body text-xs text-on-surface-variant max-w-[280px]">
              No flagged items match the selected filter. The campus feed is running clean.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredReports.map((r) => {
              const listing = r.listing || { title: "Deleted Item", price: 0, condition: "Unknown", seller: null, campus: "AMU", slug: "" }
              const seller = listing.seller || { id: "", full_name: "Deleted User", email: "" }
              const reporter = r.reporter || { full_name: "Anonymous student", email: "" }

              const isPendingReport = r.status === "pending"

              return (
                <div 
                  key={r.id} 
                  className={cn(
                    "bg-white border rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col gap-6 relative overflow-hidden transition-all",
                    isPendingReport ? "border-rose-100 bg-gradient-to-br from-white to-rose-50/5" : "border-outline-variant/15"
                  )}
                >
                  {/* Status strip */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/10 pb-4">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider",
                        r.status === "pending" && "bg-rose-50 text-rose-700 border border-rose-100 animate-pulse",
                        r.status === "resolved" && "bg-emerald-50 text-emerald-700 border border-emerald-100",
                        r.status === "dismissed" && "bg-slate-100 text-slate-600 border border-slate-200"
                      )}>
                        {r.status}
                      </span>
                      <span className="font-body text-[10px] text-on-surface-variant/70">
                        Reported on {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <div className="text-right font-body text-[10px] text-on-surface-variant/80 font-medium">
                      Flagged by <span className="font-bold text-slate-800">{reporter.full_name}</span> ({reporter.email})
                    </div>
                  </div>

                  {/* Core detail panel */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Column 1: Listing details */}
                    <div className="lg:col-span-6 flex flex-col gap-3">
                      <span className="text-[10px] font-bold text-on-surface-variant/65 uppercase tracking-wider">
                        Flagged Item Details
                      </span>
                      <div className="bg-slate-50 border border-outline-variant/15 rounded-2xl p-4 flex flex-col gap-1 text-left">
                        {listing.slug ? (
                          <Link
                            href={`/item/${listing.slug}`}
                            target="_blank"
                            className="font-body text-sm font-bold text-slate-800 hover:text-primary hover:underline flex items-center gap-1.5 w-fit"
                          >
                            <span>{listing.title}</span>
                            <ArrowUpRight size={14} />
                          </Link>
                        ) : (
                          <span className="font-body text-sm font-bold text-slate-500 italic">
                            {listing.title} (Catalog record missing)
                          </span>
                        )}
                        <span className="font-display font-semibold text-primary text-sm mt-1">
                          ₹{listing.price} • {listing.condition} • {listing.campus}
                        </span>
                        <div className="mt-3 flex flex-col gap-0.5 border-t border-outline-variant/10 pt-2.5">
                          <span className="text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-wide">
                            Seller:
                          </span>
                          <span className="font-body text-xs font-semibold text-slate-700">
                            {seller.full_name} ({seller.email})
                          </span>
                          {seller.department && (
                            <span className="font-body text-[10px] text-on-surface-variant">
                              {seller.department} • {seller.university}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Flag description */}
                    <div className="lg:col-span-6 flex flex-col gap-3 h-full justify-between">
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-on-surface-variant/65 uppercase tracking-wider">
                          Report Explanation / Reason
                        </span>
                        <div className="bg-rose-50/20 border border-rose-100/40 rounded-2xl p-4 font-body text-xs text-on-surface-variant leading-relaxed min-h-[80px]">
                          {r.reason}
                        </div>
                      </div>

                      {/* Admin resolution buttons */}
                      {isPendingReport && (
                        <div className="flex flex-wrap items-center gap-2.5 mt-4">
                          <button
                            onClick={() => handleResolve(r.id, "dismiss")}
                            disabled={isPending}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-body text-[10px] font-bold uppercase tracking-wider rounded-full transition-all border border-slate-200 cursor-pointer disabled:opacity-50 flex items-center gap-1"
                          >
                            <UserCheck size={12} />
                            Dismiss Flag
                          </button>
                          
                          <button
                            onClick={() => handleResolve(r.id, "unlist")}
                            disabled={isPending}
                            className="px-4 py-2 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-700 font-body text-[10px] font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                          >
                            <Trash2 size={12} />
                            Unlist Item
                          </button>

                          {seller.id && (
                            <button
                              onClick={() => handleAdjustTrust(seller.id, seller.full_name)}
                              disabled={isPending}
                              className="px-4 py-2 bg-orange-50 border border-orange-100 hover:bg-orange-100 text-orange-700 font-body text-[10px] font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                            >
                              <Flame size={12} />
                              Penalize (-15 Trust)
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
