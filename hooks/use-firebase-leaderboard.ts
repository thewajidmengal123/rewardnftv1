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
  initialLimit: number = 10,
  autoRefresh: boolean = false,
  refreshInterval: number = 300000 // 5 minutes default
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

  // Load leaderboard data - optimized to prevent excessive calls
  const loadLeaderboardData = useCallback(async (type: LeaderboardType, limit: number) => {
    // Prevent multiple simultaneous loads
    if (loading || refreshing) return

    setLoading(true)
    setError(null)

    try {
      console.log(`🏆 Loading ${type} leaderboard data...`)

      // For XP leaderboard, use API directly to avoid Firebase timeout issues
      if (type === "xp") {
        try {
          console.log(`🏆 Loading XP leaderboard via API...`)
          const response = await fetch(`/api/xp?action=get-leaderboard&limit=${limit}`)

          if (response.ok) {
            const data = await response.json()
            if (data.success) {
              // Convert XP data to LeaderboardEntry format
              const xpData = data.data || []
              const leaderboardData = xpData.map((entry: any, index: number) => ({
                rank: index + 1,
                walletAddress: entry.walletAddress,
                displayName: entry.displayName || `User ${entry.walletAddress.slice(0, 8)}`,
                totalReferrals: 0,
                totalEarned: 0,
                questsCompleted: entry.questsCompleted || 0,
                nftsMinted: 0,
                totalXP: entry.totalXP || 0,
                level: entry.level || 1,
                score: entry.totalXP || 0,
                lastActive: entry.lastActive ? new Date(entry.lastActive) : new Date(),
              }))

              setLeaderboard(leaderboardData)
              console.log(`🏆 XP leaderboard loaded successfully: ${leaderboardData.length} entries`)
            } else {
              console.warn("XP API returned unsuccessful response:", data)
              setLeaderboard([])
            }
          } else {
            console.warn("XP API request failed:", response.status)
            setLeaderboard([])
          }
        } catch (xpError) {
          console.error("XP API error:", xpError)
          setLeaderboard([])
        }

        // Skip stats for XP leaderboard to avoid additional complexity
        setStats(null)
      } else {
        // For other leaderboard types, use the Firebase service
        const leaderboardData = await firebaseLeaderboardService.getLeaderboard(type, limit)
        setLeaderboard(leaderboardData)

        // Load stats separately and don't fail if it times out
        try {
          const statsData = await firebaseLeaderboardService.getLeaderboardStats()
          setStats(statsData)
        } catch (statsError) {
          console.warn("Stats loading failed, continuing without stats:", statsError)
          setStats(null)
        }
      }

      // Load user stats if wallet is connected - but don't trigger reload on every call
      if (connected && publicKey && !userStats) {
        try {
          const walletAddress = publicKey.toString()
          const userStatsData = await firebaseLeaderboardService.getUserLeaderboardStats(walletAddress)
          setUserStats(userStatsData)
        } catch (userStatsError) {
          console.warn("Failed to load user stats:", userStatsError)
          // Don't fail the entire load for user stats
        }
      } else if (!connected) {
        setUserStats(null)
      }
    } catch (err) {
      console.error("Error loading leaderboard data:", err)
      setError(err instanceof Error ? err.message : "Failed to load leaderboard data")

      // Don't clear existing data on error, just show error state
      if (leaderboard.length === 0) {
        setLeaderboard([])
        setStats(null)
      }
    } finally {
      setLoading(false)
    }
  }, [connected, publicKey, loading, refreshing]) // Removed leaderboard.length dependency

  // Refresh data
  const refresh = useCallback(async () => {
    // Prevent multiple simultaneous refreshes
    if (refreshing || loading) return

    setRefreshing(true)
    try {
      await loadLeaderboardData(currentType, currentLimit)
    } finally {
      setRefreshing(false)
    }
  }, [currentType, currentLimit, loadLeaderboardData, refreshing, loading])

  // Set leaderboard type
  const setType = useCallback((type: LeaderboardType) => {
    setCurrentType(type)
  }, [])

  // Set leaderboard limit
  const setLimit = useCallback((limit: number) => {
    setCurrentLimit(limit)
  }, [])

  // Load data when type or limit changes - but only once per change
  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      if (isMounted) {
        await loadLeaderboardData(currentType, currentLimit)
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [currentType, currentLimit]) // Removed loadLeaderboardData dependency to prevent loops

  // Load user stats only when wallet connection changes - not on every render
  useEffect(() => {
    let isMounted = true

    if (connected && publicKey) {
      const walletAddress = publicKey.toString()
      firebaseLeaderboardService.getUserLeaderboardStats(walletAddress)
        .then((stats) => {
          if (isMounted) {
            setUserStats(stats)
          }
        })
        .catch((err) => {
          if (isMounted) {
            console.error("Error loading user stats:", err)
          }
        })
    } else if (isMounted) {
      setUserStats(null)
    }

    return () => {
      isMounted = false
    }
  }, [connected, publicKey?.toString()]) // Use toString() to prevent object reference changes

  // Auto-refresh data periodically (only if enabled and not already loading)
  useEffect(() => {
    if (!autoRefresh || loading || refreshing) return

    const interval = setInterval(() => {
      // Only refresh if not currently loading and has been some time since last refresh
      if (!loading && !refreshing) {
        refresh()
      }
    }, Math.max(refreshInterval, 60000)) // Minimum 1 minute between refreshes

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, loading, refreshing]) // Removed refresh dependency to prevent loops

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
