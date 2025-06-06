import { type NextRequest, NextResponse } from "next/server"
import { firebaseUserService } from "@/services/firebase-user-service"
import { firebaseReferralService } from "@/services/firebase-referral-service"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

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

    console.log(`🔍 Debugging referral status for wallet: ${walletAddress}`)

    // 1. Get user profile
    const user = await firebaseUserService.getUserByWallet(walletAddress)
    console.log("User profile:", user)

    // 2. Check if user was referred (referredBy field)
    const referredBy = user?.referredBy
    console.log("User referredBy field:", referredBy)

    // 3. Check referrals collection for this user as referred
    const referredQuery = query(
      collection(db, "referrals"),
      where("referredWallet", "==", walletAddress)
    )
    const referredSnapshot = await getDocs(referredQuery)
    type ReferralRecord = {
      id: string
      referrerWallet?: string
      referredWallet?: string
      status?: string
      [key: string]: any
    }

    const referralRecords: ReferralRecord[] = referredSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    console.log("Referral records where user is referred:", referralRecords)

    // 4. Check referrals collection for this user as referrer
    const referrerQuery = query(
      collection(db, "referrals"),
      where("referrerWallet", "==", walletAddress)
    )
    const referrerSnapshot = await getDocs(referrerQuery)
    const referrerRecords: ReferralRecord[] = referrerSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    console.log("Referral records where user is referrer:", referrerRecords)

    // 5. Get referral stats
    const stats = await firebaseReferralService.getReferralStats(walletAddress)
    console.log("Referral stats:", stats)

    // 6. Check if referred
    const checkReferred = await firebaseReferralService.checkIfReferred(walletAddress)
    console.log("Check if referred result:", checkReferred)

    // 7. Get referral history
    const history = await firebaseReferralService.getReferralHistory(walletAddress)
    console.log("Referral history:", history)

    const debugInfo = {
      walletAddress,
      user: {
        exists: !!user,
        referredBy: user?.referredBy || null,
        totalReferrals: user?.totalReferrals || 0,
        totalEarned: user?.totalEarned || 0,
        nftsMinted: user?.nftsMinted || 0,
        referralCode: user?.referralCode || null,
      },
      referralRecords: {
        asReferred: referralRecords,
        asReferrer: referrerRecords,
      },
      stats,
      checkReferred,
      history,
      analysis: {
        isReferred: !!referredBy || referralRecords.length > 0,
        hasReferralRecord: referralRecords.length > 0,
        userProfileConsistent: user?.referredBy === (referralRecords[0]?.referrerWallet || null),
        referrerWallet: referralRecords[0]?.referrerWallet || null,
        referralStatus: referralRecords[0]?.status || null,
      }
    }

    return NextResponse.json({
      success: true,
      debug: debugInfo
    })
  } catch (error) {
    console.error("Debug referral status error:", error)
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
    const { action, walletAddress, referralCode } = await request.json()

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: "Wallet address is required" },
        { status: 400 }
      )
    }

    switch (action) {
      case "track-referral": {
        if (!referralCode) {
          return NextResponse.json(
            { success: false, error: "Referral code is required" },
            { status: 400 }
          )
        }

        console.log(`🔗 Manually tracking referral: ${referralCode} -> ${walletAddress}`)
        
        const success = await firebaseReferralService.trackReferral(referralCode, walletAddress)
        
        return NextResponse.json({
          success,
          message: success ? "Referral tracked successfully" : "Failed to track referral"
        })
      }

      case "complete-referral": {
        console.log(`✅ Manually completing referral for: ${walletAddress}`)
        
        const success = await firebaseReferralService.completeReferral(walletAddress)
        
        return NextResponse.json({
          success,
          message: success ? "Referral completed successfully" : "No pending referral found"
        })
      }

      case "process-reward": {
        console.log(`💰 Manually processing reward for: ${walletAddress}`)
        
        const success = await firebaseReferralService.processReferralReward(walletAddress, "manual-test")
        
        return NextResponse.json({
          success,
          message: success ? "Reward processed successfully" : "No completed referral found"
        })
      }

      case "fix-user-profile": {
        console.log(`🔧 Fixing user profile for: ${walletAddress}`)
        
        // Check if there's a referral record but user profile doesn't have referredBy
        const referredQuery = query(
          collection(db, "referrals"),
          where("referredWallet", "==", walletAddress)
        )
        const referredSnapshot = await getDocs(referredQuery)
        
        if (!referredSnapshot.empty) {
          const referralDoc = referredSnapshot.docs[0]
          const referralData = referralDoc.data()
          
          // Update user profile with referredBy
          await firebaseUserService.createOrUpdateUser(walletAddress, {
            referredBy: referralData.referrerWallet
          })
          
          return NextResponse.json({
            success: true,
            message: `Fixed user profile - set referredBy to ${referralData.referrerWallet}`
          })
        } else {
          return NextResponse.json({
            success: false,
            message: "No referral record found to fix"
          })
        }
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("Debug referral status POST error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error"
      },
      { status: 500 }
    )
  }
}
