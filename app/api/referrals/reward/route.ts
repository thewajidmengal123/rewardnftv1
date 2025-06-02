import { NextRequest, NextResponse } from "next/server"
import { firebaseReferralService } from "@/services/firebase-referral-service"
import { firebaseLeaderboardService } from "@/services/firebase-leaderboard-service"

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, transactionSignature } = await request.json()

    // Validate input
    if (!walletAddress || !transactionSignature) {
      return NextResponse.json(
        { error: "Missing walletAddress or transactionSignature" },
        { status: 400 }
      )
    }

    // Process the referral reward
    const success = await firebaseReferralService.processReferralReward(
      walletAddress,
      transactionSignature
    )

    if (!success) {
      return NextResponse.json(
        { error: "Failed to process referral reward. No completed referral found." },
        { status: 400 }
      )
    }

    // Update leaderboard for the referrer
    const referrerWallet = await firebaseReferralService.checkIfReferred(walletAddress)
    if (referrerWallet) {
      await firebaseLeaderboardService.updateUserLeaderboardPosition(referrerWallet)
    }

    return NextResponse.json({
      success: true,
      message: "Referral reward processed successfully",
      transactionSignature,
    })
  } catch (error) {
    console.error("Error processing referral reward:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
