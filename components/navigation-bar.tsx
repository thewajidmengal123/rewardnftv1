"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { useWallet } from "@/contexts/wallet-context"
import { cn } from "@/lib/utils"

export function NavigationBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const { connected } = useWallet()

  // Close menu when path changes
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isMenuOpen])

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/mint", label: "Mint NFT" },
    { href: "/referrals", label: "Referrals" },
    { href: "/quests", label: "Quests" },
    { href: "/leaderboard", label: "Leaderboard" },
  ]

  // Add profile link if connected
  const authenticatedItems = connected
    ? [
        { href: "/profile", label: "My Profile" },
        { href: "/airdrops", label: "Airdrops" },
        // Add admin link (in a real app, this would check for admin role)
        { href: "/admin/dashboard", label: "Admin" },
      ]
    : []

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-10 w-10 overflow-hidden rounded-lg">
              <Image src="/images/logo.png" alt="Reward NFT Logo" width={40} height={40} className="object-cover" />
            </div>
            <span className="font-bold text-xl text-white hidden sm:inline-block">Reward NFT</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === item.href ? "bg-white/10 text-white" : "text-white/70 hover:text-white hover:bg-white/5",
                )}
              >
                {item.label}
              </Link>
            ))}

            {authenticatedItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === item.href ? "bg-white/10 text-white" : "text-white/70 hover:text-white hover:bg-white/5",
                )}
              >
                {item.label}
              </Link>
            ))}

            <div className="ml-4">
              <WalletConnectButton />
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <WalletConnectButton variant="outline" size="sm" />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              className="text-white"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-black/95 z-50 pt-4">
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 py-3 rounded-md text-lg font-medium",
                  pathname === item.href ? "bg-white/10 text-white" : "text-gray-300",
                )}
              >
                {item.label}
              </Link>
            ))}

            {authenticatedItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 py-3 rounded-md text-lg font-medium",
                  pathname === item.href ? "bg-white/10 text-white" : "text-gray-300",
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
