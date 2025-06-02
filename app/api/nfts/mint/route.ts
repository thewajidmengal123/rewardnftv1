import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

export async function POST(request: NextRequest) {
  try {
    const nftData = await request.json()

    // Validate required fields
    if (!nftData.mintAddress || !nftData.ownerWallet || !nftData.transactionSignature) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 },
      )
    }

    // Check if NFT already exists
    const nftRef = adminDb.collection("nfts").doc(nftData.mintAddress)
    const existingNft = await nftRef.get()

    if (existingNft.exists) {
      return NextResponse.json(
        {
          success: false,
          error: "NFT already recorded",
        },
        { status: 409 },
      )
    }

    // Record NFT mint
    const nftRecord = {
      ...nftData,
      mintedAt: adminDb.FieldValue.serverTimestamp(),
      isVerified: true,
      isTransferred: false,
    }

    await nftRef.set(nftRecord)

    // Update user NFT count
    const userRef = adminDb.collection("users").doc(nftData.ownerWallet)
    await userRef.update({
      nftsMinted: adminDb.FieldValue.increment(1),
      nftAddresses: adminDb.FieldValue.arrayUnion(nftData.mintAddress),
      lastActive: adminDb.FieldValue.serverTimestamp(),
    })

    return NextResponse.json({
      success: true,
      nft: { id: nftData.mintAddress, ...nftRecord },
    })
  } catch (error) {
    console.error("Error recording NFT mint:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
