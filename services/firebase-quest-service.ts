import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  addDoc,
  Timestamp,
  writeBatch,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { firebaseUserService } from "./firebase-user-service"

// Quest types
export type QuestType = "daily" | "weekly" | "special" | "one-time"
export type QuestDifficulty = "Easy" | "Medium" | "Hard"
export type QuestStatus = "not_started" | "in_progress" | "completed" | "claimed"

// Quest interface
export interface Quest {
  id: string
  title: string
  description: string
  type: QuestType
  difficulty: QuestDifficulty
  reward: {
    xp: number
  }
  requirements: {
    type: "connect_discord" | "login_streak" | "share_twitter" | "refer_friends" | "play_minigame" | "join_community_call"
    count: number
    data?: any
  }
  isActive: boolean
  expiresAt?: Timestamp
  createdAt: Timestamp
}

// User quest progress
export interface UserQuestProgress {
  id: string
  userId: string
  questId: string
  status: QuestStatus
  progress: number
  maxProgress: number
  startedAt?: Timestamp
  completedAt?: Timestamp
  claimedAt?: Timestamp
  rewardXP: number
}

// User XP and level data
export interface UserXPData {
  walletAddress: string
  totalXP: number
  level: number
  currentLevelXP: number
  nextLevelXP: number
  rank: number
  questsCompleted: number
  lastActive: Timestamp
}

class FirebaseQuestService {
  private readonly QUESTS_COLLECTION = "quests"
  private readonly USER_QUESTS_COLLECTION = "userQuests"
  private readonly USER_XP_COLLECTION = "userXP"

  // Predefined quests based on the image
  private readonly DEFAULT_QUESTS: Omit<Quest, "id" | "createdAt">[] = [
    {
      title: "Connect Discord",
      description: "Link your Discord account to RewardNFT",
      type: "daily",
      difficulty: "Easy",
      reward: { xp: 50 },
      requirements: { type: "connect_discord", count: 1 },
      isActive: true,
    },
    {
      title: "Login Streak",
      description: "Login 5 days in a row",
      type: "daily",
      difficulty: "Medium",
      reward: { xp: 100 },
      requirements: { type: "login_streak", count: 5 },
      isActive: true,
    },
    {
      title: "Share on Twitter",
      description: "Share your NFT on Twitter with #RewardNFT",
      type: "daily",
      difficulty: "Easy",
      reward: { xp: 75 },
      requirements: { type: "share_twitter", count: 1 },
      isActive: true,
    },
    {
      title: "Refer 3 Friends",
      description: "Get 3 friends to mint NFTs with your referral link",
      type: "weekly",
      difficulty: "Hard",
      reward: { xp: 250 },
      requirements: { type: "refer_friends", count: 3 },
      isActive: true,
    },
    {
      title: "Play Mini-Game",
      description: "Score 1000+ points in the mini-game",
      type: "weekly",
      difficulty: "Medium",
      reward: { xp: 150 },
      requirements: { type: "play_minigame", count: 1000 },
      isActive: true,
    },
    {
      title: "Join Community Call",
      description: "Attend the weekly community call",
      type: "weekly",
      difficulty: "Easy",
      reward: { xp: 200 },
      requirements: { type: "join_community_call", count: 1 },
      isActive: true,
    },
  ]

  // Initialize default quests
  async initializeDefaultQuests(): Promise<void> {
    const batch = writeBatch(db)
    
    for (const questData of this.DEFAULT_QUESTS) {
      const questRef = doc(collection(db, this.QUESTS_COLLECTION))
      const quest: Quest = {
        ...questData,
        id: questRef.id,
        createdAt: serverTimestamp() as Timestamp,
      }
      batch.set(questRef, quest)
    }
    
    await batch.commit()
  }

  // Get all active quests (simplified query)
  async getActiveQuests(): Promise<Quest[]> {
    const q = query(
      collection(db, this.QUESTS_COLLECTION),
      where("isActive", "==", true)
    )

    const snapshot = await getDocs(q)
    const quests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quest))

    // Sort by createdAt in memory
    return quests.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0
      const bTime = b.createdAt?.seconds || 0
      return bTime - aTime
    })
  }

  // Get quests by type (simplified query)
  async getQuestsByType(type: QuestType): Promise<Quest[]> {
    const q = query(
      collection(db, this.QUESTS_COLLECTION),
      where("type", "==", type)
    )

    const snapshot = await getDocs(q)
    const quests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quest))

    // Filter active quests and sort in memory
    return quests
      .filter(quest => quest.isActive)
      .sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0
        const bTime = b.createdAt?.seconds || 0
        return bTime - aTime
      })
  }

  // Get user quest progress (simplified query)
  async getUserQuestProgress(walletAddress: string): Promise<UserQuestProgress[]> {
    const q = query(
      collection(db, this.USER_QUESTS_COLLECTION),
      where("userId", "==", walletAddress)
    )

    const snapshot = await getDocs(q)
    const progress = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserQuestProgress))

    // Sort by startedAt in memory
    return progress.sort((a, b) => {
      const aTime = a.startedAt?.seconds || 0
      const bTime = b.startedAt?.seconds || 0
      return bTime - aTime
    })
  }

  // Start a quest for user
  async startQuest(walletAddress: string, questId: string): Promise<UserQuestProgress> {
    const questDoc = await getDoc(doc(db, this.QUESTS_COLLECTION, questId))
    if (!questDoc.exists()) {
      throw new Error("Quest not found")
    }
    
    const quest = questDoc.data() as Quest
    const progressRef = doc(collection(db, this.USER_QUESTS_COLLECTION))
    
    const progress: UserQuestProgress = {
      id: progressRef.id,
      userId: walletAddress,
      questId,
      status: "in_progress",
      progress: 0,
      maxProgress: quest.requirements.count,
      startedAt: serverTimestamp() as Timestamp,
      rewardXP: quest.reward.xp,
    }
    
    await setDoc(progressRef, progress)
    return progress
  }

  // Update quest progress with verification
  async updateQuestProgress(
    walletAddress: string,
    questId: string,
    progressIncrement: number = 1,
    verificationData?: any
  ): Promise<UserQuestProgress | null> {
    const q = query(
      collection(db, this.USER_QUESTS_COLLECTION),
      where("userId", "==", walletAddress),
      where("questId", "==", questId)
    )

    const snapshot = await getDocs(q)

    // Filter by status in memory
    const validDocs = snapshot.docs.filter(doc => {
      const data = doc.data()
      return data.status === "in_progress" || data.status === "not_started"
    })
    if (validDocs.length === 0) {
      // Start the quest if not started
      return await this.startQuest(walletAddress, questId)
    }

    const progressDoc = validDocs[0]
    const progress = progressDoc.data() as UserQuestProgress

    // Verify quest requirements based on quest type
    const questDoc = await getDoc(doc(db, this.QUESTS_COLLECTION, questId))
    if (!questDoc.exists()) {
      throw new Error("Quest not found")
    }

    const quest = questDoc.data() as Quest
    const isValid = await this.verifyQuestRequirement(walletAddress, quest, verificationData)

    if (!isValid) {
      throw new Error("Quest requirement not met")
    }

    const newProgress = Math.min(progress.progress + progressIncrement, progress.maxProgress)
    const isCompleted = newProgress >= progress.maxProgress

    const updateData: Partial<UserQuestProgress> = {
      progress: newProgress,
      status: isCompleted ? "completed" : "in_progress",
    }

    if (isCompleted && !progress.completedAt) {
      updateData.completedAt = serverTimestamp() as Timestamp
      updateData.status = "claimed"
      updateData.claimedAt = serverTimestamp() as Timestamp
    }

    // Ensure rewardUSDC is not undefined when updating
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    )

    await updateDoc(doc(db, this.USER_QUESTS_COLLECTION, progressDoc.id), cleanUpdateData)

    // If quest was just completed, award XP immediately
    if (isCompleted && !progress.completedAt) {
      try {
        await this.addUserXP(walletAddress, progress.rewardXP)
        await firebaseUserService.incrementQuestCompletion(walletAddress)
        console.log(`Awarded ${progress.rewardXP} XP to ${walletAddress} for completing quest`)
      } catch (error) {
        console.error("Error awarding XP:", error)
      }
    }

    return { ...progress, ...updateData } as UserQuestProgress
  }

  // Verify quest requirements
  private async verifyQuestRequirement(
    walletAddress: string,
    quest: Quest,
    verificationData?: any
  ): Promise<boolean> {
    switch (quest.requirements.type) {
      case "connect_discord":
        // Verify Discord connection
        return verificationData?.discordConnected === true && verificationData?.timestamp

      case "login_streak":
        // Verify SOL payment for daily login
        if (!verificationData?.solPaymentSignature || !verificationData?.amount) {
          return false
        }

        // Additional verification: check if payment was made today
        const today = new Date().toDateString()
        const lastLoginKey = `lastLogin_${walletAddress}`

        // In a real app, you'd store this in Firebase
        // For now, we'll verify the signature and amount
        return verificationData.amount >= 0.01 && verificationData.verified === true

      case "share_twitter":
        // Verify Twitter share
        return verificationData?.twitterShareUrl &&
               verificationData?.twitterShareUrl.includes("RewardNFT") &&
               verificationData?.sharedAt

      case "refer_friends":
        // Verify referral count from verification data or Firebase
        if (verificationData?.referralCount !== undefined) {
          return verificationData.referralCount >= quest.requirements.count
        }

        // Fallback: check Firebase directly
        const userDoc = await getDoc(doc(db, "users", walletAddress))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          return (userData.totalReferrals || 0) >= quest.requirements.count
        }
        return false

      case "play_minigame":
        // Verify mini-game score
        return verificationData?.gameScore >= quest.requirements.count

      case "join_community_call":
        // Verify community call attendance
        return verificationData?.attendanceVerified === true && verificationData?.joinedAt

      default:
        return true
    }
  }

  // Claim quest reward
  async claimQuestReward(walletAddress: string, questProgressId: string): Promise<boolean> {
    const progressDoc = await getDoc(doc(db, this.USER_QUESTS_COLLECTION, questProgressId))
    if (!progressDoc.exists()) {
      throw new Error("Quest progress not found")
    }
    
    const progress = progressDoc.data() as UserQuestProgress
    if (progress.status !== "completed" || progress.claimedAt) {
      throw new Error("Quest reward already claimed or quest not completed")
    }
    
    const batch = writeBatch(db)
    
    // Update quest progress
    batch.update(doc(db, this.USER_QUESTS_COLLECTION, questProgressId), {
      status: "claimed",
      claimedAt: serverTimestamp(),
    })
    
    // Update user XP
    await this.addUserXP(walletAddress, progress.rewardXP)
    
    // Update user quest completion count
    await firebaseUserService.incrementQuestCompletion(walletAddress)
    
    await batch.commit()
    return true
  }

  // Add XP to user and update level
  async addUserXP(walletAddress: string, xpAmount: number): Promise<UserXPData> {
    const userXPRef = doc(db, this.USER_XP_COLLECTION, walletAddress)
    const userXPDoc = await getDoc(userXPRef)
    
    let currentXP = 0
    let currentLevel = 1
    
    if (userXPDoc.exists()) {
      const data = userXPDoc.data() as UserXPData
      currentXP = data.totalXP
      currentLevel = data.level
    }
    
    const newTotalXP = currentXP + xpAmount
    const newLevel = this.calculateLevel(newTotalXP)
    const { currentLevelXP, nextLevelXP } = this.getLevelXPInfo(newTotalXP, newLevel)
    
    const userXPData: UserXPData = {
      walletAddress,
      totalXP: newTotalXP,
      level: newLevel,
      currentLevelXP,
      nextLevelXP,
      rank: 0, // Will be calculated separately
      questsCompleted: userXPDoc.exists() ? (userXPDoc.data() as UserXPData).questsCompleted + 1 : 1,
      lastActive: serverTimestamp() as Timestamp,
    }
    
    await setDoc(userXPRef, userXPData, { merge: true })
    return userXPData
  }

  // Calculate level based on XP (500 XP per level)
  private calculateLevel(totalXP: number): number {
    return Math.floor(totalXP / 500) + 1
  }

  // Get XP info for current level
  private getLevelXPInfo(totalXP: number, level: number): { currentLevelXP: number; nextLevelXP: number } {
    const currentLevelXP = totalXP % 500
    const nextLevelXP = 500
    return { currentLevelXP, nextLevelXP }
  }

  // Get user XP data
  async getUserXPData(walletAddress: string): Promise<UserXPData | null> {
    try {
      const docRef = doc(db, this.USER_XP_COLLECTION, walletAddress)
      const docSnap = await getDoc(docRef)
      return docSnap.exists() ? (docSnap.data() as UserXPData) : null
    } catch (error) {
      console.error("Error getting user XP data:", error)
      return null
    }
  }

  // Get XP leaderboard
  async getXPLeaderboard(limitCount: number = 50): Promise<UserXPData[]> {
    const q = query(
      collection(db, this.USER_XP_COLLECTION),
      orderBy("totalXP", "desc"),
      limit(limitCount)
    )
    
    const snapshot = await getDocs(q)
    const leaderboard = snapshot.docs.map((doc, index) => ({
      ...doc.data(),
      rank: index + 1,
    } as UserXPData))
    
    return leaderboard
  }
}

export const firebaseQuestService = new FirebaseQuestService()
