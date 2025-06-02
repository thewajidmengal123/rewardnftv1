"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, Home, Award, Users, Gift, Trophy, User, Settings } from "lucide-react"
import { useWallet } from "@/contexts/wallet-context"
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { cn } from "@/lib/utils"

const navigationItems = [
  { href: "/", label: "Home" },
  { href: "/mint", label: "Mint" },
  { href: "/profile", label: "Profile" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/referrals", label: "Referrals" },
  { href: "/quests", label: "Quests" },
]

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const { connected } = useWallet()
  const pathname = usePathname()

  // Close menu when path changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isOpen])

  const toggleMenu = () => setIsOpen(!isOpen)

  const menuItems = [
    { href: "/", label: "Home", icon: <Home size={20} /> },
    { href: "/mint", label: "Mint NFT", icon: <Award size={20} /> },
    { href: "/referrals", label: "Referrals", icon: <Users size={20} /> },
    { href: "/quests", label: "Quests", icon: <Gift size={20} /> },
    { href: "/leaderboard", label: "Leaderboard", icon: <Trophy size={20} /> },
    { href: "/airdrops", label: "Airdrops", icon: <Gift size={20} /> },
  ]

  // Add profile link if connected
  if (connected) {
    menuItems.push({ href: "/profile", label: "My Profile", icon: <User size={20} /> })
  }

  // Add admin links if connected (in a real app, this would check for admin role)
  if (connected) {
    menuItems.push({ href: "/admin/dashboard", label: "Admin Dashboard", icon: <Settings size={20} /> })
  }

  return (
    <div className="md:hidden">
      <button
        onClick={toggleMenu}
        className="text-white p-2 rounded-full hover:bg-white/10 transition-colors"
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md"
          >
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center p-4 border-b border-white/10">
                <Link href="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
                  <div className="relative h-10 w-10 overflow-hidden rounded-lg">
                    <Image
                      src="/images/logo.png"
                      alt="Reward NFT Logo"
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  </div>
                  <span className="text-white font-bold text-xl">Reward NFT</span>
                </Link>
                <button
                  onClick={toggleMenu}
                  className="text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-6 px-4">
                <nav className="flex flex-col space-y-1">
                  {menuItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 py-3 px-4 rounded-lg transition-colors ${
                        pathname === item.href
                          ? "bg-white/10 text-white font-medium"
                          : "text-white/80 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="p-4 border-t border-white/10">
                <WalletConnectButton className="w-full" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container py-4">
        <nav className="flex flex-col space-y-3">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-foreground/80",
                pathname === item.href ? "text-foreground" : "text-foreground/60",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
