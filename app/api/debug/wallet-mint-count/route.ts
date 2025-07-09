import { NextRequest, NextResponse } from "next/server"
import { firebaseUserService } from "@/services/firebase-user-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const wallet = searchParams.get("wallet")

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: "Wallet address required" },
        { status: 400 }
      )
    }

    // Get user from Firebase
    const user = await firebaseUserService.getUserByWallet(wallet)
    
    return NextResponse.json({
      success: true,
      wallet,
      user: user ? {
        walletAddress: user.walletAddress,
        nftsMinted: user.nftsMinted,
        nftAddresses: user.nftAddresses,
        totalReferrals: user.totalReferrals,
        createdAt: user.createdAt
      } : null,
      mintCount: user?.nftsMinted || 0,
      hasUser: !!user
    })
  } catch (error) {
    console.error("Error checking wallet mint count:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
