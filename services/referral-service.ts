// Interface for referral data
export interface ReferralData {
  code: string
  referrerWallet: string
  referrals: Array<{
    wallet: string
    timestamp: number
    rewarded: boolean
    transactionId?: string
  }>
  totalEarned: number
  totalReferrals: number
}

// Referral Service class
export class ReferralService {
  private referralStore: Record<string, ReferralData> = {}

  constructor() {
    // Load referral data from localStorage if available
    this.loadReferralData()
  }

  // Load referral data from localStorage
  private loadReferralData(): void {
    if (typeof window === "undefined") return

    try {
      const storedData = localStorage.getItem("referralData")
      if (storedData) {
        this.referralStore = JSON.parse(storedData)
      }
    } catch (error) {
      console.error("Error loading referral data:", error)
    }
  }

  // Save referral data to localStorage
  private saveReferralData(): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem("referralData", JSON.stringify(this.referralStore))
    } catch (error) {
      console.error("Error saving referral data:", error)
    }
  }

  // Generate a unique referral code for a wallet
  generateReferralCode(walletAddress: string): string {
    // Take the first 4 and last 4 characters of the wallet address
    const prefix = walletAddress.substring(0, 4)
    const suffix = walletAddress.substring(walletAddress.length - 4)

    // Add a timestamp to ensure uniqueness
    const timestamp = Date.now().toString(36).substring(4, 8)

    return `${prefix}${timestamp}${suffix}`.toLowerCase()
  }

  // Initialize referral data for a wallet
  initializeReferral(walletAddress: string): ReferralData {
    if (this.referralStore[walletAddress]) {
      return this.referralStore[walletAddress]
    }

    const code = this.generateReferralCode(walletAddress)
    const referralData: ReferralData = {
      code,
      referrerWallet: walletAddress,
      referrals: [],
      totalEarned: 0,
      totalReferrals: 0,
    }

    this.referralStore[walletAddress] = referralData
    this.saveReferralData()

    return referralData
  }

  // Get referral data for a wallet
  getReferralData(walletAddress: string): ReferralData | null {
    return this.referralStore[walletAddress] || null
  }

  // Get referral data by code
  getReferralByCode(code: string): ReferralData | null {
    const entries = Object.values(this.referralStore)
    return entries.find((entry) => entry.code === code) || null
  }

  // Track a new referral
  trackReferral(referralCode: string, newWalletAddress: string): boolean {
    const referralData = this.getReferralByCode(referralCode)

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
      rewarded: false,
    })

    referralData.totalReferrals += 1
    this.saveReferralData()

    return true
  }

  // Process referral reward
  async processReferralReward(referralCode: string, referredWallet: string): Promise<string | null> {
    const referralData = this.getReferralByCode(referralCode)

    if (!referralData) {
      return null
    }

    // Find the referral
    const referral = referralData.referrals.find((ref) => ref.wallet === referredWallet && !ref.rewarded)

    if (!referral) {
      return null
    }

    try {
      // In a real implementation, this would transfer USDC to the referrer
      // For demo purposes, we'll just simulate a successful transaction
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const transactionId = `sim_${Date.now().toString(36)}`

      // Update the referral data
      referral.rewarded = true
      referral.transactionId = transactionId
      referralData.totalEarned += 4 // 4 USDC reward per referral

      this.saveReferralData()

      return transactionId
    } catch (error) {
      console.error("Error processing referral reward:", error)
      return null
    }
  }

  // Get top referrers
  getTopReferrers(limit = 10): Array<{
    walletAddress: string
    totalReferrals: number
    totalEarned: number
  }> {
    return Object.entries(this.referralStore)
      .map(([walletAddress, data]) => ({
        walletAddress,
        totalReferrals: data.totalReferrals,
        totalEarned: data.totalEarned,
      }))
      .sort((a, b) => b.totalEarned - a.totalEarned)
      .slice(0, limit)
  }

  // Get referral link for a wallet
  getReferralLink(walletAddress: string): string {
    const referralData = this.getReferralData(walletAddress) || this.initializeReferral(walletAddress)
    return `${typeof window !== "undefined" ? window.location.origin : "https://rewardnft.com"}/mint?ref=${referralData.code}`
  }
}

// Create a singleton instance
let referralServiceInstance: ReferralService | null = null

// Get referral service instance
export function getReferralService(): ReferralService {
  if (!referralServiceInstance) {
    referralServiceInstance = new ReferralService()
  }
  return referralServiceInstance
}
