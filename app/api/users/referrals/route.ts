import { type NextRequest, NextResponse } from "next/server"
import { firebaseUserService } from "@/services/firebase-user-service"
import { firebaseReferralService } from "@/services/firebase-referral-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get("wallet")

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: "Wallet address is required" },
        { status: 400 }
      )
    }

    console.log("🔍 API: Getting referral data for wallet:", walletAddress)

    // Get comprehensive user referral data
    const [user, stats, history, referredUsers] = await Promise.all([
      firebaseUserService.getUserByWallet(walletAddress),
      firebaseReferralService.getReferralStats(walletAddress),
      firebaseReferralService.getReferralHistory(walletAddress),
      firebaseUserService.getUserReferredList(walletAddress)
    ])

    console.log("🔍 API: Retrieved data:", {
      user: user ? { wallet: user.walletAddress, referralCode: user.referralCode } : null,
      statsCount: stats.totalReferrals,
      historyCount: history.length,
      referredUsersCount: referredUsers.length
    })

    // Format referred users for display
    const formattedReferredUsers = referredUsers.map(user => ({
      walletAddress: user.walletAddress,
      displayName: user.displayName || `User ${user.walletAddress.slice(0, 8)}`,
      nftsMinted: (user.nftsMinted && user.nftsMinted > 0) ? 1 : 0, // Always 1 if they have minted, 0 if not
      totalEarned: user.totalEarned || 0,
      createdAt: user.createdAt,
      lastActive: user.lastActive
    }))

    // Format referral history for display
    const formattedHistory = history.map(ref => ({
      id: ref.id,
      referredWallet: ref.referredWallet,
      status: ref.status,
      rewardAmount: ref.rewardAmount,
      createdAt: ref.createdAt,
      completedAt: ref.completedAt,
      rewardedAt: ref.rewardedAt,
      referredUser: ref.referredUser ? {
        displayName: ref.referredUser.displayName || `User ${ref.referredUser.walletAddress.slice(0, 8)}`,
        nftsMinted: ref.referredUser.nftsMinted || 0
      } : null
    }))

    return NextResponse.json({
      success: true,
      data: {
        user: user ? {
          walletAddress: user.walletAddress,
          displayName: user.displayName,
          referralCode: user.referralCode,
          totalReferrals: user.totalReferrals,
          totalEarned: user.totalEarned,
          nftsMinted: user.nftsMinted,
          createdAt: user.createdAt,
          lastActive: user.lastActive
        } : null,
        stats,
        history: formattedHistory,
        referredUsers: formattedReferredUsers,
        summary: {
          totalReferrals: stats.totalReferrals,
          completedReferrals: stats.completedReferrals,
          totalEarned: stats.totalEarned,
          pendingRewards: stats.pendingRewards,
          referredUsersCount: referredUsers.length,
          averageEarningPerReferral: stats.totalReferrals > 0 ? stats.totalEarned / stats.totalReferrals : 0
        }
      }
    })
  } catch (error) {
    console.error("Get user referrals error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error"
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, walletAddress, data } = await request.json()

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: "Wallet address is required" },
        { status: 400 }
      )
    }

    switch (action) {
      case "sync-user-data": {
        // Sync user's referral data
        await firebaseUserService.syncUserReferralData(walletAddress)
        
        // Get updated data
        const [user, stats] = await Promise.all([
          firebaseUserService.getUserByWallet(walletAddress),
          firebaseReferralService.getReferralStats(walletAddress)
        ])

        return NextResponse.json({
          success: true,
          message: "User data synced successfully",
          user,
          stats
        })
      }

      case "update-display-name": {
        const { displayName } = data || {}
        
        if (!displayName) {
          return NextResponse.json(
            { success: false, error: "Display name is required" },
            { status: 400 }
          )
        }

        const updatedUser = await firebaseUserService.createOrUpdateUser(walletAddress, {
          displayName
        })

        return NextResponse.json({
          success: true,
          message: "Display name updated successfully",
          user: updatedUser
        })
      }

      case "get-referral-link": {
        const user = await firebaseUserService.getUserByWallet(walletAddress)
        
        if (!user) {
          return NextResponse.json(
            { success: false, error: "User not found" },
            { status: 404 }
          )
        }

        const referralLink = firebaseReferralService.getReferralLink(user.referralCode)

        return NextResponse.json({
          success: true,
          referralCode: user.referralCode,
          referralLink
        })
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("User referrals POST error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error"
      },
      { status: 500 }
    )
  }
}
