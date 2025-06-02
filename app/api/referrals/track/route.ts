import { NextRequest, NextResponse } from "next/server"
import { firebaseReferralService } from "@/services/firebase-referral-service"
import { firebaseLeaderboardService } from "@/services/firebase-leaderboard-service"

export async function POST(request: NextRequest) {
  try {
    const { referralCode, walletAddress } = await request.json()

    // Validate input
    if (!referralCode || !walletAddress) {
      return NextResponse.json(
        { error: "Missing referralCode or walletAddress" },
        { status: 400 }
      )
    }

    // Track the referral
    const success = await firebaseReferralService.trackReferral(referralCode, walletAddress)

    if (!success) {
      return NextResponse.json(
        { error: "Failed to track referral. Invalid code or wallet already referred." },
        { status: 400 }
      )
    }

    // Update leaderboard positions
    const referrer = await firebaseReferralService.getUserByReferralCode(referralCode)
    if (referrer) {
      await firebaseLeaderboardService.updateUserLeaderboardPosition(referrer.walletAddress)
    }

    return NextResponse.json({
      success: true,
      message: "Referral tracked successfully",
    })
  } catch (error) {
    console.error("Error tracking referral:", error)
    return NextResponse.json(
      { error: "Internal server error" },
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
        { error: "Missing wallet address" },
        { status: 400 }
      )
    }

    // Get referral stats
    const stats = await firebaseReferralService.getReferralStats(walletAddress)
    const history = await firebaseReferralService.getReferralHistory(walletAddress)

    return NextResponse.json({
      stats,
      history,
    })
  } catch (error) {
    console.error("Error getting referral data:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
