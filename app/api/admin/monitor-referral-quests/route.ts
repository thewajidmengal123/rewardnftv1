import { type NextRequest, NextResponse } from "next/server"
import { isAdminWallet } from "@/config/admin"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { firebaseQuestService } from "@/services/firebase-quest-service"
import { firebaseReferralService } from "@/services/firebase-referral-service"
import { firebaseUserService } from "@/services/firebase-user-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get("wallet")
    const action = searchParams.get("action") || "monitor"

    // Verify admin access
    if (!walletAddress || !isAdminWallet(walletAddress)) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      )
    }

    switch (action) {
      case "monitor": {
        console.log("🔍 Admin monitoring referral quest status...")

        // Get all users with referrals
        const usersQuery = query(collection(db, "users"))
        const usersSnapshot = await getDocs(usersQuery)
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Array<{
          id: string
          walletAddress: string
          displayName?: string
          totalReferrals?: number
          totalEarned?: number
          [key: string]: any
        }>

        // Filter users with 3+ referrals
        const eligibleUsers = users.filter(user => (user.totalReferrals || 0) >= 3)

        // Get referral quest
        const quests = await firebaseQuestService.getActiveQuests()
        const referralQuest = quests.find(quest => quest.requirements.type === 'refer_friends')

        if (!referralQuest) {
          return NextResponse.json({
            success: false,
            error: "Referral quest not found"
          })
        }

        // Check quest completion status for eligible users
        const userQuestStatus = []
        
        for (const user of eligibleUsers) {
          const userProgress = await firebaseQuestService.getUserQuestProgress(user.walletAddress)
          const questProgress = userProgress.find(progress => 
            progress.questId === referralQuest.id
          )

          userQuestStatus.push({
            walletAddress: user.walletAddress,
            displayName: user.displayName || `User ${user.walletAddress.slice(0, 8)}`,
            totalReferrals: user.totalReferrals || 0,
            questStatus: questProgress?.status || "not_started",
            questProgress: questProgress?.progress || 0,
            questMaxProgress: questProgress?.maxProgress || referralQuest.requirements.count,
            questStartedAt: questProgress?.startedAt,
            questCompletedAt: questProgress?.completedAt,
            questClaimedAt: questProgress?.claimedAt,
            needsAutoComplete: !questProgress || (questProgress.status !== "completed" && questProgress.status !== "claimed")
          })
        }

        // Statistics
        const stats = {
          totalUsers: users.length,
          usersWithReferrals: users.filter(u => (u.totalReferrals || 0) > 0).length,
          eligibleUsers: eligibleUsers.length,
          questCompleted: userQuestStatus.filter(u => u.questStatus === "completed" || u.questStatus === "claimed").length,
          questPending: userQuestStatus.filter(u => u.needsAutoComplete).length,
          questInProgress: userQuestStatus.filter(u => u.questStatus === "in_progress").length
        }

        return NextResponse.json({
          success: true,
          message: `Monitoring ${eligibleUsers.length} users eligible for referral quest completion`,
          referralQuest: {
            id: referralQuest.id,
            title: referralQuest.title,
            requirements: referralQuest.requirements,
            reward: referralQuest.reward
          },
          userQuestStatus,
          statistics: stats
        })
      }

      case "auto-complete": {
        console.log("🤖 Admin triggering auto-completion for eligible users...")

        // Get all users with 3+ referrals
        const usersQuery = query(collection(db, "users"))
        const usersSnapshot = await getDocs(usersQuery)
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Array<{
          id: string
          walletAddress: string
          displayName?: string
          totalReferrals?: number
          totalEarned?: number
          [key: string]: any
        }>
        const eligibleUsers = users.filter(user => (user.totalReferrals || 0) >= 3)

        const completionResults = []

        for (const user of eligibleUsers) {
          try {
            // Use the existing auto-completion logic
            await firebaseReferralService.checkAndCompleteReferralQuest(user.walletAddress)
            completionResults.push({
              walletAddress: user.walletAddress,
              success: true,
              referralCount: user.totalReferrals
            })
          } catch (error) {
            completionResults.push({
              walletAddress: user.walletAddress,
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
              referralCount: user.totalReferrals
            })
          }
        }

        const successCount = completionResults.filter(r => r.success).length
        const failureCount = completionResults.filter(r => !r.success).length

        return NextResponse.json({
          success: true,
          message: `Auto-completion attempted for ${eligibleUsers.length} users: ${successCount} successful, ${failureCount} failed`,
          results: completionResults,
          summary: {
            totalAttempted: eligibleUsers.length,
            successful: successCount,
            failed: failureCount
          }
        })
      }

      case "sync-referrals": {
        console.log("🔄 Admin syncing referral data...")

        // Get all users
        const usersQuery = query(collection(db, "users"))
        const usersSnapshot = await getDocs(usersQuery)
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Array<{
          id: string
          walletAddress: string
          displayName?: string
          totalReferrals?: number
          totalEarned?: number
          [key: string]: any
        }>

        const syncResults = []

        for (const user of users) {
          try {
            // Get actual referral stats
            const actualStats = await firebaseReferralService.getReferralStats(user.walletAddress)
            
            // Check if sync is needed
            const needsSync = (user.totalReferrals || 0) !== actualStats.totalReferrals ||
                             (user.totalEarned || 0) !== actualStats.totalEarned

            if (needsSync) {
              // Sync user data
              await firebaseUserService.syncUserReferralData(user.walletAddress)
              syncResults.push({
                walletAddress: user.walletAddress,
                synced: true,
                oldReferrals: user.totalReferrals || 0,
                newReferrals: actualStats.totalReferrals,
                oldEarned: user.totalEarned || 0,
                newEarned: actualStats.totalEarned
              })
            } else {
              syncResults.push({
                walletAddress: user.walletAddress,
                synced: false,
                referrals: user.totalReferrals || 0,
                earned: user.totalEarned || 0
              })
            }
          } catch (error) {
            syncResults.push({
              walletAddress: user.walletAddress,
              synced: false,
              error: error instanceof Error ? error.message : "Unknown error"
            })
          }
        }

        const syncedCount = syncResults.filter(r => r.synced).length

        return NextResponse.json({
          success: true,
          message: `Synced referral data for ${syncedCount} out of ${users.length} users`,
          results: syncResults.slice(0, 50), // Limit for performance
          summary: {
            totalUsers: users.length,
            syncedUsers: syncedCount,
            upToDateUsers: syncResults.filter(r => !r.synced && !r.error).length,
            errorUsers: syncResults.filter(r => r.error).length
          }
        })
      }

      default:
        return NextResponse.json({
          success: false,
          error: "Invalid action. Use: monitor, auto-complete, or sync-referrals"
        }, { status: 400 })
    }
  } catch (error) {
    console.error("❌ Error in referral quest monitoring:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to monitor referral quests"
      },
      { status: 500 }
    )
  }
}

// POST endpoint for manual referral quest completion
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { walletAddress: adminWallet, targetWallet, action } = body

    // Verify admin access
    if (!adminWallet || !isAdminWallet(adminWallet)) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      )
    }

    if (!targetWallet) {
      return NextResponse.json(
        { success: false, error: "Target wallet address required" },
        { status: 400 }
      )
    }

    switch (action) {
      case "force-complete": {
        console.log(`🎯 Admin force-completing referral quest for ${targetWallet}`)

        try {
          await firebaseReferralService.checkAndCompleteReferralQuest(targetWallet)
          
          return NextResponse.json({
            success: true,
            message: `Successfully force-completed referral quest for ${targetWallet}`
          })
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : "Failed to force-complete quest"
          }, { status: 500 })
        }
      }

      default:
        return NextResponse.json({
          success: false,
          error: "Invalid action. Use: force-complete"
        }, { status: 400 })
    }
  } catch (error) {
    console.error("❌ Error in referral quest POST:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process referral quest action"
      },
      { status: 500 }
    )
  }
}
