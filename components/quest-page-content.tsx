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
  Loader2,
  Target,
  Gamepad2,
  Users,
  Calendar,
  TrendingUp,
  Award,
  Gem
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
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp,
  updateDoc
} from "firebase/firestore"
import { db } from "@/lib/firebase"

// ==========================================
// ADMIN CONFIGURATION
// ==========================================
const ADMIN_WALLET_ADDRESS = "6nHPbBNxh31qpKfLrs3WzzDGkDjmQYQGuVsh9qB7VLBQ"

const isAdmin = (walletAddress: string | null | undefined): boolean => {
  if (!walletAddress) return false
  return walletAddress === ADMIN_WALLET_ADDRESS
}

// ==========================================
// TYPES
// ==========================================
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

type FilterType = "all" | "social" | "gaming" | "daily"

// ==========================================
// MAIN COMPONENT
// ==========================================
export function QuestPageContent() {
  const { signTransaction, publicKey } = useWallet()
  const [processingQuest, setProcessingQuest] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [customQuests, setCustomQuests] = useState<Quest[]>([])
  const [isLoadingQuests, setIsLoadingQuests] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
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

  // FIREBASE: REAL-TIME SYNC
  useEffect(() => {
    const questsRef = collection(db, "quests")
    const q = query(questsRef, orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const quests: Quest[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        
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

  // STATS CALCULATION
  const stats = {
    totalXP: userXPData?.totalXP || 0,
    questsCompleted: userXPData?.completedQuests || 0,
    totalQuests: 48,
    currentRank: userXPData?.rank || 142,
    nftsEarned: 3
  }

  // FILTER QUESTS
  const getFilteredQuests = useCallback((quests: any[]) => {
    if (activeFilter === "all") return quests
    return quests.filter(quest => {
      const type = quest.requirements?.type || ""
      switch (activeFilter) {
        case "social":
          return ["connect_discord", "follow_linkedin", "follow_x", "join_telegram", "engage_tweet", "share_twitter"].includes(type)
        case "gaming":
          return ["play_minigame"].includes(type)
        case "daily":
          return ["login_streak"].includes(type) || quest.category === "daily"
        default:
          return true
      }
    })
  }, [activeFilter])

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
        description: "Failed to create quest.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteQuest = async (questId: string) => {
    if (typeof window !== 'undefined' && confirm("Delete this quest?")) {
      try {
        await updateDoc(doc(db, "quests", questId), {
          isActive: false,
          deletedAt: serverTimestamp(),
          deletedBy: publicKey?.toString()
        })
        toast({ title: "✅ Quest Deleted", description: "Quest removed for all users" })
      } catch (error) {
        toast({ title: "Error", description: "Failed to delete quest", variant: "destructive" })
      }
    }
  }

  const getMergedOneTimeQuests = useCallback(() => {
    const seen = new Set()
    return [...customQuests, ...oneTimeQuests].filter(quest => {
      if (seen.has(quest.id)) return false
      seen.add(quest.id)
      return true
    })
  }, [customQuests, oneTimeQuests])

  const handleStartQuest = async (questId: string) => {
    const success = await startQuest(questId)
    if (success) {
      toast({ title: "Quest Started!", description: "Good luck!" })
    } else {
      toast({ title: "Error", description: error || "Failed to start", variant: "destructive" })
    }
  }

  const handleClaimReward = async (progressId: string) => {
    const success = await claimQuestReward(progressId)
    if (success) {
      toast({ title: "🎉 Reward Claimed!", description: "XP added to your account!" })
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
            await updateQuestProgress(questId, 1, { customCompleted: true, timestamp: Date.now() })
            toast({ title: "✅ Completed!", description: `+${quest.reward.xp} XP earned!` })
          }, 3000)
        }
        setProcessingQuest(null)
        return
      }

      const actions: Record<string, () => Promise<void>> = {
        connect_discord: async () => {
          window.open("https://discord.gg/fZ7SDHeAtr", "_blank")
          setTimeout(async () => {
            await updateQuestProgress(questId, 1, { discordConnected: true })
            toast({ title: "Discord Connected!", description: "+100 XP" })
          }, 3000)
        },
        follow_linkedin: async () => {
          window.open("https://www.linkedin.com/company/rewardnft", "_blank")
          setTimeout(async () => {
            await updateQuestProgress(questId, 1, { linkedinFollowed: true })
            toast({ title: "LinkedIn Followed!", description: "+100 XP" })
          }, 3000)
        },
        follow_x: async () => {
          window.open("https://x.com/thewajidmengal", "_blank")
          setTimeout(async () => {
            await updateQuestProgress(questId, 1, { xFollowed: true })
            toast({ title: "X Followed!", description: "+100 XP" })
          }, 3000)
        },
        join_telegram: async () => {
          window.open("https://t.me/rewardsNFT", "_blank")
          setTimeout(async () => {
            await updateQuestProgress(questId, 1, { telegramJoined: true })
            toast({ title: "Telegram Joined!", description: "+100 XP" })
          }, 3000)
        },
        engage_tweet: async () => {
          window.open("https://x.com/RewardNFT_/status/1947059548101218766", "_blank")
          setTimeout(async () => {
            await updateQuestProgress(questId, 1, { tweetEngaged: true })
            toast({ title: "Tweet Engaged!", description: "+150 XP" })
          }, 3000)
        },
        share_twitter: async () => {
          const text = encodeURIComponent("Just completed a quest on RewardNFT! 🚀 #RewardNFT #Solana")
          window.open(`https://x.com/intent/tweet?text=${text}`, "_blank")
          setTimeout(async () => {
            await updateQuestProgress(questId, 1, { sharedAt: Date.now() })
            toast({ title: "Shared!", description: "+75 XP" })
          }, 2000)
        },
        play_minigame: async () => {
          localStorage.setItem('pendingQuestId', questId)
          window.location.href = "/mini-game"
        },
        login_streak: async () => {
          const result = await solPaymentService.processPayment(publicKey, 0.01, signTransaction)
          if (result.success) {
            await updateQuestProgress(questId, 1, { solPaymentSignature: result.signature })
            toast({ title: "Daily Login!", description: "0.01 SOL paid! +100 XP" })
          }
        }
      }

      if (actions[questType]) await actions[questType]()
      else await updateQuestProgress(questId, 1)
    } catch (error) {
      console.error(error)
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

    const getDifficultyColor = (diff?: string) => {
      switch (diff) {
        case "easy": return "from-green-400 to-emerald-500"
        case "medium": return "from-yellow-400 to-orange-500"
        case "hard": return "from-red-400 to-pink-500"
        default: return "from-blue-400 to-purple-500"
      }
    }

    const getIconBg = (type: string) => {
      switch (type) {
        case "connect_discord": return "bg-indigo-500/20 text-indigo-400"
        case "follow_linkedin": return "bg-blue-500/20 text-blue-400"
        case "follow_x": return "bg-sky-500/20 text-sky-400"
        case "join_telegram": return "bg-cyan-500/20 text-cyan-400"
        case "engage_tweet": return "bg-pink-500/20 text-pink-400"
        case "share_twitter": return "bg-sky-500/20 text-sky-400"
        case "play_minigame": return "bg-purple-500/20 text-purple-400"
        case "login_streak": return "bg-orange-500/20 text-orange-400"
        default: return "bg-gradient-to-br from-pink-500/20 to-purple-500/20 text-pink-400"
      }
    }

    return (
      <div className={`group relative bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/30 hover:border-gray-600/50 transition-all duration-300 hover:transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10 overflow-hidden ${
        isCompleted ? 'border-green-500/30' : ''
      }`}>
        {/* Top Gradient Border */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getDifficultyColor(quest.difficulty)} opacity-80`} />
        
        {/* Admin Delete */}
        {adminMode && isCustomQuest && (
          <button
            onClick={() => handleDeleteQuest(quest.id)}
            className="absolute top-3 right-3 p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors z-10 opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {/* NEW Badge */}
        {quest.isNew && !adminMode && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg shadow-pink-500/25">
              NEW
            </Badge>
          </div>
        )}

        <div className="flex items-start gap-4 mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${getIconBg(quest.requirements?.type)} shadow-lg`}>
            {quest.icon || "⭐"}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-lg mb-1 truncate">{quest.title}</h3>
            <p className="text-gray-400 text-sm line-clamp-2">{quest.description}</p>
          </div>
        </div>

        {/* Progress Section */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-gray-500 uppercase tracking-wider font-medium">Progress</span>
            <span className="text-white font-semibold">{progress?.progress || 0} / {quest.requirements?.count || 1}</span>
          </div>
          <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 bg-gradient-to-r ${getDifficultyColor(quest.difficulty)}`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {quest.difficulty && (
              <span className={`text-xs px-3 py-1 rounded-full bg-gradient-to-r ${getDifficultyColor(quest.difficulty)} bg-opacity-20 text-white font-medium border border-white/10`}>
                {quest.difficulty.charAt(0).toUpperCase() + quest.difficulty.slice(1)}
              </span>
            )}
            <div className="flex items-center gap-1 text-yellow-400">
              <Zap className="w-4 h-4 fill-yellow-400" />
              <span className="font-bold text-sm">{quest.reward?.xp || 0} XP</span>
            </div>
          </div>

          <div>
            {!progress && (
              <Button
                onClick={() => handleStartQuest(quest.id)}
                size="sm"
                className="bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-500 hover:to-emerald-600 text-black font-semibold rounded-xl px-6 shadow-lg shadow-teal-500/25 transition-all hover:scale-105"
              >
                Start →
              </Button>
            )}

            {progress && !isCompleted && !isClaimed && (
              <Button
                onClick={() => handleQuestAction(quest.id, quest.requirements?.type)}
                size="sm"
                disabled={processingQuest === quest.id}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold rounded-xl px-6 shadow-lg shadow-blue-500/25 transition-all hover:scale-105"
              >
                {processingQuest === quest.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>Go <ExternalLink className="w-3 h-3 ml-1" /></>
                )}
              </Button>
            )}

            {canClaim && (
              <Button
                onClick={() => handleClaimReward(progress.id)}
                size="sm"
                className="bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-black font-semibold rounded-xl px-6 shadow-lg shadow-green-500/25 transition-all hover:scale-105 animate-pulse"
              >
                Claim
              </Button>
            )}

            {isClaimed && (
              <div className="flex items-center gap-2 text-green-400 font-semibold text-sm">
                <CheckCircle className="w-5 h-5" />
                Done
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // STAT CARD COMPONENT
  const StatCard = ({ icon: Icon, label, value, subValue, gradient }: any) => (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative bg-gradient-to-br from-gray-900/90 to-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/30 hover:border-gray-600/50 transition-all">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="text-gray-400 text-sm font-medium mb-1">{label}</div>
        <div className="text-2xl font-bold text-white mb-1">{value}</div>
        {subValue && <div className="text-xs text-gray-500">{subValue}</div>}
      </div>
    </div>
  )

  if (loading || isLoadingQuests) {
    return (
      <ProtectedRoute requiresNFT={true}>
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
          <div className="text-white text-xl flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
            Loading quests...
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const mergedOneTime = getMergedOneTimeQuests()
  const filteredOneTime = getFilteredQuests(mergedOneTime)

  return (
    <ProtectedRoute requiresNFT={true}>
      <div className="min-h-screen bg-[#0a0a0f] text-white pb-20">
        {/* Background Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
        </div>

        <main className="relative z-10 pt-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/50 border border-gray-700/50 mb-6">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm text-gray-300">Complete quests to earn rewards</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-4">
                Complete <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">Quests</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Complete tasks, earn XP, and climb the leaderboard to unlock exclusive rewards and NFTs
              </p>

              {/* Admin Controls */}
              {adminMode && (
                <div className="mt-8 flex justify-center items-center gap-4">
                  <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full flex items-center gap-2">
                    <Crown className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-400 text-sm font-semibold">Admin Mode</span>
                  </div>
                  <Button
                    onClick={() => setCreateModalOpen(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg shadow-purple-500/25 transition-all hover:scale-105"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Quest
                  </Button>
                </div>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              <StatCard 
                icon={Trophy} 
                label="Total XP Earned" 
                value={stats.totalXP.toLocaleString()}
                gradient="from-orange-400 to-red-500"
              />
              <StatCard 
                icon={Target} 
                label="Quests Completed" 
                value={`${stats.questsCompleted}/${stats.totalQuests}`}
                gradient="from-blue-400 to-indigo-500"
              />
              <StatCard 
                icon={Award} 
                label="Current Rank" 
                value={`#${stats.currentRank}`}
                gradient="from-purple-400 to-pink-500"
              />
              <StatCard 
                icon={Gem} 
                label="NFTs Earned" 
                value={stats.nftsEarned}
                gradient="from-emerald-400 to-teal-500"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {[
                { id: "all", label: "All Quests", icon: Target },
                { id: "social", label: "Social", icon: Users },
                { id: "gaming", label: "Gaming", icon: Gamepad2 },
                { id: "daily", label: "Daily", icon: Calendar },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id as FilterType)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
                    activeFilter === filter.id
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25 scale-105"
                      : "bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white border border-gray-700/30"
                  }`}
                >
                  <filter.icon className="w-4 h-4" />
                  {filter.label}
                </button>
              ))}
            </div>

            {/* One-Time Quests */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">One-Time Quests</h2>
                <span className="text-gray-500 text-sm">({filteredOneTime.length})</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredOneTime.map((quest) => (
                  <QuestCard key={quest.id} quest={quest} />
                ))}
              </div>
            </div>

            {/* Daily Quests */}
            {activeFilter !== "social" && activeFilter !== "gaming" && (
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Daily Quests</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {dailyQuests.map((quest) => (
                    <QuestCard key={quest.id} quest={quest} />
                  ))}
                </div>
              </div>
            )}

            {/* Weekly Quests */}
            {activeFilter === "all" && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Weekly Quests</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {weeklyQuests.map((quest) => (
                    <QuestCard key={quest.id} quest={quest} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Create Quest Modal */}
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogContent className="bg-[#0f0f14] border-gray-700/50 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                Create New Quest
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-gray-400 text-sm">Quest Title *</Label>
                <Input
                  value={newQuest.title}
                  onChange={(e) => setNewQuest({...newQuest, title: e.target.value})}
                  placeholder="e.g., Follow on Twitter"
                  className="bg-gray-900/50 border-gray-700 text-white mt-1 focus:border-purple-500"
                />
              </div>

              <div>
                <Label className="text-gray-400 text-sm">Description</Label>
                <Input
                  value={newQuest.description}
                  onChange={(e) => setNewQuest({...newQuest, description: e.target.value})}
                  placeholder="Short description..."
                  className="bg-gray-900/50 border-gray-700 text-white mt-1 focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400 text-sm">Icon (Emoji)</Label>
                  <Input
                    value={newQuest.icon}
                    onChange={(e) => setNewQuest({...newQuest, icon: e.target.value})}
                    placeholder="⭐"
                    className="bg-gray-900/50 border-gray-700 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-400 text-sm">XP Reward *</Label>
                  <Input
                    type="number"
                    value={newQuest.xp}
                    onChange={(e) => setNewQuest({...newQuest, xp: e.target.value})}
                    placeholder="100"
                    className="bg-gray-900/50 border-gray-700 text-white mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-400 text-sm">Action Link (URL) *</Label>
                <Input
                  type="url"
                  value={newQuest.link}
                  onChange={(e) => setNewQuest({...newQuest, link: e.target.value})}
                  placeholder="https://..."
                  className="bg-gray-900/50 border-gray-700 text-white mt-1"
                />
              </div>

              <div>
                <Label className="text-gray-400 text-sm">Quest Image URL (Optional)</Label>
                <Input
                  type="url"
                  value={newQuest.imageUrl}
                  onChange={(e) => setNewQuest({...newQuest, imageUrl: e.target.value})}
                  placeholder="https://example.com/image.png"
                  className="bg-gray-900/50 border-gray-700 text-white mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400 text-sm">Difficulty</Label>
                  <select
                    value={newQuest.difficulty}
                    onChange={(e) => setNewQuest({...newQuest, difficulty: e.target.value as any})}
                    className="w-full mt-1 px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:border-purple-500 outline-none"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <Label className="text-gray-400 text-sm">Category</Label>
                  <select
                    value={newQuest.category}
                    onChange={(e) => setNewQuest({...newQuest, category: e.target.value})}
                    className="w-full mt-1 px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:border-purple-500 outline-none"
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
                  className="flex-1 border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white"
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
