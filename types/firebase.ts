import type { Timestamp } from "firebase/firestore"

// User Profile
export interface UserProfile {
  id: string
  walletAddress: string
  email?: string
  displayName?: string
  avatar?: string
  createdAt: Timestamp
  lastActive: Timestamp
  isVerified: boolean

  // NFT Data
  nftsMinted: number
  nftAddresses: string[]

  // Earnings
  totalEarned: number
  totalWithdrawn: number

  // Referrals
  referralCode: string
  referredBy?: string
  totalReferrals: number

  // Quests
  questsCompleted: number
  dailyStreak: number
  lastDailyCheckIn?: Timestamp

  // Settings
  notifications: {
    email: boolean
    push: boolean
    referrals: boolean
    quests: boolean
  }
}

// NFT Record
export interface NFTRecord {
  id: string
  mintAddress: string
  ownerWallet: string
  transactionSignature: string
  mintedAt: Timestamp

  // Metadata
  name: string
  symbol: string
  description: string
  image: string
  attributes: Array<{
    trait_type: string
    value: string | number
  }>

  // Platform Data
  mintCost: number
  referralCode?: string
  questReward?: boolean

  // Status
  isVerified: boolean
  isTransferred: boolean
}

// Referral Record
export interface ReferralRecord {
  id: string
  referrerWallet: string
  referredWallet: string
  referralCode: string

  // Status
  status: "pending" | "completed" | "rewarded"
  nftMinted: boolean
  rewardPaid: boolean
  rewardAmount: number

  // Timestamps
  createdAt: Timestamp
  completedAt?: Timestamp
  rewardedAt?: Timestamp

  // Transaction
  rewardTransactionSignature?: string
}

// Quest Progress
export interface QuestProgress {
  id: string
  userId: string
  questId: string

  // Progress
  status: "not_started" | "in_progress" | "completed" | "claimed"
  progress: number
  maxProgress: number

  // Timestamps
  startedAt?: Timestamp
  completedAt?: Timestamp
  claimedAt?: Timestamp
  expiresAt?: Timestamp

  // Reward
  rewardAmount: number
  rewardCurrency: "USDC" | "XP"
  rewardTransactionSignature?: string
}

// Transaction Record
export interface TransactionRecord {
  id: string
  signature: string
  type: "mint" | "referral_reward" | "quest_reward" | "airdrop" | "withdrawal"

  // Participants
  fromWallet?: string
  toWallet: string

  // Amount
  amount: number
  currency: "SOL" | "USDC"

  // Status
  status: "pending" | "confirmed" | "failed"
  confirmations: number

  // Metadata
  metadata?: any
  createdAt: Timestamp
  confirmedAt?: Timestamp
}

// Analytics Data
export interface AnalyticsData {
  id: string
  date: string // YYYY-MM-DD format

  // User Metrics
  totalUsers: number
  newUsers: number
  activeUsers: number

  // NFT Metrics
  totalNFTsMinted: number
  nftsMintedToday: number
  totalMintRevenue: number

  // Referral Metrics
  totalReferrals: number
  referralsToday: number
  totalReferralRewards: number

  // Quest Metrics
  questsCompleted: number
  questRewardsPaid: number

  // Financial
  totalRevenue: number
  totalRewardsPaid: number

  updatedAt: Timestamp
}

// Leaderboard Entry
export interface LeaderboardEntry {
  id: string
  walletAddress: string
  displayName?: string
  avatar?: string

  // Scores
  referralScore: number
  questScore: number
  totalEarnings: number

  // Rankings
  referralRank: number
  questRank: number
  earningsRank: number

  // Period
  period: "daily" | "weekly" | "monthly" | "all_time"
  periodStart: Timestamp
  periodEnd: Timestamp

  updatedAt: Timestamp
}
