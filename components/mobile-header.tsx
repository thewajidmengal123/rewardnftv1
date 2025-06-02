"use client"
import { useMobile } from "@/hooks/use-mobile"

export function MobileHeader() {
  const { isMobile } = useMobile()

  // Only render on mobile devices
  if (!isMobile) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-transparent z-30">
      {/* This is now just a placeholder for spacing since NavigationBar handles navigation */}
    </div>
  )
}
