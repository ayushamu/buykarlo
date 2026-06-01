"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShieldCheck, Lock, Eye, EyeOff } from "lucide-react"
import { AuthLayout } from "@/components/auth/AuthLayout"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const handleResetPassword = async (e: React.FormEvent) => {
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
      const { error: resetError } = await supabase.auth.updateUser({
        password: password,
      })

      if (resetError) {
        throw resetError
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/login?message=password-reset-success")
      }, 2000)
    } catch (err: any) {
      setError(err.message || "Failed to update password. Reset link may have expired.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout step={1} stepTitle="Password Reset">
      <div className="w-full text-left">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-black tracking-tight text-slate-800">New Password</h2>
          <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
            Define a secure new password for your BuyKarlo account.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-semibold">
            {error}
          </div>
        )}

        {success ? (
          <div className="p-6 rounded-2xl bg-success/10 border border-success/20 text-success text-xs font-body font-semibold text-center">
            <p className="font-bold text-sm mb-2 text-emerald-800">Password Updated!</p>
            <p className="text-on-surface-variant">
              Redirecting you to the Sign In page...
            </p>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 px-1">
                <Lock className="size-3.5 text-on-surface-variant" /> New Password
              </label>
              <div className="relative flex items-center">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-12 w-full"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-on-surface-variant hover:text-foreground transition-colors focus:outline-none"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 px-1">
                <Lock className="size-3.5 text-on-surface-variant" /> Confirm Password
              </label>
              <div className="relative flex items-center">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-12 w-full"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 text-on-surface-variant hover:text-foreground transition-colors focus:outline-none"
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-white action-gradient font-bold transition-all duration-[180ms] flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <span className="inline-block size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Save Password"
              )}
            </Button>
          </form>
        )}
      </div>
    </AuthLayout>
  )
}
