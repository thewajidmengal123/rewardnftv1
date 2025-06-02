"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import { NavigationBar } from "@/components/navigation-bar"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { useMobile } from "@/hooks/use-mobile"

interface ClientLayoutWrapperProps {
  children: React.ReactNode
}

export function ClientLayoutWrapper({ children }: ClientLayoutWrapperProps) {
  const pathname = usePathname()
  const { isMobile } = useMobile()

  // Don't show navigation on profile page to avoid duplication
  const showNavigation = pathname !== "/profile"

  return (
    <>
      {showNavigation && <NavigationBar />}
      {children}
      {isMobile && <MobileBottomNav />}
    </>
  )
}
