"use client"

import { motion, AnimatePresence } from "framer-motion"
import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import ReactConfetti from "react-confetti"

// Fade In animation component
export const FadeIn = ({ children, delay = 0, duration = 500 }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      style={{
        opacity: isVisible ? 1 : 0,
        transition: `opacity ${duration}ms ease-in-out`,
      }}
    >
      {children}
    </div>
  )
}

// Slide Up animation component
export const SlideUp = ({
  children,
  delay = 0,
  duration = 0.5,
  className = "",
}: {
  children: ReactNode
  delay?: number
  duration?: number
  className?: string
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Slide In from Left animation component
export const SlideInLeft = ({
  children,
  delay = 0,
  duration = 0.5,
  className = "",
}: {
  children: ReactNode
  delay?: number
  duration?: number
  className?: string
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Slide In from Right animation component
export const SlideInRight = ({
  children,
  delay = 0,
  duration = 0.5,
  className = "",
}: {
  children: ReactNode
  delay?: number
  duration?: number
  className?: string
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Scale animation component
export const Scale = ({
  children,
  delay = 0,
  duration = 0.5,
  className = "",
}: {
  children: ReactNode
  delay?: number
  duration?: number
  className?: string
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Staggered children animation component
export const StaggerContainer = ({
  children,
  delay = 0,
  staggerDelay = 0.1,
  className = "",
}: {
  children: ReactNode
  delay?: number
  staggerDelay?: number
  className?: string
}) => {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      exit="hidden"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: delay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Staggered child item
export const StaggerItem = ({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Page transition wrapper
export const PageTransition = ({ children }: { children: ReactNode }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// Hover animation for cards
export const HoverCard = ({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Loading spinner animation
export const LoadingSpinner = ({ size = 40, color = "white" }: { size?: number; color?: string }) => {
  return (
    <motion.div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `3px solid rgba(${color === "white" ? "255,255,255" : "0,0,0"},0.1)`,
        borderTop: `3px solid ${color}`,
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
    />
  )
}

// Skeleton loading animation
export const SkeletonLoader = ({ className = "" }: { className?: string }) => {
  return (
    <motion.div
      className={`bg-white/10 rounded-md ${className}`}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
    />
  )
}

// Success animation
export const SuccessAnimation = ({ size = 100 }: { size?: number }) => {
  return (
    <div className="flex items-center justify-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="bg-green-500 rounded-full p-2"
        style={{ width: size, height: size }}
      >
        <motion.svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <path d="M20 6L9 17l-5-5" />
        </motion.svg>
      </motion.div>
    </div>
  )
}

// Error animation
export const ErrorAnimation = ({ size = 100 }: { size?: number }) => {
  return (
    <div className="flex items-center justify-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="bg-red-500 rounded-full p-2"
        style={{ width: size, height: size }}
      >
        <motion.svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.path
            d="M18 6L6 18"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
          <motion.path
            d="M6 6L18 18"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          />
        </motion.svg>
      </motion.div>
    </div>
  )
}

// Confetti animation for celebrations
export const Confetti = () => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [pieces, setPieces] = useState(200)

  useEffect(() => {
    // Set initial dimensions
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    })

    // Handle window resize
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    // Reduce confetti pieces over time
    const timer = setTimeout(() => {
      setPieces(50)
    }, 2000)

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      clearTimeout(timer)
    }
  }, [])

  return (
    <ReactConfetti
      width={dimensions.width}
      height={dimensions.height}
      recycle={false}
      numberOfPieces={pieces}
      gravity={0.2}
    />
  )
}
