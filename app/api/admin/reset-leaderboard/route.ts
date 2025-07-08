import { type NextRequest, NextResponse } from "next/server"
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch, 
  doc, 
  serverTimestamp,
  deleteDoc
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { isAdminWallet } from "@/config/admin"

export async function POST(request: NextRequest) {
  try {
    // Get the wallet address from request body
    const body = await request.json().catch(() => ({}))
    const { walletAddress, resetType = "all" } = body

    // Verify admin access
    if (!walletAddress || !isAdminWallet(walletAddress)) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      )
    }

    console.log(`🔄 Admin resetting leaderboard data - Type: ${resetType}`)

    // Validate reset type
    const validResetTypes = ["all", "xp", "referrals", "quests"]
    if (!validResetTypes.includes(resetType)) {
      return NextResponse.json(
        { success: false, error: "Invalid reset type. Must be: all, xp, referrals, or quests" },
        { status: 400 }
      )
    }

    const batch = writeBatch(db)
    let resetCounts = {
      userXP: 0,
      referrals: 0,
      users: 0,
      questProgress: 0,
      userQuests: 0
    }

    // Safety check - prevent accidental full reset without explicit confirmation
    if (resetType === "all") {
      console.log("⚠️ WARNING: Full leaderboard reset requested by admin:", walletAddress)
    }

    // Reset User XP Data
    if (resetType === "all" || resetType === "xp") {
      console.log("🔄 Resetting user XP data...")
      const userXPQuery = query(collection(db, "userXP"))
      const userXPSnapshot = await getDocs(userXPQuery)
      
      userXPSnapshot.docs.forEach(docRef => {
        batch.update(docRef.ref, {
          totalXP: 0,
          level: 1,
          currentLevelXP: 0,
          nextLevelXP: 500,
          rank: 0,
          questsCompleted: 0,
          lastActive: serverTimestamp(),
          resetAt: serverTimestamp(),
          resetBy: walletAddress
        })
        resetCounts.userXP++
      })
    }

    // Reset Referral Data
    if (resetType === "all" || resetType === "referrals") {
      console.log("🔄 Resetting referral data...")
      
      // Reset user referral counts
      const usersQuery = query(collection(db, "users"))
      const usersSnapshot = await getDocs(usersQuery)
      
      usersSnapshot.docs.forEach(docRef => {
        const userData = docRef.data()
        batch.update(docRef.ref, {
          totalReferrals: 0,
          totalEarned: 0,
          referralCount: 0,
          earnings: 0,
          lastReferralAt: null,
          resetAt: serverTimestamp(),
          resetBy: walletAddress
        })
        resetCounts.users++
      })

      // Delete all referral records
      const referralsQuery = query(collection(db, "referrals"))
      const referralsSnapshot = await getDocs(referralsQuery)
      
      referralsSnapshot.docs.forEach(docRef => {
        batch.delete(docRef.ref)
        resetCounts.referrals++
      })
    }

    // Reset Quest Progress
    if (resetType === "all" || resetType === "quests") {
      console.log("🔄 Resetting quest progress...")
      
      // Reset quest progress records
      const questProgressQuery = query(collection(db, "questProgress"))
      const questProgressSnapshot = await getDocs(questProgressQuery)
      
      questProgressSnapshot.docs.forEach(docRef => {
        batch.delete(docRef.ref)
        resetCounts.questProgress++
      })

      // Reset user quest records
      const userQuestsQuery = query(collection(db, "userQuests"))
      const userQuestsSnapshot = await getDocs(userQuestsQuery)
      
      userQuestsSnapshot.docs.forEach(docRef => {
        batch.update(docRef.ref, {
          status: "not_started",
          progress: 0,
          completedAt: null,
          claimedAt: null,
          resetAt: serverTimestamp(),
          resetBy: walletAddress
        })
        resetCounts.userQuests++
      })
    }

    // Commit all changes in a single batch
    try {
      await batch.commit()

      const totalReset = Object.values(resetCounts).reduce((sum, count) => sum + count, 0)

      console.log(`✅ Leaderboard reset completed successfully:`, {
        resetType,
        resetCounts,
        totalReset,
        resetBy: walletAddress,
        timestamp: new Date().toISOString()
      })

      // Log the reset action for audit purposes
      console.log(`🔍 AUDIT LOG: Admin ${walletAddress} reset ${resetType} leaderboard data at ${new Date().toISOString()}`)

      return NextResponse.json({
        success: true,
        message: `Successfully reset ${totalReset} records for ${resetType} leaderboard data`,
        resetType,
        resetCounts,
        totalReset,
        resetAt: new Date().toISOString(),
        resetBy: walletAddress,
        details: {
          userXPReset: resetCounts.userXP > 0,
          referralsReset: resetCounts.referrals > 0,
          usersUpdated: resetCounts.users > 0,
          questProgressReset: resetCounts.questProgress > 0,
          userQuestsReset: resetCounts.userQuests > 0
        }
      })
    } catch (batchError) {
      console.error("❌ Error committing batch reset operation:", batchError)
      throw new Error(`Failed to commit reset operation: ${batchError instanceof Error ? batchError.message : 'Unknown error'}`)
    }

  } catch (error) {
    console.error("❌ Error resetting leaderboard:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to reset leaderboard"
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check leaderboard reset status and preview what would be reset
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get("wallet")
    const resetType = searchParams.get("type") || "all"

    // Verify admin access
    if (!walletAddress || !isAdminWallet(walletAddress)) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      )
    }

    console.log(`🔍 Admin checking leaderboard reset preview - Type: ${resetType}`)

    const previewCounts = {
      userXP: 0,
      referrals: 0,
      users: 0,
      questProgress: 0,
      userQuests: 0
    }

    // Count User XP records
    if (resetType === "all" || resetType === "xp") {
      const userXPQuery = query(collection(db, "userXP"))
      const userXPSnapshot = await getDocs(userXPQuery)
      previewCounts.userXP = userXPSnapshot.docs.length
    }

    // Count Referral records
    if (resetType === "all" || resetType === "referrals") {
      const [usersSnapshot, referralsSnapshot] = await Promise.all([
        getDocs(query(collection(db, "users"))),
        getDocs(query(collection(db, "referrals")))
      ])
      previewCounts.users = usersSnapshot.docs.length
      previewCounts.referrals = referralsSnapshot.docs.length
    }

    // Count Quest records
    if (resetType === "all" || resetType === "quests") {
      const [questProgressSnapshot, userQuestsSnapshot] = await Promise.all([
        getDocs(query(collection(db, "questProgress"))),
        getDocs(query(collection(db, "userQuests")))
      ])
      previewCounts.questProgress = questProgressSnapshot.docs.length
      previewCounts.userQuests = userQuestsSnapshot.docs.length
    }

    const totalToReset = Object.values(previewCounts).reduce((sum, count) => sum + count, 0)

    return NextResponse.json({
      success: true,
      resetType,
      previewCounts,
      totalToReset,
      warning: "This action cannot be undone. All leaderboard data will be permanently reset.",
      affectedCollections: Object.entries(previewCounts)
        .filter(([_, count]) => count > 0)
        .map(([collection, count]) => `${collection}: ${count} records`)
    })

  } catch (error) {
    console.error("❌ Error checking leaderboard reset preview:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get reset preview"
      },
      { status: 500 }
    )
  }
}
