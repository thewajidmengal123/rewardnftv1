import { type Connection, PublicKey } from "@solana/web3.js"
import { createTokenTransferTransaction } from "./token"
import { DEFAULT_USDC_TOKEN_ADDRESS } from "@/config/solana"

// Quest difficulty levels
export type QuestDifficulty = "Easy" | "Medium" | "Hard"

// Quest types
export type QuestType = "daily" | "weekly" | "special" | "one-time"

// Quest status
export type QuestStatus = "not_started" | "in_progress" | "completed" | "claimed"

// Quest interface
export interface Quest {
  id: string
  title: string
  description: string
  type: QuestType
  difficulty: QuestDifficulty
  reward: {
    amount: number
    currency: "USDC" | "XP"
  }
  requirements: {
    type: "referrals" | "daily_check_in" | "social_share" | "mint" | "game_score" | "custom"
    count: number
    data?: any
  }
  expiresAt?: number // Timestamp when the quest expires (for time-limited quests)
}

// User quest progress interface
export interface QuestProgress {
  questId: string
  status: QuestStatus
  progress: number
  completedAt?: number
  claimedAt?: number
  transactionId?: string
}

// User quests data interface
export interface UserQuestsData {
  walletAddress: string
  quests: QuestProgress[]
  totalEarned: number
  totalCompleted: number
}

// In-memory store for quests (in a real app, this would be in a database)
const quests: Record<string, Quest> = {
  "daily-check-in": {
    id: "daily-check-in",
    title: "Daily Check-in",
    description: "Check in daily to earn points and USDC rewards.",
    type: "daily",
    difficulty: "Easy",
    reward: {
      amount: 0.5,
      currency: "USDC",
    },
    requirements: {
      type: "daily_check_in",
      count: 1,
    },
    expiresAt: getEndOfDay(),
  },
  "social-share": {
    id: "social-share",
    title: "Share on Twitter",
    description: "Share your NFT or referral link on Twitter.",
    type: "daily",
    difficulty: "Easy",
    reward: {
      amount: 1,
      currency: "USDC",
    },
    requirements: {
      type: "social_share",
      count: 1,
      data: {
        platform: "twitter",
      },
    },
    expiresAt: getEndOfDay(),
  },
  "refer-3-friends": {
    id: "refer-3-friends",
    title: "Refer 3 Friends",
    description: "Refer 3 friends who mint an NFT.",
    type: "weekly",
    difficulty: "Medium",
    reward: {
      amount: 5,
      currency: "USDC",
    },
    requirements: {
      type: "referrals",
      count: 3,
    },
    expiresAt: getEndOfWeek(),
  },
  "complete-5-daily": {
    id: "complete-5-daily",
    title: "Complete 5 Daily Quests",
    description: "Complete 5 daily quests this week.",
    type: "weekly",
    difficulty: "Medium",
    reward: {
      amount: 3,
      currency: "USDC",
    },
    requirements: {
      type: "custom",
      count: 5,
      data: {
        questType: "daily",
      },
    },
    expiresAt: getEndOfWeek(),
  },
  "top-10-referrers": {
    id: "top-10-referrers",
    title: "Top 10 Referrers",
    description: "End the month in the top 10 referrers on the leaderboard.",
    type: "special",
    difficulty: "Hard",
    reward: {
      amount: 25,
      currency: "USDC",
    },
    requirements: {
      type: "custom",
      count: 1,
      data: {
        leaderboardPosition: 10,
      },
    },
    expiresAt: getEndOfMonth(),
  },
  "refer-10-friends": {
    id: "refer-10-friends",
    title: "Refer 10 Friends",
    description: "Refer a total of 10 friends who mint an NFT.",
    type: "special",
    difficulty: "Hard",
    reward: {
      amount: 15,
      currency: "USDC",
    },
    requirements: {
      type: "referrals",
      count: 10,
    },
  },
  "mint-nft": {
    id: "mint-nft",
    title: "Mint Your First NFT",
    description: "Mint your first Reward NFT.",
    type: "one-time",
    difficulty: "Easy",
    reward: {
      amount: 2,
      currency: "USDC",
    },
    requirements: {
      type: "mint",
      count: 1,
    },
  },
  "game-high-score": {
    id: "game-high-score",
    title: "Achieve High Score",
    description: "Score 1000+ points in the post-mint game.",
    type: "weekly",
    difficulty: "Medium",
    reward: {
      amount: 3,
      currency: "USDC",
    },
    requirements: {
      type: "game_score",
      count: 1000,
    },
    expiresAt: getEndOfWeek(),
  },
}

// In-memory store for user quest progress (in a real app, this would be in a database)
const userQuestsStore: Record<string, UserQuestsData> = {}

// Helper function to get end of day timestamp
function getEndOfDay(): number {
  const date = new Date()
  date.setHours(23, 59, 59, 999)
  return date.getTime()
}

// Helper function to get end of week timestamp
function getEndOfWeek(): number {
  const date = new Date()
  const day = date.getDay()
  const diff = day === 0 ? 6 : day - 1 // Adjust for Sunday
  date.setDate(date.getDate() - diff + 7) // Next Monday
  date.setHours(23, 59, 59, 999)
  return date.getTime()
}

// Helper function to get end of month timestamp
function getEndOfMonth(): number {
  const date = new Date()
  date.setMonth(date.getMonth() + 1)
  date.setDate(0) // Last day of current month
  date.setHours(23, 59, 59, 999)
  return date.getTime()
}

// Get all available quests
export function getAllQuests(): Quest[] {
  return Object.values(quests)
}

// Get quests by type
export function getQuestsByType(type: QuestType): Quest[] {
  return Object.values(quests).filter((quest) => quest.type === type)
}

// Get quest by ID
export function getQuestById(questId: string): Quest | null {
  return quests[questId] || null
}

// Initialize user quests data
export function initializeUserQuests(walletAddress: string): UserQuestsData {
  if (userQuestsStore[walletAddress]) {
    return userQuestsStore[walletAddress]
  }

  const userData: UserQuestsData = {
    walletAddress,
    quests: [],
    totalEarned: 0,
    totalCompleted: 0,
  }

  // Initialize progress for all quests
  Object.values(quests).forEach((quest) => {
    userData.quests.push({
      questId: quest.id,
      status: "not_started",
      progress: 0,
    })
  })

  userQuestsStore[walletAddress] = userData
  return userData
}

// Get user quests data
export function getUserQuestsData(walletAddress: string): UserQuestsData | null {
  return userQuestsStore[walletAddress] || null
}

// Update quest progress
export function updateQuestProgress(walletAddress: string, questId: string, progress: number): QuestProgress | null {
  const userData = getUserQuestsData(walletAddress) || initializeUserQuests(walletAddress)
  const questProgress = userData.quests.find((q) => q.questId === questId)

  if (!questProgress) {
    return null
  }

  const quest = getQuestById(questId)
  if (!quest) {
    return null
  }

  // Update progress
  questProgress.progress = progress

  // Check if quest is completed
  if (
    progress >= quest.requirements.count &&
    questProgress.status !== "completed" &&
    questProgress.status !== "claimed"
  ) {
    questProgress.status = "completed"
    questProgress.completedAt = Date.now()
    userData.totalCompleted += 1
  } else if (progress < quest.requirements.count) {
    questProgress.status = progress > 0 ? "in_progress" : "not_started"
  }

  return questProgress
}

// Complete a quest
export function completeQuest(walletAddress: string, questId: string): QuestProgress | null {
  const userData = getUserQuestsData(walletAddress) || initializeUserQuests(walletAddress)
  const questProgress = userData.quests.find((q) => q.questId === questId)

  if (!questProgress) {
    return null
  }

  const quest = getQuestById(questId)
  if (!quest) {
    return null
  }

  // Mark as completed
  questProgress.status = "completed"
  questProgress.progress = quest.requirements.count
  questProgress.completedAt = Date.now()
  userData.totalCompleted += 1

  return questProgress
}

// Claim quest reward
export async function claimQuestReward(
  connection: Connection,
  platformWallet: PublicKey,
  walletAddress: string,
  questId: string,
): Promise<string | null> {
  const userData = getUserQuestsData(walletAddress) || initializeUserQuests(walletAddress)
  const questProgress = userData.quests.find((q) => q.questId === questId)

  if (!questProgress || questProgress.status !== "completed") {
    return null
  }

  const quest = getQuestById(questId)
  if (!quest) {
    return null
  }

  try {
    // Only process USDC rewards
    if (quest.reward.currency === "USDC" && quest.reward.amount > 0) {
      const userWallet = new PublicKey(walletAddress)

      // Create a transaction to transfer USDC from platform wallet to user
      const transaction = await createTokenTransferTransaction(
        connection,
        platformWallet,
        userWallet,
        DEFAULT_USDC_TOKEN_ADDRESS,
        quest.reward.amount,
      )

      // In a real implementation, this would be signed and sent by the platform
      // For demo purposes, we'll just simulate a successful transaction
      const transactionId = `sim_${Date.now().toString(36)}`

      // Update the quest progress
      questProgress.status = "claimed"
      questProgress.claimedAt = Date.now()
      questProgress.transactionId = transactionId

      // Update total earned
      userData.totalEarned += quest.reward.amount

      return transactionId
    } else if (quest.reward.currency === "XP") {
      // Handle XP rewards if needed

      // Mark as claimed
      questProgress.status = "claimed"
      questProgress.claimedAt = Date.now()

      return "xp_reward"
    }

    return null
  } catch (error) {
    console.error("Error claiming quest reward:", error)
    return null
  }
}

// Get completed quests for a user
export function getCompletedQuests(walletAddress: string): Array<{
  quest: Quest
  progress: QuestProgress
}> {
  const userData = getUserQuestsData(walletAddress) || initializeUserQuests(walletAddress)

  return userData.quests
    .filter((progress) => progress.status === "completed" || progress.status === "claimed")
    .map((progress) => {
      const quest = getQuestById(progress.questId)
      return {
        quest: quest!,
        progress,
      }
    })
    .filter((item) => item.quest !== null)
}

// Get quests by status for a user
export function getQuestsByStatus(
  walletAddress: string,
  status: QuestStatus | QuestStatus[],
): Array<{
  quest: Quest
  progress: QuestProgress
}> {
  const userData = getUserQuestsData(walletAddress) || initializeUserQuests(walletAddress)
  const statusArray = Array.isArray(status) ? status : [status]

  return userData.quests
    .filter((progress) => statusArray.includes(progress.status))
    .map((progress) => {
      const quest = getQuestById(progress.questId)
      return {
        quest: quest!,
        progress,
      }
    })
    .filter((item) => item.quest !== null)
}

// Check daily quest reset
export function checkAndResetDailyQuests(walletAddress: string): void {
  const userData = getUserQuestsData(walletAddress)
  if (!userData) return

  const now = Date.now()

  // Reset daily quests if they've expired
  userData.quests.forEach((progress) => {
    const quest = getQuestById(progress.questId)
    if (quest && quest.type === "daily" && quest.expiresAt && quest.expiresAt < now) {
      // Reset the quest
      progress.status = "not_started"
      progress.progress = 0
      progress.completedAt = undefined
      progress.claimedAt = undefined

      // Update the expiration time to the next day
      quest.expiresAt = getEndOfDay()
    }
  })
}

// Check weekly quest reset
export function checkAndResetWeeklyQuests(walletAddress: string): void {
  const userData = getUserQuestsData(walletAddress)
  if (!userData) return

  const now = Date.now()

  // Reset weekly quests if they've expired
  userData.quests.forEach((progress) => {
    const quest = getQuestById(progress.questId)
    if (quest && quest.type === "weekly" && quest.expiresAt && quest.expiresAt < now) {
      // Reset the quest
      progress.status = "not_started"
      progress.progress = 0
      progress.completedAt = undefined
      progress.claimedAt = undefined

      // Update the expiration time to the next week
      quest.expiresAt = getEndOfWeek()
    }
  })
}

// Get user quest stats
export function getUserQuestStats(walletAddress: string): {
  totalCompleted: number
  totalClaimed: number
  totalEarned: number
  dailyCompleted: number
  weeklyCompleted: number
  specialCompleted: number
} {
  const userData = getUserQuestsData(walletAddress) || initializeUserQuests(walletAddress)

  const stats = {
    totalCompleted: userData.totalCompleted,
    totalClaimed: 0,
    totalEarned: userData.totalEarned,
    dailyCompleted: 0,
    weeklyCompleted: 0,
    specialCompleted: 0,
  }

  userData.quests.forEach((progress) => {
    if (progress.status === "claimed") {
      stats.totalClaimed++
    }

    const quest = getQuestById(progress.questId)
    if (quest && (progress.status === "completed" || progress.status === "claimed")) {
      if (quest.type === "daily") stats.dailyCompleted++
      if (quest.type === "weekly") stats.weeklyCompleted++
      if (quest.type === "special") stats.specialCompleted++
    }
  })

  return stats
}
