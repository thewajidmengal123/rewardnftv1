import { type NextRequest, NextResponse } from "next/server"
import { isAdminWallet } from "@/config/admin"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, writeBatch, doc } from "firebase/firestore"

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

    console.log("🧹 Admin cleaning up duplicate quests...")

    // Get all quests
    const questsQuery = query(collection(db, "quests"))
    const questsSnapshot = await getDocs(questsQuery)
    const allQuests = questsSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }))

    console.log(`Found ${allQuests.length} total quests`)

    // Group quests by title to find duplicates
    const questsByTitle = new Map()
    allQuests.forEach(quest => {
      const title = quest.title
      if (!questsByTitle.has(title)) {
        questsByTitle.set(title, [])
      }
      questsByTitle.get(title).push(quest)
    })

    // Find duplicates and keep only the first one of each title
    const questsToDelete = []
    const uniqueQuests = []

    questsByTitle.forEach((questsWithSameTitle, title) => {
      if (questsWithSameTitle.length > 1) {
        // Keep the first quest (oldest) and mark others for deletion
        const [keepQuest, ...duplicates] = questsWithSameTitle.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0
          const bTime = b.createdAt?.seconds || 0
          return aTime - bTime
        })
        
        uniqueQuests.push(keepQuest)
        questsToDelete.push(...duplicates)
        
        console.log(`Found ${duplicates.length} duplicates for "${title}"`)
      } else {
        uniqueQuests.push(questsWithSameTitle[0])
      }
    })

    // Delete duplicate quests
    if (questsToDelete.length > 0) {
      const batch = writeBatch(db)
      
      questsToDelete.forEach(quest => {
        batch.delete(doc(db, "quests", quest.id))
      })
      
      await batch.commit()
      console.log(`✅ Deleted ${questsToDelete.length} duplicate quests`)
    }

    // Also clean up user quest progress for deleted quests
    const userQuestsQuery = query(collection(db, "userQuests"))
    const userQuestsSnapshot = await getDocs(userQuestsQuery)
    const userQuests = userQuestsSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }))

    const deletedQuestIds = new Set(questsToDelete.map(q => q.id))
    const userQuestsToDelete = userQuests.filter(uq => deletedQuestIds.has(uq.questId))

    if (userQuestsToDelete.length > 0) {
      const userBatch = writeBatch(db)
      
      userQuestsToDelete.forEach(userQuest => {
        userBatch.delete(doc(db, "userQuests", userQuest.id))
      })
      
      await userBatch.commit()
      console.log(`✅ Cleaned up ${userQuestsToDelete.length} orphaned user quest records`)
    }

    return NextResponse.json({
      success: true,
      message: `Cleanup completed: Removed ${questsToDelete.length} duplicate quests and ${userQuestsToDelete.length} orphaned user quest records`,
      summary: {
        totalQuestsBefore: allQuests.length,
        uniqueQuestsAfter: uniqueQuests.length,
        duplicatesRemoved: questsToDelete.length,
        userQuestRecordsRemoved: userQuestsToDelete.length,
        uniqueQuestTitles: Array.from(questsByTitle.keys())
      }
    })
  } catch (error) {
    console.error("❌ Error cleaning up quests:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to cleanup quests" 
      },
      { status: 500 }
    )
  }
}

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

    // Get all quests to analyze duplicates
    const questsQuery = query(collection(db, "quests"))
    const questsSnapshot = await getDocs(questsQuery)
    const allQuests = questsSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }))

    // Group by title to find duplicates
    const questsByTitle = new Map()
    allQuests.forEach(quest => {
      const title = quest.title
      if (!questsByTitle.has(title)) {
        questsByTitle.set(title, [])
      }
      questsByTitle.get(title).push(quest)
    })

    const duplicates = []
    questsByTitle.forEach((questsWithSameTitle, title) => {
      if (questsWithSameTitle.length > 1) {
        duplicates.push({
          title,
          count: questsWithSameTitle.length,
          quests: questsWithSameTitle
        })
      }
    })

    return NextResponse.json({
      success: true,
      totalQuests: allQuests.length,
      uniqueTitles: questsByTitle.size,
      duplicateGroups: duplicates.length,
      duplicates: duplicates
    })
  } catch (error) {
    console.error("❌ Error analyzing quests:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to analyze quests" 
      },
      { status: 500 }
    )
  }
}
