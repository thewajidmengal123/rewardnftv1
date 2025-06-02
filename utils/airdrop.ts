import { type Connection, PublicKey, type Transaction } from "@solana/web3.js"
import { createTokenTransferTransaction } from "./token"
import { DEFAULT_USDC_TOKEN_ADDRESS } from "@/config/solana"
import { getTopReferrers } from "./referral"
import { getUserQuestStats } from "./quests"

// Airdrop types
export type AirdropType = "token" | "nft"

// Airdrop status
export type AirdropStatus = "scheduled" | "in_progress" | "completed" | "failed"

// Airdrop eligibility criteria
export type AirdropEligibility =
  | "top_referrers"
  | "quest_completions"
  | "nft_holders"
  | "active_users"
  | "manual_selection"

// Airdrop interface
export interface Airdrop {
  id: string
  name: string
  description: string
  type: AirdropType
  tokenAddress?: string
  amount: number
  eligibility: AirdropEligibility
  eligibilityParams: {
    minRank?: number
    maxRank?: number
    minCompletions?: number
    minReferrals?: number
    minActivity?: number
    manualWallets?: string[]
  }
  status: AirdropStatus
  scheduledAt: number
  completedAt?: number
  recipients: Array<{
    wallet: string
    amount: number
    transactionId?: string
    status: "pending" | "success" | "failed"
  }>
  createdBy: string
}

// In-memory store for airdrops (in a real app, this would be in a database)
const airdrops: Record<string, Airdrop> = {}

// Create a new airdrop
export function createAirdrop(
  name: string,
  description: string,
  type: AirdropType,
  amount: number,
  eligibility: AirdropEligibility,
  eligibilityParams: any,
  scheduledAt: number,
  createdBy: string,
  tokenAddress?: string,
): Airdrop {
  const id = `airdrop_${Date.now().toString(36)}`

  const airdrop: Airdrop = {
    id,
    name,
    description,
    type,
    amount,
    eligibility,
    eligibilityParams,
    status: "scheduled",
    scheduledAt,
    recipients: [],
    createdBy,
    tokenAddress,
  }

  airdrops[id] = airdrop
  return airdrop
}

// Get all airdrops
export function getAllAirdrops(): Airdrop[] {
  return Object.values(airdrops)
}

// Get airdrop by ID
export function getAirdropById(airdropId: string): Airdrop | null {
  return airdrops[airdropId] || null
}

// Get eligible recipients for an airdrop
export async function getEligibleRecipients(airdrop: Airdrop): Promise<string[]> {
  const eligibleWallets: string[] = []

  switch (airdrop.eligibility) {
    case "top_referrers":
      // Get top referrers based on rank range
      const topReferrers = getTopReferrers(airdrop.eligibilityParams.maxRank || 100)

      // Filter by rank
      const minRank = airdrop.eligibilityParams.minRank || 1
      const maxRank = airdrop.eligibilityParams.maxRank || topReferrers.length

      for (let i = minRank - 1; i < Math.min(maxRank, topReferrers.length); i++) {
        eligibleWallets.push(topReferrers[i].walletAddress)
      }
      break

    case "quest_completions":
      // Get all wallets with quest data
      // In a real app, this would query a database
      const wallets = Object.keys(require("./quests").userQuestsStore)

      // Filter by minimum completions
      const minCompletions = airdrop.eligibilityParams.minCompletions || 1

      for (const wallet of wallets) {
        const stats = getUserQuestStats(wallet)
        if (stats.totalCompleted >= minCompletions) {
          eligibleWallets.push(wallet)
        }
      }
      break

    case "nft_holders":
      // In a real app, this would query the blockchain for NFT holders
      // For demo purposes, we'll use a placeholder
      eligibleWallets.push(
        "7C4jsPZpht42Tw6MjXWF56Q5RQUocjBBmciEjDa8HRtp",
        "3Gdu3Ufi3ViYrFUzDJNvjqoKvxLgmLhHGVJ1yVT3rQMf",
        "8ZKTdU9XJ5MZr4bSM8SvZEEd4Qkp2kBZGJQGDWKLfGm7",
      )
      break

    case "active_users":
      // In a real app, this would query a database for active users
      // For demo purposes, we'll use a placeholder
      eligibleWallets.push(
        "7C4jsPZpht42Tw6MjXWF56Q5RQUocjBBmciEjDa8HRtp",
        "3Gdu3Ufi3ViYrFUzDJNvjqoKvxLgmLhHGVJ1yVT3rQMf",
      )
      break

    case "manual_selection":
      // Use manually selected wallets
      if (airdrop.eligibilityParams.manualWallets && Array.isArray(airdrop.eligibilityParams.manualWallets)) {
        eligibleWallets.push(...airdrop.eligibilityParams.manualWallets)
      }
      break
  }

  return eligibleWallets
}

// Process airdrop
export async function processAirdrop(
  connection: Connection,
  platformWallet: PublicKey,
  airdropId: string,
): Promise<boolean> {
  const airdrop = getAirdropById(airdropId)

  if (!airdrop || airdrop.status !== "scheduled") {
    return false
  }

  try {
    // Update status
    airdrop.status = "in_progress"

    // Get eligible recipients
    const eligibleWallets = await getEligibleRecipients(airdrop)

    // Initialize recipients
    airdrop.recipients = eligibleWallets.map((wallet) => ({
      wallet,
      amount: airdrop.amount,
      status: "pending",
    }))

    // Process each recipient
    for (const recipient of airdrop.recipients) {
      try {
        const recipientWallet = new PublicKey(recipient.wallet)

        // Create transaction based on airdrop type
        let transaction: Transaction

        if (airdrop.type === "token") {
          // Use the specified token address or default to USDC
          const tokenAddress = airdrop.tokenAddress ? new PublicKey(airdrop.tokenAddress) : DEFAULT_USDC_TOKEN_ADDRESS

          transaction = await createTokenTransferTransaction(
            connection,
            platformWallet,
            recipientWallet,
            tokenAddress,
            recipient.amount,
          )
        } else {
          // For NFT airdrops, we would use a different transaction type
          // For demo purposes, we'll just use a token transaction
          transaction = await createTokenTransferTransaction(
            connection,
            platformWallet,
            recipientWallet,
            DEFAULT_USDC_TOKEN_ADDRESS,
            recipient.amount,
          )
        }

        // In a real implementation, this would be signed and sent by the platform
        // For demo purposes, we'll just simulate a successful transaction
        const transactionId = `sim_${Date.now().toString(36)}`

        // Update recipient status
        recipient.status = "success"
        recipient.transactionId = transactionId
      } catch (error) {
        console.error(`Error processing airdrop for ${recipient.wallet}:`, error)
        recipient.status = "failed"
      }
    }

    // Update airdrop status
    const allSuccessful = airdrop.recipients.every((r) => r.status === "success")
    const allFailed = airdrop.recipients.every((r) => r.status === "failed")

    if (allSuccessful) {
      airdrop.status = "completed"
    } else if (allFailed) {
      airdrop.status = "failed"
    } else {
      airdrop.status = "completed" // Partially completed
    }

    airdrop.completedAt = Date.now()

    return true
  } catch (error) {
    console.error("Error processing airdrop:", error)
    airdrop.status = "failed"
    return false
  }
}

// Get airdrops by status
export function getAirdropsByStatus(status: AirdropStatus | AirdropStatus[]): Airdrop[] {
  const statusArray = Array.isArray(status) ? status : [status]
  return Object.values(airdrops).filter((airdrop) => statusArray.includes(airdrop.status))
}

// Get airdrops for a recipient
export function getAirdropsForRecipient(walletAddress: string): Array<{
  airdrop: Airdrop
  recipient: {
    wallet: string
    amount: number
    transactionId?: string
    status: "pending" | "success" | "failed"
  }
}> {
  return Object.values(airdrops)
    .filter((airdrop) => airdrop.recipients.some((r) => r.wallet === walletAddress))
    .map((airdrop) => ({
      airdrop,
      recipient: airdrop.recipients.find((r) => r.wallet === walletAddress)!,
    }))
}

// Cancel airdrop
export function cancelAirdrop(airdropId: string): boolean {
  const airdrop = getAirdropById(airdropId)

  if (!airdrop || airdrop.status !== "scheduled") {
    return false
  }

  // Delete the airdrop
  delete airdrops[airdropId]

  return true
}
