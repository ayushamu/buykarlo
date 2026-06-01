"use client"

import { useMemo, useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { 
  Bot, 
  Check, 
  Copy, 
  Loader2, 
  Send, 
  Sparkles, 
  X, 
  Edit3, 
  Save, 
  AlertCircle, 
  Tag, 
  DollarSign, 
  Clipboard, 
  CheckCircle,
  RefreshCw
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

const DRAFT_STORAGE_KEY = "buykarlo:seller-bot-draft"
const DRAFT_EVENT_NAME = "buykarlo:seller-bot-draft-ready"

const CATEGORIES = [
  { slug: "electronics", name: "Electronics" },
  { slug: "books", name: "Books" },
  { slug: "cycles", name: "Cycles" },
  { slug: "dorm-decor", name: "Dorm Decor" },
  { slug: "sports-equipment", name: "Sports Equipment" },
  { slug: "stationery", name: "Stationery" },
  { slug: "fashion", name: "Fashion" },
  { slug: "furniture", name: "Furniture" },
  { slug: "appliances", name: "Appliances" },
  { slug: "instruments", name: "Instruments" },
  { slug: "lab-equipment", name: "Lab Equipment" },
  { slug: "other", name: "Other" },
]

const CONDITIONS = [
  { slug: "new", name: "New" },
  { slug: "like_new", name: "Like New" },
  { slug: "good", name: "Good" },
  { slug: "fair", name: "Fair" },
  { slug: "poor", name: "Poor" },
]

interface ListingDraft {
  title?: string
  description?: string
  features?: string[]
  tags?: string[]
  conditionSummary?: string
  suggestedPrice?: {
    min?: number
    max?: number
  }
  category?: string
  condition?: string
  price?: string
}

function getHash(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

function extractLocalParameters(description: string) {
  const text = description.toLowerCase()
  
  let category = ""
  if (/\b(book|books|upsc|jee|neet|semester|notes|pyq|previous year|objective|guide|novel|textbook|hcv|dc pandey|hc verma)\b/.test(text)) {
    category = "books"
  } else if (/\b(laptop|macbook|iphone|phone|mobile|charger|earbuds|headphone|tablet|camera|keyboard|mouse|monitor|gpu|cpu|pc)\b/.test(text)) {
    category = "electronics"
  } else if (/\b(cycle|bicycle|bike|pedal|hero cycle)\b/.test(text)) {
    category = "cycles"
  } else if (/\b(bat|ball|racket|football|cricket|helmet|kit|dumbbell|gym|weights)\b/.test(text)) {
    category = "sports-equipment"
  } else if (/\b(chair|table|desk|mattress|bed|almirah|shelf|cushion|curtain|pillow)\b/.test(text)) {
    category = "furniture"
  } else if (/\b(kettle|iron|heater|fan|cooler|lamp|mixer|fridge|microwave|stove)\b/.test(text)) {
    category = "appliances"
  } else if (/\b(pen|pencil|notebook|marker|scale|geometry|calculator|exam pad)\b/.test(text)) {
    category = "stationery"
  } else if (/\b(shirt|tshirt|jeans|jacket|shoes|sneakers|hoodie|cap|watch|bag|backpack)\b/.test(text)) {
    category = "fashion"
  } else if (/\b(guitar|keyboard|violin|flute|harmonium|tabla|ukulele)\b/.test(text)) {
    category = "instruments"
  } else if (/\b(flask|beaker|test tube|microscope|pipette|chemicals)\b/.test(text)) {
    category = "lab-equipment"
  } else if (/\b(bucket|mirror|mat|poster|led strip|lights|dorm|room|hostel)\b/.test(text)) {
    category = "dorm-decor"
  }

  let price = ""
  const priceMatch = description.match(/(?:rs\.?|₹|inr)\s*(\d+)/i) || description.match(/(\d+)\s*(?:rupees|rs|inr|buck)/i)
  if (priceMatch && priceMatch[1]) {
    price = priceMatch[1]
  }

  let condition = ""
  if (/\b(brand new|new|unused|box packed)\b/.test(text)) {
    condition = "new"
  } else if (/\b(like new|mint|almost new|barely used)\b/.test(text)) {
    condition = "like_new"
  } else if (/\b(good|working well|no issues|excellent)\b/.test(text)) {
    condition = "good"
  } else if (/\b(fair|satisfactory|scratched|minor scratch|dent|wear)\b/.test(text)) {
    condition = "fair"
  } else if (/\b(poor|damaged|broken|need repair|not working)\b/.test(text)) {
    condition = "poor"
  }

  return { category, price, condition }
}

function parsePartialJson(jsonString: string): ListingDraft {
  let cleaned = jsonString.trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim()

  let openBraces = 0
  let openBrackets = 0
  let inString = false
  let escaped = false

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i]
    if (escaped) {
      escaped = false;
      continue
    }
    if (char === "\\") {
      escaped = true;
      continue
    }
    if (char === '"') {
      inString = !inString;
      continue
    }
    if (!inString) {
      if (char === "{") openBraces++
      if (char === "}") openBraces--
      if (char === "[") openBrackets++
      if (char === "]") openBrackets--
    }
  }

  let suffix = ""
  if (inString) suffix += '"'
  while (openBrackets > 0) {
    suffix += "]"
    openBrackets--
  }
  while (openBraces > 0) {
    suffix += "}"
    openBraces--
  }

  try {
    const parsed = JSON.parse(cleaned + suffix)
    return {
      title: parsed.title || undefined,
      description: parsed.description || undefined,
      features: Array.isArray(parsed.features) ? parsed.features : undefined,
      tags: Array.isArray(parsed.tags) ? parsed.tags : undefined,
      conditionSummary: parsed.conditionSummary || undefined,
      suggestedPrice: parsed.suggestedPrice || undefined,
    }
  } catch (e) {
    const result: ListingDraft = {}
    const extractString = (key: string) => {
      const regex = new RegExp(`"${key}"\\s*:\\s*"([^"\\\\]*(?:\\\\.[^"\\\\]*)*)"?`, "g")
      const match = [...cleaned.matchAll(regex)].pop()
      return match ? match[1].replace(/\\"/g, '"').replace(/\\n/g, "\n") : undefined
    }

    const extractArray = (key: string) => {
      const regex = new RegExp(`"${key}"\\s*:\\s*\\[([^\\]]*)\\]?`)
      const match = cleaned.match(regex)
      if (match) {
        try {
          return JSON.parse("[" + match[1] + (match[1].endsWith(",") ? "" : "") + "]")
        } catch {
          return match[1]
            .split(",")
            .map(s => s.trim().replace(/^"|"/g, "").trim())
            .filter(Boolean)
        }
      }
      return undefined
    }

    result.title = extractString("title")
    result.description = extractString("description")
    result.conditionSummary = extractString("conditionSummary")
    result.features = extractArray("features")
    result.tags = extractArray("tags")

    const priceMatch = cleaned.match(/"suggestedPrice"\s*:\s*\{\s*"min"\s*:\s*(\d+)?\s*(?:,\s*"max"\s*:\s*(\d+)?)?/)
    if (priceMatch) {
      result.suggestedPrice = {
        min: priceMatch[1] ? parseInt(priceMatch[1]) : undefined,
        max: priceMatch[2] ? parseInt(priceMatch[2]) : undefined,
      }
    }

    return result
  }
}

export function BuyKarloSellerBot() {
  const router = useRouter()
  const pathname = usePathname()
  
  const isSellerRoute = pathname.startsWith("/dashboard") || pathname === "/sell"
  if (!isSellerRoute) return null
  
  const [open, setOpen] = useState(false)
  const [descriptionInput, setDescriptionInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Custom manual parameters
  const [categoryOverride, setCategoryOverride] = useState("")
  const [conditionOverride, setConditionOverride] = useState("")
  const [priceOverride, setPriceOverride] = useState("")
  
  // Generation output draft
  const [draft, setDraft] = useState<ListingDraft | null>(null)
  const [isEditMode, setIsEditMode] = useState<Record<string, boolean>>({})
  
  // Clipboard copy confirmation triggers
  const [copiedField, setCopiedField] = useState<string | null>(null)
  
  // Local Generation Cache
  const [generationCache, setGenerationCache] = useState<Record<string, ListingDraft>>({})

  // Automatically parse fields on user input description changes
  useEffect(() => {
    if (!descriptionInput.trim() || draft) return
    const timer = setTimeout(() => {
      const extracted = extractLocalParameters(descriptionInput)
      if (extracted.category && !categoryOverride) setCategoryOverride(extracted.category)
      if (extracted.condition && !conditionOverride) setConditionOverride(extracted.condition)
      if (extracted.price && !priceOverride) setPriceOverride(extracted.price)
    }, 450)
    return () => clearTimeout(timer)
  }, [descriptionInput, draft])

  const handleGenerate = async (forceRegenerate = false) => {
    if (!descriptionInput.trim()) {
      setError("Please describe your item first.")
      return
    }

    setError(null)
    setLoading(true)

    const cacheKey = getHash(
      `${descriptionInput.trim()}:${categoryOverride}:${conditionOverride}:${priceOverride}`
    )

    // Load from cache if matched and not forced to regenerate
    if (!forceRegenerate && generationCache[cacheKey]) {
      setDraft(generationCache[cacheKey])
      setLoading(false)
      return
    }

    try {
      setDraft(null)
      const response = await fetch("/api/ai/seller-bot/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: descriptionInput,
          category: categoryOverride || undefined,
          condition: conditionOverride || undefined,
          price: priceOverride || undefined,
        }),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || "Generation endpoint request failed.")
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error("ReadableStream is not supported by your browser.")

      const decoder = new TextDecoder()
      let accumulatedText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        accumulatedText += decoder.decode(value, { stream: true })
        const parsedDraft = parsePartialJson(accumulatedText)
        setDraft(parsedDraft)
      }

      // Add to client-side cache once stream concludes successfully
      if (accumulatedText) {
        const finalDraft = parsePartialJson(accumulatedText)
        setGenerationCache(prev => ({ ...prev, [cacheKey]: finalDraft }))
      }
    } catch (err: any) {
      console.error("Listing generation failed:", err)
      setError(err.message || "Could not connect to generator API.")
    } finally {
      setLoading(false)
    }
  }

  const handleApplyDraft = () => {
    if (!draft) return
    const cleaned: any = {
      title: draft.title,
      description: draft.description,
      category: categoryOverride || draft.category,
      condition: conditionOverride || draft.condition,
      price: priceOverride || draft.price || (draft.suggestedPrice?.min ? String(draft.suggestedPrice.min) : undefined),
    }

    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(cleaned))
    window.dispatchEvent(new CustomEvent(DRAFT_EVENT_NAME, { detail: cleaned }))

    setCopiedField("apply")
    setTimeout(() => setCopiedField(null), 1800)

    if (pathname !== "/sell") {
      router.push("/sell")
    }
  }

  const handleCopyText = async (field: string, text: string) => {
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 1800)
  }

  const handleCopyAll = async () => {
    if (!draft) return
    const block = [
      draft.title ? `Title: ${draft.title}` : "",
      draft.conditionSummary ? `Condition: ${draft.conditionSummary}` : "",
      priceOverride ? `Price: ₹${priceOverride}` : "",
      draft.description ? `\nDescription:\n${draft.description}` : "",
    ].filter(Boolean).join("\n")

    await navigator.clipboard.writeText(block)
    setCopiedField("all")
    setTimeout(() => setCopiedField(null), 1800)
  }

  const handleToggleEdit = (field: string) => {
    setIsEditMode(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const updateDraftField = (field: keyof ListingDraft, value: any) => {
    setDraft(prev => {
      if (!prev) return null
      return { ...prev, [field]: value }
    })
  }

  const handleClear = () => {
    setDraft(null)
    setDescriptionInput("")
    setCategoryOverride("")
    setConditionOverride("")
    setPriceOverride("")
    setError(null)
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 md:bottom-6 md:right-6">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4 flex h-[min(720px,calc(100vh-7rem))] w-[calc(100vw-2rem)] max-w-[480px] flex-col overflow-hidden rounded-[2.2rem] border border-emerald-100 bg-white/95 backdrop-blur-2xl shadow-[0_30px_70px_rgba(4,72,58,0.25)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-emerald-50 bg-emerald-50/50 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                  <Sparkles size={20} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="font-display text-base font-extrabold tracking-tight text-slate-800">
                    Seller Listing Assistant
                  </h3>
                  <p className="text-[11px] font-semibold text-emerald-700">AI-Powered Listing Generator</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-100 bg-white text-slate-500 hover:text-slate-800 transition-colors shadow-sm"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable container */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-none">
              {error && (
                <div className="flex items-start gap-2.5 rounded-2xl bg-rose-50 border border-rose-100 p-4 text-xs font-semibold text-rose-700 leading-relaxed">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Initial user input box */}
              {!draft && !loading ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      What are you selling?
                    </label>
                    <textarea
                      value={descriptionInput}
                      onChange={(e) => setDescriptionInput(e.target.value)}
                      placeholder="e.g. Selling my iPad Air 5th Gen. Blue color, 64GB storage, Apple M1 chip. Scratch-free, condition is like new. Includes original box and fast charger. Meet near Computer Engineering Dept."
                      className="min-h-[140px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 p-4 font-body text-xs font-semibold leading-relaxed text-slate-800 outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500/20 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  {/* Manual helper parameters */}
                  <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50/30 p-4 space-y-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Extracted Parameters (Optional Overrides)
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-600">Category</span>
                        <select
                          value={categoryOverride}
                          onChange={(e) => setCategoryOverride(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 outline-none"
                        >
                          <option value="">Auto-Detect</option>
                          {CATEGORIES.map(c => (
                            <option key={c.slug} value={c.slug}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-600">Condition</span>
                        <select
                          value={conditionOverride}
                          onChange={(e) => setConditionOverride(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 outline-none"
                        >
                          <option value="">Auto-Detect</option>
                          {CONDITIONS.map(c => (
                            <option key={c.slug} value={c.slug}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2 space-y-1">
                        <span className="text-[10px] font-bold text-slate-600">Expected Price (INR)</span>
                        <div className="relative flex items-center">
                          <DollarSign size={13} className="absolute left-3 text-slate-400" />
                          <Input
                            type="text"
                            placeholder="Auto-Detect (e.g. 45000)"
                            value={priceOverride}
                            onChange={(e) => setPriceOverride(e.target.value.replace(/\D/g, ""))}
                            className="pl-7 h-9 rounded-xl text-xs font-semibold text-slate-700"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleGenerate(false)}
                    className="flex w-full h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 font-bold text-white shadow-lg shadow-emerald-600/10 hover:bg-emerald-700 active:scale-98 transition-all duration-150"
                  >
                    <Sparkles size={16} />
                    Generate Listing Assets
                  </button>
                </div>
              ) : null}

              {/* Streaming loading screen */}
              {loading && !draft ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center space-y-3.5">
                  <Loader2 size={36} className="animate-spin text-emerald-600" />
                  <div className="text-center">
                    <p className="font-display text-sm font-extrabold text-slate-800">Reading description...</p>
                    <p className="text-xs font-semibold text-slate-400 mt-1">Generating bento assets from stream</p>
                  </div>
                </div>
              ) : null}

              {/* Bento Output Grid */}
              {draft ? (
                <div className="space-y-4">
                  {/* Generated Title Bento Card */}
                  <div className="rounded-[1.75rem] border border-emerald-100 bg-emerald-50/10 p-4 space-y-2 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
                        <Tag size={13} />
                        Title
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleEdit("title")}
                          className="p-1 hover:bg-slate-100 rounded-md text-slate-500 hover:text-slate-800 transition-colors"
                        >
                          {isEditMode["title"] ? <Save size={13} /> : <Edit3 size={13} />}
                        </button>
                        <button
                          onClick={() => handleCopyText("title", draft.title || "")}
                          className="p-1 hover:bg-slate-100 rounded-md text-slate-500 hover:text-slate-800 transition-colors"
                        >
                          {copiedField === "title" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>
                    {isEditMode["title"] ? (
                      <Input
                        value={draft.title || ""}
                        onChange={(e) => updateDraftField("title", e.target.value)}
                        className="h-9 rounded-xl text-xs font-semibold text-slate-800 mt-1"
                      />
                    ) : (
                      <p className="font-display text-sm font-extrabold text-slate-800 mt-1 leading-snug">
                        {draft.title || "Generating title..."}
                      </p>
                    )}
                  </div>

                  {/* Pricing Bento Card */}
                  {draft.suggestedPrice && (
                    <div className="rounded-[1.75rem] border border-emerald-100 bg-emerald-50/10 p-4 space-y-2.5 shadow-sm">
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-700">
                        <span className="flex items-center gap-1.5">
                          <DollarSign size={14} /> Suggested Price Range
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="font-display text-2xl font-black text-slate-800">
                          ₹{draft.suggestedPrice.min?.toLocaleString("en-IN") || 0}
                        </span>
                        <span className="text-xs font-bold text-slate-400 mx-1">to</span>
                        <span className="font-display text-2xl font-black text-slate-800">
                          ₹{draft.suggestedPrice.max?.toLocaleString("en-IN") || 0}
                        </span>
                      </div>
                      <p className="text-[10px] font-semibold text-slate-400">
                        Based on current AMU second-hand marketplace demand.
                      </p>
                    </div>
                  )}

                  {/* Condition Bento Card */}
                  {draft.conditionSummary && (
                    <div className="rounded-[1.75rem] border border-emerald-100 bg-emerald-50/10 p-4 space-y-2 shadow-sm">
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-700">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle size={13} /> Condition Summary
                        </span>
                        <button
                          onClick={() => handleCopyText("condition", draft.conditionSummary || "")}
                          className="p-1 hover:bg-slate-100 rounded-md text-slate-500 hover:text-slate-800 transition-colors"
                        >
                          {copiedField === "condition" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        </button>
                      </div>
                      <p className="font-body text-xs font-semibold text-slate-700 mt-1 leading-relaxed">
                        {draft.conditionSummary}
                      </p>
                    </div>
                  )}

                  {/* Features Bento Card */}
                  {draft.features && draft.features.length > 0 && (
                    <div className="rounded-[1.75rem] border border-emerald-100 bg-emerald-50/10 p-4 space-y-2 shadow-sm">
                      <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                        Key Features
                      </div>
                      <ul className="space-y-1.5 mt-2">
                        {draft.features.map((f, i) => (
                          <li key={i} className="flex gap-2 text-xs font-semibold text-slate-700 leading-normal">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Tags Bento Card */}
                  {draft.tags && draft.tags.length > 0 && (
                    <div className="rounded-[1.75rem] border border-emerald-100 bg-emerald-50/10 p-4 space-y-2 shadow-sm">
                      <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                        Suggested Search Tags
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {draft.tags.map((t, i) => (
                          <span key={i} className="rounded-full bg-emerald-50 border border-emerald-100/50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description Bento Card */}
                  <div className="rounded-[1.75rem] border border-emerald-100 bg-emerald-50/10 p-4 space-y-2 shadow-sm relative">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                        Listing Description
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleEdit("description")}
                          className="p-1 hover:bg-slate-100 rounded-md text-slate-500 hover:text-slate-800 transition-colors"
                        >
                          {isEditMode["description"] ? <Save size={13} /> : <Edit3 size={13} />}
                        </button>
                        <button
                          onClick={() => handleCopyText("description", draft.description || "")}
                          className="p-1 hover:bg-slate-100 rounded-md text-slate-500 hover:text-slate-800 transition-colors"
                        >
                          {copiedField === "description" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>
                    {isEditMode["description"] ? (
                      <textarea
                        value={draft.description || ""}
                        onChange={(e) => updateDraftField("description", e.target.value)}
                        className="min-h-[140px] w-full resize-none rounded-xl border border-slate-200 p-3 font-body text-xs font-semibold leading-relaxed text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 mt-1"
                      />
                    ) : (
                      <div className="max-h-56 overflow-y-auto whitespace-pre-wrap font-body text-xs font-semibold text-slate-700 mt-1 leading-relaxed pr-1 scrollbar-thin">
                        {draft.description || "Generating description..."}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Bottom Actions Area */}
            <div className="border-t border-slate-100 bg-white p-5 space-y-2.5">
              {draft ? (
                <>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={handleCopyAll}
                      className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50"
                    >
                      {copiedField === "all" ? <Check size={15} className="text-emerald-600" /> : <Clipboard size={15} />}
                      Copy All
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerate(true)}
                      disabled={loading}
                      className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/50 font-bold text-emerald-800 hover:bg-emerald-50"
                    >
                      <RefreshCw size={14} className={cn(loading && "animate-spin")} />
                      Regenerate
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyDraft}
                    className="flex w-full h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 font-bold text-white shadow-lg shadow-emerald-600/10 hover:bg-emerald-700"
                  >
                    {copiedField === "apply" ? <CheckCircle size={17} /> : <Sparkles size={17} />}
                    {pathname === "/sell" ? "Apply to Listing Form" : "Create Listing with AI Assets"}
                  </button>

                  <button
                    type="button"
                    onClick={handleClear}
                    className="flex w-full h-9 items-center justify-center text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Start New Asset Generation
                  </button>
                </>
              ) : (
                <div className="text-center text-[10px] font-semibold text-slate-400 leading-normal">
                  Describe once, get premium listing assets, copy and publish instantly.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-[0_16px_34px_rgba(5,122,85,0.35)] hover:bg-emerald-700 hover:scale-105 transition-all duration-200 active:scale-95"
        aria-label="Toggle AI Listing Assistant"
      >
        {open ? <X size={22} /> : <Bot size={24} />}
      </button>
    </div>
  )
}

export { DRAFT_EVENT_NAME, DRAFT_STORAGE_KEY }
