import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"

export async function GET(request: NextRequest, { params }: { params: Promise<{ wallet: string }> }) {
  try {
    const { wallet } = await params

    const userRef = adminDb.collection("users").doc(wallet)
    const userSnap = await userRef.get()

    if (userSnap.exists) {
      return NextResponse.json({
        success: true,
        user: { id: userSnap.id, ...userSnap.data() },
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 },
      )
    }
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ wallet: string }> }) {
  try {
    const { wallet } = await params
    const userData = await request.json()

    const userRef = adminDb.collection("users").doc(wallet)

    await userRef.set(
      {
        ...userData,
        lastActive: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )

    const updatedSnap = await userRef.get()

    return NextResponse.json({
      success: true,
      user: { id: updatedSnap.id, ...updatedSnap.data() },
    })
  } catch (error) {
    console.error("Error creating/updating user:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
