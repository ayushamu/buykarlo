"use client"

import { useState, useEffect, useTransition } from "react"
import Link from "next/link"
import { 
  Search, Loader2, ShieldAlert, CheckCircle2, AlertTriangle, 
  ChevronLeft, ChevronRight, Plus, Copy, Download, Trophy, 
  DollarSign, X, ExternalLink, LinkIcon, Phone, Mail, 
  Users, Package, MessageSquare, Clipboard, Star
} from "lucide-react"
import { 
  createPartner, 
  getPartnersWithStats, 
  getPartnerDetails, 
  updatePartnerStatus,
  recordPartnerPayout,
  deletePartner
} from "@/features/partners/actions"
import { cn } from "@/lib/utils"

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  
  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: "",
    platform: "Instagram",
    handle: "",
    email: "",
    phone: "",
    upiId: "",
    referralCode: "",
    rewardPerListing: 10
  })

  // Details Panel State
  const [detailsPartnerId, setDetailsPartnerId] = useState<string | null>(null)
  const [partnerDetails, setPartnerDetails] = useState<any>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsTab, setDetailsTab] = useState<"users" | "listings">("users")

  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const loadPartners = async () => {
    setLoading(true)
    const res = await getPartnersWithStats()
    if (res.success && res.partners) {
      setPartners(res.partners)
    } else {
      setMessage({ text: res.error || "Failed to load partners.", type: "error" })
    }
    setLoading(false)
  }

  useEffect(() => {
    loadPartners()
  }, [])

  // Auto-generate code from name
  const handleGenerateCode = () => {
    if (!createForm.name) return
    const formatted = createForm.name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 8)
    setCreateForm(prev => ({ ...prev, referralCode: formatted }))
  }

  // Handle Create Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!createForm.name || !createForm.referralCode) {
      setMessage({ text: "Name and Referral Code are required.", type: "error" })
      return
    }

    startTransition(async () => {
      const res = await createPartner(createForm)
      if (res.success) {
        setMessage({ text: "Referral partner created successfully!", type: "success" })
        setIsCreateOpen(false)
        setCreateForm({
          name: "",
          platform: "Instagram",
          handle: "",
          email: "",
          phone: "",
          upiId: "",
          referralCode: "",
          rewardPerListing: 10
        })
        loadPartners()
      } else {
        setMessage({ text: res.error || "Failed to create partner.", type: "error" })
      }
    })
  }

  // Handle Toggle Status
  const handleToggleStatus = (partnerId: string, currentStatus: string) => {
    setMessage(null)
    const newStatus = currentStatus === "active" ? "inactive" : "active"
    startTransition(async () => {
      const res = await updatePartnerStatus(partnerId, newStatus)
      if (res.success) {
        setMessage({ text: `Partner status updated to ${newStatus}.`, type: "success" })
        setPartners(prev => prev.map(p => p.id === partnerId ? { ...p, status: newStatus } : p))
        if (partnerDetails && partnerDetails.partner.id === partnerId) {
          setPartnerDetails((prev: any) => ({
            ...prev,
            partner: { ...prev.partner, status: newStatus }
          }))
        }
      } else {
        setMessage({ text: res.error || "Failed to update status.", type: "error" })
      }
    })
  }

  // Open Partner Details
  const handleOpenDetails = async (partnerId: string) => {
    setDetailsPartnerId(partnerId)
    setDetailsLoading(true)
    setDetailsTab("users")
    const res = await getPartnerDetails(partnerId)
    if (res.success) {
      setPartnerDetails(res)
    } else {
      setMessage({ text: res.error || "Failed to load partner details.", type: "error" })
      setDetailsPartnerId(null)
    }
    setDetailsLoading(false)
  }

  // Copy referral link to clipboard
  const handleCopyLink = (code: string) => {
    const link = `https://buykarlo.in?ref=${code}`
    navigator.clipboard.writeText(link)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // Handle Mark As Paid
  const handleMarkAsPaid = async (partnerId: string, amount: number) => {
    if (!confirm(`Are you sure you want to record a payout of ₹${amount} for this partner?`)) {
      return
    }
    setMessage(null)
    startTransition(async () => {
      const res = await recordPartnerPayout(partnerId, amount)
      if (res.success) {
        setMessage({ text: `Payout of ₹${amount} recorded successfully.`, type: "success" })
        loadPartners()
        const detailsRes = await getPartnerDetails(partnerId)
        if (detailsRes.success) {
          setPartnerDetails(detailsRes)
        }
      } else {
        setMessage({ text: res.error || "Failed to record payout.", type: "error" })
      }
    })
  }

  // Handle Delete Partner
  const handleDeletePartner = async (partnerId: string) => {
    if (!confirm("Are you sure you want to delete this partner? This action is permanent and cannot be undone.")) {
      return
    }
    setMessage(null)
    startTransition(async () => {
      const res = await deletePartner(partnerId)
      if (res.success) {
        setMessage({ text: "Partner deleted successfully.", type: "success" })
        setDetailsPartnerId(null)
        setPartnerDetails(null)
        loadPartners()
      } else {
        setMessage({ text: res.error || "Failed to delete partner.", type: "error" })
      }
    })
  }

  // Export reports to CSV
  const handleExportCSV = (type: "performance" | "signups" | "listings") => {
    let csvContent = "data:text/csv;charset=utf-8,"
    let filename = ""

    if (type === "performance") {
      csvContent += "Partner Name,Platform,Handle,Referral Code,Status,Signups,Listings,Chats,Sales,Reward Rate (INR),Total Earnings (INR)\n"
      partners.forEach((p) => {
        csvContent += `"${p.name}","${p.platform}","${p.handle}","${p.referral_code}","${p.status}",${p.signups_count},${p.listings_count},${p.chats_count},${p.sales_count},${p.reward_per_listing},${p.total_earnings}\n`
      })
      filename = "partners_performance_report.csv"
    } else if (type === "signups" && partnerDetails) {
      csvContent += "User Name,Email,Phone,Date Joined\n"
      partnerDetails.recentSignups.forEach((u: any) => {
        csvContent += `"${u.full_name}","${u.email || "N/A"}","${u.phone || "N/A"}",${new Date(u.created_at).toLocaleDateString()}\n`
      })
      filename = `signups_report_${partnerDetails.partner.referral_code}.csv`
    } else if (type === "listings" && partnerDetails) {
      csvContent += "Listing Title,Price (INR),Status,Date Created,Seller Name,Seller Email\n"
      partnerDetails.recentListings.forEach((l: any) => {
        csvContent += `"${l.title}",${l.price},"${l.status}",${new Date(l.createdAt).toLocaleDateString()},"${l.sellerName}","${l.sellerEmail}"\n`
      })
      filename = `listings_report_${partnerDetails.partner.referral_code}.csv`
    }

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filter and Search partners
  const filteredPartners = partners.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.referral_code.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (statusFilter === "all") return matchesSearch
    return matchesSearch && p.status === statusFilter
  })

  // Calculate Overview Stats
  const totalPartners = partners.length
  const totalSignups = partners.reduce((sum, p) => sum + Number(p.signups_count || 0), 0)
  const totalListings = partners.reduce((sum, p) => sum + Number(p.listings_count || 0), 0)
  const totalPayouts = partners.reduce((sum, p) => sum + Number(p.total_earnings || 0), 0)
  const totalPending = partners.reduce((sum, p) => sum + Number(p.pending_earnings || 0), 0)

  // Get Top 3 partners for the Leaderboard
  const leaderboardPartners = [...partners]
    .sort((a, b) => Number(b.listings_count || 0) - Number(a.listings_count || 0))
    .slice(0, 3)

  return (
    <div className="flex flex-col gap-6 text-left select-none relative">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-slate-800">
            Referral Partner Program
          </h2>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Manage student influencers, meme pages, and campus representatives generating seller growth.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExportCSV("performance")}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-body text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Download size={14} />
            <span>Export Report</span>
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-primary hover:opacity-95 text-white font-body text-xs font-bold transition shadow-md cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Partner</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div className={cn(
          "p-4 rounded-2xl border font-body text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150",
          message.type === "success" 
            ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
            : "bg-error/5 border-error/15 text-error"
        )}>
          {message.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto hover:opacity-80">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Overview Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Partners", value: totalPartners, icon: Users, color: "text-indigo-600 bg-indigo-50" },
          { label: "Referred Signups", value: totalSignups, icon: Users, color: "text-emerald-600 bg-emerald-50" },
          { label: "Referred Listings", value: totalListings, icon: Package, color: "text-amber-600 bg-amber-50" },
          { label: "Pending Payouts", value: `₹${totalPending.toLocaleString("en-IN")}`, icon: DollarSign, color: "text-violet-600 bg-violet-50" },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className="bg-white border border-outline-variant/20 rounded-3xl p-5 shadow-sm flex items-center gap-4">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", stat.color)}>
                <Icon size={20} />
              </div>
              <div>
                <span className="font-body text-[10px] uppercase tracking-wider text-on-surface-variant font-bold block">
                  {stat.label}
                </span>
                <span className="font-display text-xl font-extrabold text-slate-800 mt-0.5 block">
                  {stat.value}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Leaderboard & Filter/Search Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Leaderboard Bento */}
        <div className="bg-white border border-outline-variant/20 rounded-[2rem] p-6 shadow-sm flex flex-col gap-4 lg:col-span-1">
          <div>
            <h3 className="font-display text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <Trophy className="text-amber-500" size={16} />
              <span>Campus Leaderboard</span>
            </h3>
            <p className="font-body text-[10px] text-on-surface-variant mt-0.5">
              Ranked by total referral listing volume.
            </p>
          </div>

          <div className="flex flex-col gap-3 justify-center flex-1">
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="animate-spin text-primary" size={18} />
              </div>
            ) : leaderboardPartners.length === 0 ? (
              <div className="text-center py-6 font-body text-xs text-on-surface-variant">
                No active leaderboard data yet.
              </div>
            ) : (
              leaderboardPartners.map((p, idx) => (
                <div 
                  key={p.id} 
                  className={cn(
                    "flex items-center gap-3 p-3.5 rounded-2xl border transition-all",
                    idx === 0 && "bg-amber-50/30 border-amber-100/60 shadow-sm",
                    idx === 1 && "bg-slate-50/50 border-slate-100",
                    idx === 2 && "bg-orange-50/20 border-orange-100/30"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-xl font-display font-black text-xs flex items-center justify-center border shrink-0",
                    idx === 0 && "bg-amber-400 border-amber-500 text-white shadow-sm",
                    idx === 1 && "bg-slate-300 border-slate-400 text-slate-700",
                    idx === 2 && "bg-orange-300 border-orange-400 text-orange-800"
                  )}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-display text-xs font-bold text-slate-800 block truncate">
                      {p.name}
                    </span>
                    <span className="font-body text-[9px] text-on-surface-variant block uppercase tracking-wider mt-0.5">
                      {p.platform} • {p.handle}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-display text-xs font-extrabold text-slate-800 block">
                      {p.listings_count} Listings
                    </span>
                    <span className="font-body text-[9px] text-emerald-600 font-bold block mt-0.5">
                      +{p.signups_count} Signups
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Filter and Search Bar & Partners Table Card */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white border border-outline-variant/20 rounded-3xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full sm:w-72 shadow-sm rounded-full bg-slate-50 border border-outline-variant/30 px-4 py-1.5 focus-within:ring-2 focus-within:ring-primary/20 transition-all flex items-center">
              <Search size={14} className="text-outline shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, code, or handle..."
                className="flex-1 bg-transparent border-none outline-none font-body text-xs px-2.5 py-1 text-on-surface"
              />
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
              {[
                { id: "all", label: "All Status" },
                { id: "active", label: "Active" },
                { id: "inactive", label: "Inactive" }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full font-body text-xs font-semibold cursor-pointer transition-all border whitespace-nowrap",
                    statusFilter === filter.id
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-slate-50 border-outline-variant/20 text-on-surface-variant hover:bg-slate-100 hover:text-on-surface"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Partners Table */}
          <div className="bg-white border border-outline-variant/20 rounded-[2rem] shadow-sm overflow-hidden flex-1">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-2 text-on-surface-variant">
                  <Loader2 className="animate-spin text-primary" size={24} />
                  <span className="font-body text-xs font-semibold">Loading partners data...</span>
                </div>
              ) : filteredPartners.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
                  <ShieldAlert className="text-outline/40" size={32} />
                  <h4 className="font-body text-sm font-bold text-on-surface">No partners found</h4>
                  <p className="font-body text-xs text-on-surface-variant max-w-[280px]">
                    Try updating your search query or status filters.
                  </p>
                </div>
              ) : (
                <table className="w-full border-collapse font-body text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-outline-variant/20 font-bold text-on-surface-variant uppercase tracking-wider">
                      <th className="px-6 py-4">Partner Details</th>
                      <th className="px-6 py-4">Referral Link</th>
                      <th className="px-6 py-4 text-center">Volume</th>
                      <th className="px-6 py-4 text-right">Earnings</th>
                      <th className="px-6 py-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {filteredPartners.map((p) => (
                      <tr 
                        key={p.id} 
                        onClick={() => handleOpenDetails(p.id)}
                        className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                      >
                        {/* Name & Handle */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">
                              {p.name}
                            </span>
                            <span className="text-[10px] text-on-surface-variant/70 mt-0.5">
                              {p.platform} • {p.handle}
                            </span>
                          </div>
                        </td>

                        {/* Referral Link & Code */}
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <span className="font-mono bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold">
                              {p.referral_code}
                            </span>
                            <button
                              onClick={() => handleCopyLink(p.referral_code)}
                              className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 cursor-pointer shadow-sm flex items-center justify-center transition-all"
                              title="Copy Referral Link"
                            >
                              {copiedCode === p.referral_code ? (
                                <span className="text-[9px] font-bold text-emerald-600 px-0.5">Copied!</span>
                              ) : (
                                <Copy size={11} />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Volume Stats */}
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-semibold text-slate-800">
                              {p.listings_count} Listings
                            </span>
                            <span className="text-[9px] text-on-surface-variant/70 mt-0.5">
                              {p.signups_count} Signups
                            </span>
                          </div>
                        </td>

                        {/* Earnings */}
                        <td className="px-6 py-4 text-right">
                          <span className="font-display font-extrabold text-slate-800 block">
                            ₹{(p.total_earnings || 0).toLocaleString("en-IN")}
                          </span>
                          {Number(p.pending_earnings || 0) > 0 && (
                            <span className="text-[9px] text-violet-600 font-bold block mt-0.5">
                              ₹{(p.pending_earnings || 0).toLocaleString("en-IN")} pending
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleToggleStatus(p.id, p.status)}
                            disabled={isPending}
                            className={cn(
                              "inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider cursor-pointer border transition-all",
                              p.status === "active" 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-red-50 hover:text-red-700 hover:border-red-100"
                                : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-100"
                            )}
                          >
                            {p.status}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* CREATE PARTNER SLIDE-OVER MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs select-none">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-display text-base font-extrabold text-slate-800">Add New Partner</h3>
                <p className="font-body text-[10px] text-on-surface-variant mt-0.5">Enter details to onboard a new referral creator.</p>
              </div>
              <button 
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 hover:bg-slate-200 text-slate-500 rounded-xl transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block px-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Ahmad Khan"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 font-body text-xs text-on-surface outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block px-1">Platform *</label>
                  <select
                    value={createForm.platform}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, platform: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 font-body text-xs text-on-surface outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                  >
                    {["Instagram", "Hostel Representative", "Campus Meme Page", "Student Community", "WhatsApp Group", "Telegram Channel", "Student Club", "Department Page", "Other"].map(item => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block px-1">Handle / ID *</label>
                  <input
                    type="text"
                    required
                    value={createForm.handle}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, handle: e.target.value }))}
                    placeholder="e.g. @ahmad_amu"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 font-body text-xs text-on-surface outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block px-1">Email Address</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="e.g. ahmad@gmail.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 font-body text-xs text-on-surface outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block px-1">Phone Number</label>
                  <input
                    type="text"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="e.g. 91xxxxxxxx"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 font-body text-xs text-on-surface outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block px-1">UPI ID for Payouts</label>
                  <input
                    type="text"
                    value={createForm.upiId}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, upiId: e.target.value }))}
                    placeholder="e.g. ahmad@okaxis"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 font-body text-xs text-on-surface outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-semibold text-slate-700">Referral Code *</label>
                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    disabled={!createForm.name}
                    className="text-[10px] text-primary hover:underline font-bold disabled:opacity-40 disabled:hover:no-underline cursor-pointer"
                  >
                    Generate Code
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={createForm.referralCode}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, referralCode: e.target.value.toUpperCase() }))}
                  placeholder="e.g. AHMAD"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 font-mono text-xs font-bold text-on-surface outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block px-1">Reward Per Valid First Listing (INR) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={createForm.rewardPerListing}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, rewardPerListing: Number(e.target.value) }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 font-body text-xs text-on-surface outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-3 bg-primary hover:opacity-95 text-white font-body text-xs font-bold rounded-2xl shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <Loader2 className="animate-spin size-4" /> Creating...
                    </span>
                  ) : "Create Partner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PARTNER DETAILS SLIDE-OVER */}
      {detailsPartnerId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs select-none">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-display text-base font-extrabold text-slate-800">Partner Details</h3>
                <p className="font-body text-[10px] text-on-surface-variant mt-0.5">Review performance reports, contact fields, and payouts.</p>
              </div>
              <button 
                onClick={() => setDetailsPartnerId(null)}
                className="p-1.5 hover:bg-slate-200 text-slate-500 rounded-xl transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Pane */}
            {detailsLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 gap-2 text-on-surface-variant">
                <Loader2 className="animate-spin text-primary" size={24} />
                <span className="font-body text-xs font-semibold">Loading details...</span>
              </div>
            ) : partnerDetails ? (
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Info Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 flex flex-col sm:flex-row justify-between gap-4">
                  <div className="space-y-2.5">
                    <div>
                      <h4 className="font-display text-md font-bold text-slate-800">
                        {partnerDetails.partner.name}
                      </h4>
                      <span className="font-mono bg-slate-200 text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold mt-1 inline-block">
                        CODE: {partnerDetails.partner.referral_code}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-slate-600 font-body text-xs">
                      <div className="flex items-center gap-2">
                        <Users size={13} className="text-slate-400" />
                        <span>Platform: <b className="font-semibold text-slate-700">{partnerDetails.partner.platform} ({partnerDetails.partner.handle})</b></span>
                      </div>
                      {partnerDetails.partner.email && (
                        <div className="flex items-center gap-2">
                          <Mail size={13} className="text-slate-400" />
                          <span>Email: <b className="font-semibold text-slate-700">{partnerDetails.partner.email}</b></span>
                        </div>
                      )}
                      {partnerDetails.partner.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={13} className="text-slate-400" />
                          <span>Phone: <b className="font-semibold text-slate-700">{partnerDetails.partner.phone}</b></span>
                        </div>
                      )}
                      {partnerDetails.partner.upi_id && (
                        <div className="flex items-center gap-2">
                          <DollarSign size={13} className="text-slate-400" />
                          <span>UPI ID: <b className="font-semibold text-slate-700">{partnerDetails.partner.upi_id}</b></span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col justify-center items-end border-t sm:border-t-0 sm:border-l border-slate-200 pt-4 sm:pt-0 sm:pl-6 min-w-40">
                    <div className="text-right">
                      <span className="font-body text-[9px] uppercase tracking-wider text-on-surface-variant font-bold block">
                        Reward Structure
                      </span>
                      <span className="font-display text-xl font-bold text-slate-800 block mt-0.5">
                        ₹{partnerDetails.partner.reward_per_listing} / listing
                      </span>
                      <span className="text-[10px] text-on-surface-variant/70 font-semibold block mt-0.5">
                        {partnerDetails.partner.rewarded_listings_count} rewarded listings
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial Breakout Row */}
                <div className="grid grid-cols-3 gap-3 bg-slate-50 border border-slate-200/60 rounded-3xl p-4">
                  <div className="text-center">
                    <span className="font-body text-[9px] font-bold text-on-surface-variant uppercase block">Lifetime Earned</span>
                    <span className="font-display text-sm font-extrabold text-slate-800 block mt-1">
                      ₹{Number(partnerDetails.partner.total_earnings || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="text-center border-x border-slate-200">
                    <span className="font-body text-[9px] font-bold text-emerald-600 uppercase block">Total Paid</span>
                    <span className="font-display text-sm font-extrabold text-emerald-700 block mt-1">
                      ₹{Number(partnerDetails.partner.total_paid || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="font-body text-[9px] font-bold text-violet-600 uppercase block">Pending Balance</span>
                    <span className="font-display text-sm font-extrabold text-violet-700 block mt-1">
                      ₹{Number(partnerDetails.partner.pending_earnings || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Substats Row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Valid Listings", value: partnerDetails.partner.listings_count, icon: Package },
                    { label: "Chats Initiated", value: partnerDetails.partner.chats_count, icon: MessageSquare },
                    { label: "Completed Sales", value: partnerDetails.partner.sales_count, icon: Star },
                  ].map((s, i) => {
                    const Icon = s.icon
                    return (
                      <div key={i} className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4 text-center">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center mx-auto mb-2">
                          <Icon size={14} />
                        </div>
                        <span className="font-body text-[9px] font-bold text-on-surface-variant uppercase block">
                          {s.label}
                        </span>
                        <span className="font-display text-base font-extrabold text-slate-800 block mt-0.5">
                          {s.value}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Recent activity tabs */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <div className="flex gap-4">
                      {[
                        { id: "users", label: `Recent Signups (${partnerDetails.recentSignups.length})` },
                        { id: "listings", label: `Recent Listings (${partnerDetails.recentListings.length})` },
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setDetailsTab(tab.id as any)}
                          className={cn(
                            "font-display text-xs font-bold pb-2 -mb-2 border-b-2 transition cursor-pointer",
                            detailsTab === tab.id
                              ? "border-primary text-primary"
                              : "border-transparent text-on-surface-variant hover:text-foreground"
                          )}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => handleExportCSV(detailsTab === "users" ? "signups" : "listings")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-body text-[10px] font-bold transition shadow-xs cursor-pointer"
                    >
                      <Download size={11} />
                      <span>Export CSV</span>
                    </button>
                  </div>

                  {/* Tab Contents */}
                  {detailsTab === "users" ? (
                    <div className="border border-slate-100 rounded-2xl overflow-hidden">
                      {partnerDetails.recentSignups.length === 0 ? (
                        <div className="p-8 text-center font-body text-xs text-on-surface-variant">
                          No referred users signed up yet.
                        </div>
                      ) : (
                        <table className="w-full border-collapse font-body text-[11px] text-left">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 font-semibold text-on-surface-variant">
                              <th className="px-4 py-2.5">User Name</th>
                              <th className="px-4 py-2.5">Contact</th>
                              <th className="px-4 py-2.5 text-right">Joined</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {partnerDetails.recentSignups.map((u: any) => (
                              <tr key={u.id} className="hover:bg-slate-50/20">
                                <td className="px-4 py-2.5 font-bold text-slate-700">{u.full_name}</td>
                                <td className="px-4 py-2.5 text-slate-500">
                                  {u.email || "No email"}
                                  {u.phone && <span className="block text-[9px] mt-0.5">{u.phone}</span>}
                                </td>
                                <td className="px-4 py-2.5 text-right text-slate-500">
                                  {new Date(u.created_at).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  ) : (
                    <div className="border border-slate-100 rounded-2xl overflow-hidden">
                      {partnerDetails.recentListings.length === 0 ? (
                        <div className="p-8 text-center font-body text-xs text-on-surface-variant">
                          No listings generated by referred sellers yet.
                        </div>
                      ) : (
                        <table className="w-full border-collapse font-body text-[11px] text-left">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 font-semibold text-on-surface-variant">
                              <th className="px-4 py-2.5">Product Title</th>
                              <th className="px-4 py-2.5">Price / Seller</th>
                              <th className="px-4 py-2.5">Status</th>
                              <th className="px-4 py-2.5 text-right">Created</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {partnerDetails.recentListings.map((l: any) => (
                              <tr key={l.id} className="hover:bg-slate-50/20">
                                <td className="px-4 py-2.5 font-bold text-slate-700">
                                  <Link 
                                    href={`/item/${l.id}`} 
                                    target="_blank"
                                    className="hover:text-primary hover:underline line-clamp-1 flex items-center gap-1"
                                  >
                                    {l.title} <ExternalLink size={10} />
                                  </Link>
                                </td>
                                <td className="px-4 py-2.5 text-slate-500">
                                  ₹{l.price.toLocaleString("en-IN")}
                                  <span className="block text-[9px] mt-0.5">{l.sellerName}</span>
                                </td>
                                <td className="px-4 py-2.5">
                                  <span className={cn(
                                    "inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border",
                                    l.status === "active" && "bg-emerald-50 text-emerald-700 border-emerald-100",
                                    l.status === "sold" && "bg-blue-50 text-blue-700 border-blue-100",
                                    l.status === "hidden" && "bg-slate-100 text-slate-500 border-slate-200"
                                  )}>
                                    {l.status}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-right text-slate-500">
                                  {new Date(l.createdAt).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Footer Actions */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 shrink-0">
                <button
                  onClick={() => handleDeletePartner(partnerDetails.partner.id)}
                  disabled={isPending}
                  type="button"
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-body text-xs font-bold rounded-xl border border-red-100 transition disabled:opacity-50 cursor-pointer"
                >
                  Delete Partner
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStatus(partnerDetails.partner.id, partnerDetails.partner.status)}
                    disabled={isPending}
                    type="button"
                    className={cn(
                      "px-4 py-2 font-body text-xs font-bold rounded-xl border transition-all cursor-pointer disabled:opacity-50",
                      partnerDetails.partner.status === "active"
                        ? "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                    )}
                  >
                    {partnerDetails.partner.status === "active" ? "Deactivate" : "Activate"}
                  </button>

                  {Number(partnerDetails.partner.pending_earnings || 0) > 0 && (
                    <button
                      onClick={() => handleMarkAsPaid(partnerDetails.partner.id, partnerDetails.partner.pending_earnings)}
                      disabled={isPending}
                      type="button"
                      className="px-4 py-2 bg-primary hover:opacity-95 text-white font-body text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
                    >
                      Mark as Paid (₹{Number(partnerDetails.partner.pending_earnings).toLocaleString("en-IN")})
                    </button>
                  )}
                </div>
              </div>
              </>
            ) : (
              <div className="p-8 text-center text-xs font-body text-on-surface-variant">No details available.</div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
