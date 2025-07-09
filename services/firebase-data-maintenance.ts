import { firebaseUserService } from "./firebase-user-service"
import { firebaseReferralService } from "./firebase-referral-service"
import { firebaseLeaderboardService } from "./firebase-leaderboard-service"
import type { UserProfile } from "@/types/firebase"

export class FirebaseDataMaintenance {
  /**
   * Comprehensive data sync for a single user
   * Ensures all user data is consistent across collections
   */
  async syncUserData(walletAddress: string): Promise<{
    success: boolean
    user?: UserProfile
    stats?: any
    errors?: string[]
  }> {
    const errors: string[] = []
    
    try {
      console.log(`Starting comprehensive sync for user: ${walletAddress}`)
      
      // 1. Get current user profile
      let user = await firebaseUserService.getUserByWallet(walletAddress)
      
      if (!user) {
        console.log("User not found, creating new profile...")
        user = await firebaseUserService.createOrUpdateUser(walletAddress, {})
      }
      
      // 2. Get actual referral stats from referrals collection
      const actualStats = await firebaseReferralService.getReferralStats(walletAddress)
      
      // 3. Check for inconsistencies and update if needed
      const needsUpdate = 
        user.totalReferrals !== actualStats.totalReferrals ||
        user.totalEarned !== actualStats.totalEarned
      
      if (needsUpdate) {
        console.log(`Updating user data - Current: ${user.totalReferrals} referrals, ${user.totalEarned} earned`)
        console.log(`Actual: ${actualStats.totalReferrals} referrals, ${actualStats.totalEarned} earned`)
        
        await firebaseUserService.syncUserReferralData(walletAddress)
        
        // Get updated user data
        user = await firebaseUserService.getUserByWallet(walletAddress)
      }
      
      // 4. Update leaderboard position
      try {
        await firebaseLeaderboardService.updateUserLeaderboardPosition(walletAddress)
      } catch (error) {
        errors.push(`Leaderboard update failed: ${error}`)
      }
      
      console.log(`Sync completed for user: ${walletAddress}`)
      
      return {
        success: true,
        user: user!,
        stats: actualStats,
        errors: errors.length > 0 ? errors : undefined
      }
      
    } catch (error) {
      console.error(`Error syncing user data for ${walletAddress}:`, error)
      errors.push(`Main sync failed: ${error}`)
      
      return {
        success: false,
        errors
      }
    }
  }

  /**
   * Batch sync multiple users
   */
  async batchSyncUsers(walletAddresses: string[]): Promise<{
    success: boolean
    results: Array<{
      walletAddress: string
      success: boolean
      errors?: string[]
    }>
    summary: {
      total: number
      successful: number
      failed: number
    }
  }> {
    console.log(`Starting batch sync for ${walletAddresses.length} users`)
    
    const results = []
    let successful = 0
    let failed = 0
    
    // Process in smaller batches to avoid overwhelming Firebase
    const batchSize = 5
    
    for (let i = 0; i < walletAddresses.length; i += batchSize) {
      const batch = walletAddresses.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (walletAddress) => {
        const result = await this.syncUserData(walletAddress)
        
        if (result.success) {
          successful++
        } else {
          failed++
        }
        
        return {
          walletAddress,
          success: result.success,
          errors: result.errors
        }
      })
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
      
      // Small delay between batches
      if (i + batchSize < walletAddresses.length) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }
    
    console.log(`Batch sync completed: ${successful} successful, ${failed} failed`)
    
    return {
      success: failed === 0,
      results,
      summary: {
        total: walletAddresses.length,
        successful,
        failed
      }
    }
  }

  /**
   * Validate data consistency across all collections
   */
  async validateDataConsistency(limit: number = 100): Promise<{
    inconsistencies: Array<{
      walletAddress: string
      userProfile: {
        totalReferrals: number
        totalEarned: number
      }
      actualStats: {
        totalReferrals: number
        totalEarned: number
      }
      difference: {
        referrals: number
        earnings: number
      }
    }>
    summary: {
      totalChecked: number
      inconsistentUsers: number
      consistentUsers: number
    }
  }> {
    console.log(`Validating data consistency for up to ${limit} users`)
    
    const users = await firebaseUserService.getAllUsers(limit)
    const inconsistencies = []
    
    for (const user of users) {
      try {
        const actualStats = await firebaseReferralService.getReferralStats(user.walletAddress)
        
        const referralsDiff = user.totalReferrals - actualStats.totalReferrals
        const earningsDiff = user.totalEarned - actualStats.totalEarned
        
        if (referralsDiff !== 0 || earningsDiff !== 0) {
          inconsistencies.push({
            walletAddress: user.walletAddress,
            userProfile: {
              totalReferrals: user.totalReferrals,
              totalEarned: user.totalEarned
            },
            actualStats: {
              totalReferrals: actualStats.totalReferrals,
              totalEarned: actualStats.totalEarned
            },
            difference: {
              referrals: referralsDiff,
              earnings: earningsDiff
            }
          })
        }
      } catch (error) {
        console.error(`Error validating user ${user.walletAddress}:`, error)
      }
    }
    
    console.log(`Validation completed: ${inconsistencies.length} inconsistencies found out of ${users.length} users`)
    
    return {
      inconsistencies,
      summary: {
        totalChecked: users.length,
        inconsistentUsers: inconsistencies.length,
        consistentUsers: users.length - inconsistencies.length
      }
    }
  }

  /**
   * Fix all data inconsistencies
   */
  async fixAllInconsistencies(): Promise<{
    success: boolean
    fixed: number
    errors: number
    details: Array<{
      walletAddress: string
      success: boolean
      error?: string
    }>
  }> {
    console.log("Starting to fix all data inconsistencies...")
    
    // First, find all inconsistencies
    const validation = await this.validateDataConsistency(1000)
    
    if (validation.inconsistencies.length === 0) {
      console.log("No inconsistencies found!")
      return {
        success: true,
        fixed: 0,
        errors: 0,
        details: []
      }
    }
    
    console.log(`Found ${validation.inconsistencies.length} inconsistencies to fix`)
    
    // Fix each inconsistency
    const walletAddresses = validation.inconsistencies.map(inc => inc.walletAddress)
    const batchResult = await this.batchSyncUsers(walletAddresses)
    
    return {
      success: batchResult.summary.failed === 0,
      fixed: batchResult.summary.successful,
      errors: batchResult.summary.failed,
      details: batchResult.results
    }
  }

  /**
   * Get comprehensive user data for display
   */
  async getUserDisplayData(walletAddress: string): Promise<{
    user: UserProfile | null
    stats: any
    referredUsers: UserProfile[]
    history: any[]
    isConsistent: boolean
  }> {
    const [user, stats, referredUsers, history] = await Promise.all([
      firebaseUserService.getUserByWallet(walletAddress),
      firebaseReferralService.getReferralStats(walletAddress),
      firebaseUserService.getUserReferredList(walletAddress),
      firebaseReferralService.getReferralHistory(walletAddress)
    ])
    
    // Check consistency
    const isConsistent = user ? 
      (user.totalReferrals === stats.totalReferrals && user.totalEarned === stats.totalEarned) : 
      false
    
    return {
      user,
      stats,
      referredUsers,
      history,
      isConsistent
    }
  }
}

// Create singleton instance
export const firebaseDataMaintenance = new FirebaseDataMaintenance()
