"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShieldCheck, Mail, Lock, Key, ArrowLeft, RotateCcw, Eye, EyeOff, X, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [loginMode, setLoginMode] = useState<"password" | "otp-request" | "otp-verify">("password")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [emailOtp, setEmailOtp] = useState("")
  const [isFocused, setIsFocused] = useState(true)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const router = useRouter()
  const supabase = createClient()
  const otpInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCountdown])

  // Focus OTP input automatically when in otp-verify mode
  useEffect(() => {
    if (loginMode === "otp-verify" && otpInputRef.current) {
      otpInputRef.current.focus()
    }
  }, [loginMode])

  // Reset state on close/open
  useEffect(() => {
    if (isOpen) {
      setLoginMode("password")
      setEmail("")
      setPassword("")
      setEmailOtp("")
      setError(null)
      setSuccess(false)
      setLoading(false)
    }
  }, [isOpen])

  // Handle Email & Password Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) throw signInError

      setSuccess(true)
      setTimeout(() => {
        router.refresh()
        onSuccess()
        onClose()
      }, 1000)
    } catch (err: any) {
      setError(err.message || "Invalid email or password.")
    } finally {
      setLoading(false)
    }
  }

  // Handle Send OTP (OTP Request)
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      })

      if (otpError) throw otpError

      setLoginMode("otp-verify")
    } catch (err: any) {
      setError(err.message || "Failed to send verification code. Make sure you are registered.")
    } finally {
      setLoading(false)
    }
  }

  // Handle OTP Verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
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

      if (verifyError) throw verifyError

      setSuccess(true)
      setTimeout(() => {
        router.refresh()
        onSuccess()
        onClose()
      }, 1000)
    } catch (err: any) {
      setError(err.message || "Verification code is invalid or has expired.")
    } finally {
      setLoading(false)
    }
  }

  // Handle Resend OTP (OTP Verify)
  const handleResendOtp = async () => {
    if (resendCountdown > 0 || loading || success) return
    setError(null)
    setResendSuccess(false)
    setLoading(true)

    try {
      const { error: resendError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      })

      if (resendError) throw resendError

      setResendSuccess(true)
      setResendCountdown(60)
      setTimeout(() => setResendSuccess(false), 5000)
    } catch (err: any) {
      setError(err.message || "Failed to resend verification code.")
    } finally {
      setLoading(false)
    }
  }

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setError(null)
    setLoading(true)
    try {
      const currentPath = window.location.pathname + window.location.search
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(currentPath)}`,
        }
      })
      if (googleError) throw googleError
    } catch (err: any) {
      setError(err.message || "Failed to initialize Google login.")
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={loading ? undefined : onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-[2.5rem] border border-outline-variant/30 bg-white p-6 md:p-8 shadow-2xl flex flex-col max-h-[90vh]"
          >
            {/* Close Button */}
            {!loading && !success && (
              <button
                onClick={onClose}
                className="absolute right-6 top-6 rounded-full p-2 hover:bg-slate-100 transition-colors text-on-surface-variant cursor-pointer z-30"
              >
                <X size={18} />
              </button>
            )}

            {/* Logo/Identity */}
            <div className="flex items-center gap-2 mb-6">
              <div className="size-8 rounded-lg action-gradient flex items-center justify-center text-white shadow-accent">
                <ShieldCheck className="size-5" />
              </div>
              <span className="font-display text-lg font-black text-slate-800 tracking-tighter">BuyKarlo</span>
            </div>

            <div className="w-full text-left">
              {loginMode === "otp-verify" && (
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode("otp-request")
                    setError(null)
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-foreground mb-6 transition-all"
                  disabled={loading}
                >
                  <ArrowLeft className="size-3.5" /> Change Email
                </button>
              )}

              {/* Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-black tracking-tight text-slate-800">
                  {loginMode === "otp-verify" ? "Verify Code" : "Sign In Required"}
                </h2>
                <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                  {loginMode === "password" && "Please log in to chat with sellers and make offers."}
                  {loginMode === "otp-request" && "Enter your student email to sign in via a 6-digit verification code."}
                  {loginMode === "otp-verify" && `We sent a 6-digit confirmation code to ${email}`}
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3.5 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-semibold">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-4 rounded-xl bg-success/10 border border-success/20 text-success text-xs font-semibold text-center">
                  Login successful! Resuming...
                </div>
              )}

              {loginMode === "password" && (
                /* Password Login Form */
                <form onSubmit={handleEmailLogin} className="space-y-4">
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
                      disabled={loading || success}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Lock className="size-3.5 text-on-surface-variant" /> Password
                      </label>
                      <Link
                        href="/forgot-password"
                        onClick={onClose}
                        className="text-xs text-primary hover:underline font-bold"
                      >
                        Forgot Password?
                      </Link>
                    </div>
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

                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl text-white action-gradient font-bold transition-all duration-[180ms] flex items-center justify-center gap-2 mt-2"
                    disabled={loading || success}
                  >
                    {loading ? (
                      <Loader2 className="size-5 animate-spin text-white" />
                    ) : (
                      "Sign In"
                    )}
                  </Button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMode("otp-request")
                        setError(null)
                      }}
                      className="text-xs text-primary hover:underline font-bold cursor-pointer"
                      disabled={loading || success}
                    >
                      Sign In with Email OTP instead
                    </button>
                  </div>
                </form>
              )}

              {loginMode === "otp-request" && (
                /* OTP Request Form */
                <form onSubmit={handleSendOtp} className="space-y-4">
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
                      disabled={loading || success}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl text-white action-gradient font-bold transition-all duration-[180ms] flex items-center justify-center gap-2 mt-2"
                    disabled={loading || success}
                  >
                    {loading ? (
                      <Loader2 className="size-5 animate-spin text-white" />
                    ) : (
                      "Get OTP Code"
                    )}
                  </Button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMode("password")
                        setError(null)
                      }}
                      className="text-xs text-primary hover:underline font-bold cursor-pointer"
                      disabled={loading || success}
                    >
                      Sign In with Password instead
                    </button>
                  </div>
                </form>
              )}

              {loginMode === "otp-verify" && (
                /* OTP Verification Form */
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="space-y-4">
                    <label className="text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 px-1">
                      <Key className="size-3.5 text-on-surface-variant" /> Enter 6-Digit Email Code
                    </label>
                    
                    <div className="relative w-full max-w-[300px] mx-auto h-12">
                      <input
                        ref={otpInputRef}
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
                      />
                      
                      <div className="grid grid-cols-6 gap-2 w-full h-full pointer-events-none relative z-10">
                        {Array.from({ length: 6 }).map((_, i) => {
                          const digit = emailOtp[i] || "";
                          const isActive = isFocused && emailOtp.length === i;
                          return (
                            <div
                              key={i}
                              className={`flex items-center justify-center text-lg font-mono font-bold rounded-xl border-[1.5px] bg-slate-50 transition-all duration-150 ${
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
                                <span className="w-[1.5px] h-4 bg-primary animate-pulse" />
                              ) : (
                                <span className="text-on-surface-variant/30">•</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="text-center mt-3">
                      {resendSuccess && (
                        <p className="text-[11px] text-success font-semibold mb-2 animate-fade-in-up">
                          Code resent successfully!
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
                        <RotateCcw className="size-3" />
                        {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend Code"}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl text-white action-gradient font-bold transition-all duration-[180ms] flex items-center justify-center gap-2"
                    disabled={loading || success}
                  >
                    {loading ? (
                      <Loader2 className="size-5 animate-spin text-white" />
                    ) : (
                      "Verify OTP & Sign In"
                    )}
                  </Button>
                </form>
              )}

              {loginMode !== "otp-verify" && (
                <>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/60"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-wider">
                      <span className="bg-white px-3 text-on-surface-variant">Or continue with</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleGoogleLogin}
                    variant="outline"
                    className="w-full h-11 rounded-xl border border-border/80 bg-white hover:bg-slate-50 text-slate-700 font-bold transition-all duration-150 flex items-center justify-center gap-2.5 shadow-sm"
                    disabled={loading || success}
                  >
                    {loading && !email && !emailOtp ? (
                      <Loader2 className="size-5 animate-spin text-slate-700" />
                    ) : (
                      <>
                        <svg className="size-4.5" viewBox="0 0 24 24" width="18" height="18">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        Continue with Google
                      </>
                    )}
                  </Button>

                  <div className="mt-6 pt-4 border-t border-border/20 text-center">
                    <p className="text-xs text-on-surface-variant">
                      New to BuyKarlo?{" "}
                      <Link
                        href="/register"
                        onClick={onClose}
                        className="text-primary hover:underline font-bold transition-all"
                      >
                        Sign Up
                      </Link>
                    </p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
