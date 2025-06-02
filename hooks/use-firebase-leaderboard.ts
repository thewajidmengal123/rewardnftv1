import { useState, useEffect, useCallback } from "react"
import { useWallet } from "@/contexts/wallet-context"
import { 
  firebaseLeaderboardService, 
  type LeaderboardEntry, 
  type LeaderboardStats,
  type LeaderboardType 
} from "@/services/firebase-leaderboard-service"

export interface UseFirebaseLeaderboardReturn {
  // Leaderboard data
  leaderboard: LeaderboardEntry[]
  stats: LeaderboardStats | null
  
  // User stats
  userStats: {
    referralRank: number
    earningsRank: number
    questRank: number
    overallRank: number
    totalReferrals: number
    totalEarned: number
    questsCompleted: number
  } | null
  
  // Current settings
  currentType: LeaderboardType
  currentLimit: number
  
  // Loading states
  loading: boolean
  refreshing: boolean
  
  // Actions
  setType: (type: LeaderboardType) => void
  setLimit: (limit: number) => void
  refresh: () => Promise<void>
  
  // Error handling
  error: string | null
}

export function useFirebaseLeaderboard(
  initialType: LeaderboardType = "referrals",
  initialLimit: number = 10
): UseFirebaseLeaderboardReturn {
  const { connected, publicKey } = useWallet()
  
  // State
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [stats, setStats] = useState<LeaderboardStats | null>(null)
  const [userStats, setUserStats] = useState<{
    referralRank: number
    earningsRank: number
    questRank: number
    overallRank: number
    totalReferrals: number
    totalEarned: number
    questsCompleted: number
  } | null>(null)
  
  const [currentType, setCurrentType] = useState<LeaderboardType>(initialType)
  const [currentLimit, setCurrentLimit] = useState(initialLimit)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load leaderboard data
  const loadLeaderboardData = useCallback(async (type: LeaderboardType, limit: number) => {
    setLoading(true)
    setError(null)

    try {
      // Load leaderboard and stats
      const [leaderboardData, statsData] = await Promise.all([
        firebaseLeaderboardService.getLeaderboard(type, limit),
        firebaseLeaderboardService.getLeaderboardStats(),
      ])

      setLeaderboard(leaderboardData)
      setStats(statsData)

      // Load user stats if wallet is connected
      if (connected && publicKey) {
        const walletAddress = publicKey.toString()
        const userStatsData = await firebaseLeaderboardService.getUserLeaderboardStats(walletAddress)
        setUserStats(userStatsData)
      } else {
        setUserStats(null)
      }
    } catch (err) {
      console.error("Error loading leaderboard data:", err)
      setError("Failed to load leaderboard data")
    } finally {
      setLoading(false)
    }
  }, [connected, publicKey])

  // Refresh data
  const refresh = useCallback(async () => {
    setRefreshing(true)
    await loadLeaderboardData(currentType, currentLimit)
    setRefreshing(false)
  }, [currentType, currentLimit, loadLeaderboardData])

  // Set leaderboard type
  const setType = useCallback((type: LeaderboardType) => {
    setCurrentType(type)
  }, [])

  // Set leaderboard limit
  const setLimit = useCallback((limit: number) => {
    setCurrentLimit(limit)
  }, [])

  // Load data when type or limit changes
  useEffect(() => {
    loadLeaderboardData(currentType, currentLimit)
  }, [currentType, currentLimit, loadLeaderboardData])

  // Refresh user stats when wallet connection changes
  useEffect(() => {
    if (connected && publicKey) {
      const walletAddress = publicKey.toString()
      firebaseLeaderboardService.getUserLeaderboardStats(walletAddress)
        .then(setUserStats)
        .catch((err) => {
          console.error("Error loading user stats:", err)
        })
    } else {
      setUserStats(null)
    }
  }, [connected, publicKey])

  // Auto-refresh data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refresh()
    }, 60000) // Refresh every minute

    return () => clearInterval(interval)
  }, [refresh])

  return {
    // Leaderboard data
    leaderboard,
    stats,
    
    // User stats
    userStats,
    
    // Current settings
    currentType,
    currentLimit,
    
    // Loading states
    loading,
    refreshing,
    
    // Actions
    setType,
    setLimit,
    refresh,
    
    // Error handling
    error,
  }
}

// Helper hook for getting top referrers (legacy compatibility)
export function useTopReferrers(limit: number = 10) {
  const [topReferrers, setTopReferrers] = useState<Array<{
    walletAddress: string
    totalReferrals: number
    totalEarned: number
  }>>([])
  const [loading, setLoading] = useState(false)

  const loadTopReferrers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await firebaseLeaderboardService.getTopReferrers(limit)
      setTopReferrers(data)
    } catch (error) {
      console.error("Error loading top referrers:", error)
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    loadTopReferrers()
  }, [loadTopReferrers])

  return {
    topReferrers,
    loading,
    refresh: loadTopReferrers,
  }
}
