import { type NextRequest, NextResponse } from "next/server"
import { firebaseUserService } from "@/services/firebase-user-service"
import { firebaseReferralService } from "@/services/firebase-referral-service"

export async function POST(request: NextRequest) {
  try {
    const { action, walletAddress } = await request.json()

    switch (action) {
      case "sync-single-user": {
        if (!walletAddress) {
          return NextResponse.json(
            { success: false, error: "Wallet address is required" },
            { status: 400 }
          )
        }

        await firebaseUserService.syncUserReferralData(walletAddress)
        
        // Get updated user data
        const user = await firebaseUserService.getUserByWallet(walletAddress)
        const stats = await firebaseReferralService.getReferralStats(walletAddress)
        
        return NextResponse.json({
          success: true,
          message: "User data synced successfully",
          user,
          stats
        })
      }

      case "sync-all-users": {
        // Get all users and sync their data
        const users = await firebaseUserService.getAllUsers(100)
        let syncedCount = 0
        let errorCount = 0

        for (const user of users) {
          try {
            await firebaseUserService.syncUserReferralData(user.walletAddress)
            syncedCount++
          } catch (error) {
            console.error(`Error syncing user ${user.walletAddress}:`, error)
            errorCount++
          }
        }

        return NextResponse.json({
          success: true,
          message: `Synced ${syncedCount} users successfully, ${errorCount} errors`,
          syncedCount,
          errorCount,
          totalUsers: users.length
        })
      }

      case "get-user-referrals": {
        if (!walletAddress) {
          return NextResponse.json(
            { success: false, error: "Wallet address is required" },
            { status: 400 }
          )
        }

        const referredUsers = await firebaseUserService.getUserReferredList(walletAddress)
        const stats = await firebaseReferralService.getReferralStats(walletAddress)
        const history = await firebaseReferralService.getReferralHistory(walletAddress)

        return NextResponse.json({
          success: true,
          referredUsers,
          stats,
          history,
          count: referredUsers.length
        })
      }

      case "validate-data-consistency": {
        // Check data consistency across users and referrals
        const users = await firebaseUserService.getAllUsers(50)
        const inconsistencies = []

        for (const user of users) {
          const actualStats = await firebaseReferralService.getReferralStats(user.walletAddress)
          
          if (user.totalReferrals !== actualStats.totalReferrals || 
              user.totalEarned !== actualStats.totalEarned) {
            inconsistencies.push({
              walletAddress: user.walletAddress,
              userProfile: {
                totalReferrals: user.totalReferrals,
                totalEarned: user.totalEarned
              },
              actualStats: {
                totalReferrals: actualStats.totalReferrals,
                totalEarned: actualStats.totalEarned
              }
            })
          }
        }

        return NextResponse.json({
          success: true,
          message: `Found ${inconsistencies.length} inconsistencies out of ${users.length} users`,
          inconsistencies,
          totalChecked: users.length
        })
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("Sync users API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error"
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get("wallet")
    const action = searchParams.get("action") || "get-stats"

    switch (action) {
      case "get-stats": {
        if (!walletAddress) {
          return NextResponse.json(
            { success: false, error: "Wallet address is required" },
            { status: 400 }
          )
        }

        const [user, stats, referredUsers] = await Promise.all([
          firebaseUserService.getUserByWallet(walletAddress),
          firebaseReferralService.getReferralStats(walletAddress),
          firebaseUserService.getUserReferredList(walletAddress)
        ])

        return NextResponse.json({
          success: true,
          user,
          stats,
          referredUsers,
          referredCount: referredUsers.length
        })
      }

      case "get-all-users": {
        const limit = parseInt(searchParams.get("limit") || "50")
        const users = await firebaseUserService.getAllUsers(limit)

        return NextResponse.json({
          success: true,
          users,
          count: users.length
        })
      }

      case "get-leaderboard": {
        const type = searchParams.get("type") || "referrals"
        const limit = parseInt(searchParams.get("limit") || "10")

        let users: any[] = []
        
        if (type === "referrals") {
          users = await firebaseUserService.getUsersByReferrals(limit)
        } else if (type === "earnings") {
          users = await firebaseUserService.getUsersByEarnings(limit)
        }

        return NextResponse.json({
          success: true,
          leaderboard: users,
          type,
          count: users.length
        })
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("Sync users GET error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error"
      },
      { status: 500 }
    )
  }
}
