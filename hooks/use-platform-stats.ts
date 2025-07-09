import { useState, useEffect } from "react"

export interface PlatformStats {
  nftsMinted: number
  usdcEarned: number
  activeUsers: number
  totalUsers: number
  totalReferrals: number
  treasuryEarnings: number
  referralRewards: number
}

export function usePlatformStats() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/platform-stats")
      const data = await response.json()

      if (data.success) {
        setStats(data.data)
      } else {
        setError(data.error || "Failed to fetch platform stats")
      }
    } catch (err) {
      console.error("Error fetching platform stats:", err)
      setError("Failed to fetch platform stats")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    
    return () => clearInterval(interval)
  }, [])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  }
}
