"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Flame, Check, Trophy, Clock, Calendar, AlertCircle, Disc } from "lucide-react"
import { useWallet } from "@/contexts/wallet-context"
import {
  getAllQuests,
  getQuestsByType,
  getUserQuestsData,
  initializeUserQuests,
  completeQuest,
  claimQuestReward,
  checkAndResetDailyQuests,
  checkAndResetWeeklyQuests,
  getUserQuestStats,
  type Quest,
  type QuestProgress,
} from "@/utils/quests"
import { useToast } from "@/components/ui/use-toast"
import { PLATFORM_WALLET_ADDRESS } from "@/config/solana"
import { ProtectedRoute } from "@/components/protected-route"

export function QuestsPageContent() {
  const { connected, publicKey, connection } = useWallet()
  const [userQuests, setUserQuests] = useState<{
    daily: Array<{ quest: Quest; progress: QuestProgress }>
    weekly: Array<{ quest: Quest; progress: QuestProgress }>
    special: Array<{ quest: Quest; progress: QuestProgress }>
    completed: Array<{ quest: Quest; progress: QuestProgress }>
  }>({
    daily: [],
    weekly: [],
    special: [],
    completed: [],
  })
  const [stats, setStats] = useState({
    totalCompleted: 0,
    totalEarned: 0,
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Initialize and load quests when wallet is connected
  useEffect(() => {
    if (connected && publicKey) {
      loadUserQuests()
    }
  }, [connected, publicKey])

  // Load user quests
  const loadUserQuests = async () => {
    if (!connected || !publicKey) return

    setLoading(true)

    try {
      const walletAddress = publicKey.toString()

      // Check for quest resets
      checkAndResetDailyQuests(walletAddress)
      checkAndResetWeeklyQuests(walletAddress)

      // Initialize user quests if needed
      const userData = getUserQuestsData(walletAddress) || initializeUserQuests(walletAddress)

      // Get quests by type
      const dailyQuests = getQuestsByType("daily")
      const weeklyQuests = getQuestsByType("weekly")
      const specialQuests = getQuestsByType("special")

      // Map quests with user progress
      const daily = dailyQuests.map((quest) => {
        const progress = userData.quests.find((q) => q.questId === quest.id) || {
          questId: quest.id,
          status: "not_started",
          progress: 0,
        }
        return { quest, progress }
      })

      const weekly = weeklyQuests.map((quest) => {
        const progress = userData.quests.find((q) => q.questId === quest.id) || {
          questId: quest.id,
          status: "not_started",
          progress: 0,
        }
        return { quest, progress }
      })

      const special = specialQuests.map((quest) => {
        const progress = userData.quests.find((q) => q.questId === quest.id) || {
          questId: quest.id,
          status: "not_started",
          progress: 0,
        }
        return { quest, progress }
      })

      // Get completed quests
      const completed = userData.quests
        .filter((progress) => progress.status === "claimed")
        .map((progress) => {
          const quest = getAllQuests().find((q) => q.id === progress.questId)!
          return { quest, progress }
        })
        .filter((item) => item.quest !== undefined)

      // Get user stats
      const userStats = getUserQuestStats(walletAddress)

      setUserQuests({
        daily,
        weekly,
        special,
        completed,
      })

      setStats({
        totalCompleted: userStats.totalCompleted,
        totalEarned: userStats.totalEarned,
      })
    } catch (error) {
      console.error("Error loading quests:", error)
      toast({
        title: "Error",
        description: "Failed to load quests. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle quest completion
  const handleCompleteQuest = async (questId: string) => {
    if (!connected || !publicKey) return

    setLoading(true)

    try {
      const walletAddress = publicKey.toString()

      // Complete the quest
      const result = completeQuest(walletAddress, questId)

      if (result) {
        toast({
          title: "Quest Completed",
          description: "You've completed this quest! Claim your reward.",
        })

        // Reload quests
        await loadUserQuests()
      } else {
        toast({
          title: "Error",
          description: "Failed to complete quest. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error completing quest:", error)
      toast({
        title: "Error",
        description: "Failed to complete quest. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle claim reward
  const handleClaimReward = async (questId: string) => {
    if (!connected || !publicKey) return

    setLoading(true)

    try {
      const walletAddress = publicKey.toString()

      // Claim the reward
      const result = await claimQuestReward(connection, PLATFORM_WALLET_ADDRESS, walletAddress, questId)

      if (result) {
        toast({
          title: "Reward Claimed",
          description: "Your reward has been sent to your wallet!",
        })

        // Reload quests
        await loadUserQuests()
      } else {
        toast({
          title: "Error",
          description: "Failed to claim reward. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error claiming reward:", error)
      toast({
        title: "Error",
        description: "Failed to claim reward. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Get icon for quest
  const getQuestIcon = (quest: Quest) => {
    switch (quest.requirements.type) {
      case "daily_check_in":
        return <Calendar className="h-6 w-6 text-white" />
      case "referrals":
        return <Flame className="h-6 w-6 text-white" />
      case "social_share":
        return <Clock className="h-6 w-6 text-white" />
      case "mint":
        return <Disc className="h-6 w-6 text-white" />
      case "game_score":
        return <Trophy className="h-6 w-6 text-white" />
      default:
        return <AlertCircle className="h-6 w-6 text-white" />
    }
  }

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-[#00FFE0]/20 text-[#00FFE0]"
      case "Medium":
        return "bg-[#FF5555]/20 text-[#FF5555]"
      case "Hard":
        return "bg-[#FFA500]/20 text-[#FFA500]"
      default:
        return "bg-white/20 text-white"
    }
  }

  // Get progress text
  const getProgressText = (quest: Quest, progress: QuestProgress) => {
    if (progress.status === "completed" || progress.status === "claimed") {
      return "Completed"
    }

    switch (quest.requirements.type) {
      case "referrals":
        return `${progress.progress}/${quest.requirements.count} referrals`
      case "daily_check_in":
        return progress.progress > 0 ? "Checked in today" : "Not checked in"
      case "social_share":
        return progress.progress > 0 ? "Shared" : "Not shared"
      case "game_score":
        return `${progress.progress}/${quest.requirements.count} points`
      default:
        return `${progress.progress}/${quest.requirements.count} completed`
    }
  }

  // Render quest card
  const renderQuestCard = ({ quest, progress }: { quest: Quest; progress: QuestProgress }) => {
    return (
      <div
        key={quest.id}
        className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 hover:border-white/40 transition-colors"
      >
        <div className="flex items-start gap-4">
          <div className="bg-white/10 rounded-full p-3">{getQuestIcon(quest)}</div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-bold text-white">{quest.title}</h3>
              <span className={`${getDifficultyColor(quest.difficulty)} text-xs font-medium rounded-full px-2 py-1`}>
                {quest.difficulty}
              </span>
            </div>
            <p className="text-white/80 mt-1 mb-4">{quest.description}</p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/60 text-sm">Progress</span>
                  <span className="text-white text-sm">{getProgressText(quest, progress)}</span>
                </div>
                <Progress
                  value={(progress.progress / quest.requirements.count) * 100}
                  className="h-2 bg-white/10"
                  barClassName={progress.status === "completed" || progress.status === "claimed" ? "bg-green-500" : ""}
                />
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <span className="text-white/60 text-sm">Reward</span>
                  <p className="text-white font-medium">
                    {quest.reward.amount} {quest.reward.currency}
                  </p>
                </div>

                {progress.status === "claimed" ? (
                  <div className="bg-green-500/20 text-green-400 rounded-full px-3 py-1 text-sm flex items-center">
                    <Check className="h-4 w-4 mr-1" /> Claimed
                  </div>
                ) : progress.status === "completed" ? (
                  <Button size="sm" onClick={() => handleClaimReward(quest.id)} disabled={loading}>
                    Claim Reward
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleCompleteQuest(quest.id)}
                    disabled={progress.progress < quest.requirements.count || loading}
                  >
                    {progress.progress < quest.requirements.count ? "In Progress" : "Complete Quest"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute requireNft={true}>
      {/* Existing quests page content */}
      <div className="min-h-screen flex flex-col">
        {/* Your existing quests content */}
        <main className="flex-1 container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Quests</h1>
          <div className="min-h-screen flex flex-col">
            {/* Header */}

            {/* Main Content */}
            <main className="flex-1 py-12 px-6">
              <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                  <div>
                    <h1 className="text-5xl font-bold text-white mb-2">Quests</h1>
                    <p className="text-xl text-white/80">Complete quests to earn USDC rewards</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4 flex items-center gap-8">
                    <div>
                      <p className="text-white/60 text-sm">Total Earned</p>
                      <p className="text-2xl font-bold text-white">{stats.totalEarned} USDC</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Quests Completed</p>
                      <p className="text-2xl font-bold text-white">{stats.totalCompleted}</p>
                    </div>
                  </div>
                </div>

                {connected ? (
                  <Tabs defaultValue="daily" className="w-full">
                    <TabsList className="bg-white/10 border border-white/20 mb-8">
                      <TabsTrigger value="daily" className="data-[state=active]:bg-white/20 text-white">
                        Daily
                      </TabsTrigger>
                      <TabsTrigger value="weekly" className="data-[state=active]:bg-white/20 text-white">
                        Weekly
                      </TabsTrigger>
                      <TabsTrigger value="special" className="data-[state=active]:bg-white/20 text-white">
                        Special
                      </TabsTrigger>
                      <TabsTrigger value="completed" className="data-[state=active]:bg-white/20 text-white">
                        Completed
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="daily" className="mt-0">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {userQuests.daily.length > 0 ? (
                          userQuests.daily.map((item) => renderQuestCard(item))
                        ) : (
                          <div className="col-span-2 text-center py-12">
                            <p className="text-white text-xl">No daily quests available.</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="weekly" className="mt-0">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {userQuests.weekly.length > 0 ? (
                          userQuests.weekly.map((item) => renderQuestCard(item))
                        ) : (
                          <div className="col-span-2 text-center py-12">
                            <p className="text-white text-xl">No weekly quests available.</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="special" className="mt-0">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {userQuests.special.length > 0 ? (
                          userQuests.special.map((item) => renderQuestCard(item))
                        ) : (
                          <div className="col-span-2 text-center py-12">
                            <p className="text-white text-xl">No special quests available.</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="completed" className="mt-0">
                      {userQuests.completed.length > 0 ? (
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 mb-6">
                          <h2 className="text-2xl font-bold text-white mb-4">Completed Quests</h2>
                          <div className="space-y-4">
                            {userQuests.completed.map(({ quest, progress }) => (
                              <div
                                key={quest.id}
                                className="flex items-center justify-between py-4 border-b border-white/10"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="bg-green-500/20 rounded-full p-2">
                                    <Check className="h-4 w-4 text-green-400" />
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-medium text-white">{quest.title}</h3>
                                    <p className="text-white/60 text-sm">
                                      Completed on{" "}
                                      {progress.completedAt
                                        ? new Date(progress.completedAt).toLocaleDateString()
                                        : "Unknown date"}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-white font-medium">
                                  {quest.reward.amount} {quest.reward.currency}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-12 text-center">
                          <h2 className="text-2xl font-bold text-white mb-4">No Completed Quests</h2>
                          <p className="text-white/80 mb-6">Complete quests to earn rewards and see them here.</p>
                          <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                            View Available Quests
                          </Button>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 p-12 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">Connect Your Wallet to Access Quests</h2>
                    <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                      Mint your exclusive NFT and connect your wallet to access quests and start earning USDC rewards.
                    </p>
                    <Button size="lg" className="bg-white hover:bg-white/90 text-black">
                      Connect Wallet
                    </Button>
                  </div>
                )}
              </div>
            </main>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
