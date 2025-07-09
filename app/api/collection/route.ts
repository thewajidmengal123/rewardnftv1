import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"

const COLLECTION_DOC_ID = "main_collection"

export async function GET() {
  try {
    const collectionRef = adminDb.collection("collections").doc(COLLECTION_DOC_ID)
    const collectionSnap = await collectionRef.get()

    if (collectionSnap.exists) {
      return NextResponse.json({
        success: true,
        collection: { id: collectionSnap.id, ...collectionSnap.data() },
      })
    } else {
      return NextResponse.json({
        success: true,
        collection: null,
      })
    }
  } catch (error) {
    console.error("Error fetching collection:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const collectionData = await request.json()

    // Validate required fields
    if (!collectionData.collectionMint || !collectionData.createdBy || !collectionData.transactionSignature) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 }
      )
    }

    // Check if collection already exists
    const collectionRef = adminDb.collection("collections").doc(COLLECTION_DOC_ID)
    const existingCollection = await collectionRef.get()

    if (existingCollection.exists) {
      return NextResponse.json(
        {
          success: false,
          error: "Collection already exists",
        },
        { status: 409 }
      )
    }

    // Store collection data
    const collectionRecord = {
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    await collectionRef.set(collectionRecord)

    return NextResponse.json({
      success: true,
      collection: { id: COLLECTION_DOC_ID, ...collectionRecord },
    })
  } catch (error) {
    console.error("Error storing collection:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    )
  }
}
