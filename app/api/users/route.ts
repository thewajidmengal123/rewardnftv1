import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get("wallet")

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: "Wallet address required" },
        { status: 400 }
      )
    }

    // Get user data from Firebase
    const userDoc = await adminDb.collection("users").doc(walletAddress).get()
    
    if (!userDoc.exists) {
      // Return default user data if user doesn't exist
      return NextResponse.json({
        success: true,
        data: {
          walletAddress,
          totalReferrals: 0,
          nftsMinted: 0,
          totalEarned: 0,
          createdAt: null
        }
      })
    }

    const userData = userDoc.data()
    
    // Get referral count from referrals collection
    const referralsSnapshot = await adminDb
      .collection("referrals")
      .where("referrerWallet", "==", walletAddress)
      .where("status", "==", "rewarded")
      .get()

    const totalReferrals = referralsSnapshot.size

    // Get NFT count
    const nftsSnapshot = await adminDb
      .collection("nfts")
      .where("ownerWallet", "==", walletAddress)
      .get()

    const nftsMinted = nftsSnapshot.size

    // Calculate total earned (referral rewards)
    const totalEarned = totalReferrals * 4 // 4 USDC per referral

    const enrichedUserData = {
      ...userData,
      walletAddress,
      totalReferrals,
      nftsMinted,
      totalEarned
    }

    return NextResponse.json({
      success: true,
      data: enrichedUserData
    })

  } catch (error) {
    console.error("User API error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
