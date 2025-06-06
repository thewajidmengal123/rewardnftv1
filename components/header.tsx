"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { MobileNav } from "@/components/mobile-nav"
import { AdminAccessIndicator, AdminOnly } from "@/components/admin-access-indicator"
import { Menu } from "lucide-react"

export function Header() {
  const [showMobileNav, setShowMobileNav] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full bg-black border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-yellow-400">
              RewardNFT
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/mint"
              className="text-white hover:text-gray-300 transition-colors font-medium"
            >
              Mint
            </Link>
            <Link
              href="/referrals"
              className="text-white hover:text-gray-300 transition-colors font-medium"
            >
              Referrals
            </Link>
            <Link
              href="/leaderboard"
              className="text-white hover:text-gray-300 transition-colors font-medium"
            >
              Leaderboard
            </Link>
            <Link
              href="/quests"
              className="text-white hover:text-gray-300 transition-colors font-medium"
            >
              Quests
            </Link>
            <Link
              href="/airdrops"
              className="text-white hover:text-gray-300 transition-colors font-medium"
            >
              Airdrops
            </Link>
            <Link
              href="/mini-game"
              className="text-white hover:text-gray-300 transition-colors font-medium"
            >
              Mini-Game
            </Link>
            <AdminOnly>
              <Link
                href="/admin/dashboard"
                className="text-yellow-400 hover:text-yellow-300 transition-colors font-medium border border-yellow-400/30 px-3 py-1 rounded-md"
              >
                Admin
              </Link>
            </AdminOnly>
          </nav>

          {/* Connect Wallet Button & Admin Indicator */}
          <div className="flex items-center gap-3">
            <AdminAccessIndicator />
            <WalletConnectButton
              className="bg-gradient-to-r from-teal-400 to-green-400 hover:from-teal-500 hover:to-green-500 text-black font-semibold px-6 py-2 rounded-lg transition-all duration-200 border-0"
            />
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            className="md:hidden text-white hover:bg-gray-800"
            onClick={() => setShowMobileNav(!showMobileNav)}
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {showMobileNav && (
        <div className="md:hidden border-t border-gray-800 bg-black">
          <MobileNav />
        </div>
      )}
    </header>
  )
}
