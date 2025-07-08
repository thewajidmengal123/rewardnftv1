import { NextRequest, NextResponse } from "next/server"
import { firebaseUserService } from "@/services/firebase-user-service"

export async function GET(request: NextRequest) {
  try {
    // Get all users from Firebase
    const users = await firebaseUserService.getAllUsers(50)
    
    // Filter users who have minted NFTs
    const usersWithNFTs = users.filter(user => user.nftsMinted > 0)
    
    return NextResponse.json({
      success: true,
      totalUsers: users.length,
      usersWithNFTs: usersWithNFTs.length,
      users: users.map(user => ({
        walletAddress: user.walletAddress,
        nftsMinted: user.nftsMinted,
        totalReferrals: user.totalReferrals,
        nftAddresses: user.nftAddresses || []
      })),
      usersWithNFTsData: usersWithNFTs.map(user => ({
        walletAddress: user.walletAddress,
        nftsMinted: user.nftsMinted,
        nftAddresses: user.nftAddresses || []
      }))
    })
  } catch (error) {
    console.error("Error getting all users:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
