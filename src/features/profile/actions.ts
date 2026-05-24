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
