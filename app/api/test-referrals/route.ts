import { type NextRequest, NextResponse } from "next/server"
import { firebaseReferralService } from "@/services/firebase-referral-service"
import { firebaseUserService } from "@/services/firebase-user-service"

export async function POST(request: NextRequest) {
  try {
    const { action, walletAddress } = await request.json()

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: "Wallet address is required" },
        { status: 400 }
      )
    }

    switch (action) {
      case "create-test-referral": {
        // First ensure the user exists
        let user = await firebaseUserService.getUserByWallet(walletAddress)
        if (!user) {
          user = await firebaseReferralService.initializeUserReferral(walletAddress)
        }

        // Create a test referral
        const testWallet = `test${Date.now()}${Math.random().toString(36).substring(2, 9)}`
        const success = await firebaseReferralService.trackReferral(
          user.referralCode,
          testWallet
        )

        if (success) {
          // Get updated stats and history
          const [stats, history] = await Promise.all([
            firebaseReferralService.getReferralStats(walletAddress),
            firebaseReferralService.getReferralHistory(walletAddress)
          ])

          return NextResponse.json({
            success: true,
            message: "Test referral created successfully",
            testWallet,
            stats,
            history
          })
        } else {
          return NextResponse.json(
            { success: false, error: "Failed to create test referral" },
            { status: 500 }
          )
        }
      }

      case "complete-test-referral": {
        // Find a pending referral and complete it
        const history = await firebaseReferralService.getReferralHistory(walletAddress)
        const pendingReferral = history.find(ref => ref.status === "pending")

        if (!pendingReferral) {
          return NextResponse.json(
            { success: false, error: "No pending referrals found to complete" },
            { status: 400 }
          )
        }

        // Complete the referral
        const completed = await firebaseReferralService.completeReferral(pendingReferral.referredWallet)

        if (completed) {
          // Get updated stats and history
          const [stats, updatedHistory] = await Promise.all([
            firebaseReferralService.getReferralStats(walletAddress),
            firebaseReferralService.getReferralHistory(walletAddress)
          ])

          return NextResponse.json({
            success: true,
            message: "Test referral completed successfully",
            completedWallet: pendingReferral.referredWallet,
            stats,
            history: updatedHistory
          })
        } else {
          return NextResponse.json(
            { success: false, error: "Failed to complete test referral" },
            { status: 500 }
          )
        }
      }

      case "get-referral-data": {
        const [stats, history] = await Promise.all([
          firebaseReferralService.getReferralStats(walletAddress),
          firebaseReferralService.getReferralHistory(walletAddress)
        ])

        return NextResponse.json({
          success: true,
          stats,
          history,
          historyCount: history.length
        })
      }

      case "check-user": {
        const user = await firebaseUserService.getUserByWallet(walletAddress)
        return NextResponse.json({
          success: true,
          user,
          exists: !!user
        })
      }

      case "debug-referrals": {
        const [stats, history] = await Promise.all([
          firebaseReferralService.getReferralStats(walletAddress),
          firebaseReferralService.getReferralHistory(walletAddress)
        ])

        // Calculate expected earnings manually
        const expectedEarnings = history.filter(ref =>
          ref.status === "completed" || ref.status === "rewarded"
        ).reduce((total, ref) => total + ref.rewardAmount, 0)

        return NextResponse.json({
          success: true,
          debug: {
            stats,
            history,
            historyCount: history.length,
            statusBreakdown: {
              pending: history.filter(ref => ref.status === "pending").length,
              completed: history.filter(ref => ref.status === "completed").length,
              rewarded: history.filter(ref => ref.status === "rewarded").length,
            },
            expectedEarnings,
            actualEarnings: stats.totalEarned,
            calculationCorrect: expectedEarnings === stats.totalEarned
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
    console.error("Test referrals API error:", error)
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

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: "Wallet address is required" },
        { status: 400 }
      )
    }

    // Get referral data
    const [stats, history, user] = await Promise.all([
      firebaseReferralService.getReferralStats(walletAddress),
      firebaseReferralService.getReferralHistory(walletAddress),
      firebaseUserService.getUserByWallet(walletAddress)
    ])

    return NextResponse.json({
      success: true,
      user,
      stats,
      history,
      historyCount: history.length,
      debug: {
        userExists: !!user,
        referralCode: user?.referralCode,
        totalReferrals: stats.totalReferrals
      }
    })
  } catch (error) {
    console.error("Test referrals GET error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error"
      },
      { status: 500 }
    )
  }
}
