"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { ShieldCheck, Mail, Lock, Key, ArrowLeft, Eye, EyeOff, RotateCcw } from "lucide-react"

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1) // 1 = Registration form, 2 = Email OTP verification
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [emailOtp, setEmailOtp] = useState("")
  const [isFocused, setIsFocused] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [resendSuccess, setResendSuccess] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: email,
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
  
  const router = useRouter()
  const supabase = createClient()

  // Handle Registration Submit (Step 1)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    setLoading(true)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      })

      if (signUpError) {
        throw signUpError
      }

      // If user is already logged in (verification disabled in Supabase)
      if (data.session) {
        setSuccess(true)
        setTimeout(() => {
          router.push("/onboarding")
        }, 1500)
      } else {
        // Verification enabled, go to Step 2
        setStep(2)
      }
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
        type: "signup"
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-radial from-background via-surface-container-low to-surface-dim relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-secondary/5 blur-[120px]" />

      <div className="w-full max-w-md glass-panel border border-border/40 rounded-3xl p-8 premium-shadow relative z-10 animate-fade-in-up">
        {step === 2 && (
          <button
            type="button"
            onClick={() => {
              setStep(1)
              setError(null)
            }}
            className="inline-flex items-center gap-1 text-sm font-bold text-on-surface-variant hover:text-foreground mb-6 transition-all"
            disabled={loading}
          >
            <ArrowLeft className="size-4" /> Change Email / Password
          </button>
        )}

        {/* Logo and Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="size-16 rounded-2xl action-gradient flex items-center justify-center text-white mb-4 shadow-accent">
            <ShieldCheck className="size-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-center">
            {step === 1 ? "Join BuyKarlo" : "Verify Your Email"}
          </h1>
          <p className="text-sm text-on-surface-variant mt-2 text-center">
            {step === 1
              ? "Create an account to buy & sell within your campus"
              : `We sent a 6-digit confirmation code to ${email}`}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-success/10 border border-success/20 text-success text-sm font-semibold text-center">
            {step === 1 
              ? "Registration successful! Redirecting..." 
              : "Email verified successfully! Redirecting..."}
          </div>
        )}

        {step === 1 ? (
          /* Step 1: Registration form */
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-foreground flex items-center gap-1.5 px-1">
                <Mail className="size-4 text-on-surface-variant" /> Email Address
              </label>
              <Input
                type="email"
                placeholder="e.g. name@student.amu.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || success}
              />
              <p className="text-[11px] text-on-surface-variant px-1 mt-1">
                Academic domains (.edu, .ac.in) automatically receive a "Student Verified" badge.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-foreground flex items-center gap-1.5 px-1">
                <Lock className="size-4 text-on-surface-variant" /> Password
              </label>
              <div className="relative flex items-center">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
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

            <div className="space-y-1">
              <label className="text-sm font-semibold text-foreground flex items-center gap-1.5 px-1">
                <Lock className="size-4 text-on-surface-variant" /> Confirm Password
              </label>
              <div className="relative flex items-center">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-12 w-full"
                  required
                  disabled={loading || success}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 text-on-surface-variant hover:text-foreground transition-colors focus:outline-none"
                  disabled={loading || success}
                >
                  {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
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
                "Sign Up"
              )}
            </Button>
          </form>
        ) : (
          /* Step 2: Email OTP verification */
          <form onSubmit={handleVerifyEmail} className="space-y-6">
            <div className="space-y-4">
              <label className="text-sm font-semibold text-foreground flex items-center justify-center gap-1.5 px-1">
                <Key className="size-4 text-on-surface-variant" /> Enter 6-Digit Email Code
              </label>
              
              <div className="relative w-full max-w-[320px] mx-auto h-14">
                {/* Real input overlay (completely invisible but handles input/paste/autofill) */}
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
                        className={`flex items-center justify-center text-xl font-mono font-bold rounded-xl border-[1.5px] bg-surface/50 transition-all duration-150 ${
                          digit
                            ? "border-primary text-foreground scale-[1.02] shadow-sm"
                            : isActive
                            ? "border-primary ring-[3px] ring-primary/15 scale-[1.02] bg-surface"
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
          <div className="mt-8 text-center border-t border-border/20 pt-6">
            <p className="text-sm text-on-surface-variant">
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
    </div>
  )
}
