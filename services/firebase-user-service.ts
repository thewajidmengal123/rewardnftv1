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

    await updateDoc(userRef, {
      totalEarned: increment(amount),
      lastActive: serverTimestamp(),
    })
  }

  // Update referral count
  async incrementReferralCount(walletAddress: string): Promise<void> {
    const userRef = doc(db, this.COLLECTION, walletAddress)

    await updateDoc(userRef, {
      totalReferrals: increment(1),
      lastActive: serverTimestamp(),
    })
  }

  // Update quest completion
  async incrementQuestCompletion(walletAddress: string): Promise<void> {
    const userRef = doc(db, this.COLLECTION, walletAddress)

    await updateDoc(userRef, {
      questsCompleted: increment(1),
      lastActive: serverTimestamp(),
    })
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
