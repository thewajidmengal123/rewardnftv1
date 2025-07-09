"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, Star, Trophy, Zap, ExternalLink } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { useQuestSystem } from "@/hooks/use-quest-system"
import { useWallet } from "@/contexts/wallet-context"
import { solPaymentService } from "@/services/sol-payment-service"
import { toast } from "@/components/ui/use-toast"

export function QuestPageContent() {
  const { signTransaction, publicKey } = useWallet()
  const [processingQuest, setProcessingQuest] = useState<string | null>(null)
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
          // Open Discord and mark as completed
          window.open("https://discord.gg/fZ7SDHeAtr", "_blank")

          // Wait a moment then mark as completed
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
          }, 3000) // 3 second delay to simulate Discord connection
          break

        case "follow_linkedin":
          // Open LinkedIn and mark as completed
          window.open("https://www.linkedin.com/company/rewardnft", "_blank")

          // Wait a moment then mark as completed
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

        case "engage_tweet":
          // Open specific tweet for engagement
          window.open("https://x.com/RewardNFT_/status/1933524613067137437", "_blank")

          // Wait a moment then mark as completed
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
          // Open X profile and mark as completed
          window.open("https://x.com/RewardNFT_", "_blank")

          // Wait a moment then mark as completed
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
          // Open Telegram and mark as completed
          window.open("https://t.me/rewardsNFT", "_blank")

          // Wait a moment then mark as completed
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
          // Handle SOL payment for daily login using improved service
          try {
            const paymentResult = await solPaymentService.processPayment(publicKey, 0.01, signTransaction)

            if (paymentResult.success) {
              // Record payment in treasury API
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

              // Update quest progress with verification
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
          // Open Twitter share dialog
          const tweetText = encodeURIComponent("Just completed a quest on RewardNFT! 🚀 Earning XP and climbing the leaderboard! #RewardNFT #NFT #Solana #Web3 @RewardNFT_")
          const tweetUrl = `https://x.com/intent/tweet?text=${tweetText}`
          window.open(tweetUrl, "_blank")

          // Mark as completed after opening Twitter
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
          // Check current referral count and update progress based on actual referrals
          try {
            console.log(`👥 Checking referral quest for wallet: ${publicKey.toString()}`)

            // Get current user's referral count from Firebase
            const userResponse = await fetch(`/api/users?wallet=${publicKey.toString()}`)
            const userData = await userResponse.json()

            if (userData.success) {
              const referralCount = userData.data?.totalReferrals || 0
              const targetReferrals = 3
              console.log(`👥 Current referral count: ${referralCount}/${targetReferrals}`)

              // Get current quest progress to calculate the correct increment
              const currentProgressResponse = await fetch(`/api/quests?wallet=${publicKey.toString()}&action=get-user-progress`)
              const currentProgressResult = await currentProgressResponse.json()

              let currentProgress = 0
              if (currentProgressResult.success) {
                const questProgress = currentProgressResult.data.find((progress: any) =>
                  progress.questId === questId
                )
                currentProgress = questProgress?.progress || 0
              }

              // Calculate the exact progress needed and the increment
              const targetProgress = Math.min(referralCount, targetReferrals)
              const progressIncrement = Math.max(0, targetProgress - currentProgress)
              const isCompleted = referralCount >= targetReferrals

              console.log(`👥 Referral quest progress: current=${currentProgress}, target=${targetProgress}, increment=${progressIncrement}, completed=${isCompleted}`)

              // Update quest progress with the calculated increment
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
          // Store quest ID in localStorage and redirect to mini-game
          localStorage.setItem('pendingQuestId', questId)
          window.location.href = "/mini-game"
          break

        case "join_community_call":
          // Open Discord community and mark as completed
          window.open("https://discord.gg/fZ7SDHeAtr", "_blank")

          // Mark as completed after opening Discord
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
        default: return "Complete this quest to earn rewards"
      }
    }

    return (
      <div className={`bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border transition-all duration-300 hover:bg-gray-800/80 ${
        isCompleted ? 'border-green-500/50 bg-green-900/20' : 'border-gray-700/50'
      }`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{getQuestIcon(quest.requirements.type)}</div>
            <div>
              <h3 className="text-white font-semibold text-lg">{quest.title}</h3>
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
                {oneTimeQuests.map((quest) => (
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
      </div>
    </ProtectedRoute>
  )
}


