import { type NextRequest, NextResponse } from "next/server"
import { firebaseDataMaintenance } from "@/services/firebase-data-maintenance"
import { firebaseUserService } from "@/services/firebase-user-service"

export async function POST(request: NextRequest) {
  try {
    const { action, walletAddress, walletAddresses, limit } = await request.json()

    switch (action) {
      case "sync-single-user": {
        if (!walletAddress) {
          return NextResponse.json(
            { success: false, error: "Wallet address is required" },
            { status: 400 }
          )
        }

        const result = await firebaseDataMaintenance.syncUserData(walletAddress)
        
        return NextResponse.json({
          success: result.success,
          message: result.success ? "User data synced successfully" : "Failed to sync user data",
          data: result,
        })
      }

      case "batch-sync-users": {
        if (!walletAddresses || !Array.isArray(walletAddresses)) {
          return NextResponse.json(
            { success: false, error: "Wallet addresses array is required" },
            { status: 400 }
          )
        }

        const result = await firebaseDataMaintenance.batchSyncUsers(walletAddresses)
        
        return NextResponse.json({
          success: result.success,
          message: `Batch sync completed: ${result.summary.successful} successful, ${result.summary.failed} failed`,
          data: result,
        })
      }

      case "sync-all-users": {
        const userLimit = limit || 100
        
        // Get all users
        const users = await firebaseUserService.getAllUsers(userLimit)
        const walletAddresses = users.map(user => user.walletAddress)
        
        const result = await firebaseDataMaintenance.batchSyncUsers(walletAddresses)
        
        return NextResponse.json({
          success: result.success,
          message: `Synced all users: ${result.summary.successful} successful, ${result.summary.failed} failed`,
          data: result,
        })
      }

      case "validate-consistency": {
        const checkLimit = limit || 100
        
        const result = await firebaseDataMaintenance.validateDataConsistency(checkLimit)
        
        return NextResponse.json({
          success: true,
          message: `Validation completed: ${result.summary.inconsistentUsers} inconsistencies found out of ${result.summary.totalChecked} users`,
          data: result,
        })
      }

      case "fix-all-inconsistencies": {
        const result = await firebaseDataMaintenance.fixAllInconsistencies()
        
        return NextResponse.json({
          success: result.success,
          message: `Fixed ${result.fixed} inconsistencies, ${result.errors} errors`,
          data: result,
        })
      }

      case "get-user-display-data": {
        if (!walletAddress) {
          return NextResponse.json(
            { success: false, error: "Wallet address is required" },
            { status: 400 }
          )
        }

        const result = await firebaseDataMaintenance.getUserDisplayData(walletAddress)
        
        return NextResponse.json({
          success: true,
          message: "User display data retrieved successfully",
          data: result,
        })
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("Data maintenance API error:", error)
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
    const action = searchParams.get("action") || "health-check"
    const walletAddress = searchParams.get("wallet")
    const limit = parseInt(searchParams.get("limit") || "50")

    switch (action) {
      case "health-check": {
        // Quick health check of the data maintenance system
        const users = await firebaseUserService.getAllUsers(10)
        
        return NextResponse.json({
          success: true,
          message: "Data maintenance system is healthy",
          data: {
            timestamp: new Date().toISOString(),
            sampleUsersCount: users.length,
            systemStatus: "operational"
          }
        })
      }

      case "get-user-data": {
        if (!walletAddress) {
          return NextResponse.json(
            { success: false, error: "Wallet address is required" },
            { status: 400 }
          )
        }

        const result = await firebaseDataMaintenance.getUserDisplayData(walletAddress)
        
        return NextResponse.json({
          success: true,
          data: result
        })
      }

      case "quick-validation": {
        // Quick validation of a small sample
        const result = await firebaseDataMaintenance.validateDataConsistency(Math.min(limit, 20))
        
        return NextResponse.json({
          success: true,
          message: `Quick validation: ${result.summary.inconsistentUsers} inconsistencies in ${result.summary.totalChecked} users`,
          data: result
        })
      }

      case "get-all-users": {
        const users = await firebaseUserService.getAllUsers(limit)
        
        return NextResponse.json({
          success: true,
          data: {
            users,
            count: users.length
          }
        })
      }

      case "get-users-by-referrals": {
        const users = await firebaseUserService.getUsersByReferrals(limit)
        
        return NextResponse.json({
          success: true,
          data: {
            users,
            count: users.length
          }
        })
      }

      case "get-users-by-earnings": {
        const users = await firebaseUserService.getUsersByEarnings(limit)
        
        return NextResponse.json({
          success: true,
          data: {
            users,
            count: users.length
          }
        })
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("Data maintenance GET error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error"
      },
      { status: 500 }
    )
  }
}
