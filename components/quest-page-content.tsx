"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Star, Trophy, Zap, Plus, Trash2, Edit } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { useWallet } from "@/contexts/wallet-context"
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

// ==========================================
// CUSTOM QUESTS DATA - YEHAN NAYE QUESTS ADD KARO
// ==========================================
const CUSTOM_QUESTS = [
  // Existing quests (jo pehle se hain)
  {
    id: "bd-follow",
    title: "BD Follow",
    description: "Follow BD on X",
    icon: "👤",
    reward: { xp: 150 },
    requirements: { type: "bd_follow", count: 1 },
    actionLink: "https://x.com/thewajidmengal",
    category: "one_time"
  },
  {
    id: "engage-tweet",
    title: "Engage Tweet",
    description: "Like and retweet our latest announcement",
    icon: "❤️",
    reward: { xp: 150 },
    requirements: { type: "engage_tweet", count: 1 },
    actionLink: "https://x.com/RewardNFT_/status/1947059548101218766",
    category: "one_time"
  },
  {
    id: "follow-x",
    title: "Follow X (Twitter)",
    description: "Follow @RewardNFT_ on X",
    icon: "🐦",
    reward: { xp: 100 },
    requirements: { type: "follow_x", count: 1 },
    actionLink: "https://x.com/thewajidmengal",
    category: "one_time"
  },
  // ==========================================
  // NAYA QUEST YEHAN ADD KARO 👇
  // ==========================================
  {
    id: "join-discord",
    title: "Join Discord",
    description: "Join our Discord community for exclusive updates",
    icon: "💬",
    reward: { xp: 200 },
    requirements: { type: "join_discord", count: 1 },
    actionLink: "https://discord.gg/fZ7SDHeAtr",
    category: "one_time"
  },
  {
    id: "visit-website",
    title: "Visit Website",
    description: "Visit our official website",
    icon: "🌐",
    reward: { xp: 50 },
    requirements: { type: "visit_website", count: 1 },
    actionLink: "https://rewardnft.com",
    category: "one_time"
  },
  // Aur bhi add karo...
]

export function QuestPageContent() {
  const { publicKey } = useWallet()
  const [processingQuest, setProcessingQuest] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [questProgress, setQuestProgress] = useState<Record<string, any>>({})
  const [claimedQuests, setClaimedQuests] = useState<Set<string>>(new Set())
  
  // New quest form state
  const [newQuest, setNewQuest] = useState({
    title: "",
    description: "",
    icon: "⭐",
    xp: "100",
    link: "",
    type: "custom"
  })

  // ==========================================
  // QUEST ACTION HANDLER
  // ==========================================
  const handleQuestAction = async (questId: string, questType: string) => {
    setProcessingQuest(questId)
    const quest = CUSTOM_QUESTS.find(q => q.id === questId)
    
    if (!quest) {
      toast({ title: "Error", description: "Quest not found", variant: "destructive" })
      setProcessingQuest(null)
      return
    }

    try {
      // Open link in new tab
      window.open(quest.actionLink, "_blank")

      // Simulate completion after 3 seconds
      setTimeout(async () => {
        setQuestProgress(prev => ({
          ...prev,
          [questId]: { progress: 1, maxProgress: 1, status: "completed" }
        }))

        toast({
          title: "Quest Completed! 🎉",
          description: `You earned ${quest.reward.xp} XP! Click Claim to collect.`,
        })
        
        setProcessingQuest(null)
      }, 3000)

    } catch (error) {
      toast({ title: "Error", description: "Failed to complete quest", variant: "destructive" })
      setProcessingQuest(null)
    }
  }

  // ==========================================
  // CLAIM REWARD
  // ==========================================
  const handleClaimReward = (questId: string) => {
    const quest = CUSTOM_QUESTS.find(q => q.id === questId)
    setClaimedQuests(prev => new Set(prev).add(questId))
    
    toast({
      title: "Reward Claimed! 🎁",
      description: `${quest?.reward.xp} XP added to your account!`,
    })
  }

  // ==========================================
  // ADMIN: CREATE QUEST (Frontend only - localStorage me save)
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
      requirements: { type: newQuest.type, count: 1 },
      actionLink: newQuest.link,
      category: "one_time",
      isNew: true
    }

    // Save to localStorage (temporary)
    const existing = JSON.parse(localStorage.getItem('customQuests') || '[]')
    localStorage.setItem('customQuests', JSON.stringify([questData, ...existing]))
    
    toast({ title: "Quest Created!", description: "Refresh page to see it" })
    setCreateModalOpen(false)
    window.location.reload()
  }

  // ==========================================
  // ADMIN: DELETE QUEST
  // ==========================================
  const handleDeleteQuest = (questId: string) => {
    if (!isAdmin(publicKey?.toString())) return
    
    if (confirm("Delete this quest?")) {
      const hidden = JSON.parse(localStorage.getItem('hiddenQuests') || '[]')
      localStorage.setItem('hiddenQuests', JSON.stringify([...hidden, questId]))
      
      toast({ title: "Quest Deleted" })
      window.location.reload()
    }
  }

  // Get all quests (custom + localStorage)
  const getAllQuests = () => {
    const hidden = JSON.parse(localStorage.getItem('hiddenQuests') || '[]')
    const custom = JSON.parse(localStorage.getItem('customQuests') || '[]')
    
    return [...custom, ...CUSTOM_QUESTS].filter(q => !hidden.includes(q.id))
  }

  const allQuests = getAllQuests()
  const oneTimeQuests = allQuests.filter(q => q.category === "one_time")

  // ==========================================
  // QUEST CARD COMPONENT
  // ==========================================
  const QuestCard = ({ quest }: { quest: any }) => {
    const progress = questProgress[quest.id]
    const isCompleted = progress?.status === "completed"
    const isClaimed = claimedQuests.has(quest.id)

    return (
      <div className={`bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border transition-all duration-300 hover:bg-gray-800/80 ${
        isClaimed ? 'border-green-500/50 bg-green-900/20' : 'border-gray-700/50'
      }`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{quest.icon}</div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-semibold text-lg">{quest.title}</h3>
                {quest.isNew && (
                  <Badge className="bg-red-500 text-white text-xs">NEW</Badge>
                )}
              </div>
              <p className="text-gray-400 text-sm">{quest.description}</p>
            </div>
          </div>
          {isClaimed && <CheckCircle className="w-6 h-6 text-green-400" />}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Progress</span>
            <span className="text-white">
              {isCompleted || isClaimed ? 1 : 0} / 1
            </span>
          </div>
          
          <Progress value={isCompleted || isClaimed ? 100 : 0} className="h-2" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 font-medium">Reward: {quest.reward.xp} XP</span>
            </div>
            
            <div className="flex gap-2">
              {!isCompleted && !isClaimed && (
                <Button
                  onClick={() => handleQuestAction(quest.id, quest.requirements.type)}
                  disabled={processingQuest === quest.id}
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {processingQuest === quest.id ? "Processing..." : "Complete"}
                </Button>
              )}

              {isCompleted && !isClaimed && (
                <Button
                  onClick={() => handleClaimReward(quest.id)}
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

          {/* ADMIN CONTROLS */}
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
                Complete tasks, earn XP, and climb the leaderboard.
              </p>
              
              {/* ADMIN: Create Quest Button */}
              {isAdmin(publicKey?.toString()) && (
                <Button
                  onClick={() => setCreateModalOpen(true)}
                  className="mt-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-6 py-3 rounded-full"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Quest
                </Button>
              )}
            </div>

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
          </div>
        </main>

        {/* Create Quest Modal */}
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white">
                Create New Quest
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-gray-300">Quest Title</Label>
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
                  <Label className="text-gray-300">XP Reward</Label>
                  <Input
                    type="number"
                    value={newQuest.xp}
                    onChange={(e) => setNewQuest({...newQuest, xp: e.target.value})}
                    className="bg-gray-800 border-gray-600 text-white mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-300">Action Link (URL)</Label>
                <Input
                  type="url"
                  value={newQuest.link}
                  onChange={(e) => setNewQuest({...newQuest, link: e.target.value})}
                  placeholder="https://..."
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCreateModalOpen(false)}
                  className="flex-1 border-gray-600 text-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateQuest}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-blue-500 text-white font-semibold"
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


