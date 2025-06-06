import { type NextRequest, NextResponse } from "next/server"
import { firebaseQuestService } from "@/services/firebase-quest-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get("wallet")
    const type = searchParams.get("type") as "daily" | "weekly" | null
    const action = searchParams.get("action") || "get-quests"

    switch (action) {
      case "get-quests": {
        if (type) {
          const quests = await firebaseQuestService.getQuestsByType(type)
          return NextResponse.json({ success: true, data: quests })
        } else {
          const quests = await firebaseQuestService.getActiveQuests()
          return NextResponse.json({ success: true, data: quests })
        }
      }

      case "get-user-progress": {
        if (!walletAddress) {
          return NextResponse.json(
            { success: false, error: "Wallet address required" },
            { status: 400 }
          )
        }
        
        const progress = await firebaseQuestService.getUserQuestProgress(walletAddress)
        return NextResponse.json({ success: true, data: progress })
      }

      case "get-user-xp": {
        if (!walletAddress) {
          return NextResponse.json(
            { success: false, error: "Wallet address required" },
            { status: 400 }
          )
        }
        
        const xpData = await firebaseQuestService.getUserXPData(walletAddress)
        return NextResponse.json({ success: true, data: xpData })
      }

      case "get-xp-leaderboard": {
        const limit = parseInt(searchParams.get("limit") || "50")
        const leaderboard = await firebaseQuestService.getXPLeaderboard(limit)
        return NextResponse.json({ success: true, data: leaderboard })
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("Quest API error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, questId, action, progressIncrement, verificationData } = body

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: "Wallet address required" },
        { status: 400 }
      )
    }

    switch (action) {
      case "start-quest": {
        if (!questId) {
          return NextResponse.json(
            { success: false, error: "Quest ID required" },
            { status: 400 }
          )
        }

        const progress = await firebaseQuestService.startQuest(walletAddress, questId)
        return NextResponse.json({ success: true, data: progress })
      }

      case "update-progress": {
        if (!questId) {
          return NextResponse.json(
            { success: false, error: "Quest ID required" },
            { status: 400 }
          )
        }

        const progress = await firebaseQuestService.updateQuestProgress(
          walletAddress,
          questId,
          progressIncrement || 1,
          verificationData
        )
        return NextResponse.json({ success: true, data: progress })
      }

      case "claim-reward": {
        const { questProgressId } = body
        if (!questProgressId) {
          return NextResponse.json(
            { success: false, error: "Quest progress ID required" },
            { status: 400 }
          )
        }
        
        const result = await firebaseQuestService.claimQuestReward(walletAddress, questProgressId)
        return NextResponse.json({ success: true, data: result })
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("Quest API error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
