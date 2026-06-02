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
  AlertCircle,
  Upload,
  Send,
  Eye,
  Key
} from "lucide-react"
import { updateProfile, signOutUser, submitIdCardVerification, verifyInstitutionalEmail } from "@/features/profile/actions"
import { cn } from "@/lib/utils"
import { compressImage } from "@/lib/image"

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
    verification_status: string | null
    institutional_email: string | null
    institutional_verified: boolean | null
  }
}

export function ProfileClient({ profile }: ProfileClientProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [fullName, setFullName] = useState(profile.full_name || "")
  const [department, setDepartment] = useState(profile.department || "")
  const [phone, setPhone] = useState(profile.phone || "")

  // ID Card Upload State
  const [idCardFile, setIdCardFile] = useState<File | null>(null)
  const [uploadingIdCard, setUploadingIdCard] = useState(false)
  const [idCardError, setIdCardError] = useState<string | null>(null)
  const [idCardSuccess, setIdCardSuccess] = useState(false)

  // Institutional Email State
  const [instEmail, setInstEmail] = useState(profile.institutional_email || "")
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [emailOtp, setEmailOtp] = useState("")
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingEmail, setVerifyingEmail] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [emailSuccess, setEmailSuccess] = useState(false)

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

  // Handle ID Card Upload & Verification Submission
  const handleIdCardUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!idCardFile) return

    setUploadingIdCard(true)
    setIdCardError(null)
    setIdCardSuccess(false)

    try {
      // Compress the ID card photo client-side first
      const compressedFile = await compressImage(idCardFile)

      // 1. Get pre-signed URL from API
      const presignRes = await fetch("/api/storage/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: compressedFile.name,
          contentType: compressedFile.type,
          type: "id_card",
        }),
      })

      const presignData = await presignRes.json()
      if (presignData.error) {
        throw new Error(presignData.error)
      }

      const { uploadUrl, publicUrl } = presignData

      // 2. Upload file directly to R2 bucket
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": compressedFile.type,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
        body: compressedFile,
      })

      if (!uploadRes.ok) {
        throw new Error("Failed to upload ID card photo to storage.")
      }

      // 3. Call server action to submit verification request
      const actionRes = await submitIdCardVerification(publicUrl)
      if (actionRes.error) {
        throw new Error(actionRes.error)
      }

      setIdCardSuccess(true)
      setIdCardFile(null)
      router.refresh()
    } catch (err: any) {
      setIdCardError(err.message || "Failed to upload ID Card verification.")
    } finally {
      setUploadingIdCard(false)
    }
  }

  // Handle Send Institutional OTP (Simulated)
  const handleSendEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!instEmail) return

    setSendingOtp(true)
    setEmailError(null)
    setEmailSuccess(false)

    // Basic domain validation
    const cleanEmail = instEmail.trim().toLowerCase()
    const isAcademic = cleanEmail.endsWith(".edu") || cleanEmail.endsWith(".ac.in") || cleanEmail.endsWith(".edu.in")
    if (!isAcademic) {
      setEmailError("Please enter a valid college email (.edu, .ac.in, or .edu.in)")
      setSendingOtp(false)
      return
    }

    try {
      // Simulate API call to send OTP
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setShowOtpInput(true)
    } catch (err: any) {
      setEmailError("Failed to initiate email verification.")
    } finally {
      setSendingOtp(false)
    }
  }

  // Handle Verify Institutional OTP (Simulated verify + real server action update)
  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailOtp || emailOtp.length !== 6) {
      setEmailError("Please enter a valid 6-digit verification code.")
      return
    }

    setVerifyingEmail(true)
    setEmailError(null)

    try {
      // Simulate verification check (accept any 6-digit code for friction-free verification)
      await new Promise((resolve) => setTimeout(resolve, 1200))

      // Trigger the real Server Action to set email as verified and boost trust score
      const res = await verifyInstitutionalEmail(instEmail)
      if (res.error) {
        throw new Error(res.error)
      }

      setEmailSuccess(true)
      setShowOtpInput(false)
      setEmailOtp("")
      router.refresh()
    } catch (err: any) {
      setEmailError(err.message || "Failed to verify college email.")
    } finally {
      setVerifyingEmail(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left max-w-4xl mx-auto">
      {/* 1. Left Bento Column */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        {/* Profile Card */}
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
            <h2 className="font-display text-xl font-extrabold text-slate-800 flex items-center justify-center gap-1.5">
              {profile.full_name || "Campus User"}
              {profile.verification_status === "verified" && (
                <ShieldCheck className="size-5 text-primary fill-primary/10" />
              )}
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
            Your Trust Score reflects successful trades (+5 per sale), institutional email verification (+20), and ID card approvals (+30).
          </p>
        </div>

        {/* Verification Status List */}
        <div className="bg-white border border-outline-variant/20 rounded-[2rem] p-6 shadow-sm flex flex-col gap-3 text-xs font-body font-semibold">
          <h4 className="text-slate-800 mb-1">Verification Status</h4>
          
          {/* Institutional Email Status */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-on-surface-variant">College Email</span>
            {profile.institutional_verified ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle size={14} /> Verified (+20)
              </span>
            ) : (
              <span className="text-amber-700 font-bold flex items-center gap-1">
                <AlertCircle size={14} /> Unverified
              </span>
            )}
          </div>

          {/* ID Card Status */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-on-surface-variant">Student ID Card</span>
            {profile.verification_status === "verified" && (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle size={14} /> Approved (+30)
              </span>
            )}
            {profile.verification_status === "pending" && (
              <span className="text-blue-700 font-bold flex items-center gap-1 animate-pulse">
                <Loader2 size={14} className="animate-spin" /> Pending Review
              </span>
            )}
            {profile.verification_status === "rejected" && (
              <span className="text-red-700 font-bold flex items-center gap-1">
                <AlertCircle size={14} /> Rejected (Resubmit)
              </span>
            )}
            {(profile.verification_status === "unverified" || !profile.verification_status) && (
              <span className="text-amber-700 font-bold flex items-center gap-1">
                <AlertCircle size={14} /> Required
              </span>
            )}
          </div>
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

      {/* 2. Right Column (Content Editor + Verification Hub) */}
      <div className="lg:col-span-8 flex flex-col gap-8">
        
        {/* Detail Editor Panel */}
        <div className="bg-white border border-outline-variant/20 rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col gap-6">
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

        {/* Verification Hub Bento Card */}
        <div className="bg-white border border-outline-variant/20 rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col gap-6 font-body text-xs">
          <div className="border-b border-outline-variant/10 pb-4">
            <h3 className="font-display text-lg font-extrabold text-slate-800">
              Verification & Trust Upgrades
            </h3>
            <p className="text-on-surface-variant text-[11px] mt-1 leading-normal">
              Increase your marketplace credibility and unlock student-verified badges. High trust score profiles sell up to 3x faster!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 1. College Institutional Email Verification */}
            <div className="flex flex-col gap-4 p-5 rounded-[1.5rem] bg-slate-50 border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full blur-xl"></div>
              
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 text-sm">Institutional Email</h4>
                  <p className="text-on-surface-variant text-[10px]">Boost Trust Score by +20 points</p>
                </div>
                <div className="px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase bg-primary/10 text-primary rounded-full shrink-0">
                  +20 Points
                </div>
              </div>

              {emailError && (
                <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-[11px] font-semibold flex items-center gap-1">
                  <AlertCircle size={14} /> {emailError}
                </div>
              )}

              {emailSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800 text-[11px] font-semibold flex items-center gap-1">
                  <CheckCircle size={14} /> College email verified successfully!
                </div>
              )}

              {profile.institutional_verified ? (
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
                    <ShieldCheck className="size-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-xs">University Verified Student</p>
                      <p className="text-[10px] text-emerald-700/80 mt-0.5 truncate">{profile.institutional_email}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-2 space-y-3">
                  {!showOtpInput ? (
                    <form onSubmit={handleSendEmailOtp} className="space-y-2">
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant" />
                        <input
                          type="email"
                          required
                          value={instEmail}
                          onChange={(e) => setInstEmail(e.target.value)}
                          placeholder="e.g. you@student.amu.ac.in"
                          className="w-full pl-9.5 pr-4 py-2.5 bg-white border border-outline-variant/20 rounded-xl outline-none focus:ring-1 focus:ring-primary/20 text-slate-800"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={sendingOtp}
                        className="w-full py-2.5 btn-gradient text-white font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-50 text-xs"
                      >
                        {sendingOtp ? <Loader2 size={14} className="animate-spin" /> : <Send size={12} />}
                        <span>Verify College Email</span>
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyEmailOtp} className="space-y-3">
                      <div className="bg-amber-50 border border-amber-100 p-2.5 rounded-xl text-[10px] text-amber-800 font-semibold leading-normal">
                        Simulating email OTP. Enter any 6 digits to verify email address.
                      </div>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant" />
                        <input
                          type="text"
                          maxLength={6}
                          required
                          value={emailOtp}
                          onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ""))}
                          placeholder="Enter 6-digit OTP code"
                          className="w-full pl-9.5 pr-4 py-2.5 bg-white border border-outline-variant/20 rounded-xl outline-none focus:ring-1 focus:ring-primary/20 text-slate-800 font-mono text-center tracking-widest text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowOtpInput(false)
                            setEmailOtp("")
                            setEmailError(null)
                          }}
                          className="w-1/3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={verifyingEmail}
                          className="flex-1 py-2 btn-gradient text-white font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-50 text-xs"
                        >
                          {verifyingEmail ? <Loader2 size={14} className="animate-spin" /> : null}
                          <span>Verify OTP Code</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* 2. Student ID Card Upload & Verification */}
            <div className="flex flex-col gap-4 p-5 rounded-[1.5rem] bg-slate-50 border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full blur-xl"></div>

              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 text-sm">Student ID Verification</h4>
                  <p className="text-on-surface-variant text-[10px]">Boost Trust Score by +30 points</p>
                </div>
                <div className="px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase bg-secondary/10 text-secondary rounded-full shrink-0">
                  +30 Points
                </div>
              </div>

              {idCardError && (
                <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-[11px] font-semibold flex items-center gap-1">
                  <AlertCircle size={14} /> {idCardError}
                </div>
              )}

              {idCardSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800 text-[11px] font-semibold flex items-center gap-1">
                  <CheckCircle size={14} /> ID verification submitted successfully! Review pending.
                </div>
              )}

              {profile.verification_status === "verified" ? (
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
                    <ShieldCheck className="size-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-xs">ID Card Approved</p>
                      <p className="text-[10px] text-emerald-700/80 mt-0.5">Your official student ID has been verified.</p>
                    </div>
                  </div>
                </div>
              ) : profile.verification_status === "pending" ? (
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center gap-2 text-blue-800 bg-blue-50 border border-blue-100 p-3 rounded-xl animate-pulse">
                    <Loader2 className="size-5 text-blue-600 shrink-0 animate-spin" />
                    <div>
                      <p className="font-bold text-xs">Review in Progress</p>
                      <p className="text-[10px] text-blue-700/80 mt-0.5">Admins are verifying your document details.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleIdCardUpload} className="mt-2 space-y-3">
                  <div className="relative group border border-dashed border-outline-variant/40 hover:border-primary/50 bg-white rounded-xl p-4 transition-all flex flex-col items-center justify-center text-center">
                    <input
                      type="file"
                      accept="image/*"
                      required
                      disabled={uploadingIdCard}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) setIdCardFile(file)
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <Upload className="size-8 text-on-surface-variant group-hover:text-primary transition-colors mb-2" />
                    {idCardFile ? (
                      <div className="space-y-1">
                        <p className="font-bold text-xs text-primary max-w-[200px] truncate">{idCardFile.name}</p>
                        <p className="text-[10px] text-on-surface-variant/80">Click or drag new image to replace</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="font-bold text-slate-800">Upload ID Card Photo</p>
                        <p className="text-[10px] text-on-surface-variant">PNG, JPG or JPEG up to 5MB</p>
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={!idCardFile || uploadingIdCard}
                    className="w-full py-2.5 btn-gradient text-white font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-50 text-xs"
                  >
                    {uploadingIdCard ? <Loader2 size={14} className="animate-spin" /> : <Upload size={12} />}
                    <span>Submit for Verification</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
