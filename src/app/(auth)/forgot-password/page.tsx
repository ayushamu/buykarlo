"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { ShieldCheck, Mail, ArrowLeft } from "lucide-react"
import { AuthLayout } from "@/components/auth/AuthLayout"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const supabase = createClient()

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      })

      if (resetError) {
        throw resetError
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || "Failed to send reset link. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout step={1} stepTitle="Password Recovery">
      <div className="w-full text-left">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-foreground mb-6 transition-all"
        >
          <ArrowLeft className="size-3.5" /> Back to Sign In
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-black tracking-tight text-slate-800">Reset Password</h2>
          <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
            Enter your student email and we'll send you a password recovery link.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-semibold">
            {error}
          </div>
        )}

        {success ? (
          <div className="p-6 rounded-2xl bg-success/10 border border-success/20 text-success text-xs font-body font-semibold">
            <p className="font-bold text-sm mb-2 text-emerald-800">Recovery Email Sent!</p>
            <p className="text-on-surface-variant leading-relaxed text-[11px] font-normal">
              Check your inbox at <span className="font-bold text-slate-800">{email}</span> for a link to reset your account password.
            </p>
          </div>
        ) : (
          <form onSubmit={handleResetRequest} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 px-1">
                <Mail className="size-3.5 text-on-surface-variant" /> Email Address
              </label>
              <Input
                type="email"
                placeholder="name@student.amu.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-white action-gradient font-bold transition-all duration-[180ms] flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <span className="inline-block size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>
        )}
      </div>
    </AuthLayout>
  )
}
