"use client"

import type { ReactNode } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface MobileCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  isActive?: boolean
}

export function MobileCard({ children, className, onClick, isActive = false }: MobileCardProps) {
  return (
    <motion.div
      whileTap={{ scale: onClick ? 0.98 : 1 }}
      className={cn(
        "bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 w-full",
        isActive && "border-white/30 bg-white/10",
        onClick && "cursor-pointer active:bg-white/10",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}
