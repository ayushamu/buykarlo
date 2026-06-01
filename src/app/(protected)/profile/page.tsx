import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProfileClient } from "./ProfileClient"

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  const supabase = await createClient()

  // 1. Authenticate user session
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect("/login")
  }

  // 2. Query user profile record
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(`
      id,
      email,
      full_name,
      avatar_url,
      university,
      department,
      phone,
      trust_score,
      phone_verified,
      verification_status,
      institutional_email,
      institutional_verified
    `)
    .eq("id", user.id)
    .maybeSingle()

  if (profileError || !profile) {
    console.error("Error loading user profile:", profileError)
    // Fallback/Redirect if profile row doesn't exist
    redirect("/onboarding")
  }

  return (
    <div className="mx-auto max-w-container-max px-margin-mobile py-8 md:px-margin-desktop md:py-12">
      <ProfileClient profile={profile} />
    </div>
  )
}
