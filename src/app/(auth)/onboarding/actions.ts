"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { sendWelcomeEmail } from "@/lib/email"


interface CompleteOnboardingInput {
  fullName: string
  university: string
  department: string
  phone: string
  password?: string
  referralCode?: string
}

export async function completeOnboarding(input: CompleteOnboardingInput) {
  try {
    const supabase = await createClient()

    // 1. Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: "Unauthorized. Please log in first." }
    }

    // Update password if provided
    if (input.password) {
      const { error: passwordError } = await supabase.auth.updateUser({
        password: input.password
      })
      if (passwordError) {
        return { error: `Failed to set account password: ${passwordError.message}` }
      }
    }

    // 2. Keep student verification tied to admin-reviewed ID cards only.
    const email = user.email || ""

    // 3. Check if the phone number is already taken by another user
    const cleanedPhone = input.phone.replace(/\D/g, "")
    const displayPhone = cleanedPhone.length === 10 ? "91" + cleanedPhone : cleanedPhone

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("phone", displayPhone)
      .maybeSingle()

    if (existingProfile && existingProfile.id !== user.id) {
      return { error: "This phone number is already registered to another account." }
    }

    // 4. Update profile details (the profile is automatically created via trigger on signup)
    const cookieStore = await cookies()
    const userEnteredCode = input.referralCode?.trim().toUpperCase()
    const refCode = userEnteredCode || cookieStore.get('buykarlo_ref')?.value
    let partnerId: string | null = null

    if (refCode) {
      const { data: partnerData, error: rpcError } = await supabase
        .rpc("get_partner_by_code", { code: refCode })
      
      if (rpcError) {
        console.error("RPC get_partner_by_code error:", rpcError)
      }

      const partner = Array.isArray(partnerData) ? partnerData[0] : partnerData
      if (partner) {
        partnerId = partner.id
      } else if (userEnteredCode) {
        return { error: `Invalid referral code: "${userEnteredCode}"` }
      }
    }

    const profileUpdate: any = {
      email: email,
      full_name: input.fullName.trim(),
      university: input.university.trim(),
      department: input.department.trim(),
      phone: displayPhone,
      phone_verified: true,
      verification_status: "unverified",
      institutional_email: null,
      institutional_verified: false,
      trust_score: 50
    }

    if (partnerId) {
      profileUpdate.referred_by = partnerId
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("id", user.id)

    if (updateError) {
      console.error("Onboarding Database Update Error:", updateError)
      return { error: `Failed to update profile details: ${updateError.message}` }
    }

    // Clear the referral cookie on successful onboarding association
    if (partnerId) {
      try {
        cookieStore.delete('buykarlo_ref')
      } catch (cookieErr) {
        console.error("Failed to delete referral cookie:", cookieErr)
      }
    }

    // Trigger onboarding welcome email asynchronously
    if (email) {
      sendWelcomeEmail(email, input.fullName.trim()).catch((err) => {
        console.error("Welcome email async send failed:", err)
      })
    }

    revalidatePath("/")
    return { success: true }
  } catch (err: any) {
    console.error("completeOnboarding exception:", err)
    return { error: err.message || "An unexpected error occurred." }
  }
}
