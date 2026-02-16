"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle, 
  Clock, 
  Star, 
  Trophy, 
  Zap, 
  ExternalLink, 
  Plus, 
  Trash2,
  Crown,
  RefreshCw,
  Loader2
} from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { useQuestSystem } from "@/hooks/use-quest-system"
import { useWallet } from "@/contexts/wallet-context"
import { solPaymentService } from "@/services/sol-payment-service"
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// FIREBASE IMPORTS
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp,
  where,
  updateDoc
} from "firebase/firestore"
import { db } from "@/lib/firebase"

// ADMIN CONFIGURATION
const ADMIN_WALLET_ADDRESS = "6nHPbBNxh31qpKfLrs3WzzDGkDjmQYQGuVsh9qB7VLBQ"

const isAdmin = (walletAddress: string | null | undefined): boolean => {
  if (!walletAddress) return false
  return walletAddress === ADMIN_WALLET_ADDRESS
}

// TYPES
interface Quest {
  id: string
  title: string
  description: string
  icon?: string
  reward: { xp: number }
  requirements: { 
    type: string
    count: number
  }
  category: string
  isNew?: boolean
  actionLink?: string
  imageUrl?: string
  difficulty?: "easy" | "medium" | "hard"
  createdAt?: any
  createdBy?: string
  isActive?: boolean
  isCustom?: boolean
}

export function QuestPageContent() {
  const { signTransaction, publicKey } = useWallet()
  const [processingQuest, setProcessingQuest] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [customQuests, setCustomQuests] = useState<Quest[]>([])
  const [isLoadingQuests, setIsLoadingQuests] = useState(true)
  const [newQuest, setNewQuest] = useState({
    title: "",
    description: "",
    icon: "⭐",
    xp: "100",
    link: "",
    imageUrl: "",
    difficulty: "easy" as "easy" | "medium" | "hard",
    category: "one_time"
  })

  const {
    dailyQuests,
    weeklyQuests,
    oneTimeQuests,
    userXPData,
    loading,
    error,
    startQuest,
    updateQuestProgress,
    claimQuestReward,
    getQuestProgress,
  } = useQuestSystem()

  const adminMode = isAdmin(publicKey?.toString())

  // FIREBASE: REAL-TIME SYNC - SIMPLIFIED QUERY
  useEffect(() => {
    const questsRef = collection(db, "quests")
    const q = query(questsRef, orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const quests: Quest[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        
        // Client-side filtering
        if (data.isCustom === true && data.isActive !== false) {
          quests.push({
            id: doc.id,
            title: data.title,
            description: data.description,
            icon: data.icon || "⭐",
            reward: data.reward || { xp: 100 },
            requirements: data.requirements || { type: "custom_quest", count: 1 },
            category: data.category || "one_time",
            difficulty: data.difficulty || "easy",
            actionLink: data.actionLink,
            imageUrl: data.imageUrl,
            isNew: data.isNew ?? true,
            isActive: data.isActive ?? true,
            isCustom: true,
            createdAt: data.createdAt,
            createdBy: data.createdBy
          } as Quest)
        }
      })
      setCustomQuests(quests)
      setIsLoadingQuests(false)
    }, (error) => {
      console.error("Error fetching custom quests:", error)
      setIsLoadingQuests(false)
    })

    return () => unsubscribe()
  }, [])

  // ADMIN: CREATE QUEST
  const handleCreateQuest = async () => {
    if (!newQuest.title || !newQuest.link) {
      toast({
        title: "Error",
        description: "Title and Link are required",
        variant: "destructive"
      })
      return
    }

    try {
      const questData = {
        title: newQuest.title,
        description: newQuest.description,
        icon: newQuest.icon,
        reward: { xp: parseInt(newQuest.xp) || 100 },
        requirements: { 
          type: "custom_quest", 
          count: 1,
          description: newQuest.description
        },
        actionLink: newQuest.link,
        category: newQuest.category,
        difficulty: newQuest.difficulty,
        imageUrl: newQuest.imageUrl,
        isNew: true,
        isActive: true,
        isCustom: true,
        createdAt: serverTimestamp(),
        createdBy: publicKey?.toString(),
        maxProgress: 1,
        progress: 0
      }

      await addDoc(collection(db, "quests"), questData)

      setNewQuest({
        title: "",
        description: "",
        icon: "⭐",
        xp: "100",
        link: "",
        imageUrl: "",
        difficulty: "easy",
        category: "one_time"
      })

      setCreateModalOpen(false)

      toast({
        title: "✅ Quest Created!",
        description: "New quest is now live for ALL users worldwide!"
      })
    } catch (error) {
      console.error("Error creating quest:", error)
      toast({
        title: "Error",
        description: "Failed to create quest. Check console.",
        variant: "destructive"
      })
    }
  }

  // ADMIN: DELETE QUEST
  const handleDeleteQuest = async (questId: string) => {
    if (typeof window !== 'undefined' && confirm("Are you sure you want to delete this quest?")) {
      try {
        await updateDoc(doc(db, "quests", questId), {
          isActive: false,
          deletedAt: serverTimestamp(),
          deletedBy: publicKey?.toString()
        })

        toast({ 
          title: "✅ Quest Deleted", 
          description: "Quest removed for all users" 
        })
      } catch (error) {
        console.error("Error deleting quest:", error)
        toast({ 
          title: "Error", 
          description: "Failed to delete quest", 
          variant: "destructive" 
        })
      }
    }
  }

  // MERGE CUSTOM QUESTS WITH EXISTING QUESTS
  const getMergedOneTimeQuests = useCallback(() => {
    const seen = new Set()
    const merged = [...customQuests, ...oneTimeQuests].filter(quest => {
      if (seen.has(quest.id)) {
        return false
      }
      seen.add(quest.id)
      return true
    })
    return merged
  }, [customQuests, oneTimeQuests])

  // ... rest of handlers same as before
  const handleStartQuest = async (questId: string) => {
    const success = await startQuest(questId)
    if (success) {
      toast({ title: "Quest Started", description: "You've started this quest!" })
    } else {
      toast({ title: "Error", description: error || "Failed to start quest", variant: "destructive" })
    }
  }

  const handleClaimReward = async (progressId: string) => {
    const success = await claimQuestReward(progressId)
    if (success) {
      toast({ title: "Reward Claimed!", description: "XP has been added to your account" })
    } else {
      toast({ title: "Error", description: error || "Failed to claim reward", variant: "destructive" })
    }
  }

  const handleQuestAction = async (questId: string, questType: string) => {
    if (!publicKey || !signTransaction) return

    setProcessingQuest(questId)

    try {
      if (questType === "custom_quest") {
        const quest = customQuests.find(q => q.id === questId)
        if (quest?.actionLink) {
          window.open(quest.actionLink, "_blank")
          setTimeout(async () => {
            const success = await updateQuestProgress(questId, 1, { 
              customCompleted: true, 
              timestamp: Date.now() 
            })
            if (success) {
              toast({ 
                title: "✅ Quest Completed!", 
                description: `You earned ${quest.reward.xp} XP` 
              })
            }
          }, 3000)
        }
        setProcessingQuest(null)
        return
      }

      // ... other quest types
      switch (questType) {
        case "connect_discord":
          window.open("https://discord.gg/fZ7SDHeAtr", "_blank")
          setTimeout(async () => {
            const success = await updateQuestProgress(questId, 1, { discordConnected: true, timestamp: Date.now() })
            if (success) toast({ title: "Discord Connected!", description: "Quest completed! You earned 100 XP" })
          }, 3000)
          break
        case "follow_linkedin":
          window.open("https://www.linkedin.com/company/rewardnft", "_blank")
          setTimeout(async () => {
            const success = await updateQuestProgress(questId, 1, { linkedinFollowed: true, timestamp: Date.now() })
            if (success) toast({ title: "LinkedIn Followed!", description: "Quest completed! You earned 100 XP" })
          }, 3000)
          break
        case "BD Follow":
          window.open("https://x.com/thewajidmengal", "_blank")
          setTimeout(async () => {
            const success = await updateQuestProgress(questId, 1, { tweetEngaged: true, timestamp: Date.now() })
            if (success) toast({ title: "Follow Now!", description: "Quest completed! You earned 150 XP" })
          }, 3000)
          break
        case "engage_tweet":
          window.open("https://x.com/RewardNFT_/status/1947059548101218766", "_blank")
          setTimeout(async () => {
            const success = await updateQuestProgress(questId, 1, { tweetEngaged: true, timestamp: Date.now() })
            if (success) toast({ title: "Tweet Engaged!", description: "Quest completed! You earned 150 XP" })
          }, 3000)
          break
        case "follow_x":
          window.open("https://x.com/thewajidmengal", "_blank")
          setTimeout(async () => {
            const success = await updateQuestProgress(questId, 1, { xFollowed: true, timestamp: Date.now() })
            if (success) toast({ title: "X Followed!", description: "Quest completed! You earned 100 XP" })
          }, 3000)
          break
        case "join_telegram":
          window.open("https://t.me/rewardsNFT", "_blank")
          setTimeout(async () => {
            const success = await updateQuestProgress(questId, 1, { telegramJoined: true, timestamp: Date.now() })
            if (success) toast({ title: "Telegram Joined!", description: "Quest completed! You earned 100 XP" })
          }, 3000)
          break
        case "login_streak":
          try {
            const paymentResult = await solPaymentService.processPayment(publicKey, 0.01, signTransaction)
            if (paymentResult.success) {
              const success = await updateQuestProgress(questId, 1, {
                solPaymentSignature: paymentResult.signature,
                amount: 0.01,
                verified: true
              })
              if (success) {
                toast({ title: "Daily Login Complete!", description: `0.01 SOL paid! You earned 100 XP` })
              }
            }
          } catch (error) {
            toast({ title: "Payment Failed", description: "Failed to process SOL payment", variant: "destructive" })
          }
          break
        case "share_twitter":
          const tweetText = encodeURIComponent("Just completed a quest on RewardNFT! 🚀 #RewardNFT #NFT #Solana #Web3 @RewardNFT_")
          window.open(`https://x.com/intent/tweet?text=${tweetText}`, "_blank")
          setTimeout(async () => {
            const success = await updateQuestProgress(questId, 1, { sharedAt: Date.now() })
            if (success) toast({ title: "Twitter Share Complete!", description: "Quest completed! You earned 75 XP" })
          }, 2000)
          break
        case "refer_friends":
          try {
            const userResponse = await fetch(`/api/users?wallet=${publicKey.toString()}`)
            const userData = await userResponse.json()
            if (userData.success) {
              const referralCount = userData.data?.totalReferrals || 0
              const success = await updateQuestProgress(questId, Math.min(referralCount, 3), { referralCount })
              if (success) {
                if (referralCount >= 3) {
                  toast({ title: "🎉 Referral Quest Complete!", description: `You earned 500 XP!` })
                } else {
                  toast({ title: "📊 Progress Updated", description: `${referralCount}/3 referrals` })
                }
              }
            }
          } catch (error) {
            toast({ title: "Error", description: "Failed to check referrals", variant: "destructive" })
          }
          break
        case "play_minigame":
          localStorage.setItem('pendingQuestId', questId)
          window.location.href = "/mini-game"
          break
        case "join_community_call":
          window.open("https://discord.gg/fZ7SDHeAtr", "_blank")
          setTimeout(async () => {
            const success = await updateQuestProgress(questId, 1, { joinedAt: Date.now() })
            if (success) toast({ title: "Community Call Joined!", description: "Quest completed! You earned 200 XP" })
          }, 3000)
          break
        default:
          await updateQuestProgress(questId, 1)
      }
    } catch (error) {
      console.error("Quest action error:", error)
    } finally {
      setProcessingQuest(null)
    }
  }

  // QUEST CARD COMPONENT
  const QuestCard = ({ quest }: { quest: any }) => {
    const progress = getQuestProgress(quest.id)
    const progressPercentage = progress ? (progress.progress / progress.maxProgress) * 100 : 0
    const isCompleted = progress?.status === "completed"
    const isClaimed = progress?.status === "claimed"
    const canClaim = isCompleted && !isClaimed
    const isCustomQuest = quest.isCustom === true

    const getQuestIcon = (questType: string, icon?: string) => {
      if (icon && icon.length <= 2) return icon
      switch (questType) {
        case "connect_discord": return "🔗"
        case "login_streak": return "🔥"
        case "share_twitter": return "🐦"
        case "refer_friends": return "👥"
        case "play_minigame": return "🎮"
        case "join_community_call": return "📞"
        case "follow_linkedin": return "💼"
        case "engage_tweet": return "❤️"
        case "follow_x": return "🐦"
        case "join_telegram": return "📱"
        default: return "⭐"
      }
    }

    const getActionText = (questType: string) => {
      switch (questType) {
        case "connect_discord": return "🔗 Connect Discord"
        case "login_streak": return "💰 Pay & Login"
        case "share_twitter": return "🐦 Share on Twitter"
        case "refer_friends": return "👥 Check Referrals"
        case "play_minigame": return "🎮 Play Game"
        case "join_community_call": return "💬 Join Community"
        case "follow_linkedin": return "💼 Follow LinkedIn"
        case "engage_tweet": return "❤️ Engage Tweet"
        case "follow_x": return "🐦 Follow X"
        case "join_telegram": return "📱 Join Telegram"
        case "custom_quest": return "Complete"
        default: return "Complete"
      }
    }

    return (
      <div className={`bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border transition-all duration-300 hover:bg-gray-800/80 relative ${
        isCompleted ? 'border-green-500/50 bg-green-900/20' : 'border-gray-700/50'
      }`}>
        {/* Admin Delete Button */}
        {adminMode && isCustomQuest && (
          <button
            onClick={() => handleDeleteQuest(quest.id)}
            className="absolute top-4 right-4 p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors z-10"
            title="Delete Quest"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {/* NEW Badge */}
        {quest.isNew && !adminMode && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-red-500 text-white text-xs animate-pulse">NEW</Badge>
          </div>
        )}

        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{getQuestIcon(quest.requirements.type, quest.icon)}</div>
            <div>
              <h3 className="text-white font-semibold text-lg">{quest.title}</h3>
              <p className="text-gray-400 text-sm">{quest.description}</p>
            </div>
          </div>
          {isClaimed && <CheckCircle className="w-6 h-6 text-green-400" />}
        </div>

        {/* Quest Image */}
        {quest.imageUrl && (
          <div className="mb-4 rounded-lg overflow-hidden">
            <img src={quest.imageUrl} alt={quest.title} className="w-full h-32 object-cover" />
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Progress</span>
            <span className="text-white">
              {progress?.progress || 0} / {quest.requirements.count}
            </span>
          </div>

          <Progress value={progressPercentage} className="h-2" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {quest.difficulty && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  quest.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                  quest.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {quest.difficulty.charAt(0).toUpperCase() + quest.difficulty.slice(1)}
                </span>
              )}
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 font-medium">Reward: {quest.reward.xp} XP</span>
            </div>

            <div className="flex gap-2">
              {!progress && (
                <Button
                  onClick={() => handleStartQuest(quest.id)}
                  size="sm"
                  className="bg-teal-500 hover:bg-teal-600 text-black"
                >
                  Start
                </Button>
              )}

              {progress && !isCompleted && !isClaimed && (
                <Button
                  onClick={() => handleQuestAction(quest.id, quest.requirements.type)}
                  size="sm"
                  disabled={processingQuest === quest.id}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {processingQuest === quest.id ? "Processing..." : getActionText(quest.requirements.type)}
                  {quest.requirements.type === "login_streak" && (
                    <span className="ml-1 text-xs">(0.01 SOL)</span>
                  )}
                </Button>
              )}

              {canClaim && (
                <Button
                  onClick={() => handleClaimReward(progress.id)}
                  size="sm"
                  className="bg-green-500 hover:bg-green-600 text-black"
                >
                  Claim
                </Button>
              )}

              {isClaimed && (
                <Button size="sm" variant="outline" disabled>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Completed
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading || isLoadingQuests) {
    return (
      <ProtectedRoute requiresNFT={true}>
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
          <div className="text-white text-xl flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            Loading quests...
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiresNFT={true}>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
        <main className="py-12 px-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold text-white mb-4">
                Complete <span className="bg-gradient-to-r from-green-400 via-teal-400 to-blue-400 bg-clip-text text-transparent">Quests</span>
              </h1>
              <p className="text-xl text-gray-400">
                Complete tasks, earn XP, and climb the leaderboard to unlock exclusive rewards.
              </p>

              {/* Admin Badge & Create Button */}
              {adminMode && (
                <div className="mt-6 flex justify-center items-center gap-4">
                  <div className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full flex items-center gap-2">
                    <Crown className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-400 text-sm font-semibold">Admin Mode</span>
                  </div>
                  <Button
                    onClick={() => setCreateModalOpen(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg shadow-purple-500/25"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Quest
                  </Button>
                </div>
              )}
            </div>

            {/* User XP Progress */}
            {userXPData && (
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 mb-12 border border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center">
                      <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">Level {userXPData.level}</div>
                      <div className="text-gray-400">
                        {userXPData.currentLevelXP}/{userXPData.nextLevelXP} XP
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-3xl font-bold text-teal-400">
                      {userXPData.totalXP}/500
                    </div>
                    <div className="text-gray-400">Total XP</div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-yellow-400">
                      #{userXPData.rank || 532}
                    </div>
                    <div className="text-gray-400">Rank</div>
                  </div>
                </div>

                <div className="mt-4">
                  <Progress 
                    value={(userXPData.currentLevelXP / userXPData.nextLevelXP) * 100} 
                    className="h-3"
                  />
                </div>
              </div>
            )}

            {/* One-Time Quests */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="w-6 h-6 text-purple-400" />
                <h2 className="text-3xl font-bold text-white">
                  {adminMode ? "All Quests (Admin View)" : "One-Time Quests"}
                </h2>
                {customQuests.length > 0 && (
                  <span className="text-sm text-gray-400">
                    ({customQuests.length} custom)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {getMergedOneTimeQuests().map((quest) => (
                  <QuestCard key={quest.id} quest={quest} />
                ))}
              </div>
            </div>

            {/* Daily Quests */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <Zap className="w-6 h-6 text-blue-400" />
                <h2 className="text-3xl font-bold text-white">Daily Quests</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {dailyQuests.map((quest) => (
                  <QuestCard key={quest.id} quest={quest} />
                ))}
              </div>
            </div>

            {/* Weekly Quests */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Star className="w-6 h-6 text-yellow-400" />
                <h2 className="text-3xl font-bold text-white">Weekly Quests</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {weeklyQuests.map((quest) => (
                  <QuestCard key={quest.id} quest={quest} />
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* Create Quest Modal */}
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Plus className="w-5 h-5 text-purple-400" />
                </div>
                Create New Quest
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-gray-300">Quest Title *</Label>
                <Input
                  value={newQuest.title}
                  onChange={(e) => setNewQuest({...newQuest, title: e.target.value})}
                  placeholder="e.g., Follow on Twitter"
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                />
              </div>

              <div>
                <Label className="text-gray-300">Description</Label>
                <Input
                  value={newQuest.description}
                  onChange={(e) => setNewQuest({...newQuest, description: e.target.value})}
                  placeholder="Short description..."
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Icon (Emoji)</Label>
                  <Input
                    value={newQuest.icon}
                    onChange={(e) => setNewQuest({...newQuest, icon: e.target.value})}
                    placeholder="⭐"
                    className="bg-gray-800 border-gray-600 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">XP Reward *</Label>
                  <Input
                    type="number"
                    value={newQuest.xp}
                    onChange={(e) => setNewQuest({...newQuest, xp: e.target.value})}
                    placeholder="100"
                    className="bg-gray-800 border-gray-600 text-white mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-300">Action Link (URL) *</Label>
                <Input
                  type="url"
                  value={newQuest.link}
                  onChange={(e) => setNewQuest({...newQuest, link: e.target.value})}
                  placeholder="https://..."
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Users will be redirected here</p>
              </div>

              <div>
                <Label className="text-gray-300">Quest Image URL (Optional)</Label>
                <Input
                  type="url"
                  value={newQuest.imageUrl}
                  onChange={(e) => setNewQuest({...newQuest, imageUrl: e.target.value})}
                  placeholder="https://example.com/image.png"
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Difficulty</Label>
                  <select
                    value={newQuest.difficulty}
                    onChange={(e) => setNewQuest({...newQuest, difficulty: e.target.value as any})}
                    className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <Label className="text-gray-300">Category</Label>
                  <select
                    value={newQuest.category}
                    onChange={(e) => setNewQuest({...newQuest, category: e.target.value})}
                    className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white"
                  >
                    <option value="one_time">One-Time</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCreateModalOpen(false)}
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateQuest}
                  disabled={!newQuest.title || !newQuest.link}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold"
                >
                  Create Quest
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
