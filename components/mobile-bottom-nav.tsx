"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Home, Award, Users, Gift, User } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"

export function MobileBottomNav() {
  const pathname = usePathname()
  const { isMobile } = useMobile()
  const [visible, setVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setVisible(false)
      } else {
        setVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])

  // Don't render on desktop
  if (!isMobile) return null

  const navItems = [
    { href: "/", label: "Home", icon: <Home size={20} /> },
    { href: "/mint", label: "Mint", icon: <Award size={20} /> },
    { href: "/referrals", label: "Refer", icon: <Users size={20} /> },
    { href: "/quests", label: "Quests", icon: <Gift size={20} /> },
    { href: "/profile", label: "Profile", icon: <User size={20} /> },
  ]

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: visible ? 0 : 100 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-t border-white/10 md:hidden"
    >
      <nav className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href

          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center w-full h-full">
              <div
                className={`flex flex-col items-center justify-center ${isActive ? "text-[#00FFE0]" : "text-white/60"}`}
              >
                {item.icon}
                <span className="text-xs mt-1">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute bottom-0 w-12 h-1 bg-[#00FFE0] rounded-t-full"
                  />
                )}
              </div>
            </Link>
          )
        })}
      </nav>
    </motion.div>
  )
}
