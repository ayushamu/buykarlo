"use client"

import { useState, useEffect, useTransition } from "react"
import Link from "next/link"
import { Search, Loader2, ShieldAlert, CheckCircle2, AlertTriangle, Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react"
import { getAdminListings, updateListingStatusByAdmin } from "@/features/admin/actions"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 12

export default function AdminListingsPage() {
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  })
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  const loadListings = async (nextPage = page) => {
    setLoading(true)
    const res = await getAdminListings({
      page: nextPage,
      pageSize: PAGE_SIZE,
      searchQuery,
      status: statusFilter,
    })

    if (res.success && res.listings) {
      setListings(res.listings)
      if (res.pagination) {
        setPagination(res.pagination)
      }
    } else {
      setMessage({ text: res.error || "Failed to load listings.", type: "error" })
    }
    setLoading(false)
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadListings(page)
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [page, searchQuery, statusFilter])

  const handleToggleStatus = (listingId: string, currentStatus: string) => {
    setMessage(null)
    const newStatus = currentStatus === "active" ? "hidden" : "active"
    
    startTransition(async () => {
      const res = await updateListingStatusByAdmin(listingId, newStatus)
      if (res.success) {
        setMessage({ 
          text: `Listing successfully ${newStatus === "active" ? "relisted" : "unlisted"}.`, 
          type: "success" 
        })
        setListings(prev => 
          prev.map(l => l.id === listingId ? { ...l, status: newStatus } : l)
        )
        loadListings(page)
      } else {
        setMessage({ text: res.error || "Action failed.", type: "error" })
      }
    })
  }

  const firstVisibleItem = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1
  const lastVisibleItem = Math.min(pagination.page * pagination.pageSize, pagination.total)

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-slate-800">
            Catalog Management
          </h2>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Browse, inspect, and unlist/relist listings across all campus branches.
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
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
            placeholder="Search items or sellers..."
            className="flex-1 bg-transparent border-none outline-none font-body text-xs px-2.5 py-1.5 text-on-surface"
          />
        </div>

        {/* Status Filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: "all", label: "All Items" },
            { id: "active", label: "Active" },
            { id: "sold", label: "Sold" },
            { id: "hidden", label: "Hidden" }
          ].map((status) => (
            <button
              key={status.id}
              onClick={() => {
                setStatusFilter(status.id)
                setPage(1)
              }}
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

      {/* Catalog Table */}
      <div className="bg-white border border-outline-variant/20 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-outline-variant/15 bg-white px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-display text-sm font-extrabold text-slate-800">Listings Review</h3>
            <p className="font-body text-[11px] text-on-surface-variant">
              Showing {firstVisibleItem}-{lastVisibleItem} of {pagination.total} matching listings.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={loading || pagination.page <= 1}
              className="inline-flex size-9 items-center justify-center rounded-full border border-outline-variant/20 bg-slate-50 text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous listings page"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="min-w-20 text-center font-body text-[11px] font-bold text-on-surface-variant">
              Page {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
              disabled={loading || pagination.page >= pagination.totalPages}
              className="inline-flex size-9 items-center justify-center rounded-full border border-outline-variant/20 bg-slate-50 text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next listings page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2 text-on-surface-variant">
              <Loader2 className="animate-spin text-primary" size={24} />
              <span className="font-body text-xs font-semibold">Loading catalog details...</span>
            </div>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
              <ShieldAlert className="text-outline/40" size={32} />
              <h4 className="font-body text-sm font-bold text-on-surface">No products found</h4>
              <p className="font-body text-xs text-on-surface-variant max-w-[280px]">
                No listings matched your active search query or status filter.
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse font-body text-xs text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-outline-variant/20 font-bold text-on-surface-variant uppercase tracking-wider select-none">
                  <th className="px-6 py-4">Product Details</th>
                  <th className="px-6 py-4">Seller Info</th>
                  <th className="px-6 py-4">Campus Scope</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {listings.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Product */}
                    <td className="px-6 py-4 max-w-[240px]">
                      <div className="flex flex-col">
                        <Link 
                          href={`/item/${l.slug || l.id}`}
                          target="_blank"
                          className="font-bold text-slate-800 hover:text-primary hover:underline line-clamp-1 flex items-center gap-1.5 w-fit"
                        >
                          {l.title}
                        </Link>
                        <span className="text-[10px] text-on-surface-variant/70 mt-1">
                          ₹{l.price.toLocaleString("en-IN")} • {l.category?.name || "Uncategorized"}
                        </span>
                      </div>
                    </td>

                    {/* Seller */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">
                          {l.seller?.full_name || "Campus User"}
                        </span>
                        <span className="text-[10px] text-on-surface-variant/70">
                          {l.seller?.email || "No email available"}
                        </span>
                      </div>
                    </td>

                    {/* Campus */}
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-700">{l.campus}</span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        l.status === "active" && "bg-emerald-50 text-emerald-700 border border-emerald-100",
                        l.status === "sold" && "bg-blue-50 text-blue-700 border border-blue-100",
                        l.status === "hidden" && "bg-slate-100 text-slate-600 border border-slate-200"
                      )}>
                        {l.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-center">
                      {l.status !== "sold" ? (
                        <button
                          onClick={() => handleToggleStatus(l.id, l.status)}
                          disabled={isPending}
                          className={cn(
                            "inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-full font-bold text-[10px] tracking-wider uppercase transition-all cursor-pointer disabled:opacity-50 border",
                            l.status === "active" 
                              ? "bg-slate-50 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 text-slate-600" 
                              : "bg-primary text-white border-primary hover:opacity-90 shadow-sm"
                          )}
                        >
                          {l.status === "active" ? (
                            <>
                              <EyeOff size={12} />
                              <span>Unlist</span>
                            </>
                          ) : (
                            <>
                              <Eye size={12} />
                              <span>Relist</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-on-surface-variant/50 uppercase select-none">
                          Archived
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
