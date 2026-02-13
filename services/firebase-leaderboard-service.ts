import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  where,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { firebaseUserService } from "./firebase-user-service"
import type { UserProfile } from "@/types/firebase"

export interface LeaderboardEntry {
  rank: number
  walletAddress: string
  displayName: string
  totalReferrals: number
  totalEarned: number
  questsCompleted: number
  nftsMinted: number
  totalXP: number
  level: number
  score: number
  lastActive: Date
}

export interface LeaderboardStats {
  totalUsers: number
  totalReferrals: number
  totalRewards: number
  topReferrer: LeaderboardEntry | null
}

export type LeaderboardType = "referrals" | "earnings" | "quests" | "xp" | "overall"

export class FirebaseLeaderboardService {
  private readonly LEADERBOARD_COLLECTION = "leaderboard"
  private readonly CACHE_DURATION = 30 * 1000 // 30 seconds (for testing) // 5 minutes

  // Cache for leaderboard data
  private cache = new Map<string, { data: any; timestamp: number }>()

  // Rate limiting - prevent calls more frequent than every 30 seconds
  private lastCallTime = new Map<string, number>()
  private readonly MIN_CALL_INTERVAL = 30 * 1000 // 30 seconds

  /**
   * Get leaderboard data with caching and rate limiting
   */
  async getLeaderboard(
    type: LeaderboardType = "referrals",
    limitCount = 10
  ): Promise<LeaderboardEntry[]> {
    const cacheKey = `${type}-${limitCount}`
    const now = Date.now()

    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      console.log(`🏆 Returning cached ${type} leaderboard data`)
      return cached.data
    }

    // Check rate limiting
    const lastCall = this.lastCallTime.get(cacheKey) || 0
    if ((now - lastCall) < this.MIN_CALL_INTERVAL) {
      console.log(`🏆 Rate limited - returning cached data for ${type} leaderboard`)
      return cached?.data || []
    }

    // Update last call time
    this.lastCallTime.set(cacheKey, now)

    try {
      console.log(`🏆 Fetching fresh ${type} leaderboard data`)

      // Try Firebase first
      const data = await this.getLeaderboardFromFirebase(type, limitCount)

      // Cache the result
      this.cache.set(cacheKey, { data, timestamp: now })

      return data
    } catch (error) {
      console.error("Error getting leaderboard from Firebase, trying API fallback:", error)

      // Fallback to API endpoint
      try {
        const data = await this.getLeaderboardFromAPI(type, limitCount)

        // Cache the fallback result too
        this.cache.set(cacheKey, { data, timestamp: now })

        return data
      } catch (apiError) {
        console.error("Error getting leaderboard from API:", apiError)

        // Return cached data if available, even if expired
        return cached?.data || []
      }
    }
  }

  /**
   * Get leaderboard data from Firebase
   */
  private async getLeaderboardFromFirebase(
    type: LeaderboardType = "referrals",
    limitCount = 10
  ): Promise<LeaderboardEntry[]> {
   // For XP leaderboard, query userXP collection directly
if (type === "xp") {
  console.log(`🏆 XP leaderboard requested - querying userXP collection directly`)
  
  const userXPQuery = query(
    collection(db, "userXP"),
    orderBy("totalXP", "desc"),
    limit(limitCount)
  )
  
  const userXPSnapshot = await getDocs(userXPQuery)
  
  const leaderboard: LeaderboardEntry[] = userXPSnapshot.docs.map((doc, index) => {
    const data = doc.data()
    return {
      rank: index + 1,
      walletAddress: data.walletAddress,
      displayName: `User ${data.walletAddress?.slice(0, 8) || 'Unknown'}`,
      totalReferrals: 0,
      totalEarned: 0,
      questsCompleted: data.questsCompleted || 0,
      nftsMinted: 0,
      totalXP: data.totalXP || 0,
      level: data.level || 1,
      score: data.totalXP || 0,
      lastActive: data.lastActive?.toDate() || new Date(),
    }
  })
  
  console.log(`🏆 XP leaderboard: ${leaderboard.length} entries from userXP collection`)
  return leaderboard
}

    // For other leaderboard types, get ALL users first then sort in memory
    // This avoids Firebase orderBy issues with missing fields
    try {
      // Get all users without ordering (to avoid missing field issues)
      const usersQuery = query(
        collection(db, "users"),
        limit(Math.max(limitCount * 3, 100)) // Get more users to ensure we have enough data
      )

      const usersSnapshot = await getDocs(usersQuery)
      const allUsers: LeaderboardEntry[] = []

      usersSnapshot.docs.forEach((doc) => {
        const userData = doc.data() as UserProfile

        // Skip users without walletAddress (invalid documents)
        const walletAddress = userData.walletAddress || doc.id
        if (!walletAddress) {
          console.warn("Skipping user document without walletAddress:", doc.id)
          return
        }

        const entry: LeaderboardEntry = {
          rank: 0, // Will be set after sorting
          walletAddress: walletAddress,
          displayName: userData.displayName || `User ${walletAddress.slice(0, 8)}`,
          totalReferrals: userData.totalReferrals || 0,
          totalEarned: userData.totalEarned || 0,
          questsCompleted: userData.questsCompleted || 0,
          nftsMinted: userData.nftsMinted || 0,
          totalXP: 0, // Will be populated if needed
          level: 1, // Will be populated if needed
          score: this.calculateScore(userData, type),
          lastActive: userData.lastActive?.toDate() || new Date(),
        }

        allUsers.push(entry)
      })

      // Sort users by score in descending order
      allUsers.sort((a, b) => b.score - a.score)

      // Take only the requested number of users and set ranks
      const leaderboard = allUsers.slice(0, limitCount).map((entry, index) => ({
        ...entry,
        rank: index + 1
      }))

      return leaderboard

    } catch (error) {
      console.error("Error in Firebase leaderboard query:", error)
      // Fallback: return empty array
      return []
    }
  }

  /**
   * Get leaderboard data from API (fallback)
   */
  private async getLeaderboardFromAPI(
    type: LeaderboardType = "referrals",
    limitCount = 10
  ): Promise<LeaderboardEntry[]> {
    try {
      // For XP leaderboard, use the XP API endpoint
      if (type === "xp") {
        console.log(`🏆 Fetching XP leaderboard from API with limit: ${limitCount}`)

        // Add timeout to API call as well
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

        try {
          const response = await fetch(`/api/xp?action=get-leaderboard&limit=${limitCount}`, {
            signal: controller.signal
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            console.error(`🏆 XP API responded with status: ${response.status}`)
            const errorText = await response.text()
            console.error(`🏆 XP API error response:`, errorText)
            throw new Error(`XP API responded with status: ${response.status}`)
          }

          const data = await response.json()
          console.log(`🏆 XP API response:`, data)

          if (!data.success) {
            console.error(`🏆 XP API error:`, data.error)
            throw new Error(data.error || "XP API request failed")
          }

          // Convert XP data to LeaderboardEntry format
          const xpData = data.data || []
          console.log(`🏆 Raw XP data from API:`, xpData)

          const leaderboard: LeaderboardEntry[] = xpData.map((entry: any, index: number) => ({
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

          console.log(`🏆 XP API returned ${leaderboard.length} entries`)
          return leaderboard
        } catch (fetchError) {
          clearTimeout(timeoutId)
          throw fetchError
        }
      }

      // For other leaderboard types, use the general API
      const response = await fetch(`/api/leaderboard/all-users?type=${type}&limit=${limitCount}`)

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "API request failed")
      }

      return data.data.leaderboard || []
    } catch (error) {
      console.error(`🏆 API fallback error for ${type} leaderboard:`, error)
      return []
    }
  }

  /**
   * Get user's rank in leaderboard
   */
  async getUserRank(walletAddress: string, type: LeaderboardType = "referrals"): Promise<number> {
    try {
      const user = await firebaseUserService.getUserByWallet(walletAddress)
      if (!user) return 0

      const sortField = this.getSortField(type)
      const userScore = (user as any)[sortField] || 0

      // Count users with higher scores
      const higherScoreQuery = query(
        collection(db, "users"),
        where(sortField, ">", userScore)
      )

      const higherScoreSnapshot = await getDocs(higherScoreQuery)
      return higherScoreSnapshot.size + 1
    } catch (error) {
      console.error("Error getting user rank:", error)
      return 0
    }
  }

  /**
   * Get leaderboard statistics with caching
   */
  async getLeaderboardStats(): Promise<LeaderboardStats> {
    const cacheKey = "leaderboard-stats"
    const now = Date.now()

    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      console.log(`🏆 Returning cached leaderboard stats`)
      return cached.data
    }

    // Check rate limiting
    const lastCall = this.lastCallTime.get(cacheKey) || 0
    if ((now - lastCall) < this.MIN_CALL_INTERVAL) {
      console.log(`🏆 Rate limited - returning cached stats`)
      return cached?.data || { totalUsers: 0, totalReferrals: 0, totalRewards: 0, topReferrer: null }
    }

    // Update last call time
    this.lastCallTime.set(cacheKey, now)

    try {
      console.log(`🏆 Fetching fresh leaderboard stats`)

      // Try Firebase first
      const stats = await this.getLeaderboardStatsFromFirebase()

      // Cache the result
      this.cache.set(cacheKey, { data: stats, timestamp: now })

      return stats
    } catch (error) {
      console.error("Error getting leaderboard stats from Firebase, trying API fallback:", error)

      // Fallback to API endpoint
      try {
        const stats = await this.getLeaderboardStatsFromAPI()

        // Cache the fallback result too
        this.cache.set(cacheKey, { data: stats, timestamp: now })

        return stats
      } catch (apiError) {
        console.error("Error getting leaderboard stats from API:", apiError)

        // Return cached data if available, even if expired
        return cached?.data || {
          totalUsers: 0,
          totalReferrals: 0,
          totalRewards: 0,
          topReferrer: null,
        }
      }
    }
  }

  /**
   * Get leaderboard statistics from Firebase
   */
  private async getLeaderboardStatsFromFirebase(): Promise<LeaderboardStats> {
    // Get all users
    const usersQuery = query(collection(db, "users"))
    const usersSnapshot = await getDocs(usersQuery)

    let totalUsers = 0
    let totalReferrals = 0
    let totalRewards = 0
    let topReferrer: LeaderboardEntry | null = null
    let maxReferrals = 0

    usersSnapshot.docs.forEach((doc) => {
      const userData = doc.data() as UserProfile
      totalUsers++
      totalReferrals += userData.totalReferrals || 0
      totalRewards += userData.totalEarned || 0

      // Track top referrer (including those with 0 referrals)
      if ((userData.totalReferrals || 0) >= maxReferrals) {
        maxReferrals = userData.totalReferrals || 0
        topReferrer = {
          rank: 1,
          walletAddress: userData.walletAddress,
          displayName: userData.displayName || `User ${userData.walletAddress.slice(0, 8)}`,
          totalReferrals: userData.totalReferrals || 0,
          totalEarned: userData.totalEarned || 0,
          questsCompleted: userData.questsCompleted || 0,
          nftsMinted: userData.nftsMinted || 0,
          totalXP: 0,
          level: 1,
          score: userData.totalReferrals || 0,
          lastActive: userData.lastActive?.toDate() || new Date(),
        }
      }
    })

    return {
      totalUsers,
      totalReferrals,
      totalRewards,
      topReferrer,
    }
  }

  /**
   * Get leaderboard statistics from API (fallback)
   */
  private async getLeaderboardStatsFromAPI(): Promise<LeaderboardStats> {
    const response = await fetch('/api/leaderboard/all-users?type=referrals&limit=1')

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || "API request failed")
    }

    return data.data.stats || {
      totalUsers: 0,
      totalReferrals: 0,
      totalRewards: 0,
      topReferrer: null,
    }
  }

  /**
   * Get top referrers (legacy compatibility)
   */
  async getTopReferrers(limitCount = 10): Promise<Array<{
    walletAddress: string
    totalReferrals: number
    totalEarned: number
  }>> {
    try {
      const leaderboard = await this.getLeaderboard("referrals", limitCount)
      return leaderboard.map(entry => ({
        walletAddress: entry.walletAddress,
        totalReferrals: entry.totalReferrals,
        totalEarned: entry.totalEarned,
      }))
    } catch (error) {
      console.error("Error getting top referrers:", error)
      return []
    }
  }

  /**
   * Update user leaderboard position (called when user data changes)
   */
  async updateUserLeaderboardPosition(walletAddress: string): Promise<void> {
    try {
      const user = await firebaseUserService.getUserByWallet(walletAddress)
      if (!user) return

      // Calculate ranks for different categories
      const referralRank = await this.getUserRank(walletAddress, "referrals")
      const earningsRank = await this.getUserRank(walletAddress, "earnings")
      const questRank = await this.getUserRank(walletAddress, "quests")

      // Store leaderboard position data
      const leaderboardDoc = doc(db, this.LEADERBOARD_COLLECTION, walletAddress)
      await setDoc(leaderboardDoc, {
        walletAddress,
        referralRank,
        earningsRank,
        questRank,
        totalReferrals: user.totalReferrals || 0,
        totalEarned: user.totalEarned || 0,
        questsCompleted: user.questsCompleted || 0,
        lastUpdated: serverTimestamp(),
      }, { merge: true })

    } catch (error) {
      console.error("Error updating user leaderboard position:", error)
    }
  }

  /**
   * Get user's complete leaderboard stats
   */
  async getUserLeaderboardStats(walletAddress: string): Promise<{
    referralRank: number
    earningsRank: number
    questRank: number
    overallRank: number
    totalReferrals: number
    totalEarned: number
    questsCompleted: number
  }> {
    try {
      const user = await firebaseUserService.getUserByWallet(walletAddress)
      if (!user) {
        return {
          referralRank: 0,
          earningsRank: 0,
          questRank: 0,
          overallRank: 0,
          totalReferrals: 0,
          totalEarned: 0,
          questsCompleted: 0,
        }
      }

      const [referralRank, earningsRank, questRank, overallRank] = await Promise.all([
        this.getUserRank(walletAddress, "referrals"),
        this.getUserRank(walletAddress, "earnings"),
        this.getUserRank(walletAddress, "quests"),
        this.getUserRank(walletAddress, "overall"),
      ])

      return {
        referralRank,
        earningsRank,
        questRank,
        overallRank,
        totalReferrals: user.totalReferrals || 0,
        totalEarned: user.totalEarned || 0,
        questsCompleted: user.questsCompleted || 0,
      }
    } catch (error) {
      console.error("Error getting user leaderboard stats:", error)
      return {
        referralRank: 0,
        earningsRank: 0,
        questRank: 0,
        overallRank: 0,
        totalReferrals: 0,
        totalEarned: 0,
        questsCompleted: 0,
      }
    }
  }

  /**
   * Get sort field based on leaderboard type
   */
  private getSortField(type: LeaderboardType): string {
    switch (type) {
      case "referrals":
        return "totalReferrals"
      case "earnings":
        return "totalEarned"
      case "quests":
        return "questsCompleted"
      case "xp":
        return "totalXP" // This won't be used since XP queries userXP collection
      case "overall":
        return "totalEarned" // Use earnings as overall score
      default:
        return "totalReferrals"
    }
  }

  /**
   * Calculate score based on leaderboard type
   */
  private calculateScore(user: UserProfile, type: LeaderboardType): number {
    switch (type) {
      case "referrals":
        return user.totalReferrals || 0
      case "earnings":
        return user.totalEarned || 0
      case "quests":
        return user.questsCompleted || 0
      case "xp":
        return 0 // XP score is handled separately in the XP query
      case "overall":
        // Weighted score: referrals * 10 + earnings + quests * 2
        return (user.totalReferrals || 0) * 10 + (user.totalEarned || 0) + (user.questsCompleted || 0) * 2
      default:
        return user.totalReferrals || 0
    }
  }
}

// Create singleton instance
export const firebaseLeaderboardService = new FirebaseLeaderboardService()
