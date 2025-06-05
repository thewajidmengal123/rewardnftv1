import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

const COLLECTION_DOC_ID = "main_collection"

export async function POST(request: NextRequest) {
  try {
    const { collectionMint } = await request.json()

    if (!collectionMint) {
      return NextResponse.json(
        {
          success: false,
          error: "Collection mint address is required",
        },
        { status: 400 }
      )
    }

    // Update collection mint count
    const collectionRef = adminDb.collection("collections").doc(COLLECTION_DOC_ID)
    
    await collectionRef.update({
      totalMinted: adminDb.FieldValue.increment(1),
      updatedAt: adminDb.FieldValue.serverTimestamp(),
    })

    return NextResponse.json({
      success: true,
      message: "Collection mint count updated",
    })
  } catch (error) {
    console.error("Error updating collection mint count:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    )
  }
}
