import { NextRequest, NextResponse } from "next/server"
import { firebaseReferralService } from "@/services/firebase-referral-service"
import { firebaseUserService } from "@/services/firebase-user-service"
import { firebaseLeaderboardService } from "@/services/firebase-leaderboard-service"

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, nftAddress, transactionSignature } = await request.json()

    // Validate input
    if (!walletAddress || !nftAddress || !transactionSignature) {
      return NextResponse.json(
        { error: "Missing required fields: walletAddress, nftAddress, transactionSignature" },
        { status: 400 }
      )
    }

    console.log(`Processing NFT mint completion for wallet: ${walletAddress}`)

    // Update user's NFT data
    await firebaseUserService.updateUserNFTData(walletAddress, nftAddress)

    // Complete any pending referral for this wallet
    const referralCompleted = await firebaseReferralService.completeReferral(walletAddress)

    let referralRewardProcessed = false
    let referrerWallet = null

    if (referralCompleted) {
      console.log(`Referral completed for wallet: ${walletAddress}`)
      
      // Check who referred this user
      referrerWallet = await firebaseReferralService.checkIfReferred(walletAddress)
      
      if (referrerWallet) {
        // Process the referral reward
        referralRewardProcessed = await firebaseReferralService.processReferralReward(
          walletAddress,
          transactionSignature
        )

        if (referralRewardProcessed) {
          console.log(`Referral reward processed for referrer: ${referrerWallet}`)
          
          // Update referrer's leaderboard position
          await firebaseLeaderboardService.updateUserLeaderboardPosition(referrerWallet)
        }
      }
    }

    // Update user's leaderboard position
    await firebaseLeaderboardService.updateUserLeaderboardPosition(walletAddress)

    return NextResponse.json({
      success: true,
      message: "NFT mint completion processed successfully",
      data: {
        walletAddress,
        nftAddress,
        transactionSignature,
        referralCompleted,
        referralRewardProcessed,
        referrerWallet,
      },
    })
  } catch (error) {
    console.error("Error processing NFT mint completion:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
