import { getReferralService } from "./referral-service"
import { getQuestService } from "./quest-service"

// Leaderboard entry interface
export interface LeaderboardEntry {
  walletAddress: string
  score: number
  rank: number
  referrals: number
  questsCompleted: number
  totalEarned: number
}

// Leaderboard type
export type LeaderboardType = "referrals" | "quests" | "earnings"

// Leaderboard Service class
export class LeaderboardService {
  private referralService = getReferralService()
  private questService = getQuestService()

  constructor() {}

  // Get leaderboard data
  async getLeaderboard(type: LeaderboardType = "earnings", limit = 10): Promise<LeaderboardEntry[]> {
    try {
      // Get top referrers
      const topReferrers = this.referralService.getTopReferrers(50)

      // Enhance with quest data
      const leaderboardData = topReferrers.map((referrer) => {
        const questStats = this.questService.getUserQuestStats(referrer.walletAddress)

        let score: number

        switch (type) {
          case "referrals":
            score = referrer.totalReferrals
            break
          case "quests":
            score = questStats.totalCompleted
            break
          case "earnings":
          default:
            score = referrer.totalEarned + questStats.totalEarned
            break
        }

        return {
          walletAddress: referrer.walletAddress,
          score,
          rank: 0, // Will be calculated after sorting
          referrals: referrer.totalReferrals,
          questsCompleted: questStats.totalCompleted,
          totalEarned: referrer.totalEarned + questStats.totalEarned,
        }
      })

      // Sort by score
      const sortedData = leaderboardData.sort((a, b) => b.score - a.score)

      // Assign ranks
      sortedData.forEach((entry, index) => {
        entry.rank = index + 1
      })

      // Return limited results
      return sortedData.slice(0, limit)
    } catch (error) {
      console.error("Error getting leaderboard data:", error)
      return []
    }
  }

  // Get user rank
  async getUserRank(walletAddress: string, type: LeaderboardType = "earnings"): Promise<number> {
    try {
      // Get full leaderboard
      const leaderboard = await this.getLeaderboard(type, 1000)

      // Find user entry
      const userEntry = leaderboard.find((entry) => entry.walletAddress === walletAddress)

      return userEntry?.rank || 0
    } catch (error) {
      console.error("Error getting user rank:", error)
      return 0
    }
  }

  // Get user stats for leaderboard
  async getUserStats(walletAddress: string): Promise<{
    referrals: number
    questsCompleted: number
    totalEarned: number
    referralRank: number
    questRank: number
    earningsRank: number
  }> {
    try {
      const referralData = this.referralService.getReferralData(walletAddress)
      const questStats = this.questService.getUserQuestStats(walletAddress)

      const referralRank = await this.getUserRank(walletAddress, "referrals")
      const questRank = await this.getUserRank(walletAddress, "quests")
      const earningsRank = await this.getUserRank(walletAddress, "earnings")

      return {
        referrals: referralData?.totalReferrals || 0,
        questsCompleted: questStats.totalCompleted,
        totalEarned: (referralData?.totalEarned || 0) + questStats.totalEarned,
        referralRank,
        questRank,
        earningsRank,
      }
    } catch (error) {
      console.error("Error getting user stats:", error)
      return {
        referrals: 0,
        questsCompleted: 0,
        totalEarned: 0,
        referralRank: 0,
        questRank: 0,
        earningsRank: 0,
      }
    }
  }
}

// Create a singleton instance
let leaderboardServiceInstance: LeaderboardService | null = null

// Get leaderboard service instance
export function getLeaderboardService(): LeaderboardService {
  if (!leaderboardServiceInstance) {
    leaderboardServiceInstance = new LeaderboardService()
  }
  return leaderboardServiceInstance
}
