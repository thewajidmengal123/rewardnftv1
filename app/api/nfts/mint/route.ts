import { type NextRequest, NextResponse } from "next/server"
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
  arrayUnion,
  serverTimestamp
} from "firebase/firestore"
import { db } from "@/lib/firebase"

export async function POST(request: NextRequest) {
  try {
    const nftData = await request.json()

    // Validate required fields
    if (!nftData.mintAddress || !nftData.ownerWallet || !nftData.transactionSignature) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: mintAddress, ownerWallet, transactionSignature",
        },
        { status: 400 },
      )
    }

    // Check if NFT already exists
    const nftRef = doc(db, "nfts", nftData.mintAddress)
    const existingNft = await getDoc(nftRef)

    if (existingNft.exists()) {
      return NextResponse.json(
        {
          success: false,
          error: "NFT already recorded",
        },
        { status: 409 },
      )
    }

    // Create comprehensive NFT record with all required data
    const nftRecord = {
      mintAddress: nftData.mintAddress,
      ownerWallet: nftData.ownerWallet,
      transactionSignature: nftData.transactionSignature,
      name: nftData.name || "RewardNFT Collection",
      symbol: nftData.symbol || "RNFT",
      description: nftData.description || "Exclusive NFT from RewardNFT Platform",
      image: nftData.image || "/nft-reward-token.png",
      attributes: nftData.attributes || [
        { trait_type: "Platform", value: "RewardNFT" },
        { trait_type: "Utility", value: "Membership" }
      ],
      mintCost: nftData.mintCost || 10, // 10 USDC per NFT
      usdcRevenue: nftData.mintCost || 10, // Track USDC revenue
      mintedAt: serverTimestamp(),
      isVerified: true,
      isTransferred: false,
      collectionAddress: nftData.collectionAddress || null,
      metadata: nftData.metadata || null
    }

    // Store NFT record
    await setDoc(nftRef, nftRecord)

    // Update user NFT count and add NFT to their collection
    const userRef = doc(db, "users", nftData.ownerWallet)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      await updateDoc(userRef, {
        nftsMinted: increment(1),
        nftAddresses: arrayUnion(nftData.mintAddress),
        lastActive: serverTimestamp(),
      })
    } else {
      // Create user profile if it doesn't exist
      await setDoc(userRef, {
        walletAddress: nftData.ownerWallet,
        displayName: `User ${nftData.ownerWallet.slice(0, 8)}`,
        totalEarned: 0,
        totalReferrals: 0,
        nftsMinted: 1,
        nftAddresses: [nftData.mintAddress],
        questsCompleted: 0,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
      })
    }

    console.log(`✅ NFT mint recorded: ${nftData.mintAddress} for ${nftData.ownerWallet}`)

    return NextResponse.json({
      success: true,
      nft: { id: nftData.mintAddress, ...nftRecord },
      message: "NFT mint recorded successfully"
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
