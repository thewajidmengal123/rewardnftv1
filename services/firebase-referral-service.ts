import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  addDoc,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { firebaseUserService } from "./firebase-user-service"
import type { ReferralRecord, UserProfile } from "@/types/firebase"

export interface ReferralStats {
  totalReferrals: number
  totalEarned: number
  pendingRewards: number
  completedReferrals: number
}

export interface ReferralWithUser {
  id: string
  referredWallet: string
  referredUser?: UserProfile
  status: "pending" | "completed" | "rewarded"
  rewardAmount: number
  createdAt: Timestamp
  completedAt?: Timestamp
  rewardedAt?: Timestamp
}

export class FirebaseReferralService {
  private readonly REFERRALS_COLLECTION = "referrals"
  private readonly REFERRAL_REWARD_AMOUNT = 5 // USDC

  /**
   * Initialize referral system for a user
   */
  async initializeUserReferral(walletAddress: string): Promise<UserProfile> {
    try {
      // Create or get user profile with referral code
      const user = await firebaseUserService.createOrUpdateUser(walletAddress, {})
      return user
    } catch (error) {
      console.error("Error initializing user referral:", error)
      throw error
    }
  }

  /**
   * Get user by referral code
   */
  async getUserByReferralCode(referralCode: string): Promise<UserProfile | null> {
    try {
      return await firebaseUserService.getUserByReferralCode(referralCode)
    } catch (error) {
      console.error("Error getting user by referral code:", error)
      return null
    }
  }

  /**
   * Track a new referral
   */
  async trackReferral(referralCode: string, referredWallet: string): Promise<boolean> {
    try {
      // Get referrer by code
      const referrer = await this.getUserByReferralCode(referralCode)
      if (!referrer) {
        console.error("Invalid referral code:", referralCode)
        return false
      }

      // Check if user is trying to refer themselves
      if (referrer.walletAddress === referredWallet) {
        console.error("User cannot refer themselves")
        return false
      }

      // Check if this wallet has already been referred by anyone
      const existingReferralQuery = query(
        collection(db, this.REFERRALS_COLLECTION),
        where("referredWallet", "==", referredWallet)
      )
      const existingReferrals = await getDocs(existingReferralQuery)

      if (!existingReferrals.empty) {
        console.error("Wallet already referred:", referredWallet)
        return false
      }

      // Create referral record
      const referralData: Omit<ReferralRecord, "id"> = {
        referrerWallet: referrer.walletAddress,
        referredWallet,
        referralCode,
        status: "pending",
        nftMinted: false,
        rewardPaid: false,
        rewardAmount: this.REFERRAL_REWARD_AMOUNT,
        createdAt: serverTimestamp() as Timestamp,
      }

      await addDoc(collection(db, this.REFERRALS_COLLECTION), referralData)

      // Update referrer's total referrals count
      await firebaseUserService.incrementReferralCount(referrer.walletAddress)

      // Update referred user with referrer info
      await firebaseUserService.createOrUpdateUser(referredWallet, {
        referredBy: referrer.walletAddress,
      })

      // Check if referrer now has 3+ referrals and auto-complete quest
      await this.checkAndCompleteReferralQuest(referrer.walletAddress)

      console.log(`Referral tracked: ${referrer.walletAddress} -> ${referredWallet}`)
      return true
    } catch (error) {
      console.error("Error tracking referral:", error)
      return false
    }
  }

  /**
   * Complete referral when referred user mints NFT
   */
  async completeReferral(referredWallet: string): Promise<boolean> {
    try {
      // Find pending referral for this wallet
      const referralQuery = query(
        collection(db, this.REFERRALS_COLLECTION),
        where("referredWallet", "==", referredWallet),
        where("status", "==", "pending")
      )
      const referralSnapshot = await getDocs(referralQuery)

      if (referralSnapshot.empty) {
        console.log("No pending referral found for wallet:", referredWallet)
        return false
      }

      const referralDoc = referralSnapshot.docs[0]

      // Update referral status to completed
      await updateDoc(doc(db, this.REFERRALS_COLLECTION, referralDoc.id), {
        status: "completed",
        nftMinted: true,
        completedAt: serverTimestamp(),
      })

      console.log(`Referral completed for: ${referredWallet}`)
      return true
    } catch (error) {
      console.error("Error completing referral:", error)
      return false
    }
  }

  /**
   * Process referral reward (mark as rewarded)
   */
  async processReferralReward(
    referredWallet: string,
    transactionSignature?: string
  ): Promise<boolean> {
    try {
      // Find completed referral for this wallet
      const referralQuery = query(
        collection(db, this.REFERRALS_COLLECTION),
        where("referredWallet", "==", referredWallet),
        where("status", "==", "completed")
      )
      const referralSnapshot = await getDocs(referralQuery)

      if (referralSnapshot.empty) {
        console.log("No completed referral found for wallet:", referredWallet)
        return false
      }

      const referralDoc = referralSnapshot.docs[0]
      const referralData = referralDoc.data() as ReferralRecord

      // Update referral status to rewarded
      await updateDoc(doc(db, this.REFERRALS_COLLECTION, referralDoc.id), {
        status: "rewarded",
        rewardPaid: true,
        rewardedAt: serverTimestamp(),
        rewardTransactionSignature: transactionSignature,
      })

      // Update referrer's total earned
      await firebaseUserService.updateUserEarnings(
        referralData.referrerWallet,
        this.REFERRAL_REWARD_AMOUNT
      )

      // Sync referrer's data to ensure consistency
      await firebaseUserService.syncUserReferralData(referralData.referrerWallet)

      console.log(`Referral reward processed for: ${referredWallet}`)
      return true
    } catch (error) {
      console.error("Error processing referral reward:", error)
      return false
    }
  }

  /**
   * Process direct referral reward from minting services
   */
  async processDirectReferralReward(
    referrerWallet: string,
    referredWallet: string,
    rewardAmount: number,
    _nftsMinted: number, // Unused - always 1 NFT per wallet
    mintSignatures: string[]
  ): Promise<boolean> {
    try {
      // Check if referral already exists to prevent duplicates
      const existingReferralQuery = query(
        collection(db, this.REFERRALS_COLLECTION),
        where("referrerWallet", "==", referrerWallet),
        where("referredWallet", "==", referredWallet)
      )
      const existingReferrals = await getDocs(existingReferralQuery)

      if (!existingReferrals.empty) {
        console.log(`Referral already exists: ${referrerWallet} -> ${referredWallet}`)
        return true // Return success to avoid errors, but don't create duplicate
      }

      // Create referral record with unique ID based on wallets only
      const referralId = `${referrerWallet}_${referredWallet}`
      const referralData = {
        referrerWallet,
        referredWallet,
        referralCode: "", // Not applicable for direct rewards
        status: "rewarded" as const,
        nftMinted: true,
        rewardPaid: true,
        rewardAmount,
        nftsMinted: 1, // Always 1 since users can only mint 1 NFT
        mintSignatures,
        createdAt: serverTimestamp() as Timestamp,
        completedAt: serverTimestamp() as Timestamp,
        rewardedAt: serverTimestamp() as Timestamp,
        type: "nft_mint_referral"
      }

      await setDoc(doc(db, this.REFERRALS_COLLECTION, referralId), referralData)

      // Update referrer's total earned and referral count
      await firebaseUserService.updateUserEarnings(referrerWallet, rewardAmount)
      await firebaseUserService.incrementReferralCount(referrerWallet)

      // Update referred user's NFT count - always set to 1 (not increment)
      const referredUserRef = doc(db, "users", referredWallet)
      const referredUserDoc = await getDoc(referredUserRef)

      if (referredUserDoc.exists()) {
        await updateDoc(referredUserRef, {
          nftsMinted: 1, // Always 1 since users can only mint 1 NFT
          lastActive: serverTimestamp(),
        })
      } else {
        // Create referred user profile if it doesn't exist
        await setDoc(referredUserRef, {
          walletAddress: referredWallet,
          displayName: `User ${referredWallet.slice(0, 8)}`,
          totalEarned: 0,
          totalReferrals: 0,
          nftsMinted: 1, // Always 1 since users can only mint 1 NFT
          questsCompleted: 0,
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp(),
        })
      }

      // Sync referrer's data to ensure consistency
      await firebaseUserService.syncUserReferralData(referrerWallet)

      // Check if referrer now has 3+ referrals and auto-complete quest
      await this.checkAndCompleteReferralQuest(referrerWallet)

      console.log(`Direct referral reward processed: ${rewardAmount} USDC to ${referrerWallet} for 1 NFT`)
      return true
    } catch (error) {
      console.error("Error processing direct referral reward:", error)
      return false
    }
  }

  /**
   * Track referral without processing rewards (analytics only)
   */
  async trackReferralOnly(
    referrerWallet: string,
    referredWallet: string,
    nftsMinted: number,
    mintSignatures: string[]
  ): Promise<boolean> {
    try {
      console.log(`📊 Tracking referral (no rewards):`)
      console.log(`   Referrer: ${referrerWallet}`)
      console.log(`   Referred: ${referredWallet}`)
      console.log(`   NFTs: ${nftsMinted}`)

      // Check if referral already exists to prevent duplicates
      const existingReferralQuery = query(
        collection(db, this.REFERRALS_COLLECTION),
        where("referrerWallet", "==", referrerWallet),
        where("referredWallet", "==", referredWallet)
      )
      const existingReferrals = await getDocs(existingReferralQuery)

      if (!existingReferrals.empty) {
        console.log(`Referral already tracked: ${referrerWallet} -> ${referredWallet}`)
        return true // Return success to avoid errors, but don't create duplicate
      }

      // Create referral record with unique ID based on wallets only
      const referralId = `${referrerWallet}_${referredWallet}`
      const referralData = {
        referrerWallet,
        referredWallet,
        referralCode: "", // Not applicable for direct tracking
        status: "tracked" as const, // Changed from "rewarded" to "tracked"
        nftMinted: true,
        rewardPaid: false, // No rewards paid
        rewardAmount: 0, // No reward amount
        nftsMinted: 1, // Always 1 since users can only mint 1 NFT
        mintSignatures,
        createdAt: serverTimestamp() as Timestamp,
        completedAt: serverTimestamp() as Timestamp,
        rewardedAt: null, // No reward date
        type: "nft_mint_referral_tracking",
        trackingOnly: true
      }

      await setDoc(doc(db, this.REFERRALS_COLLECTION, referralId), referralData)

      // Update referrer's referral count (but not earnings)
      await firebaseUserService.incrementReferralCount(referrerWallet)

      // Update referred user's NFT count - always set to 1 (not increment)
      const referredUserRef = doc(db, "users", referredWallet)
      const referredUserDoc = await getDoc(referredUserRef)

      if (referredUserDoc.exists()) {
        await updateDoc(referredUserRef, {
          nftsMinted: 1, // Always 1 since users can only mint 1 NFT
          lastActive: serverTimestamp(),
        })
      } else {
        // Create referred user profile if it doesn't exist
        await setDoc(referredUserRef, {
          walletAddress: referredWallet,
          displayName: `User ${referredWallet.slice(0, 8)}`,
          totalEarned: 0, // No earnings from referrals
          totalReferrals: 0,
          nftsMinted: 1, // Always 1 since users can only mint 1 NFT
          questsCompleted: 0,
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp(),
        })
      }

      // Sync referrer's data to ensure consistency (but no earnings)
      await firebaseUserService.syncUserReferralData(referrerWallet)

      // Check if referrer now has 3+ referrals and auto-complete quest
      await this.checkAndCompleteReferralQuest(referrerWallet)

      console.log(`Referral tracked successfully (no rewards): ${referrerWallet} -> ${referredWallet}`)
      return true
    } catch (error) {
      console.error("Error tracking referral:", error)
      return false
    }
  }

  /**
   * Get referral stats for a user
   */
  async getReferralStats(walletAddress: string): Promise<ReferralStats> {
    try {
      console.log("Getting referral stats for wallet:", walletAddress)

      const referralQuery = query(
        collection(db, this.REFERRALS_COLLECTION),
        where("referrerWallet", "==", walletAddress)
      )
      const referralSnapshot = await getDocs(referralQuery)

      let totalReferrals = 0
      let completedReferrals = 0
      let totalEarned = 0
      let pendingRewards = 0

      console.log("Stats query results for referrerWallet:", {
        empty: referralSnapshot.empty,
        size: referralSnapshot.size,
        docs: referralSnapshot.docs.length
      })

      // Also check if this wallet appears as a referredWallet (for debugging)
      const referredQuery = query(
        collection(db, this.REFERRALS_COLLECTION),
        where("referredWallet", "==", walletAddress)
      )
      const referredSnapshot = await getDocs(referredQuery)

      console.log("🔍 DEBUG: This wallet as referredWallet in stats:", {
        empty: referredSnapshot.empty,
        size: referredSnapshot.size,
        docs: referredSnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }))
      })

      referralSnapshot.docs.forEach((doc) => {
        const referral = doc.data() as ReferralRecord
        console.log("Processing referral for stats:", {
          id: doc.id,
          status: referral.status,
          rewardAmount: referral.rewardAmount,
          referredWallet: referral.referredWallet
        })

        totalReferrals++

        if (referral.status === "completed" || referral.status === "rewarded") {
          completedReferrals++
          // Count both completed and rewarded as earned since completed means the referral was successful
          totalEarned += referral.rewardAmount
        }

        if (referral.status === "completed") {
          // Pending rewards are those that are completed but not yet paid out
          pendingRewards += referral.rewardAmount
        }
      })

      const stats = {
        totalReferrals,
        totalEarned,
        pendingRewards,
        completedReferrals,
      }

      console.log("Final calculated stats:", stats)
      return stats
    } catch (error) {
      console.error("Error getting referral stats:", error)
      return {
        totalReferrals: 0,
        totalEarned: 0,
        pendingRewards: 0,
        completedReferrals: 0,
      }
    }
  }

  /**
   * Get referral history for a user
   */
  async getReferralHistory(walletAddress: string): Promise<ReferralWithUser[]> {
    try {
      console.log("Getting referral history for wallet:", walletAddress)

      // Remove orderBy to avoid index requirement for now
      const referralQuery = query(
        collection(db, this.REFERRALS_COLLECTION),
        where("referrerWallet", "==", walletAddress)
      )
      const referralSnapshot = await getDocs(referralQuery)

      console.log("Referral query results for referrerWallet:", {
        empty: referralSnapshot.empty,
        size: referralSnapshot.size,
        docs: referralSnapshot.docs.length
      })

      // Also check if this wallet appears as a referredWallet (for debugging)
      const referredQuery = query(
        collection(db, this.REFERRALS_COLLECTION),
        where("referredWallet", "==", walletAddress)
      )
      const referredSnapshot = await getDocs(referredQuery)

      console.log("🔍 DEBUG: This wallet as referredWallet:", {
        empty: referredSnapshot.empty,
        size: referredSnapshot.size,
        docs: referredSnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }))
      })

      const referrals: ReferralWithUser[] = []

      for (const doc of referralSnapshot.docs) {
        const referralData = doc.data() as ReferralRecord
        console.log("Processing referral doc:", { id: doc.id, data: referralData })

        // Get referred user profile
        const referredUser = await firebaseUserService.getUserByWallet(referralData.referredWallet)

        referrals.push({
          id: doc.id,
          referredWallet: referralData.referredWallet,
          referredUser: referredUser || undefined,
          status: referralData.status,
          rewardAmount: referralData.rewardAmount,
          createdAt: referralData.createdAt,
          completedAt: referralData.completedAt,
          rewardedAt: referralData.rewardedAt,
        })
      }

      console.log("Final referrals array:", referrals)

      // Sort by createdAt descending (client-side sorting)
      referrals.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0)
        const bTime = b.createdAt?.toDate?.() || new Date(0)
        return bTime.getTime() - aTime.getTime()
      })

      return referrals
    } catch (error) {
      console.error("Error getting referral history:", error)
      return []
    }
  }

  /**
   * Get referral link for a user
   */
  getReferralLink(referralCode: string): string {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || "https://rewardnft.com"
    return `${baseUrl}/mint?ref=${referralCode}`
  }

  /**
   * Check if a wallet was referred
   */
  async checkIfReferred(walletAddress: string): Promise<string | null> {
    try {
      const user = await firebaseUserService.getUserByWallet(walletAddress)
      return user?.referredBy || null
    } catch (error) {
      console.error("Error checking if referred:", error)
      return null
    }
  }

  /**
   * Check and auto-complete referral quest when user reaches 3 referrals
   */
  async checkAndCompleteReferralQuest(walletAddress: string): Promise<void> {
    try {
      // Get user's current referral count with fresh data
      const user = await firebaseUserService.getUserByWallet(walletAddress)
      if (!user || (user.totalReferrals || 0) < 3) {
        console.log(`👥 User ${walletAddress} has ${user?.totalReferrals || 0} referrals, not enough for quest completion`)
        return // Not enough referrals yet
      }

      console.log(`👥 User ${walletAddress} has ${user.totalReferrals} referrals, checking quest completion...`)

      // Import quest service dynamically to avoid circular dependency
      const { firebaseQuestService } = await import('./firebase-quest-service')

      // Get all active quests to find referral quest
      const quests = await firebaseQuestService.getActiveQuests()
      const referralQuest = quests.find(quest => quest.requirements.type === 'refer_friends')

      if (!referralQuest) {
        console.log('👥 No referral quest found')
        return
      }

      // Check if quest is already completed
      const userProgress = await firebaseQuestService.getUserQuestProgress(walletAddress)
      const questProgress = userProgress.find(progress =>
        progress.questId === referralQuest.id &&
        (progress.status === 'completed' || progress.status === 'claimed')
      )

      if (questProgress) {
        console.log(`👥 Referral quest already ${questProgress.status} for ${walletAddress}`)
        return
      }

      // Auto-complete the quest
      console.log(`👥 Auto-completing referral quest for ${walletAddress} with ${user.totalReferrals} referrals`)
      await firebaseQuestService.updateQuestProgress(
        walletAddress,
        referralQuest.id,
        1,
        {
          referralCount: user.totalReferrals,
          verified: true,
          autoCompleted: true,
          completedAt: Date.now(),
          triggeredBy: 'referral_service'
        }
      )

      console.log(`✅ Successfully auto-completed referral quest for ${walletAddress}`)
    } catch (error) {
      console.error(`❌ Error auto-completing referral quest for ${walletAddress}:`, error)
      throw error // Re-throw to allow caller to handle
    }
  }

  /**
   * Enhanced referral tracking with quest monitoring
   */
  async trackReferralWithQuestMonitoring(referrerWallet: string, referredWallet: string): Promise<boolean> {
    try {
      // Track the referral first
      const success = await this.trackReferral(referrerWallet, referredWallet)

      if (success) {
        // Check and complete referral quest after successful tracking
        await this.checkAndCompleteReferralQuest(referrerWallet)
        console.log(`✅ Referral tracked and quest checked for ${referrerWallet}`)
      }

      return success
    } catch (error) {
      console.error('Error in enhanced referral tracking:', error)
      return false
    }
  }
}

// Create singleton instance
export const firebaseReferralService = new FirebaseReferralService()
