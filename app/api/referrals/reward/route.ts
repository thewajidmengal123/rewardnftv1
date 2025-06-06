import { NextRequest, NextResponse } from "next/server"
import { firebaseReferralService } from "@/services/firebase-referral-service"
import { firebaseLeaderboardService } from "@/services/firebase-leaderboard-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Handle both old and new API formats
    if (body.walletAddress && body.transactionSignature) {
      // Old format - use existing logic
      const { walletAddress, transactionSignature } = body

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
    } else {
      // New format from minting services
      const {
        referrerWallet,
        referredWallet,
        rewardAmount,
        nftsMinted,
        mintSignatures
      } = body

      // Validate required fields
      if (!referrerWallet || !referredWallet || !rewardAmount || !nftsMinted) {
        return NextResponse.json(
          { error: "Missing required fields: referrerWallet, referredWallet, rewardAmount, nftsMinted" },
          { status: 400 }
        )
      }

      // Prevent self-referral
      if (referrerWallet === referredWallet) {
        return NextResponse.json(
          { error: "Self-referral not allowed" },
          { status: 400 }
        )
      }

      // Process the referral reward using the new format
      const success = await firebaseReferralService.processDirectReferralReward(
        referrerWallet,
        referredWallet,
        rewardAmount,
        nftsMinted,
        mintSignatures || []
      )

      if (!success) {
        return NextResponse.json(
          { error: "Failed to process referral reward" },
          { status: 400 }
        )
      }

      // Update leaderboard for the referrer
      await firebaseLeaderboardService.updateUserLeaderboardPosition(referrerWallet)

      return NextResponse.json({
        success: true,
        message: `Referral reward of ${rewardAmount} USDC processed successfully`,
        data: {
          referrerWallet,
          referredWallet,
          rewardAmount,
          nftsMinted
        }
      })
    }
  } catch (error) {
    console.error("Error processing referral reward:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
