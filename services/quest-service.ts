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

// Quest Service class
export class QuestService {
  private quests: Record<string, Quest> = {}
  private userQuestsStore: Record<string, UserQuestsData> = {}

  constructor() {
    // Initialize quests
    this.initializeQuests()

    // Load user quest data from localStorage if available
    this.loadUserQuestData()
  }

  // Initialize quests
  private initializeQuests(): void {
    this.quests = {
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
        expiresAt: this.getEndOfDay(),
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
        expiresAt: this.getEndOfDay(),
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
        expiresAt: this.getEndOfWeek(),
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
        expiresAt: this.getEndOfWeek(),
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
        expiresAt: this.getEndOfMonth(),
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
        expiresAt: this.getEndOfWeek(),
      },
    }
  }

  // Load user quest data from localStorage
  private loadUserQuestData(): void {
    if (typeof window === "undefined") return

    try {
      const storedData = localStorage.getItem("userQuestsData")
      if (storedData) {
        this.userQuestsStore = JSON.parse(storedData)
      }
    } catch (error) {
      console.error("Error loading user quest data:", error)
    }
  }

  // Save user quest data to localStorage
  private saveUserQuestData(): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem("userQuestsData", JSON.stringify(this.userQuestsStore))
    } catch (error) {
      console.error("Error saving user quest data:", error)
    }
  }

  // Helper function to get end of day timestamp
  private getEndOfDay(): number {
    const date = new Date()
    date.setHours(23, 59, 59, 999)
    return date.getTime()
  }

  // Helper function to get end of week timestamp
  private getEndOfWeek(): number {
    const date = new Date()
    const day = date.getDay()
    const diff = day === 0 ? 6 : day - 1 // Adjust for Sunday
    date.setDate(date.getDate() - diff + 7) // Next Monday
    date.setHours(23, 59, 59, 999)
    return date.getTime()
  }

  // Helper function to get end of month timestamp
  private getEndOfMonth(): number {
    const date = new Date()
    date.setMonth(date.getMonth() + 1)
    date.setDate(0) // Last day of current month
    date.setHours(23, 59, 59, 999)
    return date.getTime()
  }

  // Get all available quests
  getAllQuests(): Quest[] {
    return Object.values(this.quests)
  }

  // Get quests by type
  getQuestsByType(type: QuestType): Quest[] {
    return Object.values(this.quests).filter((quest) => quest.type === type)
  }

  // Get quest by ID
  getQuestById(questId: string): Quest | null {
    return this.quests[questId] || null
  }

  // Initialize user quests data
  initializeUserQuests(walletAddress: string): UserQuestsData {
    if (this.userQuestsStore[walletAddress]) {
      return this.userQuestsStore[walletAddress]
    }

    const userData: UserQuestsData = {
      walletAddress,
      quests: [],
      totalEarned: 0,
      totalCompleted: 0,
    }

    // Initialize progress for all quests
    Object.values(this.quests).forEach((quest) => {
      userData.quests.push({
        questId: quest.id,
        status: "not_started",
        progress: 0,
      })
    })

    this.userQuestsStore[walletAddress] = userData
    this.saveUserQuestData()

    return userData
  }

  // Get user quests data
  getUserQuestsData(walletAddress: string): UserQuestsData | null {
    return this.userQuestsStore[walletAddress] || null
  }

  // Update quest progress
  updateQuestProgress(walletAddress: string, questId: string, progress: number): QuestProgress | null {
    const userData = this.getUserQuestsData(walletAddress) || this.initializeUserQuests(walletAddress)
    const questProgress = userData.quests.find((q) => q.questId === questId)

    if (!questProgress) {
      return null
    }

    const quest = this.getQuestById(questId)
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

    this.saveUserQuestData()

    return questProgress
  }

  // Complete a quest
  completeQuest(walletAddress: string, questId: string): QuestProgress | null {
    const userData = this.getUserQuestsData(walletAddress) || this.initializeUserQuests(walletAddress)
    const questProgress = userData.quests.find((q) => q.questId === questId)

    if (!questProgress) {
      return null
    }

    const quest = this.getQuestById(questId)
    if (!quest) {
      return null
    }

    // Mark as completed
    questProgress.status = "completed"
    questProgress.progress = quest.requirements.count
    questProgress.completedAt = Date.now()
    userData.totalCompleted += 1

    this.saveUserQuestData()

    return questProgress
  }

  // Claim quest reward
  async claimQuestReward(walletAddress: string, questId: string): Promise<string | null> {
    const userData = this.getUserQuestsData(walletAddress) || this.initializeUserQuests(walletAddress)
    const questProgress = userData.quests.find((q) => q.questId === questId)

    if (!questProgress || questProgress.status !== "completed") {
      return null
    }

    const quest = this.getQuestById(questId)
    if (!quest) {
      return null
    }

    try {
      // In a real implementation, this would transfer USDC to the user
      // For demo purposes, we'll just simulate a successful transaction
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const transactionId = `sim_${Date.now().toString(36)}`

      // Update the quest progress
      questProgress.status = "claimed"
      questProgress.claimedAt = Date.now()
      questProgress.transactionId = transactionId

      // Update total earned
      userData.totalEarned += quest.reward.amount

      this.saveUserQuestData()

      return transactionId
    } catch (error) {
      console.error("Error claiming quest reward:", error)
      return null
    }
  }

  // Get completed quests for a user
  getCompletedQuests(walletAddress: string): Array<{
    quest: Quest
    progress: QuestProgress
  }> {
    const userData = this.getUserQuestsData(walletAddress) || this.initializeUserQuests(walletAddress)

    return userData.quests
      .filter((progress) => progress.status === "completed" || progress.status === "claimed")
      .map((progress) => {
        const quest = this.getQuestById(progress.questId)
        return {
          quest: quest!,
          progress,
        }
      })
      .filter((item) => item.quest !== null)
  }

  // Get quests by status for a user
  getQuestsByStatus(
    walletAddress: string,
    status: QuestStatus | QuestStatus[],
  ): Array<{
    quest: Quest
    progress: QuestProgress
  }> {
    const userData = this.getUserQuestsData(walletAddress) || this.initializeUserQuests(walletAddress)
    const statusArray = Array.isArray(status) ? status : [status]

    return userData.quests
      .filter((progress) => statusArray.includes(progress.status))
      .map((progress) => {
        const quest = this.getQuestById(progress.questId)
        return {
          quest: quest!,
          progress,
        }
      })
      .filter((item) => item.quest !== null)
  }

  // Check and reset daily quests
  checkAndResetDailyQuests(walletAddress: string): void {
    const userData = this.getUserQuestsData(walletAddress)
    if (!userData) return

    const now = Date.now()

    // Reset daily quests if they've expired
    userData.quests.forEach((progress) => {
      const quest = this.getQuestById(progress.questId)
      if (quest && quest.type === "daily" && quest.expiresAt && quest.expiresAt < now) {
        // Reset the quest
        progress.status = "not_started"
        progress.progress = 0
        progress.completedAt = undefined
        progress.claimedAt = undefined

        // Update the expiration time to the next day
        quest.expiresAt = this.getEndOfDay()
      }
    })

    this.saveUserQuestData()
  }

  // Check and reset weekly quests
  checkAndResetWeeklyQuests(walletAddress: string): void {
    const userData = this.getUserQuestsData(walletAddress)
    if (!userData) return

    const now = Date.now()

    // Reset weekly quests if they've expired
    userData.quests.forEach((progress) => {
      const quest = this.getQuestById(progress.questId)
      if (quest && quest.type === "weekly" && quest.expiresAt && quest.expiresAt < now) {
        // Reset the quest
        progress.status = "not_started"
        progress.progress = 0
        progress.completedAt = undefined
        progress.claimedAt = undefined

        // Update the expiration time to the next week
        quest.expiresAt = this.getEndOfWeek()
      }
    })

    this.saveUserQuestData()
  }

  // Get user quest stats
  getUserQuestStats(walletAddress: string): {
    totalCompleted: number
    totalClaimed: number
    totalEarned: number
    dailyCompleted: number
    weeklyCompleted: number
    specialCompleted: number
  } {
    const userData = this.getUserQuestsData(walletAddress) || this.initializeUserQuests(walletAddress)

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

      const quest = this.getQuestById(progress.questId)
      if (quest && (progress.status === "completed" || progress.status === "claimed")) {
        if (quest.type === "daily") stats.dailyCompleted++
        if (quest.type === "weekly") stats.weeklyCompleted++
        if (quest.type === "special") stats.specialCompleted++
      }
    })

    return stats
  }
}

// Create a singleton instance
let questServiceInstance: QuestService | null = null

// Get quest service instance
export function getQuestService(): QuestService {
  if (!questServiceInstance) {
    questServiceInstance = new QuestService()
  }
  return questServiceInstance
}
