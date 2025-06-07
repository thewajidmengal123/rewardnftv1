import type { PublicKey } from "@solana/web3.js"

export interface UserProfile {
  address: string
  nfts: Array<{
    mint: string
    name: string
    image: string
    attributes: Array<{ trait_type: string; value: string }>
  }>
  stats: {
    totalNFTs: number
    questsCompleted: number
    referrals: number
    points: number
    rank: number
  }
  activities: Array<{
    id: string
    type: "mint" | "quest" | "referral" | "reward"
    title: string
    description: string
    timestamp: string
    points?: number
  }>
  referralCode: string
  referralStats: {
    totalReferrals: number
    activeReferrals: number
    totalEarned: number
  }
}

export class ProfileService {
  async getUserProfile(publicKey: PublicKey): Promise<UserProfile> {
    const address = publicKey.toString()

    try {
      // Use the dedicated profile API endpoint
      const response = await fetch(`/api/profile/${address}`)

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        console.log('Profile data loaded successfully for:', address, data.data)
        return data.data
      } else {
        throw new Error(data.error || "Failed to fetch profile")
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)

      // Try to create a basic profile with sample data for development
      const fallbackProfile: UserProfile = {
        address,
        nfts: [],
        stats: {
          totalNFTs: 0,
          questsCompleted: 0,
          referrals: 0,
          points: 0,
          rank: 0,
        },
        activities: [
          {
            id: 'welcome',
            type: 'reward',
            title: 'Welcome to RewardNFT!',
            description: 'Your profile has been created. Start minting NFTs and referring friends to earn rewards!',
            timestamp: new Date().toISOString(),
            points: 0,
          }
        ],
        referralCode: `REF${address.slice(0, 8).toUpperCase()}`,
        referralStats: {
          totalReferrals: 0,
          activeReferrals: 0,
          totalEarned: 0,
        },
      }

      return fallbackProfile
    }
  }



  async updateUserProfile(publicKey: PublicKey, updates: Partial<UserProfile>): Promise<UserProfile> {
    // For now, just return the current profile since we don't have an update API endpoint
    // In a real implementation, this would call an API to update the user profile
    const address = publicKey.toString()
    console.log(`Update user profile for ${address}:`, updates)
    return await this.getUserProfile(publicKey)
  }

  async getUserNFTs(publicKey: PublicKey): Promise<UserProfile["nfts"]> {
    const profile = await this.getUserProfile(publicKey)
    return profile.nfts
  }

  async getUserStats(publicKey: PublicKey): Promise<UserProfile["stats"]> {
    const profile = await this.getUserProfile(publicKey)
    return profile.stats
  }

  async generateReferralCode(publicKey: PublicKey): Promise<string> {
    const address = publicKey.toString()
    try {
      const response = await fetch(`/api/profile/${address}`)
      const data = await response.json()
      return data.success && data.data?.referralCode ? data.data.referralCode : `REF${address.slice(0, 8).toUpperCase()}`
    } catch (error) {
      console.error("Error generating referral code:", error)
      return `REF${address.slice(0, 8).toUpperCase()}`
    }
  }

  async getReferralStats(publicKey: PublicKey): Promise<UserProfile["referralStats"]> {
    const address = publicKey.toString()
    try {
      const response = await fetch(`/api/profile/${address}`)
      const data = await response.json()
      const stats = data.success ? data.data.referralStats : null
      return {
        totalReferrals: stats?.totalReferrals || 0,
        activeReferrals: stats?.activeReferrals || 0,
        totalEarned: stats?.totalEarned || 0,
      }
    } catch (error) {
      console.error("Error fetching referral stats:", error)
      return {
        totalReferrals: 0,
        activeReferrals: 0,
        totalEarned: 0,
      }
    }
  }
}

// Create a singleton instance
const profileService = new ProfileService()

// Export both the class and the instance
export default profileService
