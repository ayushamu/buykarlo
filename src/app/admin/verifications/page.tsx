import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getPendingVerifications } from "@/features/admin/actions"
import { VerificationsClient } from "./VerificationsClient"

export const dynamic = "force-dynamic"

export default async function AdminVerificationsPage() {
  // 1. Authenticate admin status
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile || !profile.is_admin) {
    redirect("/")
  }

  // 2. Fetch pending verifications
  const res = await getPendingVerifications()
  if (res.error) {
    return (
      <div className="p-8 text-center bg-red-50 text-red-600 rounded-2xl border border-red-100 max-w-md mx-auto mt-20">
        <p className="font-bold">Error loading verifications</p>
        <p className="text-sm mt-1">{res.error}</p>
      </div>
    )
  }

  const verifications = res.verifications || []

  return (
    <div className="mx-auto max-w-container-max px-margin-mobile py-8 md:px-margin-desktop md:py-12">
      <div className="mb-8 border-b border-slate-100 pb-4">
        <h1 className="font-display text-2xl font-black text-slate-800">ID Verification Queue</h1>
        <p className="text-xs text-on-surface-variant mt-1">
          Review submitted student ID cards, verify credentials, and approve or reject submissions to award trust points.
        </p>
      </div>

      <VerificationsClient initialVerifications={verifications} />
    </div>
  )
}
