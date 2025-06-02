import type { Connection } from "@solana/web3.js"
import { NFT_METADATA } from "@/config/solana"

// Types for verification
export interface VerificationResult {
  isVerified: boolean
  status: "verified" | "unverified" | "suspicious" | "pending"
  details: {
    nameMatch: boolean
    symbolMatch: boolean
    descriptionMatch: boolean
    imageMatch: boolean
    creatorMatch: boolean
    collectionMatch: boolean
  }
  message?: string
}

// Authorized creator addresses that are allowed to mint official NFTs
export const AUTHORIZED_CREATORS = [
  process.env.NEXT_PUBLIC_PLATFORM_WALLET_ADDRESS || "7C4jsPZpht42Tw6MjXWF56Q5RQUocjBBmciEjDa8HRtp",
]

// Collection address for official NFTs
export const OFFICIAL_COLLECTION = "EnEnryMh6Lcxjr8Qard3kSFHJokSxCuqcwCfGLHbmMZa"

// Calculate hash of image for verification
export async function calculateImageHash(imageUrl: string): Promise<string> {
  try {
    // Fetch the image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }

    // Get the image data as array buffer
    const imageBuffer = await response.arrayBuffer()

    // Calculate SHA-256 hash
    const hashBuffer = await crypto.subtle.digest("SHA-256", imageBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

    return hashHex
  } catch (error) {
    console.error("Error calculating image hash:", error)
    return ""
  }
}

// Verify NFT metadata against expected values
export async function verifyNftMetadata(
  metadata: any,
  mintAddress: string,
  connection: Connection,
): Promise<VerificationResult> {
  try {
    // Default verification result
    const result: VerificationResult = {
      isVerified: false,
      status: "pending",
      details: {
        nameMatch: false,
        symbolMatch: false,
        descriptionMatch: false,
        imageMatch: false,
        creatorMatch: false,
        collectionMatch: false,
      },
    }

    // Check if metadata exists
    if (!metadata) {
      result.status = "unverified"
      result.message = "No metadata found"
      return result
    }

    // Verify name
    result.details.nameMatch = metadata.name === NFT_METADATA.name

    // Verify symbol
    result.details.symbolMatch = metadata.symbol === NFT_METADATA.symbol

    // Verify description
    result.details.descriptionMatch = metadata.description === NFT_METADATA.description

    // Verify image (if image URL is available)
    if (metadata.image && NFT_METADATA.image) {
      // For simplicity, we'll just check if the URLs match
      // In a production environment, you would calculate and compare image hashes
      result.details.imageMatch = metadata.image === NFT_METADATA.image
    }

    // Verify creator (if creators array is available)
    if (metadata.creators && metadata.creators.length > 0) {
      const creatorAddresses = metadata.creators.map((creator: any) => creator.address)
      result.details.creatorMatch = AUTHORIZED_CREATORS.some((address) => creatorAddresses.includes(address))
    }

    // Verify collection (if collection is available)
    if (metadata.collection) {
      result.details.collectionMatch = metadata.collection.address === OFFICIAL_COLLECTION
    }

    // Calculate overall verification status
    const verificationScore = Object.values(result.details).filter(Boolean).length
    const totalChecks = Object.keys(result.details).length

    if (verificationScore === totalChecks) {
      result.isVerified = true
      result.status = "verified"
      result.message = "NFT is verified and authentic"
    } else if (verificationScore >= totalChecks * 0.7) {
      result.isVerified = false
      result.status = "suspicious"
      result.message = "NFT has some verification issues"
    } else {
      result.isVerified = false
      result.status = "unverified"
      result.message = "NFT could not be verified"
    }

    return result
  } catch (error) {
    console.error("Error verifying NFT metadata:", error)
    return {
      isVerified: false,
      status: "unverified",
      details: {
        nameMatch: false,
        symbolMatch: false,
        descriptionMatch: false,
        imageMatch: false,
        creatorMatch: false,
        collectionMatch: false,
      },
      message: "Error during verification process",
    }
  }
}

// Fetch and verify NFT metadata from on-chain data
export async function fetchAndVerifyNftMetadata(
  mintAddress: string,
  connection: Connection,
): Promise<{ metadata: any; verification: VerificationResult }> {
  try {
    // In a real implementation, you would fetch the actual on-chain metadata
    // For this example, we'll simulate fetching metadata

    // Simulate a delay for fetching
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Simulate fetched metadata (in a real app, you'd fetch this from the blockchain)
    const metadata = {
      ...NFT_METADATA,
      mint: mintAddress,
      creators: [
        {
          address: AUTHORIZED_CREATORS[0],
          verified: true,
          share: 100,
        },
      ],
      collection: {
        address: OFFICIAL_COLLECTION,
        verified: true,
      },
    }

    // Verify the metadata
    const verification = await verifyNftMetadata(metadata, mintAddress, connection)

    return { metadata, verification }
  } catch (error) {
    console.error("Error fetching and verifying NFT metadata:", error)
    return {
      metadata: null,
      verification: {
        isVerified: false,
        status: "unverified",
        details: {
          nameMatch: false,
          symbolMatch: false,
          descriptionMatch: false,
          collectionMatch: false,
          imageMatch: false,
          creatorMatch: false,
        },
        message: "Failed to fetch metadata",
      },
    }
  }
}

// Verify a batch of NFTs
export async function verifyNftBatch(
  mintAddresses: string[],
  connection: Connection,
): Promise<Map<string, VerificationResult>> {
  const results = new Map<string, VerificationResult>()

  await Promise.all(
    mintAddresses.map(async (address) => {
      const { verification } = await fetchAndVerifyNftMetadata(address, connection)
      results.set(address, verification)
    }),
  )

  return results
}
