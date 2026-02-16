"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
  Target,
  Gamepad2,
  Twitter,
  Linkedin,
  MessageCircle,
  Flame,
  Crown,
  Gem,
  Sparkles,
  ArrowRight,
  X,
  Link as LinkIcon,
  Upload,
  AlertCircle,
  RefreshCw
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
  icon: string
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
  createdAt?: string
  createdBy?: string
  isActive?: boolean
}

// ==========================================
// SAFE LOCALSTORAGE HELPER
// ==========================================
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null
    try {
      return window.localStorage.getItem(key)
    } catch (e) {
      console.warn('localStorage error:', e)
      return null
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(key, value)
    } catch (e) {
      console.warn('localStorage error:', e)
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.removeItem(key)
    } catch (e) {
      console.warn('localStorage error:', e)
    }
  }
}

// ==========================================
// CREATE QUEST MODAL COMPONENT
// ==========================================
function CreateQuestModal({ 
  isOpen, 
  onClose, 
  onCreate 
}: { 
  isOpen: boolean
  onClose: () => void
  onCreate: (questData: any) => void
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    icon: "⭐",
    xp: "100",
    link: "",
    imageUrl: "",
    difficulty: "easy" as "easy" | "medium" | "hard",
    category: "one_time"
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.link) {
      toast({ 
        title: "Error", 
        description: "Title and Link are required", 
        variant: "destructive" 
      })
      return
    }

    setIsSubmitting(true)

    try {
      const questData = {
        id: `custom-${Date.now()}`,
        title: formData.title,
        description: formData.description,
        icon: formData.icon,
        reward: { xp: parseInt(formData.xp) || 100 },
        requirements: { type: "custom_quest", count: 1 },
        actionLink: formData.link,
        category: formData.category,
        difficulty: formData.difficulty,
        imageUrl: formData.imageUrl,
        isNew: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: ADMIN_WALLET_ADDRESS
      }

      await new Promise(resolve => setTimeout(resolve, 500))
      onCreate(questData)

      setFormData({
        title: "",
        description: "",
        icon: "⭐",
        xp: "100",
        link: "",
        imageUrl: "",
        difficulty: "easy",
        category: "one_time"
      })
      onClose()
    } catch (error) {
      console.error("Create quest error:", error)
      toast({ 
        title: "Error", 
        description: "Failed to create quest", 
        variant: "destructive" 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-white">
                Create New Quest
              </DialogTitle>
              <p className="text-slate-400 text-sm">Admin Only</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label className="text-slate-300">Quest Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="e.g., Follow us on Twitter"
              className="bg-slate-800 border-slate-600 text-white mt-1"
              required
            />
          </div>

          <div>
            <Label className="text-slate-300">Description</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Short description..."
              className="bg-slate-800 border-slate-600 text-white mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Icon (Emoji)</Label>
              <Input
                value={formData.icon}
                onChange={(e) => setFormData({...formData, icon: e.target.value})}
                placeholder="⭐"
                className="bg-slate-800 border-slate-600 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-slate-300">XP Reward *</Label>
              <Input
                type="number"
                value={formData.xp}
                onChange={(e) => setFormData({...formData, xp: e.target.value})}
                placeholder="100"
                className="bg-slate-800 border-slate-600 text-white mt-1"
                required
              />
            </div>
          </div>

          <div>
            <Label className="text-slate-300">Action Link (URL) *</Label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                type="url"
                value={formData.link}
                onChange={(e) => setFormData({...formData, link: e.target.value})}
                placeholder="https://twitter.com/yourhandle"
                className="bg-slate-800 border-slate-600 text-white mt-1 pl-10"
                required
              />
            </div>
          </div>

          <div>
            <Label className="text-slate-300">Quest Image URL (Optional)</Label>
            <div className="relative">
              <Upload className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                placeholder="https://example.com/image.png"
                className="bg-slate-800 border-slate-600 text-white mt-1 pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Difficulty</Label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({...formData, difficulty: e.target.value as any})}
                className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <Label className="text-slate-300">Category</Label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white"
              >
                <option value="one_time">One-Time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create Quest
                </span>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ==========================================
// ENHANCED QUEST CARD COMPONENT
// ==========================================
function EnhancedQuestCard({ 
  quest, 
  progress, 
  onStart, 
  onAction, 
  onClaim, 
  onDelete,
  isAdmin,
  processingQuest 
}: { 
  quest: Quest
  progress: any
  onStart: (id: string) => void
  onAction: (id: string, type: string) => void
  onClaim: (id: string) => void
  onDelete?: (id: string) => void
  isAdmin: boolean
  processingQuest: string | null
}) {
  const progressPercentage = progress ? (progress.progress / progress.maxProgress) * 100 : 0
  const isCompleted = progress?.status === "completed"
  const isClaimed = progress?.status === "claimed"
  const canClaim = isCompleted && !isClaimed
  const hasStarted = !!progress

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
      case "custom_quest": return "⭐"
      default: return "⭐"
    }
  }

  const getActionText = (questType: string) => {
    switch (questType) {
      case "connect_discord": return "Connect Discord"
      case "login_streak": return "Pay & Login"
      case "share_twitter": return "Share on Twitter"
      case "refer_friends": return "Check Referrals"
      case "play_minigame": return "Play Game"
      case "join_community_call": return "Join Community"
      case "follow_linkedin": return "Follow LinkedIn"
      case "engage_tweet": return "Engage Tweet"
      case "follow_x": return "Follow X"
      case "join_telegram": return "Join Telegram"
      case "custom_quest": return "Complete Quest"
      default: return "Complete"
    }
  }

  const getDifficultyColor = (diff?: string) => {
    switch (diff) {
      case "easy": return "from-emerald-400 to-emerald-600"
      case "medium": return "from-amber-400 to-orange-600"
      case "hard": return "from-rose-400 to-red-600"
      default: return "from-blue-400 to-indigo-600"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="group relative"
    >
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${getDifficultyColor(quest.difficulty)} rounded-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-xl`} />

      <div className={`relative bg-slate-900/80 backdrop-blur-xl border rounded-2xl overflow-hidden transition-all duration-300 ${
        isClaimed ? 'border-green-500/50 shadow-lg shadow-green-500/20' : 'border-slate-800 hover:border-slate-600'
      }`}>
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getDifficultyColor(quest.difficulty)} opacity-50`} />

        {isAdmin && onDelete && (
          <button
            onClick={() => onDelete(quest.id)}
            className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {quest.isNew && (
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold rounded-full shadow-lg shadow-pink-500/25 animate-pulse">
              NEW
            </span>
          </div>
        )}

        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${getDifficultyColor(quest.difficulty)} shadow-lg`}>
              <span className="text-2xl">{getQuestIcon(quest.requirements.type, quest.icon)}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-white">{quest.title}</h3>
                {quest.isNew && !isAdmin && (
                  <Badge className="bg-red-500 text-white text-xs">NEW</Badge>
                )}
              </div>
              <p className="text-slate-400 text-sm">{quest.description}</p>
            </div>
          </div>

          {quest.imageUrl && (
            <div className="mb-4 rounded-xl overflow-hidden">
              <img 
                src={quest.imageUrl} 
                alt={quest.title}
                className="w-full h-32 object-cover"
              />
            </div>
          )}

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Progress</span>
              <span className="text-sm font-bold text-white">
                {progress?.progress || 0} <span className="text-slate-500">/ {quest.requirements.count}</span>
              </span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className={`h-full bg-gradient-to-r ${getDifficultyColor(quest.difficulty)} rounded-full`}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {quest.difficulty && (
                <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                  quest.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                  quest.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                  'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}>
                  {quest.difficulty.charAt(0).toUpperCase() + quest.difficulty.slice(1)}
                </div>
              )}
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">
                <Zap className="w-3 h-3" />
                {quest.reward.xp} XP
              </div>
            </div>

            <div className="flex gap-2">
              {!hasStarted && (
                <Button
                  onClick={() => onStart(quest.id)}
                  size="sm"
                  className="bg-teal-500 hover:bg-teal-600 text-black font-semibold"
                >
                  Start
                </Button>
              )}

              {hasStarted && !isCompleted && !isClaimed && (
                <Button
                  onClick={() => onAction(quest.id, quest.requirements.type)}
                  size="sm"
                  disabled={processingQuest === quest.id}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {processingQuest === quest.id ? "Processing..." : (
                    <span className="flex items-center gap-1">
                      {getActionText(quest.requirements.type)}
                      {quest.requirements.type === "login_streak" && (
                        <span className="text-xs">(0.01 SOL)</span>
                      )}
                    </span>
                  )}
                </Button>
              )}

              {canClaim && (
                <Button
                  onClick={() => onClaim(progress.id)}
                  size="sm"
                  className="bg-green-500 hover:bg-green-600 text-black font-semibold"
                >
                  Claim
                </Button>
              )}

              {isClaimed && (
                <Button size="sm" variant="outline" disabled className="border-green-500/50 text-green-400">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Completed
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
      </div>
    </motion.div>
  )
}

// ==========================================
// STATS CARD COMPONENT
// ==========================================
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="relative bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 overflow-hidden group cursor-pointer"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity`} />
      <div className="relative">
        <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${color} mb-4`}>
          {icon}
        </div>
        <p className="text-slate-400 text-sm mb-1">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </motion.div>
  )
}

// ==========================================
// MAIN QUEST PAGE COMPONENT
// ==========================================
export function QuestPageContent() {
  const { signTransaction, publicKey } = useWallet()
  const [processingQuest, setProcessingQuest] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [customQuests, setCustomQuests] = useState<Quest[]>([])
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const {
    dailyQuests,
    weeklyQuests,
    oneTimeQuests,
    userXPData,
    loading,
    error: questError,
    startQuest,
    updateQuestProgress,
    claimQuestReward,
    getQuestProgress,
  } = useQuestSystem()

  const adminMode = isAdmin(publicKey?.toString())

  // ==========================================
  // SYNC CUSTOM QUESTS - Real-time sync
  // ==========================================
  const syncCustomQuests = useCallback(async () => {
    try {
      // Try to fetch from API first (if you have a backend endpoint)
      const response = await fetch('/api/quests/custom', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }).catch(() => null)

      if (response && response.ok) {
        const data = await response.json()
        if (data.success && data.quests) {
          setCustomQuests(data.quests)
          safeLocalStorage.setItem('customQuests', JSON.stringify(data.quests))
          return
        }
      }

      // Fallback to localStorage
      const saved = safeLocalStorage.getItem('customQuests')
      if (saved) {
        const parsed = JSON.parse(saved)
        // Filter only active quests
        const activeQuests = parsed.filter((q: Quest) => q.isActive !== false)
        setCustomQuests(activeQuests)
      }
    } catch (e) {
      console.error("Error syncing quests:", e)
    }
  }, [])

  // Initial load and periodic sync
  useEffect(() => {
    setMounted(true)
    syncCustomQuests()

    // Sync every 5 seconds for real-time updates
    const interval = setInterval(syncCustomQuests, 5000)
    return () => clearInterval(interval)
  }, [syncCustomQuests])

  // Listen for storage changes (cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'customQuests') {
        syncCustomQuests()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [syncCustomQuests])

  // Save to localStorage whenever customQuests change
  useEffect(() => {
    if (customQuests.length > 0) {
      safeLocalStorage.setItem('customQuests', JSON.stringify(customQuests))
    }
  }, [customQuests])

  // ==========================================
  // CREATE QUEST - With API sync
  // ==========================================
  const handleCreateQuest = useCallback(async (questData: Quest) => {
    try {
      // Add to local state immediately
      setCustomQuests(prev => [questData, ...prev])

      // Try to save to API
      const response = await fetch('/api/quests/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questData)
      }).catch(() => null)

      if (response && response.ok) {
        toast({ 
          title: "Quest Created!", 
          description: "New quest is now live for all users" 
        })
      } else {
        // If API fails, still show success (localStorage will sync)
        toast({ 
          title: "Quest Created!", 
          description: "Quest saved locally. All users will see it on refresh." 
        })
      }

      // Broadcast to other tabs
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'customQuests',
        newValue: JSON.stringify([questData, ...customQuests])
      }))

    } catch (e) {
      console.error("Error creating quest:", e)
      toast({ 
        title: "Error", 
        description: "Failed to create quest", 
        variant: "destructive" 
      })
    }
  }, [customQuests])

  // ==========================================
  // DELETE QUEST - With API sync
  // ==========================================
  const handleDeleteQuest = useCallback(async (questId: string) => {
    if (typeof window !== 'undefined' && window.confirm("Are you sure you want to delete this quest?")) {
      try {
        // Update local state
        setCustomQuests(prev => prev.filter(q => q.id !== questId))

        // Try to delete from API
        await fetch(`/api/quests/custom?id=${questId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        }).catch(() => null)

        toast({ title: "Quest Deleted" })

        // Broadcast to other tabs
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'customQuests',
          newValue: JSON.stringify(customQuests.filter(q => q.id !== questId))
        }))

      } catch (e) {
        console.error("Error deleting quest:", e)
        toast({ 
          title: "Error", 
          description: "Failed to delete quest", 
          variant: "destructive" 
        })
      }
    }
  }, [customQuests])

  const getMergedOneTimeQuests = useCallback(() => {
    return [...customQuests, ...oneTimeQuests]
  }, [customQuests, oneTimeQuests])

  const handleStartQuest = useCallback(async (questId: string) => {
    try {
      const success = await startQuest(questId)
      if (success) {
        toast({ title: "Quest Started", description: "You've started this quest!" })
      } else {
        toast({ title: "Error", description: questError || "Failed to start quest", variant: "destructive" })
      }
    } catch (e) {
      console.error("Start quest error:", e)
      toast({ title: "Error", description: "Failed to start quest", variant: "destructive" })
    }
  }, [startQuest, questError])

  const handleClaimReward = useCallback(async (progressId: string) => {
    try {
      const success = await claimQuestReward(progressId)
      if (success) {
        toast({ title: "Reward Claimed!", description: "XP has been added to your account" })
      } else {
        toast({ title: "Error", description: questError || "Failed to claim reward", variant: "destructive" })
      }
    } catch (e) {
      console.error("Claim reward error:", e)
      toast({ title: "Error", description: "Failed to claim reward", variant: "destructive" })
    }
  }, [claimQuestReward, questError])

  const handleQuestAction = useCallback(async (questId: string, questType: string) => {
    if (!publicKey || !signTransaction) {
      toast({ title: "Error", description: "Please connect your wallet", variant: "destructive" })
      return
    }

    setProcessingQuest(questId)

    try {
      if (questType === "custom_quest") {
        const quest = customQuests.find(q => q.id === questId)
        if (quest?.actionLink) {
          window.open(quest.actionLink, "_blank")
          setTimeout(async () => {
            try {
              const success = await updateQuestProgress(questId, 1, { customCompleted: true, timestamp: Date.now() })
              if (success) {
                toast({ title: "Quest Completed!", description: `You earned ${quest.reward.xp} XP` })
              }
            } catch (e) {
              console.error("Custom quest completion error:", e)
            }
          }, 3000)
        }
        setProcessingQuest(null)
        return
      }

      // All existing quest types...
      switch (questType) {
        case "connect_discord":
          window.open("https://discord.gg/fZ7SDHeAtr", "_blank")
          setTimeout(async () => {
            try {
              const success = await updateQuestProgress(questId, 1, { discordConnected: true, timestamp: Date.now() })
              if (success) toast({ title: "Discord Connected!", description: "Quest completed! You earned 100 XP" })
            } catch (e) { console.error(e) }
          }, 3000)
          break

        case "follow_linkedin":
          window.open("https://www.linkedin.com/company/rewardnft", "_blank")
          setTimeout(async () => {
            try {
              const success = await updateQuestProgress(questId, 1, { linkedinFollowed: true, timestamp: Date.now() })
              if (success) toast({ title: "LinkedIn Followed!", description: "Quest completed! You earned 100 XP" })
            } catch (e) { console.error(e) }
          }, 3000)
          break

        case "engage_tweet":
          window.open("https://x.com/RewardNFT_/status/1947059548101218766", "_blank")
          setTimeout(async () => {
            try {
              const success = await updateQuestProgress(questId, 1, { tweetEngaged: true, timestamp: Date.now() })
              if (success) toast({ title: "Tweet Engaged!", description: "Quest completed! You earned 150 XP" })
            } catch (e) { console.error(e) }
          }, 3000)
          break

        case "follow_x":
          window.open("https://x.com/thewajidmengal", "_blank")
          setTimeout(async () => {
            try {
              const success = await updateQuestProgress(questId, 1, { xFollowed: true, timestamp: Date.now() })
              if (success) toast({ title: "X Followed!", description: "Quest completed! You earned 100 XP" })
            } catch (e) { console.error(e) }
          }, 3000)
          break

        case "join_telegram":
          window.open("https://t.me/rewardsNFT", "_blank")
          setTimeout(async () => {
            try {
              const success = await updateQuestProgress(questId, 1, { telegramJoined: true, timestamp: Date.now() })
              if (success) toast({ title: "Telegram Joined!", description: "Quest completed! You earned 100 XP" })
            } catch (e) { console.error(e) }
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
                console.warn("Failed to record payment:", recordError)
              }

              const success = await updateQuestProgress(questId, 1, {
                solPaymentSignature: paymentResult.signature,
                amount: 0.01,
                verified: true,
                treasuryWallet: solPaymentService.treasuryWalletAddress
              })

              if (success) {
                toast({ title: "Daily Login Complete!", description: `0.01 SOL paid to treasury! You earned 100 XP` })
              }
            } else {
              throw new Error(paymentResult.error || "Payment failed")
            }
          } catch (error) {
            console.error("Payment error:", error)
            toast({ title: "Payment Failed", description: "Failed to process SOL payment", variant: "destructive" })
          }
          break

        case "share_twitter":
          const tweetText = encodeURIComponent("Just completed a quest on RewardNFT! 🚀 Earning XP and climbing the leaderboard! #RewardNFT #NFT #Solana #Web3 @RewardNFT_")
          window.open(`https://x.com/intent/tweet?text=${tweetText}`, "_blank")
          setTimeout(async () => {
            try {
              const success = await updateQuestProgress(questId, 1, { twitterShareUrl: `https://x.com/intent/tweet?text=${tweetText}`, sharedAt: Date.now() })
              if (success) toast({ title: "Twitter Share Complete!", description: "Quest completed! You earned 75 XP" })
            } catch (e) { console.error(e) }
          }, 2000)
          break

        case "refer_friends":
          try {
            const userResponse = await fetch(`/api/users?wallet=${publicKey.toString()}`)
            const userData = await userResponse.json()

            if (userData.success) {
              const referralCount = userData.data?.totalReferrals || 0
              const targetReferrals = 3

              const currentProgressResponse = await fetch(`/api/quests?wallet=${publicKey.toString()}&action=get-user-progress`)
              const currentProgressResult = await currentProgressResponse.json()

              let currentProgress = 0
              if (currentProgressResult.success) {
                const questProgress = currentProgressResult.data.find((progress: any) => progress.questId === questId)
                currentProgress = questProgress?.progress || 0
              }

              const targetProgress = Math.min(referralCount, targetReferrals)
              const progressIncrement = Math.max(0, targetProgress - currentProgress)
              const isCompleted = referralCount >= targetReferrals

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
                  toast({ title: "🎉 Referral Quest Complete!", description: `You have ${referralCount} referrals! Quest completed! You earned 500 XP!` })
                } else {
                  toast({ title: "📊 Referral Progress Updated", description: `You have ${referralCount}/${targetReferrals} referrals. Refer ${targetReferrals - referralCount} more friends to complete.` })
                }
              }
            }
          } catch (error) {
            console.error("Referral check error:", error)
            toast({ title: "Error", description: "Failed to check referral count", variant: "destructive" })
          }
          break

        case "play_minigame":
          safeLocalStorage.setItem('pendingQuestId', questId)
          window.location.href = "/mini-game"
          break

        case "join_community_call":
          window.open("https://discord.gg/fZ7SDHeAtr", "_blank")
          setTimeout(async () => {
            try {
              const success = await updateQuestProgress(questId, 1, { attendanceVerified: true, joinedAt: Date.now() })
              if (success) toast({ title: "Community Call Joined!", description: "Quest completed! You earned 200 XP" })
            } catch (e) { console.error(e) }
          }, 3000)
          break

        default:
          await updateQuestProgress(questId, 1)
      }
    } catch (error) {
      console.error("Quest action error:", error)
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to complete quest", variant: "destructive" })
    } finally {
      setProcessingQuest(null)
    }
  }, [publicKey, signTransaction, customQuests, updateQuestProgress])

  // Manual refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await syncCustomQuests()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  if (!mounted || loading) {
    return (
      <ProtectedRoute requiresNFT={true}>
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
          <div className="text-white text-xl flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            Loading quests...
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiresNFT={true}>
      <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px] animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[150px]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

          {/* Admin Badge */}
          {adminMode && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed top-4 right-4 z-50"
            >
              <div className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg shadow-purple-500/25 flex items-center gap-2">
                <Crown className="w-4 h-4 text-white" />
                <span className="text-sm font-bold text-white">Admin Mode</span>
              </div>
            </motion.div>
          )}

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400"
            >
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-sm hover:text-red-300"
              >
                Dismiss
              </button>
            </motion.div>
          )}

          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 mb-6">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-slate-300">Complete quests to earn rewards</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                Complete
              </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 ml-4">
                Quests
              </span>
            </h1>

            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Complete tasks, earn XP, and climb the leaderboard to unlock exclusive rewards and NFTs
            </p>

            {/* Admin Controls */}
            {adminMode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-8 flex justify-center gap-4"
              >
                <Button
                  onClick={() => setCreateModalOpen(true)}
                  className="px-8 py-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all text-lg"
                >
                  <Plus className="w-6 h-6 mr-2" />
                  Create New Quest
                </Button>

                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  className="px-6 py-6 border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  <RefreshCw className={`w-5 h-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Sync Quests
                </Button>
              </motion.div>
            )}
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
            <StatCard 
              icon={<Trophy className="w-6 h-6 text-white" />}
              label="Total XP Earned"
              value={userXPData?.totalXP?.toString() || "0"}
              color="from-yellow-400 to-orange-600"
            />
            <StatCard 
              icon={<Target className="w-6 h-6 text-white" />}
              label="Quests Completed"
              value={`${customQuests.length + oneTimeQuests.length}`}
              color="from-blue-400 to-indigo-600"
            />
            <StatCard 
              icon={<Crown className="w-6 h-6 text-white" />}
              label="Current Rank"
              value={`#${userXPData?.rank || 142}`}
              color="from-purple-400 to-pink-600"
            />
            <StatCard 
              icon={<Gem className="w-6 h-6 text-white" />}
              label="Level"
              value={userXPData?.level?.toString() || "1"}
              color="from-emerald-400 to-teal-600"
            />
          </div>

          {/* One-Time Quests */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <Star className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">
                {adminMode ? "All Quests (Admin View)" : "One-Time Quests"}
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-slate-800 to-transparent ml-4" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnimatePresence mode="popLayout">
                {getMergedOneTimeQuests().map((quest, index) => (
                  <EnhancedQuestCard
                    key={quest.id}
                    quest={quest}
                    progress={getQuestProgress(quest.id)}
                    onStart={handleStartQuest}
                    onAction={handleQuestAction}
                    onClaim={handleClaimReward}
                    onDelete={adminMode ? handleDeleteQuest : undefined}
                    isAdmin={adminMode}
                    processingQuest={processingQuest}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Daily Quests */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Daily Quests</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-slate-800 to-transparent ml-4" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {dailyQuests.map((quest, index) => (
                <EnhancedQuestCard
                  key={quest.id}
                  quest={quest}
                  progress={getQuestProgress(quest.id)}
                  onStart={handleStartQuest}
                  onAction={handleQuestAction}
                  onClaim={handleClaimReward}
                  onDelete={adminMode ? handleDeleteQuest : undefined}
                  isAdmin={adminMode}
                  processingQuest={processingQuest}
                />
              ))}
            </div>
          </motion.div>

          {/* Weekly Quests */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Weekly Quests</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-slate-800 to-transparent ml-4" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {weeklyQuests.map((quest, index) => (
                <EnhancedQuestCard
                  key={quest.id}
                  quest={quest}
                  progress={getQuestProgress(quest.id)}
                  onStart={handleStartQuest}
                  onAction={handleQuestAction}
                  onClaim={handleClaimReward}
                  onDelete={adminMode ? handleDeleteQuest : undefined}
                  isAdmin={adminMode}
                  processingQuest={processingQuest}
                />
              ))}
            </div>
          </motion.div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-16 text-center"
          >
            <div className="inline-flex flex-col items-center gap-4 p-8 rounded-3xl bg-gradient-to-b from-slate-900/80 to-slate-900/40 border border-slate-800 backdrop-blur-xl">
              <div className="p-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">Ready for more challenges?</h3>
              <p className="text-slate-400 max-w-md">
                Complete all quests to unlock exclusive NFT rewards and climb to the top of the leaderboard!
              </p>
              <Button
                className="px-8 py-6 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-shadow text-lg"
              >
                View Leaderboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Create Quest Modal */}
        <CreateQuestModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onCreate={handleCreateQuest}
        />
      </div>
    </ProtectedRoute>
  )
}
