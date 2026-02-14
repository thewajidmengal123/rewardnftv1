"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, Star, Trophy, Zap, ExternalLink, Plus, Trash2 } from "lucide-react"
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

// ==========================================
// ADMIN CONFIG - YEHAN APNI WALLET ADDRESS DALO
// ==========================================
const ADMIN_WALLET_ADDRESS = "6nHPbBNxh31qpKfLrs3WzzDGkDjmQYQGuVsh9qB7VLBQ"

const isAdmin = (walletAddress: string | null | undefined): boolean => {
  if (!walletAddress) return false
  return walletAddress === ADMIN_WALLET_ADDRESS
}

export function QuestPageContent() {
  const { signTransaction, publicKey } = useWallet()
  const [processingQuest, setProcessingQuest] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newQuest, setNewQuest] = useState({
    title: "",
    description: "",
    icon: "⭐",
    xp: "100",
    link: "",
    type: "custom"
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

  const handleStartQuest = async (questId: string) => {
    const success = await startQuest(questId)
    if (success) {
      toast({
        title: "Quest Started",
        description: "You've started this quest!",
      })
    } else {
      toast({
        title: "Error",
        description: error || "Failed to start quest",
        variant: "destructive",
      })
    }
  }

  const handleClaimReward = async (progressId: string) => {
    const success = await claimQuestReward(progressId)
    if (success) {
      toast({
        title: "Reward Claimed!",
        description: "XP has been added to your account",
      })
    } else {
      toast({
        title: "Error",
        description: error || "Failed to claim reward",
        variant: "destructive",
      })
    }
  }

  // Handle specific quest actions
  const handleQuestAction = async (questId: string, questType: string) => {
    if (!publicKey || !signTransaction) return

    setProcessingQuest(questId)

    try {
      switch (questType) {
        case "connect_discord":
          window.open("https://discord.gg/fZ7SDHeAtr", "_blank")
          setTimeout(async () => {
            const success = await updateQuestProgress(questId, 1, {
              discordConnected: true,
              timestamp: Date.now()
            })
            if (success) {
              toast({
                title: "Discord Connected!",
                description: "Quest completed! You earned 100 XP",
              })
            }
          }, 3000)
          break

        case "follow_linkedin":
          window.open("https://www.linkedin.com/company/rewardnft", "_blank")
          setTimeout(async () => {
            const success = await updateQuestProgress(questId, 1, {
              linkedinFollowed: true,
              timestamp: Date.now()
            })
            if (success) {
              toast({
                title: "LinkedIn Followed!",
                description: "Quest completed! You earned 100 XP",
              })
            }
          }, 3000)
          break

        case "BD Follow":
          window.open("https://x.com/thewajidmengal", "_blank")
          setTimeout(async () => {
            const success = await updateQuestProgress(questId, 1, {
              tweetEngaged: true,
              timestamp: Date.now()
            })
            if (success) {
              toast({
                title: "Follow Now!",
                description: "Quest completed! You earned 150 XP",
              })
            }
          }, 3000)
          break

        case "engage_tweet":
          window.open("https://x.com/RewardNFT_/status/1947059548101218766", "_blank")
          setTimeout(async () => {
            const success = await updateQuestProgress(questId, 1, {
              tweetEngaged: true,
              timestamp: Date.now()
            })
            if (success) {
              toast({
                title: "Tweet Engaged!",
                description: "Quest completed! You earned 150 XP",
              })
            }
          }, 3000)
          break
          
        case "follow_x":
          window.open("https://x.com/thewajidmengal", "_blank")
          setTimeout(async () => {
            const success = await updateQuestProgress(questId, 1, {
              xFollowed: true,
              timestamp: Date.now()
            })
            if (success) {
              toast({
                title: "X Followed!",
                description: "Quest completed! You earned 100 XP",
              })
            }
          }, 3000)
          break
          
        case "join_telegram":
          window.open("https://t.me/rewardsNFT", "_blank")
          setTimeout(async () => {
            const success = await updateQuestProgress(questId, 1, {
              telegramJoined: true,
              timestamp: Date.now()
            })
            if (success) {
              toast({
                title: "Telegram Joined!",
                description: "Quest completed! You earned 100 XP",
              })
            }
          }, 3000)
          break

        case "login_streak":
          try {
            const paymentResult = await solPaymentService.processPayment(publicKey, 0.01, signTransaction)
            if (paymentResult.success) {
              try {
                await fetch('/api/treasury/sol-payments', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    walletAddress: publicKey.toString(),
                    signature: paymentResult.signature,
                    amount: 0.01,
                    questId,
                    treasuryWallet: solPaymentService.treasuryWalletAddress
                  })
                })
              } catch (recordError) {
                console.warn("Failed to record payment in treasury API:", recordError)
              }

              const success = await updateQuestProgress(questId, 1, {
                solPaymentSignature: paymentResult.signature,
                amount: 0.01,
                verified: true,
                treasuryWallet: solPaymentService.treasuryWalletAddress
              })

              if (success) {
                toast({
                  title: "Daily Login Complete!",
                  description: `0.01 SOL paid successfully to treasury! You earned 100 XP`,
                })
              }
            } else {
              throw new Error(paymentResult.error || "Payment failed")
            }
          } catch (error) {
            console.error("Payment error:", error)
            toast({
              title: "Payment Failed",
              description: "Failed to process SOL payment. Please try again.",
              variant: "destructive",
            })
          }
          break

        case "share_twitter":
          const tweetText = encodeURIComponent("Just completed a quest on RewardNFT! 🚀 Earning XP and climbing the leaderboard! #RewardNFT #NFT #Solana #Web3 @RewardNFT_")
          const tweetUrl = `https://x.com/intent/tweet?text=${tweetText}`
          window.open(tweetUrl, "_blank")

          setTimeout(async () => {
            const success = await updateQuestProgress(questId, 1, {
              twitterShareUrl: tweetUrl,
              sharedAt: Date.now()
            })
            if (success) {
              toast({
                title: "Twitter Share Complete!",
                description: "Quest completed! You earned 75 XP",
              })
            }
          }, 2000)
          break

        case "refer_friends":
          try {
            console.log(`👥 Checking referral quest for wallet: ${publicKey.toString()}`)
            const userResponse = await fetch(`/api/users?wallet=${publicKey.toString()}`)
            const userData = await userResponse.json()

            if (userData.success) {
              const referralCount = userData.data?.totalReferrals || 0
              const targetReferrals = 3
              console.log(`👥 Current referral count: ${referralCount}/${targetReferrals}`)

              const currentProgressResponse = await fetch(`/api/quests?wallet=${publicKey.toString()}&action=get-user-progress`)
              const currentProgressResult = await currentProgressResponse.json()

              let currentProgress = 0
              if (currentProgressResult.success) {
                const questProgress = currentProgressResult.data.find((progress: any) =>
                  progress.questId === questId
                )
                currentProgress = questProgress?.progress || 0
              }

              const targetProgress = Math.min(referralCount, targetReferrals)
              const progressIncrement = Math.max(0, targetProgress - currentProgress)
              const isCompleted = referralCount >= targetReferrals

              console.log(`👥 Referral quest progress: current=${currentProgress}, target=${targetProgress}, increment=${progressIncrement}, completed=${isCompleted}`)

              const success = await updateQuestProgress(questId, progressIncrement, {
                referralCount: referralCount,
                targetReferrals: targetReferrals,
                verified: true,
                lastUpdated: Date.now(),
                currentProgress: currentProgress,
                targetProgress: targetProgress
              })

              if (success) {
                if (isCompleted) {
                  toast({
                    title: "🎉 Referral Quest Complete!",
                    description: `You have ${referralCount} referrals! Quest completed! You earned 500 XP!`,
                  })
                } else {
                  toast({
                    title: "📊 Referral Progress Updated",
                    description: `You have ${referralCount}/${targetReferrals} referrals. Refer ${targetReferrals - referralCount} more friends to complete this quest.`,
                  })
                }
              } else {
                toast({
                  title: "Quest Update Failed",
                  description: "Failed to update quest progress. Please try again.",
                  variant: "destructive",
                })
              }
            } else {
              console.error("Failed to fetch user data:", userData.error)
              toast({
                title: "Error",
                description: "Failed to fetch referral data. Please try again.",
                variant: "destructive",
              })
            }
          } catch (error) {
            console.error("Referral check error:", error)
            toast({
              title: "Error",
              description: "Failed to check referral count",
              variant: "destructive",
            })
          }
          break

        case "play_minigame":
          localStorage.setItem('pendingQuestId', questId)
          window.location.href = "/mini-game"
          break

        case "join_community_call":
          window.open("https://discord.gg/fZ7SDHeAtr", "_blank")
          setTimeout(async () => {
            const success = await updateQuestProgress(questId, 1, {
              attendanceVerified: true,
              joinedAt: Date.now()
            })
            if (success) {
              toast({
                title: "Community Call Joined!",
                description: "Quest completed! You earned 200 XP",
              })
            }
          }, 3000)
          break

        // ==========================================
        // ADMIN: NEW CUSTOM QUESTS YEHAN ADD KARO
        // ==========================================
        case "custom_quest":
          const customQuest = getCustomQuestById(questId)
          if (customQuest) {
            window.open(customQuest.actionLink, "_blank")
            setTimeout(async () => {
              const success = await updateQuestProgress(questId, 1, {
                customCompleted: true,
                timestamp: Date.now()
              })
              if (success) {
                toast({
                  title: "Quest Completed!",
                  description: `You earned ${customQuest.reward.xp} XP`,
                })
              }
            }, 3000)
          }
          break

        default:
          await updateQuestProgress(questId, 1)
      }
    } catch (error) {
      console.error("Quest action error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to complete quest action",
        variant: "destructive",
      })
    } finally {
      setProcessingQuest(null)
    }
  }

  // ==========================================
  // CUSTOM QUESTS HELPERS
  // ==========================================
  const getCustomQuests = () => {
    if (typeof window === 'undefined') return []
    return JSON.parse(localStorage.getItem('customQuests') || '[]')
  }

  const getCustomQuestById = (id: string) => {
    return getCustomQuests().find((q: any) => q.id === id)
  }

  const getHiddenQuests = () => {
    if (typeof window === 'undefined') return []
    return JSON.parse(localStorage.getItem('hiddenQuests') || '[]')
  }

  // ==========================================
  // ADMIN: CREATE QUEST
  // ==========================================
  const handleCreateQuest = () => {
    if (!isAdmin(publicKey?.toString())) {
      toast({ title: "Unauthorized", variant: "destructive" })
      return
    }

    const questData = {
      id: `custom-${Date.now()}`,
      title: newQuest.title,
      description: newQuest.description,
      icon: newQuest.icon,
      reward: { xp: parseInt(newQuest.xp) || 100 },
      requirements: { type: "custom_quest", count: 1 },
      actionLink: newQuest.link,
      category: "one_time",
      isNew: true
    }

    const existing = getCustomQuests()
    localStorage.setItem('customQuests', JSON.stringify([questData, ...existing]))
    
    toast({ title: "Quest Created!", description: "Refresh page to see it" })
    setCreateModalOpen(false)
    setNewQuest({ title: "", description: "", icon: "⭐", xp: "100", link: "", type: "custom" })
    window.location.reload()
  }

  // ==========================================
  // ADMIN: DELETE QUEST
  // ==========================================
  const handleDeleteQuest = (questId: string) => {
    if (!isAdmin(publicKey?.toString())) return
    
    if (confirm("Delete this quest?")) {
      const hidden = getHiddenQuests()
      localStorage.setItem('hiddenQuests', JSON.stringify([...hidden, questId]))
      toast({ title: "Quest Deleted" })
      window.location.reload()
    }
  }

  // ==========================================
  // MERGE CUSTOM QUESTS WITH EXISTING QUESTS
  // ==========================================
  const getMergedOneTimeQuests = () => {
    const custom = getCustomQuests()
    const hidden = getHiddenQuests()
    const visibleCustom = custom.filter((q: any) => !hidden.includes(q.id))
    
    // Add custom quests to oneTimeQuests
    return [...visibleCustom, ...oneTimeQuests].filter((q: any) => !hidden.includes(q.id))
  }

  const QuestCard = ({ quest }: { quest: any }) => {
    const progress = getQuestProgress(quest.id)
    const progressPercentage = progress ? (progress.progress / progress.maxProgress) * 100 : 0
    const isCompleted = progress?.status === "completed"
    const isClaimed = progress?.status === "claimed"
    const canClaim = isCompleted && !isClaimed

    const getQuestIcon = (questType: string) => {
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
        case "custom_quest": return quest.icon || "⭐"
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

    const getQuestDescription = (questType: string, requirements: any) => {
      switch (questType) {
        case "connect_discord": return "Click to open Discord and connect"
        case "login_streak": return "Pay 0.01 SOL to treasury to complete daily login"
        case "share_twitter": return "Share on Twitter with #RewardNFT hashtag"
        case "refer_friends": return `Get ${requirements.count} friends to mint NFTs`
        case "play_minigame": return `Score ${requirements.count}+ points in mini-game`
        case "join_community_call": return "Join our Discord community"
        case "follow_linkedin": return "Follow RewardNFT on LinkedIn for updates"
        case "engage_tweet": return "Like and retweet our latest announcement"
        case "follow_x": return "Follow @RewardNFT_ on X (Twitter)"
        case "join_telegram": return "Join our Telegram community"
        case "custom_quest": return quest.description || "Complete this quest to earn rewards"
        default: return "Complete this quest to earn rewards"
      }
    }

    return (
      <div className={`bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border transition-all duration-300 hover:bg-gray-800/80 ${
        isClaimed ? 'border-green-500/50 bg-green-900/20' : 'border-gray-700/50'
      }`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{getQuestIcon(quest.requirements.type)}</div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-semibold text-lg">{quest.title}</h3>
                {quest.isNew && (
                  <Badge className="bg-red-500 text-white text-xs">NEW</Badge>
                )}
              </div>
              <p className="text-gray-400 text-sm">{quest.description}</p>
              <p className="text-gray-500 text-xs italic mt-1">{getQuestDescription(quest.requirements.type, quest.requirements)}</p>
            </div>
          </div>
          {isClaimed && <CheckCircle className="w-6 h-6 text-green-400" />}
        </div>

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

          {/* ========================================== */}
          {/* ADMIN CONTROLS - Only visible to admin */}
          {/* ========================================== */}
          {isAdmin(publicKey?.toString()) && (
            <div className="mt-4 pt-3 border-t border-gray-700/50 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                onClick={() => handleDeleteQuest(quest.id)}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <ProtectedRoute requiresNFT={true}>
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
          <div className="text-white text-xl">Loading quests...</div>
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
              
              {/* ========================================== */}
              {/* ADMIN: Create Quest Button */}
              {/* ========================================== */}
              {isAdmin(publicKey?.toString()) && (
                <Button
                  onClick={() => setCreateModalOpen(true)}
                  className="mt-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg shadow-purple-500/25"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Quest
                </Button>
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
                <h2 className="text-3xl font-bold text-white">One-Time Quests</h2>
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

        {/* ========================================== */}
        {/* Create Quest Modal */}
        {/* ========================================== */}
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white">
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
                  required
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
                    required
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
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Users will be redirected here</p>
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
                  className="flex-1 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white font-semibold"
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
