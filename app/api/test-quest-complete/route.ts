import { NextRequest, NextResponse } from "next/server"
import { firebaseQuestService } from "@/services/firebase-quest-service"

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, questId } = await request.json()
    
    if (!walletAddress || !questId) {
      return NextResponse.json(
        { success: false, error: "Wallet address and quest ID required" },
        { status: 400 }
      )
    }

    // Start the quest first
    await firebaseQuestService.startQuest(walletAddress, questId)
    
    // Complete the quest by updating progress to 100%
    const result = await firebaseQuestService.updateQuestProgress(
      walletAddress,
      questId,
      1, // Complete the quest
      { verified: true, timestamp: Date.now() }
    )
    
    return NextResponse.json({
      success: true,
      data: result,
      message: `Completed quest ${questId} for ${walletAddress}`
    })
  } catch (error) {
    console.error("Test quest complete API error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
