"use client"

import { useEffect, useRef, useState } from "react"
import { Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface CustomVideoPlayerProps {
  src: string
  fit?: "cover" | "contain"
  aspectRatio?: "4/3" | "16/9" | "1/1" | "9/16"
  className?: string
  autoPlay?: boolean
  loop?: boolean
  muted?: boolean
  playsInline?: boolean
  useAspectRatio?: boolean
  onFitChange?: (fit: "cover" | "contain") => void
}

export function CustomVideoPlayer({
  src,
  fit = "cover",
  aspectRatio = "4/3",
  className,
  autoPlay = true,
  loop = true,
  muted = true,
  playsInline = true,
  useAspectRatio = true,
  onFitChange,
}: CustomVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(muted)
  const [volume, setVolume] = useState(muted ? 0 : 0.8)
  const [currentFit, setCurrentFit] = useState<"cover" | "contain">(fit)

  // Keep state in sync with prop if it changes from outside
  useEffect(() => {
    setCurrentFit(fit)
  }, [fit])
  const [prevVolume, setPrevVolume] = useState(0.8)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Handle controls visibility timer
  const resetControlsTimeout = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)

    // Hide controls after 2.5s of inactivity if playing
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 2500)
    }
  }

  useEffect(() => {
    resetControlsTimeout()
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    }
  }, [isPlaying])

  // Sync mute state on video tag
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted
      videoRef.current.volume = isMuted ? 0 : volume
    }
  }, [isMuted, volume])

  // Track fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement && document.fullscreenElement === containerRef.current)
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  const handlePlayPause = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play().catch((err) => console.log("Play failed:", err))
    }
  }

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!videoRef.current) return

    if (isMuted) {
      setIsMuted(false)
      const nextVol = volume === 0 ? prevVolume || 0.8 : volume
      setVolume(nextVol)
    } else {
      setPrevVolume(volume)
      setIsMuted(true)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setVolume(val)
    if (val > 0) {
      setIsMuted(false)
    } else {
      setIsMuted(true)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleDurationChange = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0)
    }
  }

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = val
      setCurrentTime(val)
    }
  }

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!containerRef.current) return

    if (!isFullscreen) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error("Fullscreen error:", err)
      })
    } else {
      document.exitFullscreen()
    }
  }

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === Infinity) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  // Map aspect ratios to class
  const aspectClass = {
    "4/3": "aspect-[4/3]",
    "16/9": "aspect-[16/9]",
    "1/1": "aspect-[1/1]",
    "9/16": "aspect-[9/16]",
  }[aspectRatio] || "aspect-[4/3]"

  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onClick={handlePlayPause}
      className={cn(
        "group relative w-full overflow-hidden bg-black select-none transition-all duration-300 rounded-[1.35rem] md:rounded-[1.75rem] shadow-md cursor-pointer",
        useAspectRatio && aspectClass,
        className
      )}
    >
      {/* HTML5 Video Element */}
      <video
        ref={videoRef}
        src={src}
        autoPlay={autoPlay}
        loop={loop}
        playsInline={playsInline}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleDurationChange}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onLoadedData={() => setIsLoading(false)}
        className={cn(
          "h-full w-full pointer-events-none transition-all duration-300",
          currentFit === "cover" ? "object-cover" : "object-contain"
        )}
      />

      {/* Loading Spinner overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-sm pointer-events-none">
          <Loader2 className="h-10 w-10 animate-spin text-white" />
        </div>
      )}

      {/* Center Big Play Button Overlay */}
      {!isPlaying && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-all duration-300">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white shadow-xl hover:scale-105 active:scale-95 transition-transform duration-200">
            <Play className="h-7 w-7 fill-white ml-1 text-white" />
          </div>
        </div>
      )}

      {/* Custom Glassmorphic Controls Bar */}
      <div
        onClick={(e) => e.stopPropagation()} // Stop toggle playback when clicking control bar
        className={cn(
          "absolute bottom-3 inset-x-3 rounded-2xl bg-black/35 backdrop-blur-md border border-white/10 px-4 py-3 flex flex-col gap-2.5 text-white transition-all duration-300 shadow-lg z-20",
          showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        )}
      >
        {/* Timeline Slider / Scrubber */}
        <div className="flex items-center gap-2 w-full">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleScrub}
            className="w-full h-1 cursor-pointer appearance-none rounded-lg bg-white/25 accent-indigo-500 hover:h-1.5 transition-all outline-none"
          />
        </div>

        {/* Buttons Controls and Time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Play/Pause Button */}
            <button
              onClick={handlePlayPause}
              className="hover:scale-110 active:scale-90 transition-transform duration-150"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="h-5 w-5 fill-white" /> : <Play className="h-5 w-5 fill-white" />}
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-1.5 group/volume">
              <button
                onClick={handleMuteToggle}
                className="hover:scale-110 active:scale-90 transition-transform duration-150"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="h-5 w-5 text-white/80" /> : <Volume2 className="h-5 w-5 text-white" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/volume:w-16 h-1 cursor-pointer appearance-none rounded-lg bg-white/25 accent-indigo-500 transition-all outline-none duration-300 overflow-hidden"
              />
            </div>

            {/* Time Counter */}
            <div className="text-xs font-semibold tracking-wide text-white/90">
              {formatTime(currentTime)} <span className="text-white/40">/</span> {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Aspect Ratio / Fit Toggle Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                const nextFit = currentFit === "cover" ? "contain" : "cover"
                setCurrentFit(nextFit)
                if (onFitChange) {
                  onFitChange(nextFit)
                }
              }}
              className="rounded-md bg-white/10 hover:bg-white/20 hover:text-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/90 border border-white/5 transition-all active:scale-95 cursor-pointer shrink-0"
              title="Click to toggle between Fill Frame and Fit Inside"
            >
              {aspectRatio} • {currentFit === "cover" ? "Fill" : "Fit"}
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="hover:scale-110 active:scale-90 transition-transform duration-150 cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5 text-white" /> : <Maximize2 className="h-5 w-5 text-white" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
