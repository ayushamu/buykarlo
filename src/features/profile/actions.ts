"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface UpdateProfileInput {
  fullName: string
  department: string
  phone?: string
}

export async function updateProfile(input: UpdateProfileInput) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: "Unauthorized. Please log in first." }
    }

    // 2. Update user profile information
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: input.fullName.trim(),
        department: input.department.trim(),
        phone: input.phone?.trim() || null
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("Error updating profile details:", updateError)
      return { error: "Failed to update profile details. Please try again." }
    }

    revalidatePath("/profile")
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("updateProfile Server Action Exception:", error)
    return { error: "An unexpected error occurred while updating your profile." }
  }
}

export async function signOutUser() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error("Sign Out Error:", error)
      return { error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    console.error("signOutUser Server Action Exception:", error)
    return { error: "An unexpected error occurred during logout." }
  }
}

export async function submitIdCardVerification(documentUrl: string) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: "Unauthorized. Please log in first." }
    }

    // 2. Insert into verifications table
    const { error: insertError } = await supabase
      .from("verifications")
      .insert({
        user_id: user.id,
        document_url: documentUrl,
        status: "pending"
      })

    if (insertError) {
      console.error("Error inserting verification request:", insertError)
      return { error: "Failed to submit verification request." }
    }

    // 3. Update profiles table status to pending
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        verification_status: "pending"
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("Error updating profile verification status:", updateError)
      return { error: "Failed to update profile verification status." }
    }

    revalidatePath("/profile")
    return { success: true }
  } catch (error) {
    console.error("submitIdCardVerification Exception:", error)
    return { error: "An unexpected error occurred." }
  }
}

export async function verifyInstitutionalEmail(emailAddress: string) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: "Unauthorized. Please log in first." }
    }

    // 2. Validate email is institutional
    const cleanEmail = emailAddress.trim().toLowerCase()
    const isAcademic = cleanEmail.endsWith(".edu") || cleanEmail.endsWith(".ac.in") || cleanEmail.endsWith(".edu.in")
    if (!isAcademic) {
      return { error: "Please enter a valid university institutional email (.edu, .ac.in, or .edu.in)." }
    }

    // 3. Check if email is already taken by another account
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("institutional_email", cleanEmail)
      .eq("institutional_verified", true)
      .maybeSingle()

    if (existing && existing.id !== user.id) {
      return { error: "This institutional email is already verified by another account." }
    }

    // 4. Fetch current profiles details to calculate new trust score
    const { data: profile } = await supabase
      .from("profiles")
      .select("trust_score, institutional_verified")
      .eq("id", user.id)
      .single()

    if (!profile) {
      return { error: "Profile not found." }
    }

    // 5. Update profile: mark verified, add +20 points (only if not already verified to prevent double claiming)
    const currentScore = profile.trust_score || 50
    const alreadyVerified = profile.institutional_verified
    const newScore = alreadyVerified ? currentScore : Math.min(currentScore + 20, 100)

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        institutional_email: cleanEmail,
        institutional_verified: true,
        trust_score: newScore,
        verification_status: "verified" // Set to verified upon email verification
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("Error verifying institutional email:", updateError)
      return { error: "Failed to verify institutional email." }
    }

    revalidatePath("/profile")
    return { success: true }
  } catch (error) {
    console.error("verifyInstitutionalEmail Exception:", error)
    return { error: "An unexpected error occurred." }
  }
}

