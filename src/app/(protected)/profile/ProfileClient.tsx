"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { 
  User, 
  MapPin, 
  BookOpen, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Loader2, 
  LogOut, 
  Edit,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { updateProfile, signOutUser } from "@/features/profile/actions"
import { cn } from "@/lib/utils"

interface ProfileClientProps {
  profile: {
    id: string
    full_name: string | null
    email: string | null
    avatar_url: string | null
    university: string | null
    department: string | null
    phone: string | null
    trust_score: number | null
    phone_verified: boolean | null
  }
}

export function ProfileClient({ profile }: ProfileClientProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [fullName, setFullName] = useState(profile.full_name || "")
  const [department, setDepartment] = useState(profile.department || "")
  const [phone, setPhone] = useState(profile.phone || "")

  const [isPending, startTransition] = useTransition()
  const [isLoggingOut, startLoggingOut] = useTransition()
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    startTransition(async () => {
      const res = await updateProfile({
        fullName,
        department,
        phone
      })

      if (res.success) {
        setMessage({ text: "Profile updated successfully!", type: "success" })
        setIsEditing(false)
        router.refresh()
      } else {
        setMessage({ text: res.error || "Failed to update profile.", type: "error" })
      }
    })
  }

  const handleLogout = () => {
    startLoggingOut(async () => {
      const res = await signOutUser()
      if (res.success) {
        window.location.href = "/login"
      } else {
        setMessage({ text: res.error || "Failed to log out.", type: "error" })
      }
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left max-w-4xl mx-auto">
      {/* 1. Profile Bento Card */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        <div className="bg-white border border-outline-variant/20 rounded-[2rem] p-6 text-center shadow-sm flex flex-col items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl"></div>
          
          {profile.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt={profile.full_name || "Profile"} 
              className="w-24 h-24 rounded-full object-cover border border-outline-variant/35 shadow-sm"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center font-body text-3xl font-extrabold border border-primary/20 shadow-sm">
              {(profile.full_name || "CU").slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="flex flex-col">
            <h2 className="font-display text-xl font-extrabold text-slate-800">
              {profile.full_name || "Campus User"}
            </h2>
            <span className="font-body text-xs text-on-surface-variant/80 mt-1 font-semibold">
              {profile.department || "Unspecified Department"}
            </span>
          </div>

          <div className="w-full pt-4 border-t border-outline-variant/20 flex flex-col gap-3 text-xs font-medium text-on-surface-variant font-body">
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-primary shrink-0" />
              <span className="truncate">{profile.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-primary shrink-0" />
              <span className="truncate">{profile.university || "Aligarh Muslim University"}</span>
            </div>
            {profile.phone && (
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-primary shrink-0" />
                <span>{profile.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Trust Score Panel */}
        <div className="bg-white border border-outline-variant/20 rounded-[2rem] p-6 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center text-xs font-body">
            <span className="font-semibold text-on-surface-variant">Trust Score</span>
            <span className="font-extrabold text-secondary">{profile.trust_score || 50} / 100</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full action-gradient rounded-full transition-all duration-500" 
              style={{ width: `${profile.trust_score || 50}%` }}
            />
          </div>
          <p className="font-body text-[10px] text-on-surface-variant/75 leading-normal">
            Your Trust Score reflects successful trades, student verification reviews, and platform behavior.
          </p>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 hover:border-red-100 text-slate-700 font-body text-xs font-bold rounded-full border border-slate-200 cursor-pointer transition-all disabled:opacity-50"
        >
          {isLoggingOut ? <Loader2 className="animate-spin" size={14} /> : <LogOut size={14} />}
          <span>Log Out Account</span>
        </button>
      </div>

      {/* 2. Detail Editor Panel */}
      <div className="lg:col-span-8 bg-white border border-outline-variant/20 rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-outline-variant/10 pb-4">
          <h3 className="font-display text-lg font-extrabold text-slate-800">
            Account Information
          </h3>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-outline-variant/20 bg-slate-50 text-slate-700 hover:bg-slate-100 font-body text-xs font-bold transition-all cursor-pointer"
            >
              <Edit size={12} />
              <span>Edit Info</span>
            </button>
          )}
        </div>

        {message && (
          <div className={cn(
            "p-4 rounded-xl border font-body text-xs font-semibold flex items-center gap-2",
            message.type === "success" ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-error/5 border-error/15 text-error"
          )}>
            {message.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 font-body text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-700">Full Name</label>
              <input
                type="text"
                required
                disabled={!isEditing}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-50 disabled:bg-slate-50/40 border border-outline-variant/20 rounded-xl px-4.5 py-3 outline-none focus:ring-1 focus:ring-primary/20 text-on-surface disabled:text-on-surface/80"
              />
            </div>

            {/* Department */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-700">University Department</label>
              <input
                type="text"
                required
                disabled={!isEditing}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. ZHCET (Engineering), Physics"
                className="w-full bg-slate-50 disabled:bg-slate-50/40 border border-outline-variant/20 rounded-xl px-4.5 py-3 outline-none focus:ring-1 focus:ring-primary/20 text-on-surface disabled:text-on-surface/80"
              />
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-700">Phone Number</label>
              <input
                type="tel"
                disabled={!isEditing}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 9876543210"
                className="w-full bg-slate-50 disabled:bg-slate-50/40 border border-outline-variant/20 rounded-xl px-4.5 py-3 outline-none focus:ring-1 focus:ring-primary/20 text-on-surface disabled:text-on-surface/80"
              />
            </div>

            {/* Phone Verification Status (Always display state, not input) */}
            <div className="flex flex-col gap-1.5 justify-end">
              <div className="bg-slate-50 border border-outline-variant/15 rounded-xl px-4.5 py-3.5 flex items-center justify-between">
                <span className="font-semibold text-slate-700">Phone Status</span>
                <span className={cn(
                  "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider",
                  profile.phone_verified ? "text-emerald-700" : "text-amber-700"
                )}>
                  <ShieldCheck size={14} className={profile.phone_verified ? "text-emerald-600" : "text-amber-600"} />
                  {profile.phone_verified ? "Verified" : "Pending Onboard Check"}
                </span>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex items-center gap-3 justify-end border-t border-outline-variant/10 pt-6">
              <button
                type="button"
                onClick={() => {
                  setFullName(profile.full_name || "")
                  setDepartment(profile.department || "")
                  setPhone(profile.phone || "")
                  setIsEditing(false)
                }}
                className="px-5 py-2.5 rounded-full border border-outline-variant/25 bg-white hover:bg-slate-50 text-slate-700 font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-2.5 bg-primary hover:bg-primary-container text-white font-bold rounded-full transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isPending ? <Loader2 className="animate-spin" size={14} /> : null}
                <span>Save Changes</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
