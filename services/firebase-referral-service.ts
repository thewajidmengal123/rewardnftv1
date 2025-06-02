import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
  increment,
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
  private readonly REFERRAL_REWARD_AMOUNT = 4 // USDC

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
      const referralData = referralDoc.data() as ReferralRecord

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

      console.log(`Referral reward processed for: ${referredWallet}`)
      return true
    } catch (error) {
      console.error("Error processing referral reward:", error)
      return false
    }
  }

  /**
   * Get referral stats for a user
   */
  async getReferralStats(walletAddress: string): Promise<ReferralStats> {
    try {
      const referralQuery = query(
        collection(db, this.REFERRALS_COLLECTION),
        where("referrerWallet", "==", walletAddress)
      )
      const referralSnapshot = await getDocs(referralQuery)

      let totalReferrals = 0
      let completedReferrals = 0
      let totalEarned = 0
      let pendingRewards = 0

      referralSnapshot.docs.forEach((doc) => {
        const referral = doc.data() as ReferralRecord
        totalReferrals++

        if (referral.status === "completed" || referral.status === "rewarded") {
          completedReferrals++
        }

        if (referral.status === "rewarded") {
          totalEarned += referral.rewardAmount
        } else if (referral.status === "completed") {
          pendingRewards += referral.rewardAmount
        }
      })

      return {
        totalReferrals,
        totalEarned,
        pendingRewards,
        completedReferrals,
      }
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
      const referralQuery = query(
        collection(db, this.REFERRALS_COLLECTION),
        where("referrerWallet", "==", walletAddress),
        orderBy("createdAt", "desc")
      )
      const referralSnapshot = await getDocs(referralQuery)

      const referrals: ReferralWithUser[] = []

      for (const doc of referralSnapshot.docs) {
        const referralData = doc.data() as ReferralRecord
        
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
}

// Create singleton instance
export const firebaseReferralService = new FirebaseReferralService()
