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
    // Mock data for development
    const address = publicKey.toString()

    return {
      address,
      nfts: [
        {
          mint: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
          name: "Reward NFT #001",
          image: "/nft-reward-token.png",
          attributes: [
            { trait_type: "Rarity", value: "Common" },
            { trait_type: "Type", value: "Reward" },
            { trait_type: "Level", value: "1" },
          ],
        },
        {
          mint: "8yKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsV",
          name: "Achievement NFT #002",
          image: "/mystery-box.png",
          attributes: [
            { trait_type: "Rarity", value: "Rare" },
            { trait_type: "Type", value: "Achievement" },
            { trait_type: "Level", value: "2" },
          ],
        },
      ],
      stats: {
        totalNFTs: 2,
        questsCompleted: 5,
        referrals: 3,
        points: 1250,
        rank: 42,
      },
      activities: [
        {
          id: "1",
          type: "mint",
          title: "NFT Minted",
          description: "Successfully minted Reward NFT #001",
          timestamp: "2024-01-15T10:30:00Z",
          points: 100,
        },
        {
          id: "2",
          type: "quest",
          title: "Daily Check-in",
          description: "Completed daily GM check-in",
          timestamp: "2024-01-15T09:00:00Z",
          points: 50,
        },
        {
          id: "3",
          type: "referral",
          title: "Friend Referred",
          description: "Successfully referred a new user",
          timestamp: "2024-01-14T16:45:00Z",
          points: 200,
        },
        {
          id: "4",
          type: "reward",
          title: "Bonus Points",
          description: "Received bonus points for activity",
          timestamp: "2024-01-14T14:20:00Z",
          points: 75,
        },
        {
          id: "5",
          type: "mint",
          title: "Achievement Unlocked",
          description: "Minted Achievement NFT #002",
          timestamp: "2024-01-13T11:15:00Z",
          points: 150,
        },
      ],
      referralCode: `REF${address.slice(0, 8).toUpperCase()}`,
      referralStats: {
        totalReferrals: 3,
        activeReferrals: 2,
        totalEarned: 45.5,
      },
    }
  }

  async updateUserProfile(publicKey: PublicKey, updates: Partial<UserProfile>): Promise<UserProfile> {
    // In a real implementation, this would update the user's profile
    const currentProfile = await this.getUserProfile(publicKey)
    return { ...currentProfile, ...updates }
  }

  async getUserNFTs(publicKey: PublicKey): Promise<UserProfile["nfts"]> {
    const profile = await this.getUserProfile(publicKey)
    return profile.nfts
  }

  async getUserStats(publicKey: PublicKey): Promise<UserProfile["stats"]> {
    const profile = await this.getUserProfile(publicKey)
    return profile.stats
  }

  async getUserActivities(publicKey: PublicKey): Promise<UserProfile["activities"]> {
    const profile = await this.getUserProfile(publicKey)
    return profile.activities
  }

  async generateReferralCode(publicKey: PublicKey): Promise<string> {
    const address = publicKey.toString()
    return `REF${address.slice(0, 8).toUpperCase()}`
  }

  async getReferralStats(publicKey: PublicKey): Promise<UserProfile["referralStats"]> {
    const profile = await this.getUserProfile(publicKey)
    return profile.referralStats
  }
}

// Create a singleton instance
const profileService = new ProfileService()

// Export both the class and the instance
export default profileService
