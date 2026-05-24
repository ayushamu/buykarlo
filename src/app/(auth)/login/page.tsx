"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { ShieldCheck, Mail, Lock } from "lucide-react"

function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = searchParams?.get("redirect") || "/"
  const supabase = createClient()

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
        router.push(redirectPath)
        router.refresh()
      }, 1000)
    } catch (err: any) {
      setError(err.message || "Invalid email or password.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-radial from-background via-surface-container-low to-surface-dim relative overflow-hidden">
      {/* Ambient background light */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-secondary/5 blur-[120px]" />

      <div className="w-full max-w-md glass-panel border border-border/40 rounded-3xl p-8 premium-shadow relative z-10 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="size-16 rounded-2xl action-gradient flex items-center justify-center text-white mb-4 shadow-accent">
            <ShieldCheck className="size-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-center">Welcome Back</h1>
          <p className="text-sm text-on-surface-variant mt-2 text-center">
            Sign in to start exploring your campus marketplace
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-success/10 border border-success/20 text-success text-sm font-semibold text-center">
            Login successful! Redirecting...
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5 px-1">
              <Mail className="size-4 text-on-surface-variant" /> Email Address
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
              <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Lock className="size-4 text-on-surface-variant" /> Password
              </label>
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              "Sign In"
            )}
          </Button>
        </form>

        <div className="mt-8 text-center border-t border-border/20 pt-6">
          <p className="text-sm text-on-surface-variant">
            New to BuyKarlo?{" "}
            <Link
              href="/register"
              className="text-primary hover:underline font-bold transition-all"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4 bg-radial from-background via-surface-container-low to-surface-dim">
        <div className="size-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
