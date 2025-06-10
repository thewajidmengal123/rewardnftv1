import { useState, useEffect } from "react"
import { useWallet } from "@/contexts/wallet-context"
import { Quest, UserQuestProgress, UserXPData } from "@/services/firebase-quest-service"

export function useQuestSystem() {
  const { connected, publicKey } = useWallet()
  const [quests, setQuests] = useState<Quest[]>([])
  const [userProgress, setUserProgress] = useState<UserQuestProgress[]>([])
  const [userXPData, setUserXPData] = useState<UserXPData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load quest data
  const loadQuestData = async () => {
    if (!connected || !publicKey) return

    try {
      setLoading(true)
      setError(null)

      const [questsResponse, progressResponse, xpResponse] = await Promise.all([
        fetch("/api/quests?action=get-quests"),
        fetch(`/api/quests?action=get-user-progress&wallet=${publicKey.toString()}`),
        fetch(`/api/quests?action=get-user-xp&wallet=${publicKey.toString()}`)
      ])

      const questsData = await questsResponse.json()
      const progressData = await progressResponse.json()
      const xpData = await xpResponse.json()

      if (questsData.success) {
        // Frontend deduplication: Remove duplicate quests by title
        const uniqueQuests = questsData.data.reduce((acc: Quest[], quest: Quest) => {
          const existing = acc.find(q => q.title === quest.title)
          if (!existing) {
            acc.push(quest)
          } else {
            // Keep the one with earlier creation time (older quest)
            const existingTime = existing.createdAt?.seconds || 0
            const currentTime = quest.createdAt?.seconds || 0
            if (currentTime < existingTime) {
              const index = acc.findIndex(q => q.title === quest.title)
              acc[index] = quest
            }
          }
          return acc
        }, [])

        console.log(`🧹 Frontend deduplication: ${questsData.data.length} -> ${uniqueQuests.length} quests`)
        setQuests(uniqueQuests)
      }

      if (progressData.success) {
        setUserProgress(progressData.data)
      }

      if (xpData.success) {
        setUserXPData(xpData.data)
      }
    } catch (err) {
      console.error("Error loading quest data:", err)
      setError("Failed to load quest data")
    } finally {
      setLoading(false)
    }
  }

  // Start a quest
  const startQuest = async (questId: string) => {
    if (!connected || !publicKey) return false

    try {
      const response = await fetch("/api/quests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          questId,
          action: "start-quest"
        })
      })

      const data = await response.json()
      if (data.success) {
        await loadQuestData() // Refresh data
        return true
      } else {
        setError(data.error)
        return false
      }
    } catch (err) {
      console.error("Error starting quest:", err)
      setError("Failed to start quest")
      return false
    }
  }

  // Update quest progress with verification
  const updateQuestProgress = async (
    questId: string,
    progressIncrement: number = 1,
    verificationData?: any
  ) => {
    if (!connected || !publicKey) return false

    try {
      const response = await fetch("/api/quests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          questId,
          action: "update-progress",
          progressIncrement,
          verificationData
        })
      })

      const data = await response.json()
      if (data.success) {
        await loadQuestData() // Refresh data
        return true
      } else {
        setError(data.error)
        return false
      }
    } catch (err) {
      console.error("Error updating quest progress:", err)
      setError("Failed to update quest progress")
      return false
    }
  }

  // Claim quest reward
  const claimQuestReward = async (questProgressId: string) => {
    if (!connected || !publicKey) return false

    try {
      const response = await fetch("/api/quests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          questProgressId,
          action: "claim-reward"
        })
      })

      const data = await response.json()
      if (data.success) {
        await loadQuestData() // Refresh data
        return true
      } else {
        setError(data.error)
        return false
      }
    } catch (err) {
      console.error("Error claiming quest reward:", err)
      setError("Failed to claim quest reward")
      return false
    }
  }

  // Get quest progress for a specific quest
  const getQuestProgress = (questId: string): UserQuestProgress | undefined => {
    return userProgress.find(p => p.questId === questId)
  }

  // Get quests by type with deduplication
  const getQuestsByType = (type: "daily" | "weekly"): Quest[] => {
    const filteredQuests = quests.filter(q => q.type === type as any)

    // Additional deduplication by title for this type
    const uniqueQuests = filteredQuests.reduce((acc: Quest[], quest: Quest) => {
      const existing = acc.find(q => q.title === quest.title)
      if (!existing) {
        acc.push(quest)
      } else {
        // Keep the one with earlier creation time (older quest)
        const existingTime = existing.createdAt?.seconds || 0
        const currentTime = quest.createdAt?.seconds || 0
        if (currentTime < existingTime) {
          const index = acc.findIndex(q => q.title === quest.title)
          acc[index] = quest
        }
      }
      return acc
    }, [])

    return uniqueQuests
  }

  // Load data when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      loadQuestData()
    }
  }, [connected, publicKey])

  return {
    // Data
    quests,
    userProgress,
    userXPData,
    loading,
    error,

    // Actions
    startQuest,
    updateQuestProgress,
    claimQuestReward,
    loadQuestData,

    // Helpers
    getQuestProgress,
    getQuestsByType,

    // Computed values (already deduplicated through getQuestsByType)
    dailyQuests: getQuestsByType("daily"),
    weeklyQuests: getQuestsByType("weekly"),
    totalXP: userXPData?.totalXP || 0,
    currentLevel: userXPData?.level || 1,
    currentRank: userXPData?.rank || 0,
  }
}
