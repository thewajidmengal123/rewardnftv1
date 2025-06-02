"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

interface LazyImageProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
}

export function LazyImage({ src, alt, width, height, className = "" }: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState<string>("/loading-screen-animation.png")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    // Reset states when src changes
    setLoading(true)
    setError(false)

    // Use a placeholder while loading
    setImageSrc("/loading-screen-animation.png")

    // Create a new image to preload
    const img = new Image()
    img.src = src

    img.onload = () => {
      setImageSrc(src)
      setLoading(false)
    }

    img.onerror = () => {
      setError(true)
      setLoading(false)
      setImageSrc("/broken-image-icon.png")
    }

    return () => {
      // Clean up
      img.onload = null
      img.onerror = null
    }
  }, [src])

  return (
    <div className={`relative ${className}`}>
      <Image
        src={error ? "/placeholder.svg?height=300&width=300&query=image+not+found" : imageSrc}
        alt={alt}
        width={width}
        height={height}
        className={`transition-opacity duration-300 ${loading ? "opacity-70" : "opacity-100"}`}
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-white/30 border-t-white/80 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  )
}
