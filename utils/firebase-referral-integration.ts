/**
 * Firebase Referral Integration Utilities
 * 
 * This module provides utilities to integrate the Firebase referral system
 * with the NFT minting process and other platform features.
 */

import { firebaseReferralService } from "@/services/firebase-referral-service"
import { firebaseUserService } from "@/services/firebase-user-service"
import { firebaseLeaderboardService } from "@/services/firebase-leaderboard-service"

/**
 * Track a referral when a user visits with a referral code
 */
export async function trackReferralFromURL(
  referralCode: string, 
  walletAddress: string
): Promise<{ success: boolean; message: string }> {
  try {
    const success = await firebaseReferralService.trackReferral(referralCode, walletAddress)
    
    if (success) {
      return {
        success: true,
        message: "Referral tracked successfully! You'll earn rewards when you mint your NFT."
      }
    } else {
      return {
        success: false,
        message: "Invalid referral code or you've already been referred."
      }
    }
  } catch (error) {
    console.error("Error tracking referral:", error)
    return {
      success: false,
      message: "Failed to track referral. Please try again."
    }
  }
}

/**
 * Process NFT mint completion and handle referral rewards
 */
export async function processNFTMintCompletion(
  walletAddress: string,
  nftAddress: string,
  transactionSignature: string
): Promise<{
  success: boolean
  message: string
  referralCompleted: boolean
  referralRewardProcessed: boolean
  referrerWallet?: string
}> {
  try {
    // Update user's NFT data
    await firebaseUserService.updateUserNFTData(walletAddress, nftAddress)

    // Complete any pending referral
    const referralCompleted = await firebaseReferralService.completeReferral(walletAddress)
    
    let referralRewardProcessed = false
    let referrerWallet: string | undefined

    if (referralCompleted) {
      // Get the referrer
      const referrer = await firebaseReferralService.checkIfReferred(walletAddress)
      
      if (referrer) {
        referrerWallet = referrer
        
        // Process the referral reward
        referralRewardProcessed = await firebaseReferralService.processReferralReward(
          walletAddress,
          transactionSignature
        )

        if (referralRewardProcessed) {
          // Update referrer's leaderboard position
          await firebaseLeaderboardService.updateUserLeaderboardPosition(referrer)
        }
      }
    }

    // Update user's leaderboard position
    await firebaseLeaderboardService.updateUserLeaderboardPosition(walletAddress)

    return {
      success: true,
      message: referralCompleted 
        ? "NFT minted successfully! Referral reward has been processed."
        : "NFT minted successfully!",
      referralCompleted,
      referralRewardProcessed,
      referrerWallet,
    }
  } catch (error) {
    console.error("Error processing NFT mint completion:", error)
    return {
      success: false,
      message: "Failed to process NFT mint completion.",
      referralCompleted: false,
      referralRewardProcessed: false,
    }
  }
}

/**
 * Initialize user in the referral system
 */
export async function initializeUserReferralSystem(walletAddress: string) {
  try {
    const user = await firebaseReferralService.initializeUserReferral(walletAddress)
    return {
      success: true,
      user,
      referralCode: user.referralCode,
      referralLink: firebaseReferralService.getReferralLink(user.referralCode),
    }
  } catch (error) {
    console.error("Error initializing user referral system:", error)
    return {
      success: false,
      user: null,
      referralCode: null,
      referralLink: null,
    }
  }
}

/**
 * Get comprehensive referral stats for a user
 */
export async function getUserReferralStats(walletAddress: string) {
  try {
    const [stats, history, leaderboardStats] = await Promise.all([
      firebaseReferralService.getReferralStats(walletAddress),
      firebaseReferralService.getReferralHistory(walletAddress),
      firebaseLeaderboardService.getUserLeaderboardStats(walletAddress),
    ])

    return {
      success: true,
      stats,
      history,
      leaderboardStats,
    }
  } catch (error) {
    console.error("Error getting user referral stats:", error)
    return {
      success: false,
      stats: null,
      history: [],
      leaderboardStats: null,
    }
  }
}

/**
 * Check if a referral code is valid
 */
export async function validateReferralCode(referralCode: string): Promise<{
  valid: boolean
  referrer?: {
    walletAddress: string
    displayName: string
  }
}> {
  try {
    const referrer = await firebaseReferralService.getUserByReferralCode(referralCode)
    
    if (referrer) {
      return {
        valid: true,
        referrer: {
          walletAddress: referrer.walletAddress,
          displayName: referrer.displayName || `User ${referrer.walletAddress.slice(0, 8)}`,
        },
      }
    } else {
      return {
        valid: false,
      }
    }
  } catch (error) {
    console.error("Error validating referral code:", error)
    return {
      valid: false,
    }
  }
}

/**
 * Get leaderboard data with caching
 */
export async function getLeaderboardData(
  type: "referrals" | "earnings" | "quests" | "overall" = "referrals",
  limit: number = 10
) {
  try {
    const [leaderboard, stats] = await Promise.all([
      firebaseLeaderboardService.getLeaderboard(type, limit),
      firebaseLeaderboardService.getLeaderboardStats(),
    ])

    return {
      success: true,
      leaderboard,
      stats,
    }
  } catch (error) {
    console.error("Error getting leaderboard data:", error)
    return {
      success: false,
      leaderboard: [],
      stats: null,
    }
  }
}

/**
 * Utility to handle referral code from URL parameters
 */
export function extractReferralCodeFromURL(): string | null {
  if (typeof window === "undefined") return null
  
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get("ref")
}

/**
 * Remove referral code from URL after processing
 */
export function cleanReferralCodeFromURL(): void {
  if (typeof window === "undefined") return
  
  const url = new URL(window.location.href)
  if (url.searchParams.has("ref")) {
    url.searchParams.delete("ref")
    window.history.replaceState({}, "", url.toString())
  }
}
