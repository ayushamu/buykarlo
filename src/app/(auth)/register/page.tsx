"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { ShieldCheck, Mail, Key, ArrowLeft, RotateCcw } from "lucide-react"
import { AuthLayout } from "@/components/auth/AuthLayout"

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1) // 1 = Registration form, 2 = Email OTP verification
  const [email, setEmail] = useState("")
  const [emailOtp, setEmailOtp] = useState("")
  const [isFocused, setIsFocused] = useState(true)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [resendSuccess, setResendSuccess] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCountdown])

  // Handle Resend OTP (Step 2)
  const handleResendOtp = async () => {
    if (resendCountdown > 0 || loading || success) return
    setError(null)
    setResendSuccess(false)
    setLoading(true)

    try {
      const { error: resendError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      })

      if (resendError) {
        throw resendError
      }

      setResendSuccess(true)
      setResendCountdown(60) // 60 seconds rate limit cooldown
      setTimeout(() => setResendSuccess(false), 5000)
    } catch (err: any) {
      setError(err.message || "Failed to resend verification code. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Handle Registration Submit (Step 1)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error: signUpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      })

      if (signUpError) {
        throw signUpError
      }

      // Verification OTP code is sent, go to Step 2
      setStep(2)
    } catch (err: any) {
      setError(err.message || "An error occurred during registration.")
    } finally {
      setLoading(false)
    }
  }

  // Handle Email Verification (Step 2)
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailOtp || emailOtp.length !== 6) {
      setError("Please enter a valid 6-digit verification code.")
      return
    }

    setError(null)
    setLoading(true)

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: emailOtp,
        type: "email"
      })

      if (verifyError) {
        throw verifyError
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/onboarding")
        router.refresh()
      }, 1500)
    } catch (err: any) {
      setError(err.message || "Verification code is invalid or has expired.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout step={1} stepTitle="Join BuyKarlo">
      <div className="w-full text-left">
        {step === 2 && (
          <button
            type="button"
            onClick={() => {
              setStep(1)
              setError(null)
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-foreground mb-6 transition-all"
            disabled={loading}
          >
            <ArrowLeft className="size-3.5" /> Change Email
          </button>
        )}

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-black tracking-tight text-slate-800">
            {step === 1 ? "Join BuyKarlo" : "Verify Your Email"}
          </h2>
          <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
            {step === 1
              ? "Create an account to buy & sell within your verified campus community."
              : `We sent a 6-digit confirmation code to ${email}`}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-success/10 border border-success/20 text-success text-xs font-semibold text-center">
            {step === 1 
              ? "Registration successful! Redirecting..." 
              : "Email verified successfully! Redirecting..."}
          </div>
        )}

        {step === 1 ? (
          /* Step 1: Registration form */
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 px-1">
                <Mail className="size-3.5 text-on-surface-variant" /> Email Address
              </label>
              <Input
                type="email"
                placeholder="e.g. name@student.amu.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || success}
              />
              <p className="text-[10px] text-on-surface-variant px-1 mt-1 leading-normal italic">
                Using an academic domain (.edu, .ac.in) automatically verifies your student network profile.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-white action-gradient font-bold transition-all duration-[180ms] flex items-center justify-center gap-2"
              disabled={loading || success}
            >
              {loading ? (
                <span className="inline-block size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Get OTP Code"
              )}
            </Button>
          </form>
        ) : (
          /* Step 2: Email OTP verification */
          <form onSubmit={handleVerifyEmail} className="space-y-6">
            <div className="space-y-4">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 px-1">
                <Key className="size-3.5 text-on-surface-variant" /> Enter 6-Digit Email Code
              </label>
              
              <div className="relative w-full max-w-[320px] mx-auto h-14">
                {/* Real input overlay */}
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ""))}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-text z-20 text-center"
                  required
                  disabled={loading || success}
                  autoFocus
                />
                
                {/* 6 Segmented visual boxes */}
                <div className="grid grid-cols-6 gap-2 w-full h-full pointer-events-none relative z-10">
                  {Array.from({ length: 6 }).map((_, i) => {
                    const digit = emailOtp[i] || "";
                    const isActive = isFocused && emailOtp.length === i;
                    return (
                      <div
                        key={i}
                        className={`flex items-center justify-center text-xl font-mono font-bold rounded-xl border-[1.5px] bg-slate-50 transition-all duration-150 ${
                          digit
                            ? "border-primary text-foreground scale-[1.02] shadow-sm"
                            : isActive
                            ? "border-primary ring-[3px] ring-primary/15 scale-[1.02] bg-white"
                            : "border-border text-on-surface-variant"
                        }`}
                      >
                        {digit ? (
                          digit
                        ) : isActive ? (
                          <span className="w-[1.5px] h-5 bg-primary animate-pulse" />
                        ) : (
                          <span className="text-on-surface-variant/30">•</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Resend OTP button */}
              <div className="text-center mt-4">
                {resendSuccess && (
                  <p className="text-xs text-success font-semibold mb-2 animate-fade-in-up">
                    Verification code resent successfully!
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCountdown > 0 || loading || success}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold transition-all ${
                    resendCountdown > 0 || loading || success
                      ? "text-on-surface-variant/40 cursor-not-allowed"
                      : "text-primary hover:text-secondary hover:underline cursor-pointer"
                  }`}
                >
                  <RotateCcw className="size-3.5" />
                  {resendCountdown > 0 ? `Resend Code in ${resendCountdown}s` : "Resend Code"}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-white action-gradient font-bold transition-all duration-[180ms] flex items-center justify-center gap-2"
              disabled={loading || success}
            >
              {loading ? (
                <span className="inline-block size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Verify Email"
              )}
            </Button>
          </form>
        )}

        {step === 1 && (
          <div className="mt-8 pt-6 border-t border-border/20">
            <p className="text-xs text-on-surface-variant">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-primary hover:underline font-bold transition-all"
              >
                Sign In
              </Link>
            </p>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
