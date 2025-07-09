import { NextRequest, NextResponse } from "next/server"
import { firebaseReferralService } from "@/services/firebase-referral-service"
import { firebaseUserService } from "@/services/firebase-user-service"
import { firebaseLeaderboardService } from "@/services/firebase-leaderboard-service"

export async function POST(request: NextRequest) {
  try {
    const { referralCode, walletAddress } = await request.json()

    console.log(`🔗 API: Tracking referral ${referralCode} -> ${walletAddress}`)

    // Validate input
    if (!referralCode || !walletAddress) {
      return NextResponse.json(
        { success: false, error: "Missing referralCode or walletAddress" },
        { status: 400 }
      )
    }

    // Validate referral code and get referrer
    const referrer = await firebaseReferralService.getUserByReferralCode(referralCode)
    if (!referrer) {
      return NextResponse.json(
        { success: false, error: "Invalid referral code" },
        { status: 400 }
      )
    }

    // Check if user is trying to refer themselves
    if (referrer.walletAddress === walletAddress) {
      return NextResponse.json(
        { success: false, error: "Cannot refer yourself" },
        { status: 400 }
      )
    }

    // Track the referral
    const success = await firebaseReferralService.trackReferral(referralCode, walletAddress)

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Failed to track referral. User may already be referred." },
        { status: 400 }
      )
    }

    // Update leaderboard positions
    await firebaseLeaderboardService.updateUserLeaderboardPosition(referrer.walletAddress)

    // Get updated user data to confirm referral was tracked
    const user = await firebaseUserService.getUserByWallet(walletAddress)

    console.log(`✅ Referral tracked successfully: ${referrer.walletAddress} -> ${walletAddress}`)

    return NextResponse.json({
      success: true,
      message: "Referral tracked successfully",
      data: {
        referrer: {
          walletAddress: referrer.walletAddress,
          displayName: referrer.displayName || `User ${referrer.walletAddress.slice(0, 8)}`,
          referralCode: referrer.referralCode
        },
        referred: {
          walletAddress: user?.walletAddress,
          referredBy: user?.referredBy
        }
      }
    })
  } catch (error) {
    console.error("Error tracking referral:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get("wallet")
    const action = searchParams.get("action") || "stats"

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: "Missing wallet address" },
        { status: 400 }
      )
    }

    switch (action) {
      case "check-referred": {
        // Check if user was referred
        const referrerWallet = await firebaseReferralService.checkIfReferred(walletAddress)

        if (referrerWallet) {
          // Get referrer details
          const referrer = await firebaseUserService.getUserByWallet(referrerWallet)

          return NextResponse.json({
            success: true,
            isReferred: true,
            referrer: {
              walletAddress: referrerWallet,
              displayName: referrer?.displayName || `User ${referrerWallet.slice(0, 8)}`,
              referralCode: referrer?.referralCode
            }
          })
        } else {
          return NextResponse.json({
            success: true,
            isReferred: false,
            referrer: null
          })
        }
      }

      case "stats":
      default: {
        // Get referral stats and history
        const stats = await firebaseReferralService.getReferralStats(walletAddress)
        const history = await firebaseReferralService.getReferralHistory(walletAddress)

        return NextResponse.json({
          success: true,
          stats,
          history,
        })
      }
    }
  } catch (error) {
    console.error("Error getting referral data:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
