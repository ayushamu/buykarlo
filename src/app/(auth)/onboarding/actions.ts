"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface CompleteOnboardingInput {
  fullName: string
  university: string
  department: string
  phone: string
}

export async function completeOnboarding(input: CompleteOnboardingInput) {
  try {
    const supabase = await createClient()

    // 1. Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: "Unauthorized. Please log in first." }
    }

    // 2. Determine verification status based on email domain
    const email = user.email || ""
    const isAcademic = email.endsWith(".edu") || email.endsWith(".ac.in") || email.endsWith(".edu.in")
    const verificationStatus = isAcademic ? "verified" : "unverified"

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

    // 4. Upsert profile details (creates the profile if it was missing, or updates it if it exists)
    const { error: updateError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        email: email,
        full_name: input.fullName.trim(),
        university: input.university.trim(),
        department: input.department.trim(),
        phone: displayPhone,
        phone_verified: true,
        verification_status: verificationStatus
      })

    if (updateError) {
      console.error("Onboarding Database Update Error:", updateError)
      return { error: `Failed to update profile details: ${updateError.message}` }
    }

    revalidatePath("/")
    return { success: true }
  } catch (err: any) {
    console.error("completeOnboarding exception:", err)
    return { error: err.message || "An unexpected error occurred." }
  }
}
