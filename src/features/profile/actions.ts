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

    const publicBaseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/$/, "")
    const normalizedDocumentUrl = documentUrl.trim()
    const expectedDocumentPrefix = publicBaseUrl ? `${publicBaseUrl}/id_cards/${user.id}/` : null

    if (!expectedDocumentPrefix || !normalizedDocumentUrl.startsWith(expectedDocumentPrefix)) {
      return { error: "Invalid verification document URL." }
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("verification_status")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return { error: "Profile not found." }
    }

    if (profile.verification_status === "pending") {
      return { error: "Your ID verification is already under review." }
    }

    if (profile.verification_status === "verified") {
      return { error: "Your student ID is already verified." }
    }

    const { data: pendingRequest } = await supabase
      .from("verifications")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .limit(1)
      .maybeSingle()

    if (pendingRequest) {
      return { error: "Your ID verification is already under review." }
    }

    // 2. Insert into verifications table
    const { error: insertError } = await supabase
      .from("verifications")
      .insert({
        user_id: user.id,
        document_url: normalizedDocumentUrl,
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
