"use client"

import { useEffect, useRef, useState } from "react"
import { Check, X, ZoomIn, ZoomOut, Loader2, RotateCw } from "lucide-react"

interface ImageCropperModalProps {
  isOpen: boolean
  imageSrc: string
  fileName?: string
  onClose: () => void
  onCrop: (croppedFile: File, croppedPreviewUrl: string) => void
}

export function ImageCropperModal({
  isOpen,
  imageSrc,
  fileName,
  onClose,
  onCrop,
}: ImageCropperModalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const pointerStart = useRef({ x: 0, y: 0 })
  const panStart = useRef({ x: 0, y: 0 })

  const [boxSize, setBoxSize] = useState({ width: 320, height: 240 })
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 })
  const [fitSize, setFitSize] = useState({ width: 0, height: 0 })
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isProcessing, setIsProcessing] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)

  // Measure the viewport on open or source change
  useEffect(() => {
    if (!isOpen) return
    setIsImageLoaded(false)
    setScale(1)
    setRotation(0)
    setPan({ x: 0, y: 0 })

    const updateBoxSize = () => {
      if (containerRef.current) {
        setBoxSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        })
      }
    }

    updateBoxSize()
    // Small timeout to allow transition/modal render to finish
    const timer = setTimeout(updateBoxSize, 50)

    window.addEventListener("resize", updateBoxSize)
    return () => {
      clearTimeout(timer)
      window.removeEventListener("resize", updateBoxSize)
    }
  }, [isOpen, imageSrc])

  // Sync pan limits when scale, rotation, or dimensions change
  useEffect(() => {
    if (fitSize.width === 0) return

    const isRotated = rotation === 90 || rotation === 270
    const w = isRotated ? fitSize.height : fitSize.width
    const h = isRotated ? fitSize.width : fitSize.height

    const maxPanX = Math.max(0, (w * scale - boxSize.width) / 2)
    const maxPanY = Math.max(0, (h * scale - boxSize.height) / 2)

    setPan((prev) => ({
      x: Math.min(maxPanX, Math.max(-maxPanX, prev.x)),
      y: Math.min(maxPanY, Math.max(-maxPanY, prev.y)),
    }))
  }, [scale, rotation, fitSize, boxSize])

  if (!isOpen) return null

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    const nw = img.naturalWidth
    const nh = img.naturalHeight
    setNaturalSize({ width: nw, height: nh })

    const bw = boxSize.width
    const bh = boxSize.height

    let fw = 0
    let fh = 0

    // Contain behavior: fit the entire image inside the 4:3 box by default
    if (nw / nh > bw / bh) {
      fw = bw
      fh = nh * (bw / nw)
    } else {
      fh = bh
      fw = nw * (bh / nh)
    }

    setFitSize({ width: fw, height: fh })
    setIsImageLoaded(true)
  }

  // Pointer drag events for panning
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isImageLoaded) return
    e.currentTarget.setPointerCapture(e.pointerId)
    isDragging.current = true
    pointerStart.current = { x: e.clientX, y: e.clientY }
    panStart.current = { ...pan }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return
    const dx = e.clientX - pointerStart.current.x
    const dy = e.clientY - pointerStart.current.y

    const newX = panStart.current.x + dx
    const newY = panStart.current.y + dy

    const isRotated = rotation === 90 || rotation === 270
    const w = isRotated ? fitSize.height : fitSize.width
    const h = isRotated ? fitSize.width : fitSize.height

    const maxPanX = Math.max(0, (w * scale - boxSize.width) / 2)
    const maxPanY = Math.max(0, (h * scale - boxSize.height) / 2)

    setPan({
      x: Math.min(maxPanX, Math.max(-maxPanX, newX)),
      y: Math.min(maxPanY, Math.max(-maxPanY, newY)),
    })
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = false
  }

  const handleSave = () => {
    if (naturalSize.width === 0 || naturalSize.height === 0 || isProcessing) return
    setIsProcessing(true)

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      setIsProcessing(false)
      return
    }

    // Output target is 4:3 high-res standard (1200x900)
    canvas.width = 1200
    canvas.height = 900

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = imageSrc

    img.onload = () => {
      // Clear/fill with white background so any empty letterbox/pillarbox margins are clean white
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, 1200, 900)

      const renderW = fitSize.width * scale
      const renderH = fitSize.height * scale

      const leftCenter = (boxSize.width - renderW) / 2
      const topCenter = (boxSize.height - renderH) / 2

      const left = leftCenter + pan.x
      const top = topCenter + pan.y

      const canvasScaleX = 1200 / boxSize.width
      const canvasScaleY = 900 / boxSize.height

      const dx = left * canvasScaleX
      const dy = top * canvasScaleY
      const dw = renderW * canvasScaleX
      const dh = renderH * canvasScaleY

      ctx.save()
      const cx = dx + dw / 2
      const cy = dy + dh / 2
      ctx.translate(cx, cy)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh)
      ctx.restore()

      canvas.toBlob(
        (blob) => {
          setIsProcessing(false)
          if (blob) {
            const baseName = fileName ? fileName.replace(/\.[^/.]+$/, "") : "cropped"
            const finalName = `${baseName}_cropped.jpg`
            const file = new File([blob], finalName, {
              type: "image/jpeg",
              lastModified: Date.now(),
            })
            onCrop(file, URL.createObjectURL(file))
            onClose()
          }
        },
        "image/jpeg",
        0.85
      )
    }

    img.onerror = () => {
      setIsProcessing(false)
      console.error("Failed to load image for canvas cropping.")
    }
  }

  // Calculate coordinates for inline preview style
  const renderW = fitSize.width * scale
  const renderH = fitSize.height * scale
  const leftCenter = (boxSize.width - renderW) / 2
  const topCenter = (boxSize.height - renderH) / 2

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-[var(--seller-border)] bg-white p-6 shadow-2xl dark:bg-surface-container-lowest">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-xl font-bold text-on-surface">Crop Listing Photo</h3>
            <p className="text-xs text-on-surface-variant/80">Adjust fit and zoom for best 4:3 campus feed layout.</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/35 text-on-surface-variant hover:bg-surface-container-low transition-colors"
            title="Cancel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Viewport Frame (Standard 4:3 area) */}
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-950 border border-outline-variant/30 shadow-inner select-none cursor-move touch-none"
        >
          {/* Draggable Image */}
          <img
            src={imageSrc}
            alt="Source to Crop"
            onLoad={handleImageLoad}
            style={{
              width: renderW || "auto",
              height: renderH || "auto",
              transform: `translate3d(${leftCenter + pan.x}px, ${topCenter + pan.y}px, 0) rotate(${rotation}deg)`,
              transformOrigin: "center center",
            }}
            className="absolute left-0 top-0 max-w-none pointer-events-none select-none"
          />

          {/* Grid overlay lines (premium helper guides) */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none border border-white/20">
            <div className="border-r border-b border-white/10"></div>
            <div className="border-r border-b border-white/10"></div>
            <div className="border-b border-white/10"></div>
            <div className="border-r border-b border-white/10"></div>
            <div className="border-r border-b border-white/10"></div>
            <div className="border-b border-white/10"></div>
            <div className="border-r border-white/10"></div>
            <div className="border-r border-white/10"></div>
            <div></div>
          </div>
        </div>

        {/* Zoom & Rotate controls */}
        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setScale((prev) => Math.max(1, prev - 0.2))}
            disabled={!isImageLoaded}
            className="text-on-surface-variant hover:text-primary transition-colors disabled:opacity-40"
            title="Zoom Out"
          >
            <ZoomOut size={18} />
          </button>
          <input
            type="range"
            min="1.0"
            max="3.0"
            step="0.05"
            value={scale}
            disabled={!isImageLoaded}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg bg-surface-container-high accent-primary transition-all"
          />
          <button
            type="button"
            onClick={() => setScale((prev) => Math.min(3, prev + 0.2))}
            disabled={!isImageLoaded}
            className="text-on-surface-variant hover:text-primary transition-colors disabled:opacity-40"
            title="Zoom In"
          >
            <ZoomIn size={18} />
          </button>

          <div className="h-4 w-[1px] bg-outline-variant/35 mx-1" />

          <button
            type="button"
            onClick={() => setRotation((prev) => (prev + 90) % 360)}
            disabled={!isImageLoaded}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors disabled:opacity-40"
            title="Rotate 90° Clockwise"
          >
            <RotateCw size={16} />
            <span>Rotate</span>
          </button>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-outline-variant/35 px-5 py-2.5 text-sm font-bold text-on-surface hover:bg-surface-container-low transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isImageLoaded || isProcessing}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {isProcessing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check size={16} />
                Apply Crop
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
