import { NextRequest, NextResponse } from "next/server"
import { firebaseReferralService } from "@/services/firebase-referral-service"
import { firebaseLeaderboardService } from "@/services/firebase-leaderboard-service"

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, transactionSignature } = await request.json()

    // Validate input
    if (!walletAddress) {
      return NextResponse.json(
        { error: "Missing walletAddress" },
        { status: 400 }
      )
    }

    // Complete the referral (when user mints NFT)
    const completed = await firebaseReferralService.completeReferral(walletAddress)

    if (!completed) {
      return NextResponse.json({
        success: false,
        message: "No pending referral found for this wallet",
      })
    }

    // Check if we should also process the reward
    if (transactionSignature) {
      const rewarded = await firebaseReferralService.processReferralReward(
        walletAddress,
        transactionSignature
      )

      if (rewarded) {
        // Update leaderboard for the referrer
        const referrerWallet = await firebaseReferralService.checkIfReferred(walletAddress)
        if (referrerWallet) {
          await firebaseLeaderboardService.updateUserLeaderboardPosition(referrerWallet)
        }

        return NextResponse.json({
          success: true,
          message: "Referral completed and reward processed",
          rewarded: true,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Referral completed successfully",
      rewarded: false,
    })
  } catch (error) {
    console.error("Error completing referral:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
