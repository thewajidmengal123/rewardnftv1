import { getTopReferrers } from "./referral"
import { getUserQuestStats } from "./quests"
import { getAirdropsByStatus } from "./airdrop"

// Platform metrics interface
export interface PlatformMetrics {
  totalUsers: number
  totalMints: number
  totalReferrals: number
  totalQuestsCompleted: number
  totalUsdcEarned: number
  totalUsdcCollected: number
  dailyActiveUsers: number
  weeklyActiveUsers: number
  conversionRate: number
  retentionRate: number
}

// User activity interface
export interface UserActivity {
  date: string
  mints: number
  referrals: number
  questsCompleted: number
  usdcEarned: number
  activeUsers: number
}

// Mock data for platform metrics (in a real app, this would come from a database)
const platformMetrics: PlatformMetrics = {
  totalUsers: 523,
  totalMints: 1247,
  totalReferrals: 856,
  totalQuestsCompleted: 2543,
  totalUsdcEarned: 5280,
  totalUsdcCollected: 12470,
  dailyActiveUsers: 128,
  weeklyActiveUsers: 342,
  conversionRate: 0.68,
  retentionRate: 0.72,
}

// Mock data for user activity over time (in a real app, this would come from a database)
const userActivityData: UserActivity[] = [
  {
    date: "2023-05-01",
    mints: 42,
    referrals: 28,
    questsCompleted: 86,
    usdcEarned: 178,
    activeUsers: 98,
  },
  {
    date: "2023-05-02",
    mints: 38,
    referrals: 32,
    questsCompleted: 92,
    usdcEarned: 186,
    activeUsers: 105,
  },
  {
    date: "2023-05-03",
    mints: 45,
    referrals: 36,
    questsCompleted: 78,
    usdcEarned: 192,
    activeUsers: 112,
  },
  {
    date: "2023-05-04",
    mints: 52,
    referrals: 41,
    questsCompleted: 104,
    usdcEarned: 215,
    activeUsers: 118,
  },
  {
    date: "2023-05-05",
    mints: 48,
    referrals: 38,
    questsCompleted: 96,
    usdcEarned: 202,
    activeUsers: 110,
  },
  {
    date: "2023-05-06",
    mints: 56,
    referrals: 45,
    questsCompleted: 112,
    usdcEarned: 228,
    activeUsers: 125,
  },
  {
    date: "2023-05-07",
    mints: 62,
    referrals: 52,
    questsCompleted: 124,
    usdcEarned: 245,
    activeUsers: 132,
  },
  {
    date: "2023-05-08",
    mints: 58,
    referrals: 48,
    questsCompleted: 118,
    usdcEarned: 232,
    activeUsers: 128,
  },
  {
    date: "2023-05-09",
    mints: 64,
    referrals: 54,
    questsCompleted: 126,
    usdcEarned: 252,
    activeUsers: 135,
  },
  {
    date: "2023-05-10",
    mints: 68,
    referrals: 56,
    questsCompleted: 132,
    usdcEarned: 264,
    activeUsers: 142,
  },
  {
    date: "2023-05-11",
    mints: 72,
    referrals: 62,
    questsCompleted: 138,
    usdcEarned: 276,
    activeUsers: 148,
  },
  {
    date: "2023-05-12",
    mints: 76,
    referrals: 64,
    questsCompleted: 142,
    usdcEarned: 284,
    activeUsers: 152,
  },
  {
    date: "2023-05-13",
    mints: 82,
    referrals: 68,
    questsCompleted: 148,
    usdcEarned: 296,
    activeUsers: 158,
  },
  {
    date: "2023-05-14",
    mints: 78,
    referrals: 65,
    questsCompleted: 144,
    usdcEarned: 288,
    activeUsers: 154,
  },
]

// Get platform metrics
export function getPlatformMetrics(): PlatformMetrics {
  return platformMetrics
}

// Get user activity data
export function getUserActivityData(days = 14): UserActivity[] {
  return userActivityData.slice(-days)
}

// Get top performing users
export function getTopPerformingUsers(limit = 10): Array<{
  walletAddress: string
  totalReferrals: number
  totalEarned: number
  questsCompleted: number
}> {
  // Get top referrers
  const topReferrers = getTopReferrers(limit)

  // Enhance with quest data
  return topReferrers.map((referrer) => {
    const questStats = getUserQuestStats(referrer.walletAddress)
    return {
      walletAddress: referrer.walletAddress,
      totalReferrals: referrer.totalReferrals,
      totalEarned: referrer.totalEarned,
      questsCompleted: questStats.totalCompleted,
    }
  })
}

// Get airdrop statistics
export function getAirdropStatistics(): {
  totalAirdrops: number
  completedAirdrops: number
  pendingAirdrops: number
  totalRecipients: number
  totalAmountAirdropped: number
} {
  const completedAirdrops = getAirdropsByStatus("completed")
  const scheduledAirdrops = getAirdropsByStatus("scheduled")
  const inProgressAirdrops = getAirdropsByStatus("in_progress")

  const totalRecipients = completedAirdrops.reduce((sum, airdrop) => sum + airdrop.recipients.length, 0)
  const totalAmountAirdropped = completedAirdrops.reduce(
    (sum, airdrop) => sum + airdrop.amount * airdrop.recipients.length,
    0,
  )

  return {
    totalAirdrops: completedAirdrops.length + scheduledAirdrops.length + inProgressAirdrops.length,
    completedAirdrops: completedAirdrops.length,
    pendingAirdrops: scheduledAirdrops.length + inProgressAirdrops.length,
    totalRecipients,
    totalAmountAirdropped,
  }
}

// Get quest completion statistics
export function getQuestCompletionStats(): {
  totalQuests: number
  dailyCompleted: number
  weeklyCompleted: number
  specialCompleted: number
  completionRate: number
} {
  // In a real app, this would query a database
  return {
    totalQuests: 2543,
    dailyCompleted: 1842,
    weeklyCompleted: 586,
    specialCompleted: 115,
    completionRate: 0.76,
  }
}

// Get referral conversion statistics
export function getReferralConversionStats(): {
  totalReferrals: number
  successfulReferrals: number
  pendingReferrals: number
  conversionRate: number
  averageEarningsPerReferrer: number
} {
  // In a real app, this would query a database
  return {
    totalReferrals: 856,
    successfulReferrals: 582,
    pendingReferrals: 274,
    conversionRate: 0.68,
    averageEarningsPerReferrer: 18.5,
  }
}
