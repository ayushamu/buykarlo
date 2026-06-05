"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  LayoutDashboard, Users, CreditCard, ShieldAlert, Share2, 
  Bell, ArrowRight, Sparkles, Copy, UserPlus, Package, Tag, 
  HelpCircle, CheckCircle2, Lock, AlertTriangle, Loader2, Activity, Info
} from "lucide-react"
import { getMyPartnerStats, getMyReferredSignups, getMyPayouts } from "@/features/partners/portal-actions"
import { cn } from "@/lib/utils"

export default function PartnerDashboard() {
  const [partner, setPartner] = useState<any>(null)
  const [signups, setSignups] = useState<any[]>([])
  const [payouts, setPayouts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "referrals" | "payouts" | "policy">("overview")

  const loadData = async () => {
    setLoading(true)
    setErrorMsg(null)
    
    // Fetch stats
    const statsRes = await getMyPartnerStats()
    if (!statsRes.success) {
      setErrorMsg(statsRes.error || "Failed to load partner details.")
      setLoading(false)
      return
    }

    setPartner(statsRes.partner)

    // Fetch signups list
    const signupsRes = await getMyReferredSignups()
    if (signupsRes.success) {
      setSignups(signupsRes.signups)
    }

    // Fetch payouts list
    const payoutsRes = await getMyPayouts()
    if (payoutsRes.success) {
      setPayouts(payoutsRes.payouts)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCopyLink = () => {
    if (!partner) return
    const link = `https://buykarlo.in?ref=${partner.referral_code}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
        <Loader2 className="animate-spin text-primary size-8" />
        <span className="font-body text-xs font-semibold text-slate-500 mt-2">Loading partner portal...</span>
      </div>
    )
  }

  // Unauthorized Gate Screen
  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 font-body text-left">
        <div className="w-full max-w-md bg-white border border-slate-200/60 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden flex flex-col gap-6">
          <div className="w-14 h-14 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center shrink-0">
            <Lock size={24} />
          </div>
          <div>
            <h2 className="font-display text-xl font-extrabold text-slate-800">
              Partner Portal Access
            </h2>
            <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
              This area is restricted to registered BuyKarlo Referral Partners. If you are a student creator, campus rep, or community leader, please log in with your partner account email to track your statistics.
            </p>
          </div>

          <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex items-start gap-2.5">
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={15} />
            <div className="text-[10px] text-amber-800 leading-normal">
              If you already logged in with a regular account, please log out and sign in using your registered partner email address.
            </div>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <Link 
              href={`/login?next=/partners/dashboard`}
              className="w-full h-11 bg-primary hover:opacity-95 text-white font-semibold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition"
            >
              <span>Log in with Partner Account</span>
              <ArrowRight size={14} />
            </Link>
            <Link 
              href="/"
              className="w-full h-11 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl flex items-center justify-center transition"
            >
              Back to Marketplace
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#f7f9fb] min-h-screen text-on-surface antialiased overflow-x-hidden text-left relative font-body">
      <style dangerouslySetInnerHTML={{ __html: `
        .glass-card {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(226, 232, 240, 0.5);
        }
        .sidebar-active {
            box-shadow: 0 4px 12px rgba(53, 37, 205, 0.15);
        }
        .btn-lift {
            transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
        }
        .btn-lift:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(53, 37, 205, 0.2);
        }
      `}} />

      {/* Sidebar Navigation */}
      <aside className="h-screen w-64 fixed left-0 top-0 hidden lg:flex flex-col bg-white border-r border-outline-variant/20 z-50">
        <div className="px-6 pt-10 mb-10">
          <div className="flex items-center gap-4 mb-6">
            <img 
              alt="BuyKarlo Logo" 
              className="w-10 h-10 object-contain" 
              src="https://www.buykarlo.in/brand/buykarlo-mark.png"
            />
            <div>
              <h2 className="font-display text-sm font-extrabold text-primary leading-tight">Partner Portal</h2>
              <p className="text-[10px] text-on-surface-variant font-bold">BuyKarlo Affiliate</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4">
          <ul className="space-y-1">
            <li>
              <button 
                onClick={() => setActiveTab("overview")}
                className={cn(
                  "w-full rounded-xl px-4 py-3 font-bold flex items-center gap-3 transition-all group cursor-pointer",
                  activeTab === "overview" 
                    ? "bg-primary/5 text-primary sidebar-active" 
                    : "text-on-surface-variant hover:bg-slate-50"
                )}
              >
                <LayoutDashboard size={20} className={activeTab === "overview" ? "text-primary" : "text-on-surface-variant/70"} />
                <span className="text-xs font-bold">Overview</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab("referrals")}
                className={cn(
                  "w-full rounded-xl px-4 py-3 font-bold flex items-center gap-3 transition-all group cursor-pointer",
                  activeTab === "referrals" 
                    ? "bg-primary/5 text-primary sidebar-active" 
                    : "text-on-surface-variant hover:bg-slate-50"
                )}
              >
                <Users size={20} className={cn("group-hover:scale-110 transition-transform", activeTab === "referrals" ? "text-primary" : "text-on-surface-variant/70")} />
                <span className="text-xs font-semibold">Referrals</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab("payouts")}
                className={cn(
                  "w-full rounded-xl px-4 py-3 font-bold flex items-center gap-3 transition-all group cursor-pointer",
                  activeTab === "payouts" 
                    ? "bg-primary/5 text-primary sidebar-active" 
                    : "text-on-surface-variant hover:bg-slate-50"
                )}
              >
                <CreditCard size={20} className={cn("group-hover:scale-110 transition-transform", activeTab === "payouts" ? "text-primary" : "text-on-surface-variant/70")} />
                <span className="text-xs font-semibold">Payouts</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab("policy")}
                className={cn(
                  "w-full rounded-xl px-4 py-3 font-bold flex items-center gap-3 transition-all group cursor-pointer",
                  activeTab === "policy" 
                    ? "bg-primary/5 text-primary sidebar-active" 
                    : "text-on-surface-variant hover:bg-slate-50"
                )}
              >
                <ShieldAlert size={20} className={cn("group-hover:scale-110 transition-transform", activeTab === "policy" ? "text-primary" : "text-on-surface-variant/70")} />
                <span className="text-xs font-semibold">Partner Policy</span>
              </button>
            </li>
          </ul>
        </nav>

        <div className="p-6 mt-auto">
          <button 
            onClick={handleCopyLink}
            className="w-full py-3 px-4 bg-primary/10 hover:bg-primary/15 text-primary rounded-xl text-xs font-bold flex items-center justify-center gap-2 btn-lift cursor-pointer"
          >
            <Share2 size={14} />
            <span>Share Link</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="lg:ml-64 min-h-screen">
        
        {/* Header Section */}
        <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-outline-variant/30 px-6 py-4">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold tracking-widest text-primary uppercase bg-primary/5 px-2 py-0.5 rounded w-fit mb-1 border border-primary/10">
                PARTNER PORTAL
              </span>
              <h1 className="font-display text-xl font-extrabold text-slate-800 flex items-center gap-1">
                Welcome, {partner.name}! 👋
              </h1>
              <p className="text-[10px] text-on-surface-variant flex items-center gap-1 uppercase tracking-wide font-bold">
                <span className="text-primary">{partner.platform}</span> • {partner.handle}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="p-2 text-on-surface-variant hover:bg-slate-50 rounded-full transition-colors flex items-center justify-center shrink-0 border border-slate-100">
                <Bell size={18} />
              </button>
              <Link 
                href="/" 
                className="bg-primary hover:opacity-95 text-white px-5 py-2.5 rounded-full text-xs font-bold btn-lift flex items-center gap-1.5 shadow-md shadow-primary/10"
              >
                <span>Go to Marketplace</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </header>

        <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
          
          {/* TAB: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Top Row: Balance & Referral Code */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Payout Balance Card */}
                <div className="lg:col-span-8 glass-card rounded-[20px] p-6 md:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                  <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500"></div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase mb-3">PAYOUT BALANCE</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-display text-3xl font-black text-primary">
                        ₹{Number(partner.pending_earnings || 0).toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs text-on-surface-variant ml-2 font-semibold">Pending Payout</span>
                    </div>
                  </div>
                  
                  <div className="mt-8 grid grid-cols-2 border-t border-outline-variant/30 pt-6">
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mb-1">LIFETIME EARNED</p>
                      <p className="font-display text-lg font-bold text-slate-800">
                        ₹{Number(partner.total_earnings || 0).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="border-l border-slate-200/50 pl-6">
                      <p className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mb-1">ALREADY PAID</p>
                      <p className="font-display text-lg font-bold text-emerald-600">
                        ₹{Number(partner.total_paid || 0).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Referral Code Card */}
                <div className="lg:col-span-4 bg-gradient-to-br from-primary to-secondary rounded-[20px] p-6 md:p-8 text-white flex flex-col justify-between shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-15">
                    <Sparkles size={48} className="animate-pulse" />
                  </div>
                  <div>
                    <p className="text-[10px] text-violet-100 font-bold tracking-wider uppercase mb-3 opacity-80">REFERRAL CODE</p>
                    <h3 className="text-3xl md:text-4xl font-extrabold tracking-widest font-mono mb-3">{partner.referral_code}</h3>
                    <p className="text-[10px] text-violet-100/90 leading-relaxed">
                      Share this link with students. When they sign up and list their first active/sold item, you earn ₹{partner.reward_per_listing}!
                    </p>
                  </div>
                  
                  <button 
                    onClick={handleCopyLink}
                    className={cn(
                      "w-full mt-6 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 btn-lift shadow-xl transition-all cursor-pointer",
                      copied 
                        ? "bg-emerald-600 text-white" 
                        : "bg-white text-primary hover:bg-slate-50"
                    )}
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 size={14} />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy Referral Link</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

              {/* Bottom Section: Stats List & History */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Metrics List */}
                <div className="lg:col-span-4 space-y-4">
                  
                  {/* Total Signups */}
                  <div className="glass-card rounded-2xl p-5 flex items-center gap-5 hover:shadow-md transition-shadow group">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shrink-0">
                      <UserPlus size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mb-0.5">TOTAL SIGNUPS</p>
                      <h4 className="font-display text-lg font-bold text-slate-800">{partner.signups_count}</h4>
                      <p className="text-[9px] text-on-surface-variant truncate">Students registered with your code</p>
                    </div>
                  </div>

                  {/* Rewarded Listings */}
                  <div className="glass-card rounded-2xl p-5 flex items-center gap-5 hover:shadow-md transition-shadow group">
                    <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                      <Package size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mb-0.5">REWARDED LISTINGS</p>
                      <h4 className="font-display text-lg font-bold text-slate-800">{partner.rewarded_listings_count}</h4>
                      <p className="text-[9px] text-on-surface-variant truncate">Referred users with a valid listing</p>
                    </div>
                  </div>

                  {/* Completed Sales */}
                  <div className="glass-card rounded-2xl p-5 flex items-center gap-5 hover:shadow-md transition-shadow group">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                      <Tag size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mb-0.5">COMPLETED SALES</p>
                      <h4 className="font-display text-lg font-bold text-slate-800">{partner.sales_count}</h4>
                      <p className="text-[9px] text-on-surface-variant truncate">Successful sales closed by your referrals</p>
                    </div>
                  </div>

                </div>

                {/* Empty State / Referrals List History Summary Section */}
                <div className={cn(
                  "lg:col-span-8 glass-card rounded-[20px] p-6 flex flex-col shadow-sm",
                  signups.length === 0 && "border-2 border-dashed border-outline-variant/50"
                )}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Activity size={16} />
                      </div>
                      <h3 className="font-display text-sm font-extrabold text-slate-800">Referred Signups Summary</h3>
                    </div>
                    {signups.length > 0 && (
                      <button 
                        onClick={() => setActiveTab("referrals")}
                        className="text-[10px] text-primary hover:underline font-bold"
                      >
                        View All Referrals →
                      </button>
                    )}
                  </div>
                  
                  {signups.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-12 bg-[#f2f4f6]/30 rounded-2xl">
                      <div className="relative mb-4">
                        <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full scale-150"></div>
                        <img 
                          alt="No referrals yet illustration" 
                          className="w-48 h-48 relative object-contain drop-shadow-2xl" 
                          src="https://lh3.googleusercontent.com/aida/AP1WRLs6v7abRwFZAry_BrAV7V3AfVD5P2K6VXcTgQjVk4F9I43qspIVc9hDVqTR7_meLKVt97-Kbst7ELwYjRDfElqDyj3RdovyUOAqyhMKWSoySowrdZvNtkZQMEkVhuiYQQxdne5bCU9FYEiYYkr2wcj0AnKDKYe6uh5zGtLRbwYUDTVwot8CEKYJMdxEUq326wetSwL_CahKRXo1VqtUGolCqSPHdPrK53UALzybVsEdsnqRPW2yn296Lms"
                        />
                      </div>
                      <h4 className="font-display text-sm font-bold text-slate-700 mb-1">No referrals yet</h4>
                      <p className="text-[10px] text-slate-400 max-w-xs mx-auto mb-4">
                        Share your referral link on social media or hostel groups to start earning!
                      </p>
                      
                      <button 
                        onClick={() => setShowHowItWorks(true)}
                        className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-primary font-bold rounded-xl btn-lift flex items-center gap-1.5 shadow-sm text-xs cursor-pointer"
                      >
                        <HelpCircle size={14} />
                        <span>How it works?</span>
                      </button>
                    </div>
                  ) : (
                    <div className="border border-slate-100 rounded-2xl overflow-hidden flex-1">
                      <table className="w-full border-collapse font-body text-[11px] text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 font-bold text-on-surface-variant uppercase tracking-wider">
                            <th className="px-4 py-3">Student Name</th>
                            <th className="px-4 py-3">Joined Date</th>
                            <th className="px-4 py-3 text-center">First Listing?</th>
                            <th className="px-4 py-3 text-right">Earning Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-700 bg-white">
                          {signups.slice(0, 5).map((u, i) => (
                            <tr key={i} className="hover:bg-slate-50/20 transition-colors">
                              <td className="px-4 py-3 truncate max-w-40">{u.full_name}</td>
                              <td className="px-4 py-3 text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={cn(
                                  "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold border",
                                  u.has_listing 
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                    : "bg-slate-50 text-slate-400 border-slate-200"
                                )}>
                                  {u.has_listing ? "Yes" : "No"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className={cn(
                                  "font-bold",
                                  u.has_listing ? "text-violet-700" : "text-slate-400"
                                )}>
                                  {u.has_listing ? `+₹${partner.reward_per_listing}` : "—"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>

              </div>
            </div>
          )}

          {/* TAB: REFERRALS */}
          {activeTab === "referrals" && (
            <div className="glass-card rounded-[20px] p-6 flex flex-col shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Users size={16} />
                </div>
                <h3 className="font-display text-sm font-extrabold text-slate-800">All Referred Signups</h3>
              </div>
              <p className="text-[10px] text-on-surface-variant mb-6">
                Complete historical record of users registered using your code or link.
              </p>

              <div className="border border-slate-100 rounded-2xl overflow-hidden min-h-[300px]">
                {signups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center gap-2 bg-[#f2f4f6]/30">
                    <Users className="text-slate-300" size={32} />
                    <h4 className="font-body text-xs font-bold text-slate-600">No referrals yet</h4>
                    <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                      Share your referral link on social media or hostel groups to start earning!
                    </p>
                  </div>
                ) : (
                  <table className="w-full border-collapse font-body text-[11px] text-left bg-white">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 font-bold text-on-surface-variant uppercase tracking-wider">
                        <th className="px-4 py-3">Student Name</th>
                        <th className="px-4 py-3">Joined Date</th>
                        <th className="px-4 py-3 text-center">First Listing?</th>
                        <th className="px-4 py-3 text-right">Earning Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {signups.map((u, i) => (
                        <tr key={i} className="hover:bg-slate-50/20 transition-colors">
                          <td className="px-4 py-3 truncate max-w-40">{u.full_name}</td>
                          <td className="px-4 py-3 text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold border",
                              u.has_listing 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                : "bg-slate-50 text-slate-400 border-slate-200"
                            )}>
                              {u.has_listing ? "Yes" : "No"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={cn(
                              "font-bold",
                              u.has_listing ? "text-violet-700" : "text-slate-400"
                            )}>
                              {u.has_listing ? `+₹${partner.reward_per_listing}` : "—"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB: PAYOUTS */}
          {activeTab === "payouts" && (
            <div className="space-y-6">
              
              {/* Payout Summary and UPI Details */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Payout Balance Card */}
                <div className="lg:col-span-8 glass-card rounded-[20px] p-6 md:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                  <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500"></div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase mb-3">PAYOUT BALANCE</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-display text-3xl font-black text-primary">
                        ₹{Number(partner.pending_earnings || 0).toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs text-on-surface-variant ml-2 font-semibold">Pending Payout</span>
                    </div>
                  </div>
                  
                  <div className="mt-8 grid grid-cols-2 border-t border-outline-variant/30 pt-6">
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mb-1">LIFETIME EARNED</p>
                      <p className="font-display text-lg font-bold text-slate-800">
                        ₹{Number(partner.total_earnings || 0).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="border-l border-slate-200/50 pl-6">
                      <p className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mb-1">ALREADY PAID</p>
                      <p className="font-display text-lg font-bold text-emerald-600">
                        ₹{Number(partner.total_paid || 0).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* UPI Details Card */}
                <div className="lg:col-span-4 bg-gradient-to-br from-violet-900 to-indigo-950 rounded-[20px] p-6 md:p-8 text-white flex flex-col justify-between shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-15">
                    <CreditCard size={48} />
                  </div>
                  <div>
                    <p className="text-[10px] text-violet-100 font-bold tracking-wider uppercase mb-3 opacity-80">UPI ACCOUNT DETAILS</p>
                    <h3 className="text-lg font-extrabold tracking-wide mb-3 truncate">{partner.upi_id || "No UPI ID Registered"}</h3>
                    <p className="text-[10px] text-violet-100/90 leading-relaxed">
                      Your referral rewards are automatically transferred to this UPI ID by the campus administrator.
                    </p>
                  </div>
                  <div className="mt-6 p-3 bg-white/10 rounded-xl flex items-start gap-2 border border-white/10">
                    <Info size={14} className="shrink-0 mt-0.5 text-violet-200" />
                    <span className="text-[9px] text-violet-100 leading-normal">
                      To modify your UPI account details or payment methods, please reach out to the campus coordinator.
                    </span>
                  </div>
                </div>

              </div>

              {/* Payout History Ledger */}
              <div className="glass-card rounded-[20px] p-6 flex flex-col shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Activity size={16} />
                  </div>
                  <h3 className="font-display text-sm font-extrabold text-slate-800">Payout Ledger History</h3>
                </div>
                <p className="text-[10px] text-on-surface-variant mb-6">
                  Log of payments successfully transferred to your registered account by the admin.
                </p>

                <div className="border border-slate-100 rounded-2xl overflow-hidden min-h-[200px]">
                  {payouts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center gap-2 bg-[#f2f4f6]/30">
                      <CreditCard className="text-slate-300" size={32} />
                      <h4 className="font-body text-xs font-bold text-slate-600">No payout records found</h4>
                      <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                        Once your first payout is processed by the admin, it will show up here.
                      </p>
                    </div>
                  ) : (
                    <table className="w-full border-collapse font-body text-[11px] text-left bg-white">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 font-bold text-on-surface-variant uppercase tracking-wider">
                          <th className="px-4 py-3">Payout Reference</th>
                          <th className="px-4 py-3">Payment Method</th>
                          <th className="px-4 py-3">Date Processed</th>
                          <th className="px-4 py-3 text-right">Amount Paid</th>
                          <th className="px-4 py-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {payouts.map((p, i) => (
                          <tr key={i} className="hover:bg-slate-50/20 transition-colors">
                            <td className="px-4 py-3 font-mono text-slate-500">TXN-{p.id.slice(0, 8).toUpperCase()}</td>
                            <td className="px-4 py-3">UPI Transfer</td>
                            <td className="px-4 py-3 text-slate-500">{new Date(p.created_at).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-right font-display text-emerald-700 font-bold">₹{Number(p.amount).toLocaleString("en-IN")}</td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-100">
                                Completed
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB: POLICY */}
          {activeTab === "policy" && (
            <div className="glass-card rounded-[20px] p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                <ShieldAlert className="text-primary" size={20} />
                <h2 className="font-display text-lg font-extrabold text-slate-800">BuyKarlo Partner Program Policies</h2>
              </div>
              <div className="space-y-4 text-xs text-slate-600 leading-relaxed max-h-[600px] overflow-y-auto pr-4 scrollbar-thin">
                <h1 className="font-display text-base font-extrabold text-slate-800 uppercase tracking-wide text-center border-b border-slate-100 pb-4">
                  BuyKarlo Partner Program Agreement
                </h1>
                <p className="text-[10px] text-slate-400 font-bold block text-center mt-2">
                  Effective Date: June 6, 2026
                </p>
                
                <p className="mt-4">
                  This Partner Program Agreement (&quot;Agreement&quot;) governs participation in the BuyKarlo Partner Program and constitutes a legally binding arrangement between BuyKarlo, an independently operated online marketplace platform (&quot;BuyKarlo&quot;, &quot;Platform&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), and the approved individual accepted into the Partner Program (&quot;Partner&quot;, &quot;you&quot;, or &quot;your&quot;).
                </p>
                <p>
                  By applying for, accepting, participating in, or continuing participation in the BuyKarlo Partner Program, the Partner acknowledges that they have read, understood, and agreed to be bound by the terms and conditions set forth herein.
                </p>

                <p className="font-bold text-slate-800 text-sm mt-6">1. Purpose of the Program</p>
                <p>
                  The BuyKarlo Partner Program has been established to facilitate awareness, adoption, and growth of the BuyKarlo marketplace among university students and campus communities.
                </p>
                <p>
                  The Program enables selected individuals, content creators, community administrators, student representatives, influencers, and other approved participants to promote BuyKarlo through approved communication channels and to receive performance-based incentives subject to the terms of this Agreement.
                </p>
                <p>
                  Participation in the Program is by invitation, approval, or acceptance at the sole discretion of BuyKarlo. No individual shall possess any automatic right to participate in the Program.
                </p>

                <p className="font-bold text-slate-800 text-sm mt-6">2. Eligibility</p>
                <p>
                  Participation in the Program is restricted to individuals specifically approved by BuyKarlo. Submission of an application, inquiry, request, or expression of interest does not create any obligation on BuyKarlo to approve or engage any individual as a Partner.
                </p>
                <p>
                  Approval decisions may be based on factors including, but not limited to: audience relevance, campus presence, university reach, community influence, social media engagement, quality of content, previous conduct, alignment with BuyKarlo objectives, or any other factors deemed relevant by BuyKarlo.
                </p>
                <p>
                  BuyKarlo reserves the unrestricted right to accept, reject, suspend, remove, or decline any Partner application without providing any explanation.
                </p>

                <p className="font-bold text-slate-800 text-sm mt-6">3. Nature of Relationship</p>
                <p>
                  The Partner acknowledges and agrees that participation in the Program does not create employment, partnership, joint venture, agency relationship, franchise relationship, representative authority, or fiduciary relationship between BuyKarlo and the Partner.
                </p>
                <p>
                  The Partner shall at all times remain an independent individual acting on their own behalf. Nothing contained within this Agreement shall be construed as granting authority to legally bind BuyKarlo in any manner. The Partner shall not represent themselves as an employee, officer, representative, spokesperson, manager, owner, or authorized decision-maker of BuyKarlo.
                </p>

                <p className="font-bold text-slate-800 text-sm mt-6">4. Referral Attribution</p>
                <p>
                  BuyKarlo may issue a unique referral code, referral identifier, tracking link, campaign link, or any other attribution mechanism to the Partner. Referral attribution shall be determined solely by BuyKarlo&apos;s internal systems, databases, tracking mechanisms, records, logs, and administrative review processes.
                </p>
                <p>
                  The Partner acknowledges and agrees that BuyKarlo&apos;s records shall be final and binding for all referral determinations. Any discrepancies, tracking failures, technical errors, attribution conflicts, duplicate records, system outages, fraudulent activity, or other anomalies may result in exclusion of referrals at BuyKarlo&apos;s sole discretion.
                </p>

                <p className="font-bold text-slate-800 text-sm mt-6">5. Eligible Referrals</p>
                <p>
                  A referral shall only qualify for reward consideration if all applicable requirements established by BuyKarlo are satisfied. At the time of publication of this Agreement, rewards may be considered only for users who: register through an approved referral mechanism, create a genuine product listing, maintain such listing in active status for a minimum period of seven (7) consecutive days, comply with BuyKarlo policies, and are determined by BuyKarlo to be legitimate users.
                </p>
                <p>
                  BuyKarlo reserves the right to modify qualification requirements at any time without prior notice. No Partner shall possess any vested right to any specific reward structure.
                </p>

                <p className="font-bold text-slate-800 text-sm mt-6">6. Invalid Referrals</p>
                <p>
                  The following activities shall constitute invalid referrals and shall not qualify for rewards: self-referrals, duplicate accounts, multiple accounts created by the same individual, fake user accounts, automated account creation, spam submissions, artificial traffic, purchased traffic, misleading promotions, fraudulent registrations, false listings, duplicate listings, manipulated engagement, coordinated abuse, or any activity determined by BuyKarlo to be abusive or non-genuine.
                </p>
                <p>
                  BuyKarlo reserves the unrestricted right to withhold, reverse, adjust, reject, or cancel rewards associated with invalid referrals. Such decisions shall be final.
                </p>

                <p className="font-bold text-slate-800 text-sm mt-6">7. Compensation and Rewards</p>
                <p>
                  Partner rewards are discretionary performance-based incentives and shall not be construed as wages, salary, employment benefits, commissions guaranteed by law, or any form of recurring compensation. Reward structures may vary between Partners and may be determined individually.
                </p>
                <p>
                  Reward calculations may be based on: valid listings, qualified referrals, user activity, campaign objectives, performance metrics, or administrative review. No compensation shall become payable until approved by BuyKarlo.
                </p>
                <p>
                  BuyKarlo reserves the right to modify reward rates, suspend reward programs, discontinue campaigns, introduce caps or limits, conduct audits, or delay payments for verification purposes. The minimum payout threshold shall be INR 100 unless otherwise communicated by BuyKarlo.
                </p>

                <p className="font-bold text-slate-800 text-sm mt-6">8. Payment Processing</p>
                <p>
                  Payments shall be processed only after internal review and approval by BuyKarlo. The timing of payouts shall be determined solely by BuyKarlo. BuyKarlo shall not be obligated to process payments according to any fixed schedule.
                </p>
                <p>
                  The Partner shall be responsible for providing accurate payment information. BuyKarlo shall not be responsible for payment failures resulting from incorrect details provided by the Partner.
                </p>

                <p className="font-bold text-slate-800 text-sm mt-6">9. Content Creation and Brand Usage</p>
                <p>
                  Subject to compliance with this Agreement, Partners may create promotional content regarding BuyKarlo. Partners may utilize referral links, referral codes, publicly provided logos, and approved branding materials.
                </p>
                <p>
                  However, all promotional materials, advertisements, creatives, graphics, videos, captions, messaging, or campaign content may be subject to prior review and approval by BuyKarlo. BuyKarlo reserves the right to request modification, removal, correction, suspension, or deletion of any promotional material. Failure to comply with such requests may result in immediate termination from the Program.
                </p>

                <p className="font-bold text-slate-800 text-sm mt-6">10. Prohibited Conduct</p>
                <p>
                  Partners shall not: make false statements regarding BuyKarlo, misrepresent platform features, guarantee sales, guarantee profits, guarantee earnings, promise future functionality, mislead users, impersonate BuyKarlo personnel, misrepresent their relationship with BuyKarlo, publish deceptive content, engage in unlawful advertising, or damage BuyKarlo&apos;s reputation. Any violation may result in immediate removal from the Program.
                </p>

                <p className="font-bold text-slate-800 text-sm mt-6">11. Intellectual Property</p>
                <p>
                  All trademarks, logos, branding assets, designs, content, software, technology, platform elements, and intellectual property associated with BuyKarlo shall remain the exclusive property of BuyKarlo. No ownership rights are transferred to the Partner under this Agreement. BuyKarlo may revoke branding permissions at any time. Upon termination of participation, all usage rights shall immediately cease.
                </p>

                <p className="font-bold text-slate-800 text-sm mt-6">12. Competing Activities</p>
                <p>
                  Partners may engage in independent personal activities. However, while actively participating in the BuyKarlo Partner Program, Partners shall not present themselves as official BuyKarlo Partners while simultaneously promoting competing campus marketplace services in a manner that creates confusion regarding affiliation, endorsement, or representation. BuyKarlo reserves the right to determine whether such conduct constitutes a conflict of interest.
                </p>

                <p className="font-bold text-slate-800 text-sm mt-6">13. Limitation of Liability</p>
                <p>
                  To the maximum extent permitted under applicable law, BuyKarlo shall not be liable for indirect damages, consequential damages, incidental damages, business interruption, loss of income, loss of reputation, loss of opportunity, data loss, technical failures, or tracking inaccuracies. Participation in the Program is undertaken entirely at the Partner&apos;s own risk.
                </p>

                <p className="font-bold text-slate-800 text-sm mt-6">14. Termination</p>
                <p>
                  BuyKarlo may suspend, restrict, or terminate a Partner&apos;s participation at any time, with or without notice, and with or without assigning any reason. The Partner may voluntarily withdraw from the Program at any time by notifying BuyKarlo.
                </p>
                <p>
                  Termination shall not obligate BuyKarlo to pay rewards associated with: fraudulent activity, pending investigations, policy violations, invalid referrals, or unverified performance.
                </p>

                <p className="font-bold text-slate-800 text-sm mt-6">15. Modifications</p>
                <p>
                  BuyKarlo reserves the right to amend, update, revise, replace, supplement, or discontinue this Agreement at any time. Continued participation following any modification shall constitute acceptance of the revised Agreement.
                </p>

                <p className="font-bold text-slate-800 text-sm mt-6">16. Governing Law and Jurisdiction</p>
                <p>
                  This Agreement shall be governed by and interpreted in accordance with the laws of India. Any dispute arising from or relating to this Agreement shall be subject to the exclusive jurisdiction of the competent courts situated in Aligarh, Uttar Pradesh.
                </p>

                <p className="font-bold text-slate-800 text-sm mt-6">17. Entire Agreement</p>
                <p>
                  This Agreement constitutes the complete understanding between BuyKarlo and the Partner concerning participation in the Partner Program and supersedes all prior discussions, communications, understandings, representations, and arrangements relating thereto.
                </p>
                <p className="border-t border-slate-100 pt-4 mt-6 text-center text-[10px] text-slate-400">
                  By participating in the BuyKarlo Partner Program, the Partner expressly acknowledges and agrees to all provisions contained herein.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Dynamic How It Works Modal overlay */}
        {showHowItWorks && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-none">
            <div className="w-full max-w-md bg-white border border-slate-100 rounded-[2rem] p-6 shadow-2xl animate-in scale-in duration-200 text-left flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="font-display text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="text-primary" size={16} />
                  <span>How Referral Rewards Work</span>
                </h3>
                <button 
                  onClick={() => setShowHowItWorks(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <ArrowRight size={16} className="rotate-90" />
                </button>
              </div>
              
              <div className="space-y-3 font-body text-xs text-slate-600 leading-relaxed">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">1</div>
                  <p>Share your unique referral link or tell students to enter your code <b>{partner.referral_code}</b> when they sign up on BuyKarlo.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">2</div>
                  <p>The referred student must create their **first item listing** (e.g. upload a book, cycle, or calculator) and it must be approved as active or sold.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">3</div>
                  <p>Once their first listing is live, you earn <b>₹{partner.reward_per_listing}</b>! Earnings will show up on your Pending Payout balance and get transferred by admin to your registered UPI ID (<b>{partner.upi_id || "No UPI ID set"}</b>).</p>
                </div>
              </div>
              
              <button 
                onClick={() => setShowHowItWorks(false)}
                className="w-full py-2.5 mt-2 bg-primary hover:opacity-95 text-white font-bold rounded-xl shadow-md transition text-xs cursor-pointer"
              >
                Got it!
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
