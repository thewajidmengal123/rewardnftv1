import { NextRequest, NextResponse } from "next/server"
import { firebaseReferralService } from "@/services/firebase-referral-service"
import { firebaseLeaderboardService } from "@/services/firebase-leaderboard-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log(`📊 Referral API called (tracking only, no rewards):`, body)

    // Handle both old and new API formats
    if (body.walletAddress && body.transactionSignature) {
      // Old format - track only, no rewards
      const { walletAddress, transactionSignature } = body

      console.log(`📊 Tracking referral (old format): ${walletAddress}`)

      // Just track the referral, no reward processing
      const referrerWallet = await firebaseReferralService.checkIfReferred(walletAddress)
      if (referrerWallet) {
        // Update leaderboard for tracking purposes
        await firebaseLeaderboardService.updateUserLeaderboardPosition(referrerWallet)
        console.log(`✅ Referral tracked for analytics: ${referrerWallet}`)
      }

      return NextResponse.json({
        success: true,
        message: "Referral tracked successfully (no rewards)",
        transactionSignature,
      })
    } else {
      // New format from minting services - track only
      const {
        referrerWallet,
        referredWallet,
        nftsMinted,
        mintSignatures,
        trackingOnly
      } = body

      // Validate required fields (removed rewardAmount)
      if (!referrerWallet || !referredWallet || !nftsMinted) {
        return NextResponse.json(
          { error: "Missing required fields: referrerWallet, referredWallet, nftsMinted" },
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

      console.log(`📊 Tracking referral: ${referrerWallet} → ${referredWallet} (${nftsMinted} NFTs)`)

      // Track the referral without processing rewards
      const success = await firebaseReferralService.trackReferralOnly(
        referrerWallet,
        referredWallet,
        nftsMinted,
        mintSignatures || []
      )

      if (!success) {
        return NextResponse.json(
          { error: "Failed to track referral" },
          { status: 400 }
        )
      }

      // Update leaderboard for tracking purposes
      await firebaseLeaderboardService.updateUserLeaderboardPosition(referrerWallet)

      return NextResponse.json({
        success: true,
        message: `Referral tracked successfully (no rewards)`,
        data: {
          referrerWallet,
          referredWallet,
          nftsMinted,
          trackingOnly: true
        }
      })
    }
  } catch (error) {
    console.error("Error tracking referral:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
