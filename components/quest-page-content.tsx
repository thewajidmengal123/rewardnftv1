"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Trophy, 
  Target, 
  Flame, 
  Twitter, 
  Linkedin, 
  MessageCircle, 
  Gamepad2, 
  Star,
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Crown,
  Gem,
  Plus,
  X,
  Link as LinkIcon,
  Upload,
  Trash2,
  ExternalLink
} from "lucide-react"
import { useWallet } from "@solana/wallet-adapter-react"

// ============================================
// ADMIN CONFIGURATION
// ============================================
const ADMIN_WALLET_ADDRESS = "6nHPbBNxh31qpKfLrs3WzzDGkDjmQYQGuVsh9qB7VLBQ"

// ============================================
// TYPES
// ============================================
interface Quest {
  id: string
  title: string
  description: string
  reward: number
  progress: number
  maxProgress: number
  icon: string
  type: "social" | "game" | "daily" | "special"
  difficulty: "easy" | "medium" | "hard"
  isNew?: boolean
  isCompleted?: boolean
  externalLink?: string
  imageUrl?: string
  createdAt?: string
  createdBy?: string
}

interface CreateQuestData {
  title: string
  description: string
  reward: number
  externalLink: string
  imageUrl: string
  type: "social" | "game" | "daily" | "special"
  difficulty: "easy" | "medium" | "hard"
}

// ============================================
// DEFAULT QUESTS (Initial Data)
// ============================================
const defaultQuests: Quest[] = [
  {
    id: "1",
    title: "Engage Post",
    description: "Keep engaging with community posts",
    reward: 100,
    progress: 0,
    maxProgress: 1,
    icon: "star",
    type: "social",
    difficulty: "easy",
    isNew: true
  },
  {
    id: "2",
    title: "Play Mini-Game Challenge",
    description: "Score 1500+ points in the click challenge mini-game",
    reward: 200,
    progress: 0,
    maxProgress: 1500,
    icon: "gamepad",
    type: "game",
    difficulty: "medium"
  },
  {
    id: "3",
    title: "Complete Login Streak",
    description: "Login to the platform for 5 consecutive days",
    reward: 300,
    progress: 0,
    maxProgress: 5,
    icon: "flame",
    type: "daily",
    difficulty: "medium"
  },
  {
    id: "4",
    title: "Engage Tweet",
    description: "Like and retweet our latest announcement",
    reward: 150,
    progress: 0,
    maxProgress: 1,
    icon: "twitter",
    type: "social",
    difficulty: "easy"
  },
  {
    id: "5",
    title: "Follow LinkedIn",
    description: "Follow RewardNFT on LinkedIn to stay updated",
    reward: 100,
    progress: 0,
    maxProgress: 1,
    icon: "linkedin",
    type: "social",
    difficulty: "easy"
  },
  {
    id: "6",
    title: "Join Telegram",
    description: "Join our Telegram community for exclusive updates",
    reward: 100,
    progress: 0,
    maxProgress: 1,
    icon: "message",
    type: "social",
    difficulty: "easy"
  }
]

// ============================================
// UTILITY FUNCTIONS
// ============================================
const generateId = () => Math.random().toString(36).substr(2, 9)

const getIconComponent = (iconName: string) => {
  const icons: { [key: string]: React.ReactNode } = {
    star: <Star className="w-5 h-5" />,
    gamepad: <Gamepad2 className="w-5 h-5" />,
    flame: <Flame className="w-5 h-5" />,
    twitter: <Twitter className="w-5 h-5" />,
    linkedin: <Linkedin className="w-5 h-5" />,
    message: <MessageCircle className="w-5 h-5" />,
    trophy: <Trophy className="w-5 h-5" />,
    target: <Target className="w-5 h-5" />,
    zap: <Zap className="w-5 h-5" />,
    link: <LinkIcon className="w-5 h-5" />
  }
  return icons[iconName] || <Target className="w-5 h-5" />
}

// ============================================
// DIFFICULTY CONFIG
// ============================================
const difficultyColors = {
  easy: "from-green-400 to-emerald-600",
  medium: "from-yellow-400 to-orange-600",
  hard: "from-red-400 to-rose-600"
}

const difficultyBg = {
  easy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  hard: "bg-rose-500/10 text-rose-400 border-rose-500/20"
}

// ============================================
// CREATE QUEST MODAL COMPONENT
// ============================================
function CreateQuestModal({ 
  isOpen, 
  onClose, 
  onCreate 
}: { 
  isOpen: boolean
  onClose: () => void
  onCreate: (quest: CreateQuestData) => void
}) {
  const [formData, setFormData] = useState<CreateQuestData>({
    title: "",
    description: "",
    reward: 100,
    externalLink: "",
    imageUrl: "",
    type: "social",
    difficulty: "easy"
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))

    onCreate(formData)
    setFormData({
      title: "",
      description: "",
      reward: 100,
      externalLink: "",
      imageUrl: "",
      type: "social",
      difficulty: "easy"
    })
    setIsSubmitting(false)
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Create New Quest</h2>
              <p className="text-slate-400 text-sm">Admin Only - Create a new quest for users</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Quest Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Follow us on Twitter"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Quest Description *
              </label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what users need to do..."
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
              />
            </div>

            {/* XP Reward */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                XP Reward *
              </label>
              <input
                type="number"
                required
                min={1}
                value={formData.reward}
                onChange={(e) => setFormData({ ...formData, reward: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {/* External Link */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                External Link URL *
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="url"
                  required
                  value={formData.externalLink}
                  onChange={(e) => setFormData({ ...formData, externalLink: e.target.value })}
                  placeholder="https://twitter.com/yourhandle"
                  className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Users will be redirected to this link when they start the quest
              </p>
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Quest Image URL (Optional)
              </label>
              <div className="relative">
                <Upload className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.png"
                  className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            {/* Type & Difficulty */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Quest Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  <option value="social">Social</option>
                  <option value="game">Gaming</option>
                  <option value="daily">Daily</option>
                  <option value="special">Special</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Difficulty
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Create Quest
                </>
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ============================================
// QUEST CARD COMPONENT
// ============================================
function QuestCard({ 
  quest, 
  index, 
  onComplete,
  onDelete,
  isAdmin 
}: { 
  quest: Quest
  index: number
  onComplete?: (questId: string, reward: number) => void
  onDelete?: (questId: string) => void
  isAdmin: boolean
}) {
  const [isHovered, setIsHovered] = useState(false)
  const [hasVisitedLink, setHasVisitedLink] = useState(false)
  const progressPercent = Math.min((quest.progress / quest.maxProgress) * 100, 100)

  const handleStart = () => {
    if (quest.externalLink) {
      window.open(quest.externalLink, '_blank')
      setHasVisitedLink(true)
    }
  }

  const handleComplete = () => {
    if (onComplete && !quest.isCompleted) {
      onComplete(quest.id, quest.reward)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative"
    >
      {/* Glow Effect */}
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${difficultyColors[quest.difficulty]} rounded-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-xl`} />

      {/* Card */}
      <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-600 transition-all duration-300">
        {/* Top Gradient Line */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${difficultyColors[quest.difficulty]} opacity-50`} />

        {/* Admin Delete Button */}
        {isAdmin && onDelete && (
          <button
            onClick={() => onDelete(quest.id)}
            className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {/* NEW Badge */}
        {quest.isNew && (
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold rounded-full shadow-lg shadow-pink-500/25 animate-pulse">
              NEW
            </span>
          </div>
        )}

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${difficultyColors[quest.difficulty]} shadow-lg`}>
              <div className="text-white">
                {getIconComponent(quest.icon)}
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-400 transition-all">
                {quest.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {quest.description}
              </p>
            </div>
          </div>

          {/* Quest Image */}
          {quest.imageUrl && (
            <div className="mb-4 rounded-xl overflow-hidden">
              <img 
                src={quest.imageUrl} 
                alt={quest.title}
                className="w-full h-32 object-cover"
              />
            </div>
          )}

          {/* Progress Section */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Progress</span>
              <span className="text-sm font-bold text-white">
                {quest.progress} <span className="text-slate-500">/ {quest.maxProgress}</span>
              </span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className={`h-full bg-gradient-to-r ${difficultyColors[quest.difficulty]} rounded-full`}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${difficultyBg[quest.difficulty]}`}>
                {quest.difficulty.charAt(0).toUpperCase() + quest.difficulty.slice(1)}
              </div>
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">
                <Zap className="w-3 h-3" />
                {quest.reward} XP
              </div>
            </div>

            <div className="flex gap-2">
              {/* External Link Button */}
              {quest.externalLink && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStart}
                  className="px-4 py-2 rounded-xl font-semibold text-sm bg-slate-800 text-white hover:bg-slate-700 border border-slate-700 hover:border-slate-600 transition-all flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Visit
                </motion.button>
              )}

              {/* Complete Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleComplete}
                disabled={quest.isCompleted || (!quest.externalLink && !hasVisitedLink)}
                className={`px-6 py-2 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
                  quest.isCompleted
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25 cursor-default"
                    : "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700 hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
              >
                {quest.isCompleted ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Done
                  </>
                ) : (
                  <>
                    Complete
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Hover Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
      </div>
    </motion.div>
  )
}

// ============================================
// STATS CARD COMPONENT
// ============================================
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

// ============================================
// MAIN QUEST PAGE COMPONENT
// ============================================
export default function QuestsPage() {
  const { publicKey } = useWallet()
  const [quests, setQuests] = useState<Quest[]>([])
  const [activeTab, setActiveTab] = useState<"all" | "social" | "game" | "daily" | "special">("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [userXP, setUserXP] = useState(12450)
  const [completedQuests, setCompletedQuests] = useState(24)
  const [mounted, setMounted] = useState(false)

  // Check if connected wallet is admin
  const isAdmin = publicKey?.toString() === ADMIN_WALLET_ADDRESS

  useEffect(() => {
    setMounted(true)
    // Load quests from localStorage or use defaults
    const savedQuests = localStorage.getItem('rewardnft_quests')
    if (savedQuests) {
      setQuests(JSON.parse(savedQuests))
    } else {
      setQuests(defaultQuests)
      localStorage.setItem('rewardnft_quests', JSON.stringify(defaultQuests))
    }

    // Load user stats
    const savedXP = localStorage.getItem('rewardnft_user_xp')
    if (savedXP) setUserXP(parseInt(savedXP))

    const savedCompleted = localStorage.getItem('rewardnft_completed_quests')
    if (savedCompleted) setCompletedQuests(parseInt(savedCompleted))
  }, [])

  // Save quests whenever they change
  useEffect(() => {
    if (quests.length > 0) {
      localStorage.setItem('rewardnft_quests', JSON.stringify(quests))
    }
  }, [quests])

  // Handle quest creation (ADMIN ONLY)
  const handleCreateQuest = (questData: CreateQuestData) => {
    const newQuest: Quest = {
      id: generateId(),
      title: questData.title,
      description: questData.description,
      reward: questData.reward,
      progress: 0,
      maxProgress: 1,
      icon: questData.type === "social" ? "twitter" : questData.type === "game" ? "gamepad" : "target",
      type: questData.type,
      difficulty: questData.difficulty,
      isNew: true,
      externalLink: questData.externalLink,
      imageUrl: questData.imageUrl,
      createdAt: new Date().toISOString(),
      createdBy: ADMIN_WALLET_ADDRESS
    }

    setQuests(prev => [newQuest, ...prev])

    // Show success notification (you can integrate with your toast system)
    alert("Quest created successfully!")
  }

  // Handle quest deletion (ADMIN ONLY)
  const handleDeleteQuest = (questId: string) => {
    if (confirm("Are you sure you want to delete this quest?")) {
      setQuests(prev => prev.filter(q => q.id !== questId))
    }
  }

  // Handle quest completion
  const handleCompleteQuest = (questId: string, reward: number) => {
    // Update quest status
    setQuests(prev => prev.map(q => 
      q.id === questId ? { ...q, isCompleted: true, progress: q.maxProgress } : q
    ))

    // Update user XP
    const newXP = userXP + reward
    setUserXP(newXP)
    localStorage.setItem('rewardnft_user_xp', newXP.toString())

    // Update completed count
    const newCompleted = completedQuests + 1
    setCompletedQuests(newCompleted)
    localStorage.setItem('rewardnft_completed_quests', newCompleted.toString())

    // Update leaderboard (using existing system)
    // This integrates with your existing XP/leaderboard logic
    const leaderboardData = JSON.parse(localStorage.getItem('rewardnft_leaderboard') || '[]')
    const userEntry = leaderboardData.find((entry: any) => entry.wallet === publicKey?.toString())

    if (userEntry) {
      userEntry.xp = newXP
      userEntry.completedQuests = newCompleted
    } else {
      leaderboardData.push({
        wallet: publicKey?.toString(),
        xp: newXP,
        completedQuests: newCompleted,
        rank: leaderboardData.length + 1
      })
    }

    localStorage.setItem('rewardnft_leaderboard', JSON.stringify(leaderboardData))

    alert(`Quest completed! You earned ${reward} XP!`)
  }

  // Filter quests
  const filteredQuests = activeTab === "all" 
    ? quests 
    : quests.filter(q => q.type === activeTab)

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Admin Badge */}
        {isAdmin && (
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
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <StatCard 
            icon={<Trophy className="w-6 h-6 text-white" />}
            label="Total XP Earned"
            value={userXP.toLocaleString()}
            color="from-yellow-400 to-orange-600"
          />
          <StatCard 
            icon={<Target className="w-6 h-6 text-white" />}
            label="Quests Completed"
            value={`${completedQuests}/${quests.length}`}
            color="from-blue-400 to-indigo-600"
          />
          <StatCard 
            icon={<Crown className="w-6 h-6 text-white" />}
            label="Current Rank"
            value="#142"
            color="from-purple-400 to-pink-600"
          />
          <StatCard 
            icon={<Gem className="w-6 h-6 text-white" />}
            label="NFTs Earned"
            value="3"
            color="from-emerald-400 to-teal-600"
          />
        </div>

        {/* Admin Create Quest Button */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center mb-8"
          >
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all flex items-center gap-3 hover:scale-105"
            >
              <Plus className="w-6 h-6" />
              Create New Quest
            </button>
          </motion.div>
        )}

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {[
            { id: "all", label: "All Quests", icon: <Target className="w-4 h-4" /> },
            { id: "social", label: "Social", icon: <Twitter className="w-4 h-4" /> },
            { id: "game", label: "Gaming", icon: <Gamepad2 className="w-4 h-4" /> },
            { id: "daily", label: "Daily", icon: <Clock className="w-4 h-4" /> },
            { id: "special", label: "Special", icon: <Star className="w-4 h-4" /> }
          ].map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25"
                  : "bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-700"
              }`}
            >
              {tab.icon}
              {tab.label}
            </motion.button>
          ))}
        </div>

        {/* Quests Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Star className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              {isAdmin ? "All Quests (Admin View)" : "Available Quests"}
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-slate-800 to-transparent ml-4" />
          </div>

          {filteredQuests.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex p-4 rounded-full bg-slate-800 mb-4">
                <Target className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No quests found</h3>
              <p className="text-slate-400">Check back later for new quests!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredQuests.map((quest, index) => (
                  <QuestCard 
                    key={quest.id} 
                    quest={quest} 
                    index={index}
                    onComplete={handleCompleteQuest}
                    onDelete={isAdmin ? handleDeleteQuest : undefined}
                    isAdmin={isAdmin}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
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
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-shadow"
            >
              View Leaderboard
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Create Quest Modal */}
      <CreateQuestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateQuest}
      />
    </div>
  )
}
