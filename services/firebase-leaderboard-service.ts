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
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  /**
   * Get leaderboard data
   */
  async getLeaderboard(
    type: LeaderboardType = "referrals",
    limitCount = 10
  ): Promise<LeaderboardEntry[]> {
    try {
      // For XP leaderboard, query the userXP collection directly
      if (type === "xp") {
        const xpQuery = query(
          collection(db, "userXP"),
          orderBy("totalXP", "desc"),
          limit(limitCount)
        )

        const xpSnapshot = await getDocs(xpQuery)
        const leaderboard: LeaderboardEntry[] = []

        for (let i = 0; i < xpSnapshot.docs.length; i++) {
          const xpDoc = xpSnapshot.docs[i]
          const xpData = xpDoc.data()

          // Get user profile data
          const userDoc = await getDoc(doc(db, "users", xpData.walletAddress))
          const userData = userDoc.exists() ? userDoc.data() as UserProfile : null

          const entry: LeaderboardEntry = {
            rank: i + 1,
            walletAddress: xpData.walletAddress,
            displayName: userData?.displayName || `User ${xpData.walletAddress.slice(0, 8)}`,
            totalReferrals: userData?.totalReferrals || 0,
            totalEarned: userData?.totalEarned || 0,
            questsCompleted: userData?.questsCompleted || 0,
            nftsMinted: userData?.nftsMinted || 0,
            totalXP: xpData.totalXP || 0,
            level: xpData.level || 1,
            score: xpData.totalXP || 0,
            lastActive: userData?.lastActive?.toDate() || new Date(),
          }

          leaderboard.push(entry)
        }

        return leaderboard
      }

      // For other leaderboard types, use the users collection
      const sortField = this.getSortField(type)

      const usersQuery = query(
        collection(db, "users"),
        where(sortField, ">", 0),
        orderBy(sortField, "desc"),
        limit(limitCount)
      )

      const usersSnapshot = await getDocs(usersQuery)
      const leaderboard: LeaderboardEntry[] = []

      usersSnapshot.docs.forEach((doc, index) => {
        const userData = doc.data() as UserProfile

        const entry: LeaderboardEntry = {
          rank: index + 1,
          walletAddress: userData.walletAddress,
          displayName: userData.displayName || `User ${userData.walletAddress.slice(0, 8)}`,
          totalReferrals: userData.totalReferrals || 0,
          totalEarned: userData.totalEarned || 0,
          questsCompleted: userData.questsCompleted || 0,
          nftsMinted: userData.nftsMinted || 0,
          totalXP: 0, // Will be populated if needed
          level: 1, // Will be populated if needed
          score: this.calculateScore(userData, type),
          lastActive: userData.lastActive?.toDate() || new Date(),
        }

        leaderboard.push(entry)
      })

      return leaderboard
    } catch (error) {
      console.error("Error getting leaderboard:", error)
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
   * Get leaderboard statistics
   */
  async getLeaderboardStats(): Promise<LeaderboardStats> {
    try {
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

        // Track top referrer
        if ((userData.totalReferrals || 0) > maxReferrals) {
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
    } catch (error) {
      console.error("Error getting leaderboard stats:", error)
      return {
        totalUsers: 0,
        totalReferrals: 0,
        totalRewards: 0,
        topReferrer: null,
      }
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
