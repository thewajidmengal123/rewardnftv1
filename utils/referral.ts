import { type Connection, PublicKey } from "@solana/web3.js"
import { createTokenTransferTransaction } from "./token"
import { DEFAULT_USDC_TOKEN_ADDRESS } from "@/config/solana"

// Referral reward amount in USDC
export const REFERRAL_REWARD_AMOUNT = 4

// Interface for referral data
export interface ReferralData {
  code: string
  referrerWallet: string
  referrals: Array<{
    wallet: string
    timestamp: number
    paid: boolean
    transactionId?: string
  }>
  totalEarned: number
  totalReferrals: number
}

// Generate a unique referral code for a wallet
export function generateReferralCode(walletAddress: string): string {
  // Take the first 4 and last 4 characters of the wallet address
  const prefix = walletAddress.substring(0, 4)
  const suffix = walletAddress.substring(walletAddress.length - 4)

  // Add a timestamp to ensure uniqueness
  const timestamp = Date.now().toString(36).substring(4, 8)

  return `${prefix}${timestamp}${suffix}`.toLowerCase()
}

// Store referral data (in a real app, this would use a database)
const referralStore: Record<string, ReferralData> = {}

// Initialize referral data for a wallet
export function initializeReferral(walletAddress: string): ReferralData {
  if (referralStore[walletAddress]) {
    return referralStore[walletAddress]
  }

  const code = generateReferralCode(walletAddress)
  const referralData: ReferralData = {
    code,
    referrerWallet: walletAddress,
    referrals: [],
    totalEarned: 0,
    totalReferrals: 0,
  }

  referralStore[walletAddress] = referralData
  return referralData
}

// Get referral data for a wallet
export function getReferralData(walletAddress: string): ReferralData | null {
  return referralStore[walletAddress] || null
}

// Get referral data by code
export function getReferralByCode(code: string): ReferralData | null {
  const entries = Object.values(referralStore)
  return entries.find((entry) => entry.code === code) || null
}

// Track a new referral
export function trackReferral(referralCode: string, newWalletAddress: string): boolean {
  const referralData = getReferralByCode(referralCode)

  if (!referralData) {
    return false
  }

  // Check if this wallet has already been referred
  if (referralData.referrals.some((ref) => ref.wallet === newWalletAddress)) {
    return false
  }

  // Add the new referral
  referralData.referrals.push({
    wallet: newWalletAddress,
    timestamp: Date.now(),
    paid: false,
  })

  referralData.totalReferrals += 1

  return true
}

// Process referral payment
export async function processReferralPayment(
  connection: Connection,
  platformWallet: PublicKey,
  referralCode: string,
  referredWallet: string,
): Promise<string | null> {
  const referralData = getReferralByCode(referralCode)

  if (!referralData) {
    return null
  }

  // Find the referral
  const referral = referralData.referrals.find((ref) => ref.wallet === referredWallet && !ref.paid)

  if (!referral) {
    return null
  }

  try {
    // Create a transaction to transfer USDC from platform wallet to referrer
    const referrerWallet = new PublicKey(referralData.referrerWallet)

    const transaction = await createTokenTransferTransaction(
      connection,
      platformWallet,
      referrerWallet,
      DEFAULT_USDC_TOKEN_ADDRESS,
      REFERRAL_REWARD_AMOUNT,
    )

    // In a real implementation, this would be signed and sent by the platform
    // For demo purposes, we'll just simulate a successful transaction
    const transactionId = `sim_${Date.now().toString(36)}`

    // Update the referral data
    referral.paid = true
    referral.transactionId = transactionId
    referralData.totalEarned += REFERRAL_REWARD_AMOUNT

    return transactionId
  } catch (error) {
    console.error("Error processing referral payment:", error)
    return null
  }
}

// Get top referrers
export function getTopReferrers(limit = 10): Array<{
  walletAddress: string
  totalReferrals: number
  totalEarned: number
}> {
  return Object.entries(referralStore)
    .map(([walletAddress, data]) => ({
      walletAddress,
      totalReferrals: data.totalReferrals,
      totalEarned: data.totalEarned,
    }))
    .sort((a, b) => b.totalEarned - a.totalEarned)
    .slice(0, limit)
}

// Get referral link for a wallet
export function getReferralLink(walletAddress: string): string {
  const referralData = getReferralData(walletAddress) || initializeReferral(walletAddress)
  return `${typeof window !== "undefined" ? window.location.origin : "https://rewardnft.com"}/mint?ref=${referralData.code}`
}
