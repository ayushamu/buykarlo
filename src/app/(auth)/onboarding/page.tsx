"use client"

import { useState, useEffect, useMemo, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { completeOnboarding } from "./actions"
import { User, School, BookOpen, Phone, ShieldCheck, Lock, Eye, EyeOff, Check, ChevronDown } from "lucide-react"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { cn } from "@/lib/utils"
import { CAMPUSES } from "@/lib/constants"


function OnboardingForm() {
  const [fullName, setFullName] = useState("")
  const [university, setUniversity] = useState("Aligarh Muslim University (AMU)")
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [department, setDepartment] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = searchParams?.get("next") || "/"
  const supabase = createClient()

  // Fetch current user on mount
  useEffect(() => {
    async function getUser() {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        router.push("/login")
        return
      }
      
      if (user.user_metadata?.full_name && !fullName) {
        setFullName(user.user_metadata.full_name)
      }
    }
    getUser()
  }, [router, supabase, fullName])

  const filteredUniversities = useMemo(() => {
    const query = university.toLowerCase().trim()
    if (!query) {
      return [...CAMPUSES].sort((a, b) => (a.active === b.active ? 0 : a.active ? -1 : 1))
    }
    return CAMPUSES
      .filter(u => u.name.toLowerCase().includes(query) || u.short.toLowerCase().includes(query))
      .sort((a, b) => {
        const aName = a.name.toLowerCase()
        const bName = b.name.toLowerCase()
        const aStarts = aName.startsWith(query)
        const bStarts = bName.startsWith(query)
        if (aStarts && !bStarts) return -1
        if (!aStarts && bStarts) return 1
        if (a.active && !b.active) return -1
        if (!a.active && b.active) return 1
        return a.name.localeCompare(b.name)
      })
  }, [university])

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest(".university-combobox-container")) {
        setIsOpen(false)
        setFocusedIndex(-1)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName || !university || !department || !phone || !password) {
      setError("Please fill out all fields.")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const actionResult = await completeOnboarding({
        fullName,
        university,
        department,
        phone,
        password
      })

      if (actionResult.error) {
        throw new Error(actionResult.error)
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(redirectPath)
        router.refresh()
      }, 1500)
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout step={2} stepTitle="Complete Profile">
      <div className="w-full text-left">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-black tracking-tight text-slate-800">Complete Profile</h2>
          <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
            Provide your basic details to unlock buying and selling actions in the marketplace.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-success/10 border border-success/20 text-success text-xs font-semibold text-center font-body">
            Profile completed successfully! Welcome to BuyKarlo.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 px-1">
              <User className="size-3.5 text-on-surface-variant" /> Full Name
            </label>
            <Input
              type="text"
              placeholder="e.g. Ayush Kumar"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={loading || success}
            />
          </div>

          <div className="space-y-1 relative university-combobox-container">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 px-1">
              <School className="size-3.5 text-on-surface-variant" /> University
            </label>
            <div className="relative flex items-center">
              <Input
                type="text"
                value={university}
                onChange={(e) => {
                  setUniversity(e.target.value)
                  setIsOpen(true)
                  setFocusedIndex(-1)
                }}
                onFocus={() => setIsOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault()
                    if (!isOpen) {
                      setIsOpen(true)
                    } else {
                      setFocusedIndex(prev => (prev + 1) % filteredUniversities.length)
                    }
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault()
                    if (isOpen) {
                      setFocusedIndex(prev => (prev - 1 + filteredUniversities.length) % filteredUniversities.length)
                    }
                  } else if (e.key === "Enter") {
                    if (isOpen && focusedIndex >= 0 && focusedIndex < filteredUniversities.length) {
                      e.preventDefault()
                      setUniversity(filteredUniversities[focusedIndex].name)
                      setIsOpen(false)
                      setFocusedIndex(-1)
                    }
                  } else if (e.key === "Escape") {
                    setIsOpen(false)
                    setFocusedIndex(-1)
                  }
                }}
                required
                disabled={loading || success}
                className="pr-10 w-full"
                placeholder="Type or select your university"
              />
              <ChevronDown className="absolute right-4 size-4 text-on-surface-variant pointer-events-none" />
            </div>

            {/* Suggestions Dropdown */}
            {isOpen && filteredUniversities.length > 0 && (
              <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 max-h-60 overflow-y-auto bg-white border border-outline-variant/30 rounded-2xl shadow-[0_12px_32px_rgba(26,38,86,0.14)] p-1.5 flex flex-col space-y-0.5 scrollbar-none animate-in fade-in slide-in-from-top-2 duration-150">
                {filteredUniversities.map((u, index) => {
                  const isFocused = index === focusedIndex
                  const isSelected = university === u.name

                  return (
                    <button
                      key={u.name}
                      type="button"
                      onClick={() => {
                        setUniversity(u.name)
                        setIsOpen(false)
                        setFocusedIndex(-1)
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-body text-xs font-semibold text-left transition-all cursor-pointer",
                        !u.active && "opacity-60 cursor-not-allowed hover:bg-slate-50",
                        u.active && "hover:bg-primary/5 hover:text-primary text-on-surface hover:translate-x-0.5",
                        isFocused && "bg-slate-100 text-primary",
                        isSelected && "bg-primary/15 text-primary font-bold"
                      )}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="truncate">{u.name}</span>
                        {!u.active && (
                          <span className="text-[8px] font-black text-outline-variant tracking-wider uppercase mt-0.5">
                            Coming Soon
                          </span>
                        )}
                      </div>
                      {isSelected && <Check size={14} className="text-primary shrink-0" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 px-1">
              <BookOpen className="size-3.5 text-on-surface-variant" /> Department / Hostel
            </label>
            <Input
              type="text"
              placeholder="e.g. Computer Engineering / Sulaiman Hall"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
              disabled={loading || success}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 px-1">
              <Phone className="size-3.5 text-on-surface-variant" /> Phone Number (WhatsApp)
            </label>
            <Input
              type="tel"
              placeholder="e.g. +91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              disabled={loading || success}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 px-1">
              <Lock className="size-3.5 text-on-surface-variant" /> Account Password
            </label>
            <div className="relative flex items-center">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="•••••••• (Min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-12 w-full"
                required
                disabled={loading || success}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-on-surface-variant hover:text-foreground transition-colors focus:outline-none"
                disabled={loading || success}
              >
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-xl text-white action-gradient font-bold transition-all duration-[180ms] flex items-center justify-center gap-2 mt-2"
            disabled={loading || success}
          >
            {loading ? (
              <span className="inline-block size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Complete Onboarding"
            )}
          </Button>
        </form>
      </div>
    </AuthLayout>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4 bg-radial from-background via-surface-container-low to-surface-dim">
        <div className="size-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    }>
      <OnboardingForm />
    </Suspense>
  )
}
