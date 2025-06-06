import { type NextRequest, NextResponse } from "next/server"
import { firebaseQuestService } from "@/services/firebase-quest-service"

export async function POST(request: NextRequest) {
  try {
    // Initialize default quests in the database
    await firebaseQuestService.initializeDefaultQuests()
    
    return NextResponse.json({
      success: true,
      message: "Default quests initialized successfully"
    })
  } catch (error) {
    console.error("Error initializing quests:", error)
    return NextResponse.json(
      { success: false, error: "Failed to initialize quests" },
      { status: 500 }
    )
  }
}
