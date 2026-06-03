"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { sendChatNotifications } from "@/lib/onesignal"

/**
 * Get a conversation by listingId, creating a new one if it doesn't exist.
 */
export async function getOrCreateConversation(listingId: string) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: "Unauthorized. Please log in first." }
    }

    // 2. Fetch the listing to verify it exists and get the seller_id
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, seller_id, title")
      .eq("id", listingId)
      .maybeSingle()

    if (listingError || !listing) {
      console.error("Error fetching listing:", listingError)
      return { error: "Listing not found." }
    }

    // Prevent buyers from creating a conversation with themselves
    if (listing.seller_id === user.id) {
      return { error: "You cannot initiate a conversation on your own listing." }
    }

    // 3. Check if conversation already exists between current user (buyer), seller, and listing
    const { data: existing, error: existingError } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", listingId)
      .eq("buyer_id", user.id)
      .eq("seller_id", listing.seller_id)
      .maybeSingle()

    if (existingError) {
      console.error("Error checking existing conversation:", existingError)
    }

    if (existing) {
      return { success: true, conversationId: existing.id }
    }

    // 4. Create new conversation
    const { data: newConv, error: createError } = await supabase
      .from("conversations")
      .insert({
        listing_id: listingId,
        buyer_id: user.id,
        seller_id: listing.seller_id
      })
      .select("id")
      .single()

    if (createError) {
      console.error("Error creating conversation:", createError)
      return { error: `Failed to start conversation: ${createError.message}` }
    }

    revalidatePath("/messages")
    return { success: true, conversationId: newConv.id }
  } catch (error) {
    console.error("getOrCreateConversation Exception:", error)
    return { error: "An unexpected error occurred." }
  }
}

/**
 * Get all conversations for the current user.
 */
export async function getConversations() {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: "Unauthorized. Please log in first." }
    }

    // 2. Fetch conversations
    const { data, error } = await supabase
      .from("conversations")
      .select(`
        id,
        listing_id,
        buyer_id,
        seller_id,
        created_at,
        updated_at,
        listing:listings(
          id,
          slug,
          title,
          price,
          status,
          images:listing_images(storage_path, display_order)
        ),
        buyer:profiles!conversations_buyer_id_fkey(id, full_name, avatar_url, university, department),
        seller:profiles!conversations_seller_id_fkey(id, full_name, avatar_url, university, department),
        messages(id, content, created_at, sender_id, is_read)
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error fetching conversations:", error)
      return { error: `Database error: ${error.message}` }
    }

    // 3. Format the conversations list programmatically
    const formatted = (data || []).map((conv: any) => {
      const isBuyer = conv.buyer_id === user.id
      const otherParticipant = isBuyer ? conv.seller : conv.buyer

      // Get last message sorted by created_at desc
      const sortedMessages = conv.messages ? [...conv.messages].sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ) : []
      
      const lastMessage = sortedMessages[0] || null

      // Get first listing image based on display_order
      const sortedImages = conv.listing?.images ? [...conv.listing.images].sort((a: any, b: any) => 
        a.display_order - b.display_order
      ) : []
      const listingImage = sortedImages.length > 0 ? sortedImages[0].storage_path : null

      // Count unread messages received from the other participant
      const unreadCount = conv.messages 
        ? conv.messages.filter((m: any) => m.sender_id !== user.id && !m.is_read).length 
        : 0

      return {
        id: conv.id,
        listingId: conv.listing_id,
        buyerId: conv.buyer_id,
        sellerId: conv.seller_id,
        createdAt: conv.created_at,
        updatedAt: conv.updated_at,
        listing: conv.listing ? {
          id: conv.listing.id,
          slug: conv.listing.slug,
          title: conv.listing.title,
          price: Number(conv.listing.price),
          status: conv.listing.status,
          imageUrl: listingImage,
          images: conv.listing.images || []
        } : null,
        otherParticipant: otherParticipant ? {
          id: otherParticipant.id,
          fullName: otherParticipant.full_name || "Campus User",
          avatarUrl: otherParticipant.avatar_url,
          university: otherParticipant.university || "AMU",
          department: otherParticipant.department || "Student"
        } : null,
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content,
          createdAt: lastMessage.created_at,
          senderId: lastMessage.sender_id,
          isRead: lastMessage.is_read
        } : null,
        unreadCount,
        isBuyer
      }
    })

    return { success: true, conversations: formatted, currentUserId: user.id }
  } catch (error) {
    console.error("getConversations Exception:", error)
    return { error: "An unexpected error occurred." }
  }
}

/**
 * Get all messages for a specific conversation.
 */
export async function getMessages(conversationId: string) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: "Unauthorized. Please log in first." }
    }

    // 2. Verify conversation membership
    const { data: conv, error: convError } = await supabase
      .from("conversations")
      .select("buyer_id, seller_id")
      .eq("id", conversationId)
      .maybeSingle()

    if (convError || !conv) {
      return { error: "Conversation not found." }
    }

    if (conv.buyer_id !== user.id && conv.seller_id !== user.id) {
      return { error: "Access denied. You are not a member of this conversation." }
    }

    // 3. Fetch message history
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("id, conversation_id, sender_id, content, is_read, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })

    if (messagesError) {
      console.error("Error fetching messages:", messagesError)
      return { error: `Database error: ${messagesError.message}` }
    }

    return { success: true, messages: messages || [], currentUserId: user.id }
  } catch (error) {
    console.error("getMessages Exception:", error)
    return { error: "An unexpected error occurred." }
  }
}

/**
 * Send a message within a conversation.
 */
export async function sendMessage(conversationId: string, content: string) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: "Unauthorized. Please log in first." }
    }

    // 2. Verify conversation membership
    const { data: conv, error: convError } = await supabase
      .from("conversations")
      .select(`
        buyer_id, 
        seller_id,
        buyer:profiles!conversations_buyer_id_fkey(full_name),
        seller:profiles!conversations_seller_id_fkey(full_name)
      `)
      .eq("id", conversationId)
      .maybeSingle()

    if (convError || !conv) {
      return { error: "Conversation not found." }
    }

    if (conv.buyer_id !== user.id && conv.seller_id !== user.id) {
      return { error: "Access denied. You are not a member of this conversation." }
    }

    // 3. Insert new message
    const { data: msg, error: insertError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim()
      })
      .select("id, conversation_id, sender_id, content, is_read, created_at")
      .single()

    if (insertError) {
      console.error("Error inserting message:", insertError)
      return { error: `Failed to send message: ${insertError.message}` }
    }

    // Trigger push notification asynchronously (don't block the response)
    const rawBuyer = Array.isArray(conv.buyer) ? conv.buyer[0] : conv.buyer
    const rawSeller = Array.isArray(conv.seller) ? conv.seller[0] : conv.seller
    const isBuyer = conv.buyer_id === user.id
    const senderName = isBuyer ? (rawBuyer?.full_name || "Campus User") : (rawSeller?.full_name || "Campus User")
    const receiverId = isBuyer ? conv.seller_id : conv.buyer_id

    sendChatNotifications({
      receiverId,
      senderName,
      messageContent: content.trim(),
      conversationId
    }).catch((err) => {
      console.error("Error dispatching chat notifications:", err)
    })

    revalidatePath("/messages")
    return { success: true, message: msg }
  } catch (error) {
    console.error("sendMessage Exception:", error)
    return { error: "An unexpected error occurred." }
  }
}

/**
 * Mark messages in a conversation as read (except those sent by current user).
 */
export async function markMessagesAsRead(conversationId: string) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: "Unauthorized." }
    }

    // 2. Perform bulk update
    const { error } = await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", user.id)
      .eq("is_read", false)

    if (error) {
      console.error("Error marking messages as read:", error)
      return { error: error.message }
    }

    revalidatePath("/messages")
    return { success: true }
  } catch (error) {
    console.error("markMessagesAsRead Exception:", error)
    return { error: "An unexpected error occurred." }
  }
}
