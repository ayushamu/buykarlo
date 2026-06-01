"use client"

import { useEffect, useMemo, useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Camera, Check, ChevronDown, ImagePlus, Loader2, MapPin, Sparkles, Trash2, TrendingUp } from "lucide-react"
import { createListing, getListingForEdit, updateListing } from "@/features/listings/actions"
import { Input } from "@/components/ui/input"
import { DRAFT_EVENT_NAME, DRAFT_STORAGE_KEY } from "@/components/ai/BuyKarloSellerBot"
import { cn } from "@/lib/utils"
import { compressImage } from "@/lib/image"

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
  { value: "new", name: "New" },
  { value: "like_new", name: "Like New" },
  { value: "good", name: "Good" },
  { value: "fair", name: "Fair" },
  { value: "poor", name: "Poor" },
]

interface ImageUploadState {
  file?: File
  previewUrl: string
  uploadProgress: number
  status: "idle" | "uploading" | "success" | "error"
  publicUrl?: string
}

function SellPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState("electronics")
  const [condition, setCondition] = useState("like_new")
  const [campus] = useState("Aligarh Muslim University")
  const [department, setDepartment] = useState("")
  const [images, setImages] = useState<ImageUploadState[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [loadingListing, setLoadingListing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [descriptionAiNote, setDescriptionAiNote] = useState<string | null>(null)

  const selectedCategoryLabel = CATEGORIES.find((item) => item.slug === category)?.name ?? "Electronics"
  const suggestedPrice = useMemo(() => {
    const parsed = Number(price)
    if (parsed > 0) return `Similar ${selectedCategoryLabel.toLowerCase()} listings often close around ₹${Math.max(parsed - 2000, 500).toLocaleString("en-IN")}–₹${(parsed + 5000).toLocaleString("en-IN")}.`
    if (category === "electronics") return "Similar laptops and accessories usually close between ₹18,000 and ₹47,000 on campus."
    if (category === "books") return "Semester bundles tend to move faster when priced for quick pickup."
    if (category === "cycles") return "Cycles priced with a clear condition note usually attract faster campus chats."
    return "Well-described room items perform best when pickup details are obvious."
  }, [category, price, selectedCategoryLabel])

  useEffect(() => {
    const idToEdit = editId
    if (!idToEdit) return

    async function loadListingData() {
      try {
        setLoadingListing(true)
        setError(null)
        const result = await getListingForEdit(idToEdit as string)
        if (result.error) {
          setError(result.error)
          return
        }

        if (result.listing) {
          const l = result.listing
          setTitle(l.title)
          setDescription(l.description)
          setPrice(String(l.price))
          setCategory(l.categorySlug)
          setCondition(l.condition)
          if (l.department) {
            setDepartment(l.department)
            setDetailsOpen(true)
          }
          // Populate existing images
          const populatedImages: ImageUploadState[] = l.imageUrls.map((url) => ({
            previewUrl: url,
            uploadProgress: 100,
            status: "success",
            publicUrl: url,
          }))
          setImages(populatedImages)
        }
      } catch (err) {
        console.error("Failed to load listing details:", err)
        setError("Failed to load listing details for editing.")
      } finally {
        setLoadingListing(false)
      }
    }

    loadListingData()
  }, [editId])

  useEffect(() => {
    function applySellerBotDraft(rawDraft: unknown) {
      if (!rawDraft || typeof rawDraft !== "object" || Array.isArray(rawDraft)) return
      const draft = rawDraft as Record<string, unknown>
      const nextTitle = typeof draft.title === "string" ? draft.title.trim() : ""
      const nextDescription = typeof draft.description === "string" ? draft.description.trim() : ""
      const nextCategory = typeof draft.category === "string" ? draft.category.trim() : ""
      const nextCondition = typeof draft.condition === "string" ? draft.condition.trim() : ""
      const nextPrice = typeof draft.price === "string" ? draft.price.replace(/[^\d.]/g, "") : ""

      if (nextTitle) setTitle(nextTitle)
      if (nextCategory && CATEGORIES.some((item) => item.slug === nextCategory)) setCategory(nextCategory)
      if (nextCondition && CONDITIONS.some((item) => item.value === nextCondition)) setCondition(nextCondition)
      if (nextPrice) setPrice(nextPrice)
      if (nextDescription) {
        setDescription(nextDescription)
        setDescriptionAiNote("Applied from BuyKarlo AI Seller Bot. Review it before posting.")
        setDetailsOpen(true)
      }
    }

    function applyStoredDraft() {
      const stored = window.localStorage.getItem(DRAFT_STORAGE_KEY)
      if (!stored) return
      try {
        applySellerBotDraft(JSON.parse(stored))
        window.localStorage.removeItem(DRAFT_STORAGE_KEY)
      } catch (error) {
        console.error("Failed to apply seller bot draft:", error)
      }
    }

    function handleDraftEvent(event: Event) {
      applySellerBotDraft((event as CustomEvent).detail)
    }

    if (!editId) applyStoredDraft()
    window.addEventListener(DRAFT_EVENT_NAME, handleDraftEvent)
    return () => window.removeEventListener(DRAFT_EVENT_NAME, handleDraftEvent)
  }, [editId])

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    const selectedFiles = Array.from(e.target.files)

    if (images.length + selectedFiles.length > 5) {
      setError("You can upload up to 5 images.")
      return
    }

    setError(null)
    try {
      const processedImages = await Promise.all(
        selectedFiles.map(async (file) => {
          const compressed = await compressImage(file)
          return {
            file: compressed,
            previewUrl: URL.createObjectURL(compressed),
            uploadProgress: 0,
            status: "idle" as const,
          }
        })
      )
      setImages((prev) => [...prev, ...processedImages])
    } catch (err) {
      console.error("Failed to compress listing images:", err)
      setError("Failed to compress images. Please try different images.")
    }
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const target = prev[index]
      if (target && target.previewUrl.startsWith("blob:")) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((_, currentIndex) => currentIndex !== index)
    })
  }

  async function uploadToR2(imageState: ImageUploadState, index: number): Promise<string> {
    if (!imageState.file) {
      throw new Error("No file provided for upload.")
    }

    const presignRes = await fetch("/api/storage/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: imageState.file.name,
        contentType: imageState.file.type,
      }),
    })

    if (!presignRes.ok) {
      throw new Error(`Failed to generate upload URL for ${imageState.file.name}`)
    }

    const { uploadUrl, publicUrl } = await presignRes.json()
    setImages((prev) => prev.map((img, idx) => (idx === index ? { ...img, status: "uploading", uploadProgress: 10 } : img)))

    const xhr = new XMLHttpRequest()
    return new Promise<string>((resolve, reject) => {
      xhr.open("PUT", uploadUrl, true)
      xhr.setRequestHeader("Content-Type", imageState.file!.type)

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return
        const progress = Math.round((event.loaded / event.total) * 100)
        setImages((prev) => prev.map((img, idx) => (idx === index ? { ...img, uploadProgress: progress } : img)))
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          setImages((prev) =>
            prev.map((img, idx) => (idx === index ? { ...img, status: "success", uploadProgress: 100, publicUrl } : img))
          )
          resolve(publicUrl)
        } else {
          setImages((prev) => prev.map((img, idx) => (idx === index ? { ...img, status: "error" } : img)))
          reject(new Error(`Direct upload failed with status ${xhr.status}`))
        }
      }

      xhr.onerror = () => {
        setImages((prev) => prev.map((img, idx) => (idx === index ? { ...img, status: "error" } : img)))
        reject(new Error("Network error occurred during direct upload."))
      }

      xhr.send(imageState.file)
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    if (!title.trim() || !description.trim() || !price) {
      setError("Please fill out all required fields.")
      setSubmitting(false)
      return
    }

    const numericPrice = parseFloat(price)
    if (Number.isNaN(numericPrice) || numericPrice <= 0) {
      setError("Please enter a valid price greater than 0.")
      setSubmitting(false)
      return
    }

    try {
      const uploadedUrls: string[] = []
      for (let i = 0; i < images.length; i += 1) {
        const image = images[i]
        if (image.status === "success" && image.publicUrl) {
          uploadedUrls.push(image.publicUrl)
        } else if (image.file) {
          uploadedUrls.push(await uploadToR2(image, i))
        }
      }

      if (editId) {
        const result = await updateListing({
          id: editId,
          title,
          description,
          price: numericPrice,
          categorySlug: category,
          condition: condition as "new" | "like_new" | "good" | "fair" | "poor",
          campus,
          department: department || undefined,
          imageUrls: uploadedUrls,
        })

        if (result.error) {
          setError(result.error)
          setSubmitting(false)
          return
        }
      } else {
        const result = await createListing({
          title,
          description,
          price: numericPrice,
          categorySlug: category,
          condition: condition as "new" | "like_new" | "good" | "fair" | "poor",
          campus,
          department: department || undefined,
          imageUrls: uploadedUrls,
        })

        if (result.error) {
          setError(result.error)
          setSubmitting(false)
          return
        }
      }

      router.push("/dashboard/listings")
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to save listing. Please try again.")
      setSubmitting(false)
    }
  }

  if (loadingListing) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-[2rem] bg-white border border-[var(--seller-border)] p-8 text-center shadow-sm">
        <Loader2 className="animate-spin text-[var(--seller-primary)]" size={42} />
        <div>
          <h2 className="font-display text-2xl font-bold text-on-surface">Loading listing details...</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Fetching details from the campus registry.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl pb-24 md:pb-8">
      <div className="mb-5 flex items-center justify-between">
        <Link href="/dashboard/listings" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--seller-primary-strong)]">
          <ArrowLeft size={16} />
          Back to listings
        </Link>
        <span className="hidden rounded-full bg-[var(--seller-surface)] px-4 py-2 text-sm font-semibold text-[var(--seller-primary-strong)] md:inline-flex">
          {editId ? "Seller editor" : "Seller composer"}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-6">
          <div className="seller-soft-gradient overflow-hidden rounded-[2rem] border border-[var(--seller-border)] p-5 md:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--seller-primary)]">{editId ? "Edit Listing" : "New Listing"}</p>
            <h1 className="mt-3 font-display text-5xl font-extrabold tracking-tight text-on-surface">{editId ? "Update your calm, trusted listing" : "Create a calm, trusted listing"}</h1>

            <p className="mt-3 max-w-2xl text-sm text-on-surface-variant md:text-base">
              Lead with clear photos, a confident title, and realistic pricing so campus buyers can say yes quickly.
            </p>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-[var(--seller-border)] bg-white shadow-[0_20px_40px_rgba(31,157,119,0.08)]">
            <div className="border-b border-[var(--seller-border)] px-5 py-4 md:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--seller-surface)] text-[var(--seller-primary)]">
                  <Camera size={22} />
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--seller-primary)]">Stage 1</p>
                  <h2 className="font-display text-3xl font-bold tracking-tight text-on-surface">Photos first</h2>
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-5 md:p-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="grid gap-3 sm:grid-cols-2">
                {images.map((image, index) => (
                  <div key={`${image.file?.name || image.previewUrl}-${index}`} className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] border border-[var(--seller-border)] bg-[var(--seller-surface)]">
                    <img src={image.previewUrl} alt={`Preview ${index + 1}`} className="h-full w-full object-cover" />
                    {image.status === "uploading" ? (
                      <div className="absolute inset-x-4 bottom-4 rounded-full bg-black/65 px-3 py-2 text-xs font-semibold text-white">
                        Uploading {image.uploadProgress}%
                      </div>
                    ) : null}
                    {image.status === "success" ? (
                      <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--seller-primary)] text-white">
                        <Check size={16} />
                      </div>
                    ) : null}
                    {!submitting ? (
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white"
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : null}
                  </div>
                ))}

                {images.length < 5 ? (
                  <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-3 rounded-[1.5rem] border-2 border-dashed border-[var(--seller-border)] bg-[var(--seller-surface)] text-center text-[var(--seller-primary-strong)] transition-colors hover:border-[var(--seller-primary)]">
                    <ImagePlus size={28} />
                    <div>
                      <p className="font-semibold">Add Photo</p>
                      <p className="text-xs text-[var(--seller-text-soft)]">Up to 5 images</p>
                    </div>
                    <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                ) : null}
              </div>

              <div className="rounded-[1.75rem] border border-[var(--seller-border)] bg-[var(--seller-surface)] p-5">
                <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-[var(--seller-primary)]">
                  <Sparkles size={15} />
                  AI Guidance
                </p>
                <p className="mt-4 text-2xl font-bold tracking-tight text-[var(--seller-primary-strong)]">
                  Detected category: {selectedCategoryLabel}
                </p>
                <p className="mt-2 text-sm text-[var(--seller-text-soft)]">Suggested title and pricing cues appear as you fill in the core details below.</p>
                <div className="mt-5 rounded-[1.5rem] bg-white px-4 py-4 text-sm text-on-surface-variant">
                  Clear, front-facing product photos usually create more buyer confidence than collage-style uploads.
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-[var(--seller-border)] bg-white shadow-[0_20px_40px_rgba(31,157,119,0.08)]">
            <div className="border-b border-[var(--seller-border)] px-5 py-4 md:px-6">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--seller-primary)]">Stage 2</p>
              <h2 className="font-display text-3xl font-bold tracking-tight text-on-surface">Core details</h2>
            </div>

            <div className="space-y-6 p-5 md:p-6">
              {error ? (
                <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="rounded-[1.5rem] border border-[var(--seller-border)] bg-[var(--seller-surface)] px-4 py-4">
                <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-[var(--seller-primary)]">
                  <Sparkles size={15} />
                  BuyKarlo AI Seller Bot
                </p>
                <p className="mt-2 text-sm text-[var(--seller-text-soft)]">
                  Use the floating bot in the corner to build a listing through chat. When it generates the title and description, copy them or apply them here.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  Title
                </label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  disabled={submitting}
                  placeholder="MacBook Air 13-inch 2019, 8GB RAM"
                  className="h-16 rounded-[1.5rem] border-[var(--seller-border)] px-5 text-lg font-medium focus-visible:border-[var(--seller-primary)]"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                    Category
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={submitting}
                    className="h-14 w-full rounded-[1.5rem] border border-[var(--seller-border)] bg-white px-4 text-base outline-none"
                  >
                    {CATEGORIES.map((item) => (
                      <option key={item.slug} value={item.slug}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="price" className="text-sm font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                    Set Price
                  </label>
                  <Input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    min="1"
                    disabled={submitting}
                    placeholder="42000"
                    className="h-16 rounded-[1.5rem] border-[var(--seller-border)] px-5 text-3xl font-bold focus-visible:border-[var(--seller-primary)]"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold uppercase tracking-[0.16em] text-on-surface-variant">Condition</label>
                <div className="grid gap-3 sm:grid-cols-3">
                  {CONDITIONS.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setCondition(item.value)}
                      className={cn(
                        "rounded-[1.5rem] border px-4 py-4 text-base font-semibold transition-colors",
                        condition === item.value
                          ? "border-[var(--seller-primary)] bg-[var(--seller-primary)] text-white shadow-[0_16px_30px_rgba(31,157,119,0.18)]"
                          : "border-outline-variant/25 bg-white text-on-surface-variant hover:border-[var(--seller-border)] hover:bg-[var(--seller-surface)]"
                      )}
                    >
                      {item.value === "like_new" ? "Like New" : item.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-[var(--seller-border)] bg-[var(--seller-surface)] px-4 py-4 text-sm text-[var(--seller-primary-strong)]">
                <p className="inline-flex items-center gap-2 font-semibold">
                  <TrendingUp size={16} />
                  {suggestedPrice}
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-[var(--seller-border)] bg-white shadow-[0_20px_40px_rgba(31,157,119,0.08)]">
            <button
              type="button"
              onClick={() => setDetailsOpen((current) => !current)}
              className="flex w-full items-center justify-between px-5 py-4 text-left md:px-6"
            >
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--seller-primary)]">Stage 3</p>
                <h2 className="font-display text-3xl font-bold tracking-tight text-on-surface">Optional details</h2>
              </div>
              <ChevronDown className={cn("transition-transform", detailsOpen ? "rotate-180" : "")} />
            </button>

            {detailsOpen ? (
              <div className="space-y-5 border-t border-[var(--seller-border)] p-5 md:p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                      Campus Location
                    </label>
                    <div className="flex h-14 items-center gap-2 rounded-[1.5rem] border border-[var(--seller-border)] bg-[var(--seller-surface)] px-4 text-sm font-semibold text-[var(--seller-primary-strong)]">
                      <MapPin size={16} />
                      {campus}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="department" className="text-sm font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                      Hostel / Department
                    </label>
                    <Input
                      id="department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      disabled={submitting}
                      placeholder="ZHCET or SS Hall"
                      className="h-14 rounded-[1.5rem] border-[var(--seller-border)] px-4"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value)
                      setDescriptionAiNote(null)
                    }}
                    rows={6}
                    required
                    disabled={submitting}
                    placeholder="Mention age, usage, included accessories, meetup preferences, and anything that helps campus buyers trust the listing."
                    className="w-full rounded-[1.5rem] border border-[var(--seller-border)] px-4 py-4 text-base outline-none"
                  />
                  {descriptionAiNote ? (
                    <p className="rounded-[1rem] bg-[var(--seller-surface)] px-3 py-2 text-sm font-medium text-[var(--seller-primary-strong)]">
                      {descriptionAiNote}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="space-y-6 xl:sticky xl:top-32 xl:self-start">
          <div className="rounded-[2rem] seller-card p-6">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--seller-primary)]">{editId ? "Live Preview" : "Listing Preview"}</p>
            <div className="mt-5 overflow-hidden rounded-[1.75rem] border border-[var(--seller-border)] bg-white">
              <div className="aspect-[5/4] bg-[var(--seller-surface)]" style={images[0] ? { backgroundImage: `url(${images[0].previewUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
                {!images[0] ? (
                  <div className="flex h-full items-center justify-center text-[var(--seller-primary-strong)]">
                    <Camera size={32} />
                  </div>
                ) : null}
              </div>
              <div className="space-y-3 p-5">
                <p className="line-clamp-2 font-display text-3xl font-bold tracking-tight text-on-surface">{title || "Your title appears here"}</p>
                <p className="font-display text-4xl font-extrabold tracking-tight text-[var(--seller-primary)]">
                  ₹{price ? Number(price).toLocaleString("en-IN") : "0"}
                </p>
                <div className="inline-flex rounded-full bg-[var(--seller-surface)] px-3 py-1.5 text-sm font-semibold text-[var(--seller-primary-strong)]">
                  {selectedCategoryLabel}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] seller-card p-6">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--seller-primary)]">{editId ? "Before you save" : "Before you post"}</p>
            <div className="mt-5 space-y-3 text-sm text-on-surface-variant">
              <div className="rounded-[1.5rem] border border-[var(--seller-border)] bg-[var(--seller-surface)] px-4 py-4">
                Use a sharp cover photo with natural light.
              </div>
              <div className="rounded-[1.5rem] border border-outline-variant/20 bg-white px-4 py-4">
                Mention accessories, defects, and pickup expectations clearly.
              </div>
              <div className="rounded-[1.5rem] border border-outline-variant/20 bg-white px-4 py-4">
                Mark sold items quickly so buyers keep trusting your profile.
              </div>
            </div>
          </div>
        </aside>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--seller-border)] bg-white/95 px-4 py-3 backdrop-blur-xl xl:hidden">
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--seller-primary)] px-5 py-4 text-base font-bold text-white shadow-[0_18px_36px_rgba(31,157,119,0.28)] disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {editId ? "Saving changes..." : "Uploading & creating listing..."}
              </>
            ) : (
              <>
                <Check size={18} />
                {editId ? "Save changes" : "Post listing"}
              </>
            )}
          </button>
        </div>

        <div className="hidden xl:block">
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--seller-primary)] px-5 py-4 text-base font-bold text-white shadow-[0_18px_36px_rgba(31,157,119,0.28)] disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {editId ? "Saving changes..." : "Uploading & creating listing..."}
              </>
            ) : (
              <>
                <Check size={18} />
                {editId ? "Save changes" : "Post listing"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function SellPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-[2rem] bg-white border border-[var(--seller-border)] p-8 text-center shadow-sm">
        <Loader2 className="animate-spin text-[var(--seller-primary)]" size={42} />
        <div>
          <h2 className="font-display text-2xl font-bold text-on-surface">Loading sell composer...</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Setting up your trusted dashboard.</p>
        </div>
      </div>
    }>
      <SellPageInner />
    </Suspense>
  )
}
