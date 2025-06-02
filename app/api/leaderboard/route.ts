import { NextRequest, NextResponse } from "next/server"
import { firebaseLeaderboardService, type LeaderboardType } from "@/services/firebase-leaderboard-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = (searchParams.get("type") as LeaderboardType) || "referrals"
    const limit = parseInt(searchParams.get("limit") || "10")
    const walletAddress = searchParams.get("wallet")

    // Get leaderboard data
    const leaderboard = await firebaseLeaderboardService.getLeaderboard(type, limit)
    
    // Get leaderboard stats
    const stats = await firebaseLeaderboardService.getLeaderboardStats()

    // Get user-specific data if wallet address provided
    let userStats = null
    if (walletAddress) {
      userStats = await firebaseLeaderboardService.getUserLeaderboardStats(walletAddress)
    }

    return NextResponse.json({
      leaderboard,
      stats,
      userStats,
      type,
      limit,
    })
  } catch (error) {
    console.error("Error getting leaderboard data:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json()

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Missing walletAddress" },
        { status: 400 }
      )
    }

    // Update user's leaderboard position
    await firebaseLeaderboardService.updateUserLeaderboardPosition(walletAddress)

    return NextResponse.json({
      success: true,
      message: "Leaderboard position updated",
    })
  } catch (error) {
    console.error("Error updating leaderboard position:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
