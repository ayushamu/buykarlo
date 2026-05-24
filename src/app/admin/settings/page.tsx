"use client"

import { useState, useTransition } from "react"
import { Shield, Settings, ShieldAlert, CheckCircle2, Users, Loader2, MapPin } from "lucide-react"
import { setUserAdminStatusByEmail, setUserTrustScoreByEmail } from "@/features/admin/actions"
import { cn } from "@/lib/utils"

export default function AdminSettingsPage() {
  const [emailForAdmin, setEmailForAdmin] = useState("")
  const [makeAdmin, setMakeAdmin] = useState(false)
  const [emailForTrust, setEmailForTrust] = useState("")
  const [trustScore, setTrustScore] = useState(50)

  const [isPendingAdmin, startTransitionAdmin] = useTransition()
  const [isPendingTrust, startTransitionTrust] = useTransition()

  const [adminMessage, setAdminMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)
  const [trustMessage, setTrustMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  const handleUpdateAdmin = (e: React.FormEvent) => {
    e.preventDefault()
    setAdminMessage(null)
    if (!emailForAdmin.trim()) return

    startTransitionAdmin(async () => {
      const res = await setUserAdminStatusByEmail(emailForAdmin, makeAdmin)
      if (res.success) {
        setAdminMessage({
          text: `Successfully updated ${res.name}'s administrator status to: ${makeAdmin ? "ADMIN" : "STANDARD USER"}.`,
          type: "success"
        })
        setEmailForAdmin("")
      } else {
        setAdminMessage({ text: res.error || "Action failed.", type: "error" })
      }
    })
  }

  const handleUpdateTrust = (e: React.FormEvent) => {
    e.preventDefault()
    setTrustMessage(null)
    if (!emailForTrust.trim()) return

    startTransitionTrust(async () => {
      const res = await setUserTrustScoreByEmail(emailForTrust, trustScore)
      if (res.success) {
        setTrustMessage({
          text: `Successfully set trust score of ${res.name} to ${trustScore}/100.`,
          type: "success"
        })
        setEmailForTrust("")
      } else {
        setTrustMessage({ text: res.error || "Action failed.", type: "error" })
      }
    })
  }

  const campuses = [
    { name: "Aligarh Muslim University (AMU)", status: "Active", description: "Default campus scope. Full R2 storage and student profiles active." },
    { name: "Delhi University (DU)", status: "Active", description: "Standard scoping active. Student identity confirmations verified." },
    { name: "Jamia Millia Islamia (JMI)", status: "Active", description: "Standard scoping active. Student identity confirmations verified." },
    { name: "UPES Dehradun", status: "Coming Soon", description: "Pending student registration triggers." },
    { name: "Jawaharlal Nehru University (JNU)", status: "Coming Soon", description: "Authentication scope integrations pending." },
    { name: "Banaras Hindu University (BHU)", status: "Coming Soon", description: "DB RLS rules setup pending." },
    { name: "BITS Pilani", status: "Coming Soon", description: "Campus deployment testing." },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
      {/* LEFT SECTION: System configurations */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        {/* Campus location configurations */}
        <div className="bg-white border border-outline-variant/20 rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <MapPin className="text-primary" size={20} />
            <h3 className="font-display text-xl font-extrabold text-slate-800">
              Campus Scopes Configuration
            </h3>
          </div>
          <div className="flex flex-col divide-y divide-outline-variant/10">
            {campuses.map((c) => (
              <div key={c.name} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                <div className="flex flex-col min-w-0">
                  <span className="font-body text-xs font-bold text-slate-800 truncate">
                    {c.name}
                  </span>
                  <span className="font-body text-[10px] text-on-surface-variant/80 mt-1 leading-normal">
                    {c.description}
                  </span>
                </div>
                <span className={cn(
                  "inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0",
                  c.status === "Active" 
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                    : "bg-slate-100 text-slate-500 border border-slate-200"
                )}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Reputation parameters settings card */}
        <div className="bg-white border border-outline-variant/20 rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <Settings className="text-primary" size={20} />
            <h3 className="font-display text-xl font-extrabold text-slate-800">
              Trust Score Parameters
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-body text-xs">
            <div className="p-4 bg-slate-50 border border-outline-variant/15 rounded-2xl flex flex-col gap-1">
              <span className="font-bold text-slate-800">Successful Deal Handoff</span>
              <span className="text-emerald-600 font-extrabold text-sm">+5 Trust Points</span>
              <span className="text-[10px] text-on-surface-variant/75 mt-1 leading-normal">
                Awarded to both buyer and seller when transaction status is marked completed.
              </span>
            </div>
            <div className="p-4 bg-slate-50 border border-outline-variant/15 rounded-2xl flex flex-col gap-1">
              <span className="font-bold text-slate-800">Verified Identity Approval</span>
              <span className="text-emerald-600 font-extrabold text-sm">+10 Trust Points</span>
              <span className="text-[10px] text-on-surface-variant/75 mt-1 leading-normal">
                Applied when student onboarding and department info is manually verified.
              </span>
            </div>
            <div className="p-4 bg-slate-50 border border-outline-variant/15 rounded-2xl flex flex-col gap-1">
              <span className="font-bold text-slate-800">Student Flag Penalty</span>
              <span className="text-rose-600 font-extrabold text-sm">-15 Trust Points</span>
              <span className="text-[10px] text-on-surface-variant/75 mt-1 leading-normal">
                Applied to seller when reports queue item resolve results in listing unlist.
              </span>
            </div>
            <div className="p-4 bg-slate-50 border border-outline-variant/15 rounded-2xl flex flex-col gap-1">
              <span className="font-bold text-slate-800">Abusive Chat/Spam Banner</span>
              <span className="text-rose-600 font-extrabold text-sm">-25 Trust Points</span>
              <span className="text-[10px] text-on-surface-variant/75 mt-1 leading-normal">
                Applied on accounts that get reported for chat guidelines non-compliance.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SECTION: Developer utilities (Form fields) */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        {/* Toggle admin permission form */}
        <div className="bg-white border border-outline-variant/20 rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <Shield className="text-primary" size={20} />
            <h3 className="font-display text-lg font-extrabold text-slate-800">
              Role Management
            </h3>
          </div>
          <p className="font-body text-xs text-on-surface-variant leading-relaxed">
            Quickly grant or revoke moderator privileges by user email.
          </p>

          {adminMessage && (
            <div className={cn(
              "p-3 rounded-xl border font-body text-[11px] font-semibold flex items-center gap-2",
              adminMessage.type === "success" 
                ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                : "bg-error/5 border-error/15 text-error"
            )}>
              {adminMessage.type === "success" ? <CheckCircle2 size={14} /> : <ShieldAlert size={14} />}
              <span>{adminMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateAdmin} className="flex flex-col gap-4 font-body text-xs">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-700">Student Email Address</label>
              <input
                type="email"
                required
                value={emailForAdmin}
                onChange={(e) => setEmailForAdmin(e.target.value)}
                placeholder="e.g. student@amu.ac.in"
                className="w-full bg-slate-50 border border-outline-variant/30 rounded-xl px-3 py-2.5 outline-none focus:ring-1 focus:ring-primary/20 text-on-surface"
              />
            </div>

            <div className="flex items-center gap-2.5 py-1">
              <input
                type="checkbox"
                id="makeAdminCheck"
                checked={makeAdmin}
                onChange={(e) => setMakeAdmin(e.target.checked)}
                className="w-4 h-4 text-primary border-outline-variant/30 rounded focus:ring-0 cursor-pointer"
              />
              <label htmlFor="makeAdminCheck" className="font-bold text-slate-700 cursor-pointer">
                Grant Admin Credentials
              </label>
            </div>

            <button
              type="submit"
              disabled={isPendingAdmin}
              className="w-full py-2.5 bg-primary hover:bg-primary-container text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
            >
              {isPendingAdmin ? <Loader2 className="animate-spin" size={14} /> : null}
              <span>Apply Role Configuration</span>
            </button>
          </form>
        </div>

        {/* Set trust scores form */}
        <div className="bg-white border border-outline-variant/20 rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <Users className="text-primary" size={20} />
            <h3 className="font-display text-lg font-extrabold text-slate-800">
              Trust Score Management
            </h3>
          </div>
          <p className="font-body text-xs text-on-surface-variant leading-relaxed">
            Manually override or reset a student seller's trust score parameter.
          </p>

          {trustMessage && (
            <div className={cn(
              "p-3 rounded-xl border font-body text-[11px] font-semibold flex items-center gap-2",
              trustMessage.type === "success" 
                ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                : "bg-error/5 border-error/15 text-error"
            )}>
              {trustMessage.type === "success" ? <CheckCircle2 size={14} /> : <ShieldAlert size={14} />}
              <span>{trustMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateTrust} className="flex flex-col gap-4 font-body text-xs">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-700">Student Email Address</label>
              <input
                type="email"
                required
                value={emailForTrust}
                onChange={(e) => setEmailForTrust(e.target.value)}
                placeholder="e.g. student@amu.ac.in"
                className="w-full bg-slate-50 border border-outline-variant/30 rounded-xl px-3 py-2.5 outline-none focus:ring-1 focus:ring-primary/20 text-on-surface"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="font-semibold text-slate-700">Assign Trust Points</label>
                <span className="font-bold text-primary">{trustScore} / 100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={trustScore}
                onChange={(e) => setTrustScore(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            <button
              type="submit"
              disabled={isPendingTrust}
              className="w-full py-2.5 bg-primary hover:bg-primary-container text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
            >
              {isPendingTrust ? <Loader2 className="animate-spin" size={14} /> : null}
              <span>Apply Trust Override</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
