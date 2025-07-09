import { type NextRequest, NextResponse } from "next/server"
import { firebaseUserService } from "@/services/firebase-user-service"

export async function GET(request: NextRequest, { params }: { params: { wallet: string } }) {
  try {
    const { wallet } = params

    if (!wallet) {
      return NextResponse.json(
        {
          success: false,
          error: "Wallet address is required",
        },
        { status: 400 }
      )
    }

    // Get user from Firebase
    const user = await firebaseUserService.getUserByWallet(wallet)
    const hasNFT = user && user.nftsMinted > 0

    return NextResponse.json({
      success: true,
      hasNFT: hasNFT || false,
      nftsMinted: user?.nftsMinted || 0,
    })
  } catch (error) {
    console.error("Error checking NFT ownership:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        hasNFT: false,
      },
      { status: 500 }
    )
  }
}
