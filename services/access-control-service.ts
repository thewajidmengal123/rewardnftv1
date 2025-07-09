// Access Control Service class
export class AccessControlService {
  // Check if user has minted an NFT
  async hasNFT(walletAddress: string): Promise<boolean> {
    if (!walletAddress) return false

    try {
      // In a real implementation, you would query the blockchain
      // For this demo, we'll use localStorage to simulate NFT ownership
      return localStorage.getItem(`nft_minted_${walletAddress}`) === "true"
    } catch (error) {
      console.error("Error checking NFT ownership:", error)
      return false
    }
  }

  // Check if user can access a specific feature
  async canAccessFeature(
    walletAddress: string,
    feature: "mint" | "referrals" | "quests" | "leaderboard" | "profile",
  ): Promise<boolean> {
    if (!walletAddress) return false

    try {
      // Mint and profile pages only require wallet connection
      if (feature === "mint" || feature === "profile") {
        return true
      }

      // Other features require NFT ownership
      return await this.hasNFT(walletAddress)
    } catch (error) {
      console.error(`Error checking access to ${feature}:`, error)
      return false
    }
  }

  // Record NFT mint
  recordNFTMint(walletAddress: string): void {
    if (!walletAddress) return

    try {
      localStorage.setItem(`nft_minted_${walletAddress}`, "true")
    } catch (error) {
      console.error("Error recording NFT mint:", error)
    }
  }
}

// Create a singleton instance
let accessControlServiceInstance: AccessControlService | null = null

// Get access control service instance
export function getAccessControlService(): AccessControlService {
  if (!accessControlServiceInstance) {
    accessControlServiceInstance = new AccessControlService()
  }
  return accessControlServiceInstance
}
