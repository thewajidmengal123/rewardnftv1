"use client"

import { useState, useEffect, useCallback } from "react"
import type { UserProfile } from "@/types/firebase"

interface ReferralStats {
  totalReferrals: number
  completedReferrals: number
  totalEarned: number
  pendingRewards: number
}

interface ReferralHistory {
  id: string
  referredWallet: string
  status: "pending" | "completed" | "rewarded"
  rewardAmount: number
  createdAt: any
  completedAt?: any
  rewardedAt?: any
  referredUser?: {
    displayName: string
    nftsMinted: number
  }
}

interface ReferredUser {
  walletAddress: string
  displayName: string
  nftsMinted: number
  totalEarned: number
  createdAt: any
  lastActive: any
}

interface UserReferralData {
  user: UserProfile | null
  stats: ReferralStats
  history: ReferralHistory[]
  referredUsers: ReferredUser[]
  summary: {
    totalReferrals: number
    completedReferrals: number
    totalEarned: number
    pendingRewards: number
    referredUsersCount: number
    averageEarningPerReferral: number
  }
}

export function useUserReferrals(walletAddress: string | null) {
  const [data, setData] = useState<UserReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchUserReferrals = useCallback(async () => {
    if (!walletAddress) {
      setData(null)
      setLoading(false)
      return
    }

    try {
      setError(null)
      const response = await fetch(`/api/users/referrals?wallet=${encodeURIComponent(walletAddress)}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
      } else {
        throw new Error(result.error || "Failed to fetch user referrals")
      }
    } catch (err) {
      console.error("Error fetching user referrals:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch user referrals")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [walletAddress])

  const refresh = useCallback(async () => {
    setRefreshing(true)
    await fetchUserReferrals()
  }, [fetchUserReferrals])

  const syncUserData = useCallback(async () => {
    if (!walletAddress) return

    try {
      setRefreshing(true)
      const response = await fetch("/api/users/referrals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "sync-user-data",
          walletAddress,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        // Refresh data after sync
        await fetchUserReferrals()
      } else {
        throw new Error(result.error || "Failed to sync user data")
      }
    } catch (err) {
      console.error("Error syncing user data:", err)
      setError(err instanceof Error ? err.message : "Failed to sync user data")
    }
  }, [walletAddress, fetchUserReferrals])

  const updateDisplayName = useCallback(async (displayName: string) => {
    if (!walletAddress) return false

    try {
      const response = await fetch("/api/users/referrals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update-display-name",
          walletAddress,
          data: { displayName },
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        // Refresh data after update
        await fetchUserReferrals()
        return true
      } else {
        throw new Error(result.error || "Failed to update display name")
      }
    } catch (err) {
      console.error("Error updating display name:", err)
      setError(err instanceof Error ? err.message : "Failed to update display name")
      return false
    }
  }, [walletAddress, fetchUserReferrals])

  const getReferralLink = useCallback(async () => {
    if (!walletAddress) return null

    try {
      const response = await fetch("/api/users/referrals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "get-referral-link",
          walletAddress,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        return {
          referralCode: result.referralCode,
          referralLink: result.referralLink,
        }
      } else {
        throw new Error(result.error || "Failed to get referral link")
      }
    } catch (err) {
      console.error("Error getting referral link:", err)
      setError(err instanceof Error ? err.message : "Failed to get referral link")
      return null
    }
  }, [walletAddress])

  useEffect(() => {
    fetchUserReferrals()
  }, [fetchUserReferrals])

  return {
    data,
    loading,
    error,
    refreshing,
    refresh,
    syncUserData,
    updateDisplayName,
    getReferralLink,
    // Convenience getters
    user: data?.user || null,
    stats: data?.stats || {
      totalReferrals: 0,
      completedReferrals: 0,
      totalEarned: 0,
      pendingRewards: 0,
    },
    history: data?.history || [],
    referredUsers: data?.referredUsers || [],
    summary: data?.summary || {
      totalReferrals: 0,
      completedReferrals: 0,
      totalEarned: 0,
      pendingRewards: 0,
      referredUsersCount: 0,
      averageEarningPerReferral: 0,
    },
  }
}
