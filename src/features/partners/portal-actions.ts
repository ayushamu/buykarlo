"use server"

import { createClient } from "@/lib/supabase/server"

export async function getMyPartnerStats() {
  try {
    const supabase = await createClient()

    // Calling the secure function get_my_partner_stats
    const { data, error } = await supabase.rpc("get_my_partner_stats")

    if (error) {
      console.error("Error executing get_my_partner_stats:", error)
      return { error: error.message }
    }

    const myStats = Array.isArray(data) ? data[0] : (data || null)
    if (!myStats) {
      return { error: "Not registered as an active referral partner." }
    }

    return { success: true, partner: myStats }
  } catch (err: any) {
    console.error("getMyPartnerStats Exception:", err)
    return { error: "An unexpected error occurred." }
  }
}

export async function getMyReferredSignups() {
  try {
    const supabase = await createClient()

    // Calling the secure function get_my_referred_signups
    const { data, error } = await supabase.rpc("get_my_referred_signups")

    if (error) {
      console.error("Error executing get_my_referred_signups:", error)
      return { error: error.message }
    }

    return { success: true, signups: data || [] }
  } catch (err: any) {
    console.error("getMyReferredSignups Exception:", err)
    return { error: "An unexpected error occurred." }
  }
}

export async function getMyPayouts() {
  try {
    const supabase = await createClient()

    // Calling the secure function get_my_payouts
    const { data, error } = await supabase.rpc("get_my_payouts")

    if (error) {
      console.error("Error executing get_my_payouts:", error)
      return { error: error.message }
    }

    return { success: true, payouts: data || [] }
  } catch (err: any) {
    console.error("getMyPayouts Exception:", err)
    return { error: "An unexpected error occurred." }
  }
}
