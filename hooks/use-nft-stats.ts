import { useState, useEffect, useCallback } from "react"

export interface NFTStats {
  totalMints: number
  totalRevenue: number
  averageMintCost: number
  uniqueMinters: number
  timeframe: string
  mintsByDay: { [key: string]: number }
  revenueByDay: { [key: string]: number }
  topMinters: Array<{ wallet: string; count: number }>
  recentMints: Array<{
    mintAddress: string
    ownerWallet: string
    mintCost: number
    mintedAt: any
    transactionSignature: string
  }>
}

export interface NFTRecord {
  id: string
  mintAddress: string
  ownerWallet: string
  name: string
  symbol: string
  mintCost: number
  mintedAt: any
  transactionSignature: string
  isVerified: boolean
  attributes: Array<{ trait_type: string; value: string }>
}

export interface UseNFTStatsReturn {
  stats: NFTStats | null
  nfts: NFTRecord[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  setTimeframe: (timeframe: string) => void
  setDetailed: (detailed: boolean) => void
}

export function useNFTStats(
  initialTimeframe: string = "all",
  initialDetailed: boolean = false
): UseNFTStatsReturn {
  const [stats, setStats] = useState<NFTStats | null>(null)
  const [nfts, setNfts] = useState<NFTRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState(initialTimeframe)
  const [detailed, setDetailed] = useState(initialDetailed)

  const fetchNFTStats = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        timeframe,
        detailed: detailed.toString()
      })

      const response = await fetch(`/api/nfts/stats?${params}`)
      const result = await response.json()

      if (result.success) {
        setStats(result.stats)
        if (result.nfts) {
          setNfts(result.nfts)
        }
      } else {
        throw new Error(result.error || "Failed to fetch NFT stats")
      }
    } catch (err) {
      console.error("Error fetching NFT stats:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch NFT stats")
    } finally {
      setLoading(false)
    }
  }, [timeframe, detailed])

  const refresh = useCallback(async () => {
    await fetchNFTStats()
  }, [fetchNFTStats])

  const handleSetTimeframe = useCallback((newTimeframe: string) => {
    setTimeframe(newTimeframe)
  }, [])

  const handleSetDetailed = useCallback((newDetailed: boolean) => {
    setDetailed(newDetailed)
  }, [])

  // Load data when timeframe or detailed changes
  useEffect(() => {
    fetchNFTStats()
  }, [fetchNFTStats])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNFTStats()
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchNFTStats])

  return {
    stats,
    nfts,
    loading,
    error,
    refresh,
    setTimeframe: handleSetTimeframe,
    setDetailed: handleSetDetailed
  }
}

// Helper hook for simple stats display
export function useSimpleNFTStats() {
  const { stats, loading, error, refresh } = useNFTStats("all", false)

  return {
    totalMints: stats?.totalMints || 0,
    totalRevenue: stats?.totalRevenue || 0,
    uniqueMinters: stats?.uniqueMinters || 0,
    loading,
    error,
    refresh
  }
}
