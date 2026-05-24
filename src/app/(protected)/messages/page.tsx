"use client"

import { useState, useEffect, useRef, useTransition, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import {
  getConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  getOrCreateConversation
} from "@/features/chat/actions"
import {
  Send,
  ArrowLeft,
  Shield,
  CheckCircle,
  MoreVertical,
  Plus,
  Smile,
  Image as ImageIcon,
  X,
  MessageSquare,
  MapPin,
  User,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Check
} from "lucide-react"
import { cn } from "@/lib/utils"

function MessagesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()

  // Query Params
  const queryConvId = searchParams.get("conversationId")
  const queryListingId = searchParams.get("listingId")
  const queryDraft = searchParams.get("draft")

  // State
  const [conversations, setConversations] = useState<any[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)

  // Input states
  const [inputText, setInputText] = useState("")
  const [selectedImageRef, setSelectedImageRef] = useState<string | null>(null)
  const [imagePickerOpen, setImagePickerOpen] = useState(false)
  const [didApplyDraft, setDidApplyDraft] = useState(false)

  // Filter threads
  const [filterMode, setFilterMode] = useState<"all" | "buying" | "selling">("all")

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLTextAreaElement>(null)

  // 1. Initial Load of Conversations
  useEffect(() => {
    async function loadData() {
      setLoadingConvs(true)
      const res = await getConversations()
      if (res.success && res.conversations) {
        setConversations(res.conversations)
        if (res.currentUserId) {
          setCurrentUserId(res.currentUserId)
        }

        // Handle routing based on params
        if (queryConvId) {
          setActiveConvId(queryConvId)
        } else if (queryListingId) {
          // Find existing conversation for listingId
          const existing = res.conversations.find((c: any) => c.listingId === queryListingId)
          if (existing) {
            setActiveConvId(existing.id)
            router.replace(`/messages?conversationId=${existing.id}`)
          } else {
            // Initiate a new conversation
            const createRes = await getOrCreateConversation(queryListingId)
            if (createRes.success && createRes.conversationId) {
              setActiveConvId(createRes.conversationId)
              const updatedRes = await getConversations()
              if (updatedRes.success && updatedRes.conversations) {
                setConversations(updatedRes.conversations)
              }
              router.replace(`/messages?conversationId=${createRes.conversationId}`)
            } else {
              console.error("Failed to initiate conversation:", createRes.error)
            }
          }
        }
      }
      setLoadingConvs(false)
    }

    loadData()
  }, [queryConvId, queryListingId, router])

  // Active Conversation Info
  const activeConversation = conversations.find((c) => c.id === activeConvId)
  const otherParticipant = activeConversation?.otherParticipant
  const activeListing = activeConversation?.listing

  useEffect(() => {
    if (queryDraft !== "offer" || !activeConvId || didApplyDraft) return
    setInputText("Hi! I'd like to make an offer on this item. Is the price negotiable?")
    setDidApplyDraft(true)
  }, [activeConvId, didApplyDraft, queryDraft])

  // 2. Fetch Messages and subscribe to Realtime updates for activeConvId
  useEffect(() => {
    if (!activeConvId) {
      setMessages([])
      return
    }
    const currentConvId = activeConvId as string

    async function loadMessages() {
      setLoadingMsgs(true)
      const res = await getMessages(currentConvId)
      if (res.success && res.messages) {
        setMessages(res.messages)
        scrollToBottom("instant")
      }
      setLoadingMsgs(false)

      // Mark messages as read
      await markMessagesAsRead(currentConvId)
      // Update local unread state immediately
      setConversations((prev) =>
        prev.map((c) => (c.id === currentConvId ? { ...c, unreadCount: 0 } : c))
      )
    }

    loadMessages()

    // Subscribe to messages realtime updates
    const channelName = `messages:${currentConvId}`
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${currentConvId}`
        },
        async (payload) => {
          const newMsg = payload.new as any
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })

          // Mark as read if user is not the sender
          if (newMsg.sender_id !== currentUserId) {
            await markMessagesAsRead(currentConvId)
          }

          // Update parent conversation's last message locally
          updateConvLastMessage(currentConvId, newMsg)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeConvId, currentUserId])

  // 3. General listener to update sidebar last message snippets for other threads
  useEffect(() => {
    if (!currentUserId) return

    const generalChannel = supabase
      .channel("messages-general")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new as any
          // Only process if it is NOT the active conversation (activeConvId handles its own updates)
          if (newMsg.conversation_id !== activeConvId) {
            updateConvLastMessage(newMsg.conversation_id, newMsg)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(generalChannel)
    }
  }, [currentUserId, activeConvId])

  // Helper: Update a conversation's last message snippet in state and re-sort
  const updateConvLastMessage = (convId: string, msg: any) => {
    setConversations((prev) => {
      return prev
        .map((c) => {
          if (c.id === convId) {
            const isMsgFromOther = msg.sender_id !== currentUserId
            const unreadIncrement = isMsgFromOther && activeConvId !== convId ? 1 : 0
            return {
              ...c,
              lastMessage: {
                id: msg.id,
                content: msg.content,
                createdAt: msg.created_at || new Date().toISOString(),
                senderId: msg.sender_id,
                isRead: msg.is_read
              },
              unreadCount: c.unreadCount + unreadIncrement,
              updatedAt: new Date().toISOString()
            }
          }
          return c
        })
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    })
  }

  // Helper: Scroll to bottom
  const scrollToBottom = (behavior: "smooth" | "instant" = "instant") => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior, block: "end" })
      }
    }, 50)
  }

  // 4. Send Message Handler
  const handleSend = async (textToSend?: string) => {
    const text = textToSend !== undefined ? textToSend.trim() : inputText.trim()
    if (!text && !selectedImageRef) return
    if (!activeConvId) return

    // Formatting if listing photo is referenced
    let finalContent = text
    if (selectedImageRef) {
      finalContent = `![ref](${selectedImageRef}) ${text}`
    }

    // Clear inputs immediately for Snappy feel
    if (textToSend === undefined) {
      setInputText("")
    }
    setSelectedImageRef(null)
    setImagePickerOpen(false)
    if (chatInputRef.current) {
      chatInputRef.current.style.height = "auto"
    }

    // Optimistic UI updates
    const tempId = Math.random().toString()
    const optimisticMsg = {
      id: tempId,
      conversation_id: activeConvId,
      sender_id: currentUserId,
      content: finalContent,
      is_read: false,
      created_at: new Date().toISOString(),
      sending: true
    }

    setMessages((prev) => [...prev, optimisticMsg])
    scrollToBottom("smooth")

    // Update conversation last message snippet optimistically
    updateConvLastMessage(activeConvId, optimisticMsg)

    // Call server action
    const res = await sendMessage(activeConvId, finalContent)

    if (res.success && res.message) {
      // Replace optimistic message with actual DB record
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? res.message : m))
      )
      updateConvLastMessage(activeConvId, res.message)
    } else {
      console.error("Error sending message:", res.error)
      // Mark optimistic message as failed
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, error: true, sending: false } : m))
      )
    }
  }

  // Parse Markdown Reference Format: `![ref](url) remainingText`
  const parseMessage = (content: string) => {
    const match = content.match(/^!\[ref\]\((.*?)\)\s*([\s\S]*)/)
    if (match) {
      return {
        imageRef: match[1],
        text: match[2]
      }
    }
    return {
      imageRef: null,
      text: content
    }
  }

  // Quick Replies Suggestions
  const getQuickReplies = () => {
    if (!activeConversation) return []
    const isSeller = !activeConversation.isBuyer
    if (isSeller) {
      return [
        "Yes, still available!",
        "Price is final, sorry.",
        "Meet at campus main gate?",
        "When can you meet?",
      ]
    } else {
      return [
        "Is this still available?",
        "Can you do ₹50 lower?",
        "I can pick it up today.",
        "Where should we meet on campus?",
      ]
    }
  }

  // Filter Conversations list based on filterMode
  const filteredConversations = conversations.filter((c) => {
    if (filterMode === "all") return true
    if (filterMode === "buying") return c.isBuyer
    if (filterMode === "selling") return !c.isBuyer
    return true
  })

  // Format dates
  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return "Yesterday"
    } else if (diffDays < 7) {
      return d.toLocaleDateString([], { weekday: 'short' })
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  return (
    <div className="flex w-full max-w-full h-[calc(100vh-140px)] md:h-[calc(100vh-180px)] rounded-3xl overflow-hidden border border-outline-variant/20 bg-surface-container-lowest shadow-sm premium-shadow">
      {/* 1. Sidebar: Chat List */}
      <aside
        className={cn(
          "w-full md:w-80 lg:w-96 flex flex-col bg-surface border-r border-outline-variant/30 shrink-0 select-none",
          activeConvId && "hidden md:flex"
        )}
      >
        <div className="p-stack-lg border-b border-outline-variant/20">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-on-surface">Messages</h2>
          <p className="text-xs text-on-surface-variant font-medium mt-1">Grouped by listed items</p>
          <div className="mt-stack-md flex gap-stack-sm overflow-x-auto pb-stack-xs scrollbar-none">
            <button
              onClick={() => setFilterMode("all")}
              className={cn(
                "px-stack-md py-1.5 rounded-full font-body text-label-sm font-semibold transition-all whitespace-nowrap cursor-pointer",
                filterMode === "all"
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              )}
            >
              All Chats
            </button>
            <button
              onClick={() => setFilterMode("buying")}
              className={cn(
                "px-stack-md py-1.5 rounded-full font-body text-label-sm font-semibold transition-all whitespace-nowrap cursor-pointer",
                filterMode === "buying"
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              )}
            >
              Buying
            </button>
            <button
              onClick={() => setFilterMode("selling")}
              className={cn(
                "px-stack-md py-1.5 rounded-full font-body text-label-sm font-semibold transition-all whitespace-nowrap cursor-pointer",
                filterMode === "selling"
                  ? "bg-[var(--seller-primary)] text-white shadow-sm"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              )}
            >
              Selling
            </button>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto scrollbar-none divide-y divide-outline-variant/10">
          {loadingConvs ? (
            <div className="flex flex-col items-center justify-center p-stack-xl space-y-2 text-on-surface-variant">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-label-sm">Loading negotiations...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-stack-xl text-center space-y-2">
              <MessageSquare size={36} className="text-outline/40" />
              <p className="font-body text-label-lg font-bold text-on-surface">No conversations found</p>
              <p className="font-body text-label-sm text-on-surface-variant px-4">
                Message a seller on a listing detail page to initiate trade talks.
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = conv.id === activeConvId
              const other = conv.otherParticipant
              const listing = conv.listing
              const lastMsg = conv.lastMessage
              const unread = conv.unreadCount

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    setActiveConvId(conv.id)
                    router.push(`/messages?conversationId=${conv.id}`, { scroll: false })
                  }}
                  className={cn(
                    "p-stack-md flex gap-stack-md items-center cursor-pointer transition-all border-l-4 border-transparent select-none",
                    isActive
                      ? "bg-primary/10 text-primary border-primary dark:bg-primary-container/20 dark:border-primary-fixed"
                      : "hover:bg-surface-container-low"
                  )}
                >
                  {/* User Avatar */}
                  <div className="relative shrink-0">
                    {other?.avatarUrl ? (
                      <img
                        src={other.avatarUrl}
                        alt={other?.fullName || "User"}
                        className="w-12 h-12 rounded-full object-cover border border-outline-variant/30"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                        {other?.fullName?.substring(0, 2).toUpperCase() || "CU"}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                  </div>

                  {/* Thread details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <span className="font-body text-label-lg font-bold text-on-surface truncate">
                        {other?.fullName}
                      </span>
                      {lastMsg && (
                        <span className="font-body text-label-sm text-on-surface-variant shrink-0 ml-2">
                          {formatTime(lastMsg.createdAt)}
                        </span>
                      )}
                    </div>
                    {/* Message snippet */}
                    <div className="flex items-center justify-between gap-1.5 mt-0.5">
                      <p
                        className={cn(
                          "font-body text-label-sm text-on-surface-variant truncate pr-2 flex-1",
                          unread > 0 && "font-bold text-primary dark:text-primary-fixed-dim"
                        )}
                      >
                        {lastMsg ? parseMessage(lastMsg.content).text : "No messages yet"}
                      </p>
                      {unread > 0 && (
                        <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                          {unread}
                        </span>
                      )}
                    </div>

                    {/* Listing context badge */}
                    {listing && (
                      <div className="mt-2 flex items-center gap-1.5 bg-surface-container-low border border-outline-variant/20 rounded-lg p-1 w-fit max-w-full">
                        {listing.imageUrl ? (
                          <img
                            src={listing.imageUrl}
                            alt={listing.title}
                            className="w-5 h-5 rounded object-cover"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded bg-surface-container flex items-center justify-center">
                            <ImageIcon size={10} className="text-outline" />
                          </div>
                        )}
                        <span className="font-body text-[11px] font-medium text-on-surface-variant truncate max-w-[140px]">
                          {listing.title} • ₹{listing.price}
                        </span>
                        {listing.status === "sold" && (
                          <span className="bg-emerald-500/10 text-emerald-700 text-[9px] font-bold px-1.5 rounded">
                            Sold
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </aside>

      {/* 2. Main Chat Window */}
      <section className={cn("flex-1 min-w-0 flex flex-col bg-background relative", !activeConvId && "hidden md:flex")}>
        {activeConvId ? (
          <>
            {/* Chat Pane Header */}
            <header className="h-16 bg-surface border-b border-outline-variant/30 flex justify-between items-center px-stack-lg z-10 shrink-0">
              <div className="flex items-center gap-stack-md min-w-0">
                {/* Back navigation on mobile */}
                <button
                  onClick={() => {
                    setActiveConvId(null)
                    router.push("/messages", { scroll: false })
                  }}
                  className="flex md:hidden p-1 mr-1 rounded-full text-on-surface-variant hover:bg-surface-container-low transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>

                <div className="relative shrink-0">
                  {otherParticipant?.avatarUrl ? (
                    <img
                      src={otherParticipant.avatarUrl}
                      alt={otherParticipant.fullName}
                      className="w-10 h-10 rounded-full object-cover border border-outline-variant/20"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-md">
                      {otherParticipant?.fullName?.substring(0, 2).toUpperCase() || "CU"}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-white rounded-full"></span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-body text-label-lg font-bold text-on-surface truncate">
                      {otherParticipant?.fullName}
                    </span>
                    <span className="text-primary dark:text-primary-fixed-dim">
                      <CheckCircle size={14} fill="currentColor" className="text-white fill-primary dark:fill-primary-fixed" />
                    </span>
                  </div>
                  <span className="block font-body text-[11px] text-on-surface-variant truncate">
                    {otherParticipant?.department || "Student"} • {otherParticipant?.university || "AMU"}
                  </span>
                </div>
              </div>

              {/* Chat Actions */}
              <div className="flex items-center gap-stack-sm shrink-0">
                {activeListing?.status !== "sold" && !activeConversation.isBuyer && (
                  <Link
                    href="/dashboard/listings"
                    className="hidden sm:flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-full font-body text-label-sm font-semibold transition-all cursor-pointer"
                  >
                    <CheckCircle size={14} />
                    Mark Sold
                  </Link>
                )}
                {activeListing && (
                  <Link
                    href={`/item/${activeListing.slug || activeListing.id}`}
                    target="_blank"
                    className="flex items-center gap-1 bg-surface-container hover:bg-surface-container-high text-on-surface-variant px-3 py-1.5 rounded-full font-body text-label-sm font-semibold transition-all border border-outline-variant/20"
                  >
                    <span>View Deal</span>
                    <ExternalLink size={12} />
                  </Link>
                )}
                <button className="material-symbols-outlined p-2 text-on-surface-variant hover:bg-surface-container rounded-full cursor-pointer">
                  <MoreVertical size={18} />
                </button>
              </div>
            </header>

            {/* Meetup Safety Banner */}
            <div className="bg-emerald-500/5 px-stack-lg py-2.5 flex items-center justify-between border-b border-emerald-500/10 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Shield size={16} className="text-emerald-600 shrink-0" />
                <p className="font-body text-[11px] font-medium text-emerald-800 dark:text-emerald-300 truncate">
                  You are both verified AMU students. Meet safely in public campus hubs (e.g. library, central canteen).
                </p>
              </div>
            </div>

            {/* Active Listing Info Pill (Stitch mockup style) */}
            {activeListing && (
              <div className="bg-surface/50 border-b border-outline-variant/20 px-stack-lg py-2 flex items-center gap-2 shrink-0 justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {activeListing.imageUrl ? (
                    <img
                      src={activeListing.imageUrl}
                      alt={activeListing.title}
                      className="w-8 h-8 rounded object-cover border border-outline-variant/30"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center border border-outline-variant/20">
                      <ImageIcon size={14} className="text-outline" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-body text-label-sm font-bold text-on-surface truncate leading-tight">
                      {activeListing.title}
                    </p>
                    <p className="font-body text-xs font-semibold text-primary leading-none mt-0.5">
                      ₹{activeListing.price}
                    </p>
                  </div>
                </div>
                {activeListing.status === "sold" && (
                  <span className="bg-emerald-500/10 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded">
                    SOLD
                  </span>
                )}
              </div>
            )}

            {/* Message Area scroll */}
            <div className="flex-1 overflow-y-auto p-stack-lg flex flex-col gap-stack-md scrollbar-none bg-slate-50/20 dark:bg-zinc-950/20">
              {loadingMsgs ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2 py-8">
                  <MessageSquare size={32} className="text-outline/30" />
                  <p className="font-body text-label-sm font-bold text-on-surface-variant">Start of Trade Talk</p>
                  <p className="font-body text-xs text-on-surface-variant/80 max-w-[280px]">
                    Agree on a fair price, ask about item details, and arrange a safe campus pickup.
                  </p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isOutgoing = msg.sender_id === currentUserId
                  const parsed = parseMessage(msg.content)
                  const isLastMessage = index === messages.length - 1

                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex flex-col max-w-[75%] md:max-w-[70%]",
                        isOutgoing ? "self-end items-end" : "self-start items-start",
                        isLastMessage && "chat-scroll-target" // native CSS scroll-initial-target anchor point
                      )}
                    >
                      {/* Message Bubble */}
                      <div
                        className={cn(
                          "p-stack-md shadow-sm border border-outline-variant/10 text-sm font-body leading-relaxed transition-all",
                          isOutgoing
                            ? "action-gradient text-white message-bubble-out"
                            : "bg-surface text-on-surface message-bubble-in",
                          msg.sending && "opacity-60",
                          msg.error && "bg-error/10 border-error text-error"
                        )}
                        style={{
                          // Visual speech bubble speech tail corner configuration
                          borderBottomRightRadius: isOutgoing ? "0.25rem" : "1.25rem",
                          borderBottomLeftRadius: isOutgoing ? "1.25rem" : "0.25rem"
                        }}
                      >
                        {/* Reference Image preview nested inside bubble */}
                        {parsed.imageRef && (
                          <div className="mb-2 rounded-lg overflow-hidden border border-outline-variant/20 max-w-[240px] bg-black/5">
                            <img
                              src={parsed.imageRef}
                              alt="Referenced Listing Image"
                              className="w-full h-auto max-h-[160px] object-cover cursor-pointer hover:scale-[1.02] transition-transform"
                            />
                            <div className="bg-black/20 px-2 py-0.5 text-[9px] text-white flex items-center gap-1 font-semibold uppercase tracking-wider">
                              <ImageIcon size={10} />
                              Listing Photo Reference
                            </div>
                          </div>
                        )}
                        <p className="whitespace-pre-line font-medium">{parsed.text}</p>
                      </div>

                      {/* Message Metadata */}
                      <div className="flex items-center gap-1.5 mt-1 px-1.5 text-[10px] text-on-surface-variant font-medium">
                        <span>{formatTime(msg.created_at)}</span>
                        {isOutgoing && (
                          <span>
                            {msg.sending ? (
                              <span className="animate-pulse">sending...</span>
                            ) : msg.error ? (
                              <span className="text-error font-bold flex items-center gap-0.5">
                                <AlertTriangle size={10} /> Failed
                              </span>
                            ) : msg.is_read ? (
                              <span className="text-primary font-bold">read</span>
                            ) : (
                              <span>sent</span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
              {/* Dummy bottom element for ref scrolling */}
              <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* Suggestions & Input Area */}
            <div className="bg-surface border-t border-outline-variant/20 p-stack-md md:p-stack-lg shrink-0">
              {/* Quick Reply pills suggestion */}
              <div className="flex gap-2 overflow-x-auto pb-stack-sm scrollbar-none select-none">
                {getQuickReplies().map((reply) => (
                  <button
                    key={reply}
                    onClick={() => handleSend(reply)}
                    className="px-3.5 py-1.5 bg-surface-container hover:bg-surface-container-high hover:text-primary active:scale-95 text-on-surface-variant font-body text-xs font-semibold rounded-full border border-outline-variant/10 whitespace-nowrap cursor-pointer transition-all"
                  >
                    {reply}
                  </button>
                ))}
              </div>

              {/* Listing Image Reference Selection panel */}
              {imagePickerOpen && activeListing?.images && activeListing.images.length > 0 && (
                <div className="mb-stack-sm border border-outline-variant/30 rounded-2xl bg-surface-container-low p-2">
                  <div className="flex justify-between items-center px-1 mb-1.5">
                    <span className="font-body text-xs font-bold text-on-surface-variant">
                      Reference a listing photo:
                    </span>
                    <button
                      onClick={() => setImagePickerOpen(false)}
                      className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {activeListing.images.map((img: any, idx: number) => {
                      const isSelected = selectedImageRef === img.storage_path
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setSelectedImageRef(isSelected ? null : img.storage_path)
                          }}
                          className={cn(
                            "relative w-16 h-16 rounded-lg overflow-hidden border-2 cursor-pointer shrink-0 transition-all",
                            isSelected
                              ? "border-primary scale-95"
                              : "border-transparent hover:border-outline-variant/50"
                          )}
                        >
                          <img
                            src={img.storage_path}
                            alt={`listing-${idx}`}
                            className="w-full h-full object-cover"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <div className="w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center">
                                <Check size={12} strokeWidth={3} />
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Active Image Attachment Preview indicator */}
              {selectedImageRef && (
                <div className="mb-stack-sm flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl p-2 w-fit">
                  <img
                    src={selectedImageRef}
                    alt="Ref Attachment Preview"
                    className="w-10 h-10 object-cover rounded"
                  />
                  <div className="pr-2 select-none">
                    <p className="font-body text-xs font-bold text-primary">Referencing Listing Photo</p>
                    <p className="font-body text-[10px] text-on-surface-variant">Image will be attached to message</p>
                  </div>
                  <button
                    onClick={() => setSelectedImageRef(null)}
                    className="p-1 bg-white hover:bg-surface-container rounded-full border border-outline-variant/30 text-on-surface-variant cursor-pointer shrink-0"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              {/* Input container row */}
              <div className="flex items-end gap-stack-md bg-surface-container-low border border-outline-variant/30 rounded-[24px] p-2 pr-4 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <div className="flex items-center mb-1">
                  <button
                    onClick={() => setImagePickerOpen(!imagePickerOpen)}
                    title="Attach reference photo"
                    className={cn(
                      "p-2 rounded-full cursor-pointer transition-colors",
                      imagePickerOpen || selectedImageRef
                        ? "bg-primary/10 text-primary"
                        : "text-on-surface-variant hover:bg-surface-container"
                    )}
                  >
                    <ImageIcon size={18} />
                  </button>
                  <button className="hidden sm:inline-flex p-2 text-on-surface-variant hover:bg-surface-container rounded-full cursor-pointer">
                    <Plus size={18} />
                  </button>
                  <button className="hidden sm:inline-flex p-2 text-on-surface-variant hover:bg-surface-container rounded-full cursor-pointer">
                    <Smile size={18} />
                  </button>
                </div>
                <textarea
                  ref={chatInputRef}
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value)
                    // Auto expanding text input heights
                    e.target.style.height = "auto"
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  rows={1}
                  placeholder="Type your message..."
                  className="flex-1 bg-transparent border-none focus:ring-0 font-body text-sm py-2 px-1 resize-none max-h-32 scrollbar-none outline-none text-on-surface"
                />
                <button
                  onClick={() => handleSend()}
                  className="mb-1 bg-primary hover:bg-primary-container text-white w-9 h-9 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md shadow-primary/10 cursor-pointer"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Empty Chat state */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-stack-xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center text-primary">
              <MessageSquare size={32} />
            </div>
            <div>
              <h3 className="font-display text-xl font-extrabold text-on-surface">Select a negotiation thread</h3>
              <p className="font-body text-sm text-on-surface-variant max-w-[320px] mx-auto mt-1">
                Select an active negotiation from the sidebar, or search listings to start trade talks.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* 3. Right Sidebar: Item Details Context panel (Desktop only) */}
      {activeConvId && activeListing && (
        <aside className="hidden xl:flex w-72 lg:w-80 bg-surface border-l border-outline-variant/30 flex-col overflow-y-auto scrollbar-none shrink-0 select-none">
          <div className="p-stack-lg space-y-6">
            <div>
              <h3 className="font-body text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-stack-sm">
                About the Deal
              </h3>
              <div className="rounded-2xl overflow-hidden border border-outline-variant/20 bg-surface-container-low shadow-sm">
                {activeListing.imageUrl ? (
                  <img
                    src={activeListing.imageUrl}
                    alt={activeListing.title}
                    className="w-full h-40 object-cover"
                  />
                ) : (
                  <div className="w-full h-40 bg-surface-container flex items-center justify-center">
                    <ImageIcon size={28} className="text-outline/40" />
                  </div>
                )}
                <div className="p-stack-md space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="font-display text-xl font-extrabold text-primary">
                      ₹{activeListing.price}
                    </span>
                    <span className="bg-primary/5 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/10">
                      Negotiable
                    </span>
                  </div>
                  <p className="font-body text-label-sm font-semibold text-on-surface-variant line-clamp-2">
                    {activeListing.title}
                  </p>
                  <Link
                    href={`/item/${activeListing.slug || activeListing.id}`}
                    target="_blank"
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-white hover:bg-surface-container text-on-surface font-body text-label-sm font-bold rounded-full border border-outline-variant/25 transition-all text-center mt-2"
                  >
                    <span>View Full Details</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/5 text-primary flex items-center justify-center shrink-0">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="font-body text-label-sm font-bold text-on-surface">Campus East, AMU</p>
                  <p className="font-body text-[10px] text-on-surface-variant">Hostel Pickup preferred</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/5 text-emerald-600 flex items-center justify-center shrink-0">
                  <Shield size={18} />
                </div>
                <div>
                  <p className="font-body text-label-sm font-bold text-on-surface">BuyKarlo Verified</p>
                  <p className="font-body text-[10px] text-on-surface-variant">100% AMU Student Network</p>
                </div>
              </div>
            </div>

            <hr className="border-outline-variant/20" />

            {/* Quick action buttons */}
            <div>
              <h3 className="font-body text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-stack-sm">
                Safety & Report
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button className="flex flex-col items-center justify-center gap-1 p-3 bg-surface-container-low hover:bg-red-500/5 hover:text-red-500 rounded-2xl cursor-pointer transition-all border border-outline-variant/15 text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm font-bold">report</span>
                  <span className="font-body text-[10px] font-semibold">Report</span>
                </button>
                <button className="flex flex-col items-center justify-center gap-1 p-3 bg-surface-container-low hover:bg-zinc-500/10 rounded-2xl cursor-pointer transition-all border border-outline-variant/15 text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm font-bold">block</span>
                  <span className="font-body text-[10px] font-semibold">Block</span>
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[400px] items-center justify-center text-on-surface-variant">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
        <span>Loading Messages Workspace...</span>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  )
}
