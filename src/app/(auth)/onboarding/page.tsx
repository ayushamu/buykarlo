"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { completeOnboarding } from "./actions"
import { User, School, BookOpen, Phone, ShieldCheck } from "lucide-react"

export default function OnboardingPage() {
  const [fullName, setFullName] = useState("")
  const [university, setUniversity] = useState("Aligarh Muslim University (AMU)")
  const [department, setDepartment] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  // Fetch current user on mount
  useEffect(() => {
    async function getUser() {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        router.push("/login")
      }
    }
    getUser()
  }, [router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName || !university || !department || !phone) {
      setError("Please fill out all fields.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const actionResult = await completeOnboarding({
        fullName,
        university,
        department,
        phone
      })

      if (actionResult.error) {
        throw new Error(actionResult.error)
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/")
        router.refresh()
      }, 1500)
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-radial from-background via-surface-container-low to-surface-dim relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-secondary/5 blur-[120px]" />

      <div className="w-full max-w-md glass-panel border border-border/40 rounded-3xl p-8 premium-shadow relative z-10 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="size-16 rounded-2xl action-gradient flex items-center justify-center text-white mb-4 shadow-accent">
            <ShieldCheck className="size-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-center">Complete Profile</h1>
          <p className="text-sm text-on-surface-variant mt-2 text-center">
            Provide your details to unlock buy & sell actions
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-success/10 border border-success/20 text-success text-sm font-semibold text-center">
            Profile completed successfully! Welcome to BuyKarlo.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5 px-1">
              <User className="size-4 text-on-surface-variant" /> Full Name
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

          <div className="space-y-1">
            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5 px-1">
              <School className="size-4 text-on-surface-variant" /> University
            </label>
            <Input
              type="text"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              required
              disabled={loading || success}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5 px-1">
              <BookOpen className="size-4 text-on-surface-variant" /> Department / Hostel
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
            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5 px-1">
              <Phone className="size-4 text-on-surface-variant" /> Phone Number (WhatsApp)
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
    </div>
  )
}
