import { type NextRequest, NextResponse } from "next/server"
import { firebaseReferralService } from "@/services/firebase-referral-service"
import { firebaseUserService } from "@/services/firebase-user-service"
import { adminDb } from "@/lib/firebase-admin"

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

    console.log("🔍 DEBUG: Checking referral perspective for wallet:", walletAddress)

    // Check as referrer (people this wallet referred)
    const asReferrerSnapshot = await adminDb
      .collection("referrals")
      .where("referrerWallet", "==", walletAddress)
      .get()

    const asReferrer = asReferrerSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Check as referred (this wallet was referred by someone)
    const asReferredSnapshot = await adminDb
      .collection("referrals")
      .where("referredWallet", "==", walletAddress)
      .get()

    const asReferred = asReferredSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Get user profile
    const user = await firebaseUserService.getUserByWallet(walletAddress)

    // Get stats using the service
    const stats = await firebaseReferralService.getReferralStats(walletAddress)

    return NextResponse.json({
      success: true,
      debug: {
        walletAddress,
        user: user ? {
          walletAddress: user.walletAddress,
          referralCode: user.referralCode,
          referredBy: user.referredBy,
          totalReferrals: user.totalReferrals,
          totalEarned: user.totalEarned
        } : null,
        stats,
        asReferrer: {
          count: asReferrer.length,
          referrals: asReferrer
        },
        asReferred: {
          count: asReferred.length,
          referrals: asReferred
        },
        perspective: {
          isReferrer: asReferrer.length > 0,
          wasReferred: asReferred.length > 0,
          shouldShowReferralPage: asReferrer.length > 0 || stats.totalReferrals > 0
        }
      }
    })
  } catch (error) {
    console.error("Debug referral perspective error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error"
      },
      { status: 500 }
    )
  }
}
