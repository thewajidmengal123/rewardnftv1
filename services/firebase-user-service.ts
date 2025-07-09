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
  increment,
  orderBy,
  limit,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { UserProfile } from "@/types/firebase"

export class FirebaseUserService {
  private readonly COLLECTION = "users"

  // Create or update user profile
  async createOrUpdateUser(walletAddress: string, userData: Partial<UserProfile>): Promise<UserProfile> {
    const userRef = doc(db, this.COLLECTION, walletAddress)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      // Update existing user
      await updateDoc(userRef, {
        ...userData,
        lastActive: serverTimestamp(),
      })

      const updatedSnap = await getDoc(userRef)
      return { id: updatedSnap.id, ...updatedSnap.data() } as UserProfile
    } else {
      // Create new user
      const newUser: Omit<UserProfile, "id"> = {
        walletAddress,
        displayName: userData.displayName || `User ${walletAddress.slice(0, 8)}`,
        createdAt: serverTimestamp() as any,
        lastActive: serverTimestamp() as any,
        isVerified: false,
        nftsMinted: 0,
        nftAddresses: [],
        totalEarned: 0,
        totalWithdrawn: 0,
        referralCode: this.generateReferralCode(walletAddress),
        totalReferrals: 0,
        questsCompleted: 0,
        dailyStreak: 0,
        notifications: {
          email: true,
          push: true,
          referrals: true,
          quests: true,
        },
        ...userData,
      }

      await setDoc(userRef, newUser)
      return { id: walletAddress, ...newUser } as UserProfile
    }
  }

  // Get user by wallet address
  async getUserByWallet(walletAddress: string): Promise<UserProfile | null> {
    const userRef = doc(db, this.COLLECTION, walletAddress)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() } as UserProfile
    }
    return null
  }

  // Get user by referral code
  async getUserByReferralCode(referralCode: string): Promise<UserProfile | null> {
    const q = query(collection(db, this.COLLECTION), where("referralCode", "==", referralCode))

    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0]
      return { id: doc.id, ...doc.data() } as UserProfile
    }
    return null
  }

  // Update user NFT data
  async updateUserNFTData(walletAddress: string, nftAddress: string): Promise<void> {
    const userRef = doc(db, this.COLLECTION, walletAddress)

    await updateDoc(userRef, {
      nftsMinted: increment(1),
      nftAddresses: [...((await this.getUserByWallet(walletAddress))?.nftAddresses || []), nftAddress],
      lastActive: serverTimestamp(),
    })
  }

  // Update user earnings
  async updateUserEarnings(walletAddress: string, amount: number): Promise<void> {
    const userRef = doc(db, this.COLLECTION, walletAddress)

    // Use setDoc with merge to create user if doesn't exist
    await setDoc(userRef, {
      totalEarned: increment(amount),
      lastActive: serverTimestamp(),
    }, { merge: true })
  }

  // Get all users for leaderboard (with pagination)
  async getAllUsers(limitCount: number = 100): Promise<UserProfile[]> {
    try {
      // Get users without ordering to avoid missing field issues
      const usersQuery = query(
        collection(db, this.COLLECTION),
        limit(limitCount)
      )

      const usersSnapshot = await getDocs(usersQuery)
      const users: UserProfile[] = []

      usersSnapshot.docs.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() } as UserProfile)
      })

      // Sort users by totalReferrals in memory (descending order)
      users.sort((a, b) => (b.totalReferrals || 0) - (a.totalReferrals || 0))

      return users
    } catch (error) {
      console.error("Error getting all users:", error)
      return []
    }
  }

  // Get users by referral count (for leaderboard)
  async getUsersByReferrals(limitCount: number = 50): Promise<UserProfile[]> {
    try {
      const usersQuery = query(
        collection(db, this.COLLECTION),
        where("totalReferrals", ">", 0),
        orderBy("totalReferrals", "desc"),
        limit(limitCount)
      )

      const usersSnapshot = await getDocs(usersQuery)
      const users: UserProfile[] = []

      usersSnapshot.docs.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() } as UserProfile)
      })

      return users
    } catch (error) {
      console.error("Error getting users by referrals:", error)
      return []
    }
  }

  // Get users by earnings (for leaderboard)
  async getUsersByEarnings(limitCount: number = 50): Promise<UserProfile[]> {
    try {
      const usersQuery = query(
        collection(db, this.COLLECTION),
        where("totalEarned", ">", 0),
        orderBy("totalEarned", "desc"),
        limit(limitCount)
      )

      const usersSnapshot = await getDocs(usersQuery)
      const users: UserProfile[] = []

      usersSnapshot.docs.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() } as UserProfile)
      })

      return users
    } catch (error) {
      console.error("Error getting users by earnings:", error)
      return []
    }
  }

  // Update referral count
  async incrementReferralCount(walletAddress: string): Promise<void> {
    const userRef = doc(db, this.COLLECTION, walletAddress)

    // Use setDoc with merge to create user if doesn't exist
    await setDoc(userRef, {
      totalReferrals: increment(1),
      lastActive: serverTimestamp(),
    }, { merge: true })
  }

  // Update quest completion
  async incrementQuestCompletion(walletAddress: string): Promise<void> {
    const userRef = doc(db, this.COLLECTION, walletAddress)

    // Use setDoc with merge to create user if doesn't exist
    await setDoc(userRef, {
      questsCompleted: increment(1),
      lastActive: serverTimestamp(),
    }, { merge: true })
  }

  // Update daily check-in
  async updateDailyCheckIn(walletAddress: string): Promise<void> {
    const userRef = doc(db, this.COLLECTION, walletAddress)
    const user = await this.getUserByWallet(walletAddress)

    if (user) {
      const today = new Date()
      const lastCheckIn = user.lastDailyCheckIn?.toDate()
      const isConsecutive = lastCheckIn && today.getTime() - lastCheckIn.getTime() <= 24 * 60 * 60 * 1000

      await updateDoc(userRef, {
        lastDailyCheckIn: serverTimestamp(),
        dailyStreak: isConsecutive ? increment(1) : 1,
        lastActive: serverTimestamp(),
      })
    }
  }

  // Sync user data with referral records (ensure consistency)
  async syncUserReferralData(walletAddress: string): Promise<void> {
    try {
      // Import referral service dynamically to avoid circular dependency
      const { firebaseReferralService } = await import("./firebase-referral-service")

      // Get actual referral stats from referrals collection
      const stats = await firebaseReferralService.getReferralStats(walletAddress)

      // Update user profile with accurate data
      const userRef = doc(db, this.COLLECTION, walletAddress)
      await updateDoc(userRef, {
        totalReferrals: stats.totalReferrals,
        totalEarned: stats.totalEarned,
        lastActive: serverTimestamp(),
      })

      console.log(`Synced user data for ${walletAddress}:`, stats)
    } catch (error) {
      console.error("Error syncing user referral data:", error)
    }
  }

  // Get user's referred users list
  async getUserReferredList(walletAddress: string): Promise<UserProfile[]> {
    try {
      // Import referral service dynamically
      const { firebaseReferralService } = await import("./firebase-referral-service")

      // Get referral history
      const referralHistory = await firebaseReferralService.getReferralHistory(walletAddress)

      // Get user profiles for all referred users
      const referredUsers: UserProfile[] = []

      for (const referral of referralHistory) {
        const user = await this.getUserByWallet(referral.referredWallet)
        if (user) {
          referredUsers.push(user)
        }
      }

      return referredUsers
    } catch (error) {
      console.error("Error getting user referred list:", error)
      return []
    }
  }

  // Generate referral code
  private generateReferralCode(walletAddress: string): string {
    const prefix = walletAddress.substring(0, 4)
    const suffix = walletAddress.substring(walletAddress.length - 4)
    const timestamp = Date.now().toString(36).substring(4, 8)
    return `${prefix}${timestamp}${suffix}`.toLowerCase()
  }

  // Get top users by criteria
  async getTopUsers(criteria: "referrals" | "earnings" | "quests", limit = 10): Promise<UserProfile[]> {
    const fieldMap = {
      referrals: "totalReferrals",
      earnings: "totalEarned",
      quests: "questsCompleted",
    }

    const q = query(collection(db, this.COLLECTION), where(fieldMap[criteria], ">", 0))

    const querySnapshot = await getDocs(q)
    const users = querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as UserProfile,
    )

    return users.sort((a, b) => (b as any)[fieldMap[criteria]] - (a as any)[fieldMap[criteria]]).slice(0, limit)
  }
}

// Create singleton instance
export const firebaseUserService = new FirebaseUserService()
