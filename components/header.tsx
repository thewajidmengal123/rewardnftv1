"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { MobileNav } from "@/components/mobile-nav"
import { AdminAccessIndicator, AdminOnly } from "@/components/admin-access-indicator"
import { Menu, ShoppingCart, Zap } from "lucide-react"

export function Header() {
  const [showMobileNav, setShowMobileNav] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full bg-black/80 backdrop-blur-md border-b border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo - Left Side */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3 text-xl font-bold">
              <Image
                src="/images/logo.png"
                alt="RewardNFT Logo"
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
              />
              <span className="bg-gradient-to-r from-yellow-300 via-orange-400 via-red-400 to-pink-500 bg-clip-text text-transparent">
                RewardNFT
              </span>
            </Link>
          </div>

          {/* Desktop Navigation - Center */}
          <nav className="hidden md:flex items-center space-x-8 absolute left-1/2 -translate-x-1/2">
            <Link
              href="/mint"
              className="text-gray-400 hover:text-white transition-colors font-medium text-sm"
            >
              Mint
            </Link>
            <Link
              href="/referrals"
              className="text-gray-400 hover:text-white transition-colors font-medium text-sm"
            >
              Referrals
            </Link>
            <Link
              href="/leaderboard"
              className="text-gray-400 hover:text-white transition-colors font-medium text-sm"
            >
              Leaderboard
            </Link>
            <Link
              href="/quests"
              className="text-gray-400 hover:text-white transition-colors font-medium text-sm"
            >
              Quests
            </Link>
            <Link
              href="/airdrops"
              className="text-gray-400 hover:text-white transition-colors font-medium text-sm"
            >
              Airdrops
            </Link>
            <Link
              href="/mini-game"
              className="text-gray-400 hover:text-white transition-colors font-medium text-sm"
            >
              Mini-Game
            </Link>
            <AdminOnly>
              <Link
                href="/admin/dashboard"
                className="text-yellow-400 hover:text-yellow-300 transition-colors font-medium text-sm border border-yellow-400/30 px-3 py-1 rounded-md"
              >
                Admin
              </Link>
            </AdminOnly>
          </nav>

          {/* Right Side Buttons */}
          <div className="flex items-center gap-3">
            {/* Tensor Button - Black Outline */}
            <Button
              variant="outline"
              className="hidden md:flex items-center gap-2 bg-black border border-gray-700 text-white hover:bg-gray-900 hover:border-gray-600 rounded-full px-4 py-2 text-sm font-medium transition-all"
            >
              <ShoppingCart className="w-4 h-4" />
              Tensor
            </Button>

            {/* Mint Agent Button - Red/Coral */}
            <Button
              className="hidden md:flex items-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white border-0 rounded-full px-4 py-2 text-sm font-medium transition-all shadow-lg shadow-red-500/25"
            >
              <Zap className="w-4 h-4" />
              Mint Agent
            </Button>

            <AdminAccessIndicator />
            
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
