import { type NextRequest, NextResponse } from "next/server"
import { isAdminWallet } from "@/config/admin"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, writeBatch, doc, serverTimestamp } from "firebase/firestore"

export async function POST(request: NextRequest) {
  try {
    // Get the wallet address from request body
    const body = await request.json().catch(() => ({}))
    const walletAddress = body.walletAddress

    // Verify admin access
    if (!walletAddress || !isAdminWallet(walletAddress)) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      )
    }

    console.log("🔄 Admin resetting weekly quests...")

    // Get all weekly quest progress records
    const weeklyQuestProgressQuery = query(
      collection(db, "userQuests"),
      where("status", "in", ["completed", "claimed"])
    )
    
    const progressSnapshot = await getDocs(weeklyQuestProgressQuery)
    
    // Get all weekly quests to identify which progress records to reset
    const weeklyQuestsQuery = query(
      collection(db, "quests"),
      where("type", "==", "weekly"),
      where("isActive", "==", true)
    )
    
    const questsSnapshot = await getDocs(weeklyQuestsQuery)
    const weeklyQuestIds = new Set(questsSnapshot.docs.map(doc => doc.id))
    
    // Filter progress records for weekly quests only
    const weeklyProgressDocs = progressSnapshot.docs.filter(doc => {
      const data = doc.data()
      return weeklyQuestIds.has(data.questId)
    })

    if (weeklyProgressDocs.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No weekly quest progress to reset",
        resetCount: 0,
        affectedUsers: 0
      })
    }

    // Reset weekly quest progress using batch operations
    const batch = writeBatch(db)
    const affectedUsers = new Set<string>()
    
    weeklyProgressDocs.forEach(progressDoc => {
      const progressData = progressDoc.data()
      affectedUsers.add(progressData.userId)
      
      // Reset the quest progress
      batch.update(doc(db, "userQuests", progressDoc.id), {
        status: "not_started",
        progress: 0,
        completedAt: null,
        claimedAt: null,
        resetAt: serverTimestamp(),
        resetBy: walletAddress
      })
    })

    // Commit the batch operation
    await batch.commit()

    const resetCount = weeklyProgressDocs.length
    const userCount = affectedUsers.size

    console.log(`✅ Reset ${resetCount} weekly quest progress records for ${userCount} users`)

    return NextResponse.json({
      success: true,
      message: `Successfully reset ${resetCount} weekly quest progress records for ${userCount} users`,
      resetCount,
      affectedUsers: userCount,
      weeklyQuests: questsSnapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title,
        type: doc.data().type
      }))
    })
  } catch (error) {
    console.error("❌ Error resetting weekly quests:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to reset weekly quests"
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check weekly quest status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get("wallet")

    // Verify admin access
    if (!walletAddress || !isAdminWallet(walletAddress)) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      )
    }

    console.log("🔍 Admin checking weekly quest status...")

    // Get all weekly quests
    const weeklyQuestsQuery = query(
      collection(db, "quests"),
      where("type", "==", "weekly"),
      where("isActive", "==", true)
    )
    
    const questsSnapshot = await getDocs(weeklyQuestsQuery)
    const weeklyQuests = questsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Array<{
      id: string
      title: string
      type: string
      reward: any
      requirements: any
      [key: string]: any
    }>

    // Get weekly quest progress statistics
    const weeklyQuestIds = weeklyQuests.map(q => q.id)
    const progressQuery = query(
      collection(db, "userQuests")
    )
    
    const progressSnapshot = await getDocs(progressQuery)
    const allProgress = progressSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Array<{
      id: string
      questId: string
      status: string
      userId: string
      [key: string]: any
    }>

    // Filter for weekly quest progress only
    const weeklyProgress = allProgress.filter(progress =>
      weeklyQuestIds.includes(progress.questId)
    )

    // Calculate statistics
    const stats = {
      totalWeeklyQuests: weeklyQuests.length,
      totalProgressRecords: weeklyProgress.length,
      completedRecords: weeklyProgress.filter(p => p.status === "completed").length,
      claimedRecords: weeklyProgress.filter(p => p.status === "claimed").length,
      inProgressRecords: weeklyProgress.filter(p => p.status === "in_progress").length,
      notStartedRecords: weeklyProgress.filter(p => p.status === "not_started").length,
      uniqueUsers: new Set(weeklyProgress.map(p => p.userId)).size
    }

    return NextResponse.json({
      success: true,
      message: `Found ${stats.totalWeeklyQuests} weekly quests with ${stats.totalProgressRecords} progress records`,
      weeklyQuests: weeklyQuests.map(q => ({
        id: q.id,
        title: q.title,
        type: q.type,
        reward: q.reward,
        requirements: q.requirements
      })),
      statistics: stats
    })
  } catch (error) {
    console.error("❌ Error checking weekly quest status:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to check weekly quest status"
      },
      { status: 500 }
    )
  }
}
