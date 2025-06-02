import { useState, useEffect, useCallback } from "react"
import { useWallet } from "@/contexts/wallet-context"
import { firebaseReferralService, type ReferralStats, type ReferralWithUser } from "@/services/firebase-referral-service"
import { firebaseUserService } from "@/services/firebase-user-service"
import type { UserProfile } from "@/types/firebase"

export interface UseFirebaseReferralsReturn {
  // User data
  user: UserProfile | null
  referralCode: string
  referralLink: string
  
  // Referral stats
  stats: ReferralStats | null
  history: ReferralWithUser[]
  
  // Loading states
  loading: boolean
  initializing: boolean
  
  // Actions
  initializeUser: () => Promise<void>
  trackReferral: (code: string) => Promise<boolean>
  refreshData: () => Promise<void>
  
  // Error handling
  error: string | null
}

export function useFirebaseReferrals(): UseFirebaseReferralsReturn {
  const { connected, publicKey } = useWallet()
  
  // State
  const [user, setUser] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [history, setHistory] = useState<ReferralWithUser[]>([])
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Computed values
  const referralCode = user?.referralCode || ""
  const referralLink = referralCode ? firebaseReferralService.getReferralLink(referralCode) : ""

  // Initialize user when wallet connects
  const initializeUser = useCallback(async () => {
    if (!connected || !publicKey) return

    setInitializing(true)
    setError(null)

    try {
      const walletAddress = publicKey.toString()

      // First try to get existing user
      let userData = await firebaseUserService.getUserByWallet(walletAddress)

      // If user doesn't exist, create them
      if (!userData) {
        userData = await firebaseReferralService.initializeUserReferral(walletAddress)
      }

      setUser(userData)

      // Load referral data
      await loadReferralData(walletAddress)
    } catch (err) {
      console.error("Error initializing user:", err)
      setError(`Failed to initialize user data: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setInitializing(false)
    }
  }, [connected, publicKey])

  // Load referral data
  const loadReferralData = useCallback(async (walletAddress: string) => {
    setLoading(true)
    setError(null)

    try {
      // Load stats and history in parallel with fallbacks
      const [statsData, historyData] = await Promise.allSettled([
        firebaseReferralService.getReferralStats(walletAddress),
        firebaseReferralService.getReferralHistory(walletAddress),
      ])

      // Handle stats result
      if (statsData.status === 'fulfilled') {
        setStats(statsData.value)
      } else {
        console.error("Error loading stats:", statsData.reason)
        setStats({
          totalReferrals: 0,
          totalEarned: 0,
          pendingRewards: 0,
          completedReferrals: 0
        })
      }

      // Handle history result
      if (historyData.status === 'fulfilled') {
        setHistory(historyData.value)
      } else {
        console.error("Error loading history:", historyData.reason)
        setHistory([])
      }

    } catch (err) {
      console.error("Error loading referral data:", err)
      setError(`Failed to load referral data: ${err instanceof Error ? err.message : 'Unknown error'}`)
      // Set fallback data
      setStats({
        totalReferrals: 0,
        totalEarned: 0,
        pendingRewards: 0,
        completedReferrals: 0
      })
      setHistory([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Track a referral
  const trackReferral = useCallback(async (code: string): Promise<boolean> => {
    if (!connected || !publicKey) {
      setError("Wallet not connected")
      return false
    }

    setError(null)

    try {
      const walletAddress = publicKey.toString()
      const success = await firebaseReferralService.trackReferral(code, walletAddress)
      
      if (success) {
        // Refresh user data to get updated referredBy field
        const updatedUser = await firebaseUserService.getUserByWallet(walletAddress)
        if (updatedUser) {
          setUser(updatedUser)
        }
      } else {
        setError("Failed to track referral. Invalid code or already referred.")
      }

      return success
    } catch (err) {
      console.error("Error tracking referral:", err)
      setError("Failed to track referral")
      return false
    }
  }, [connected, publicKey])

  // Refresh all data
  const refreshData = useCallback(async () => {
    if (!connected || !publicKey) return

    const walletAddress = publicKey.toString()
    setError(null)

    try {
      // Refresh user data
      const userData = await firebaseUserService.getUserByWallet(walletAddress)
      if (userData) {
        setUser(userData)
      } else {
        // If user doesn't exist, create them
        const newUserData = await firebaseReferralService.initializeUserReferral(walletAddress)
        setUser(newUserData)
      }

      // Refresh referral data
      await loadReferralData(walletAddress)
    } catch (err) {
      console.error("Error refreshing data:", err)
      setError(`Failed to refresh data: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [connected, publicKey, loadReferralData])

  // Initialize when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      initializeUser()
    } else {
      // Reset state when wallet disconnects
      setUser(null)
      setStats(null)
      setHistory([])
      setError(null)
    }
  }, [connected, publicKey, initializeUser])

  // Auto-refresh data periodically
  useEffect(() => {
    if (!connected || !publicKey) return

    const interval = setInterval(() => {
      refreshData()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [connected, publicKey, refreshData])

  return {
    // User data
    user,
    referralCode,
    referralLink,
    
    // Referral stats
    stats,
    history,
    
    // Loading states
    loading,
    initializing,
    
    // Actions
    initializeUser,
    trackReferral,
    refreshData,
    
    // Error handling
    error,
  }
}

// Helper hook for checking referral codes on page load
export function useReferralCodeHandler() {
  const { trackReferral } = useFirebaseReferrals()
  const { connected } = useWallet()

  useEffect(() => {
    // Check for referral code in URL
    if (typeof window === "undefined") return

    const urlParams = new URLSearchParams(window.location.search)
    const referralCode = urlParams.get("ref")

    if (referralCode && connected) {
      // Track the referral
      trackReferral(referralCode).then((success) => {
        if (success) {
          console.log("Referral tracked successfully")
          // Remove ref parameter from URL
          const newUrl = new URL(window.location.href)
          newUrl.searchParams.delete("ref")
          window.history.replaceState({}, "", newUrl.toString())
        }
      })
    }
  }, [connected, trackReferral])
}
