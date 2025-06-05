"use client"

import { Connection, PublicKey, Transaction, Keypair, SystemProgram } from "@solana/web3.js"
import {
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  getMinimumBalanceForRentExemptMint,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
} from "@solana/spl-token"
// Temporarily remove complex metadata operations to fix errors
// import {
//   createCreateMetadataAccountV3Instruction,
//   createSetCollectionSizeInstruction,
//   findMetadataPda,
// } from "@metaplex-foundation/mpl-token-metadata"

// Collection configuration
export const COLLECTION_CONFIG = {
  name: "RewardNFT Collection",
  symbol: "RNFT",
  description: "Exclusive NFT collection for the RewardNFT platform with referral rewards and quest access.",
  image: "https://quicknode.quicknode-ipfs.com/ipfs/QmWrmCfPm6L85p1o8KMc9WZCsdwsgW89n37nQMJ6UCVYNW",
  external_url: "https://rewardnft.com",
  seller_fee_basis_points: 500, // 5% royalty
  maxSupply: 1000,
  creators: [
    {
      address: "8QY2zcWZWwBZYMeiSfPivWAiPBbLZe1mbnyJauWe8ms6", // Treasury wallet
      verified: true,
      share: 100,
    },
  ],
}

export interface CollectionInfo {
  collectionMint: string
  createdAt: string
  createdBy: string
  transactionSignature: string
  totalMinted: number
  maxSupply: number
}

export interface CollectionCreationResult {
  success: boolean
  collectionMint?: string
  signature?: string
  error?: string
}

export class AutoCollectionService {
  private connection: Connection
  private collectionMint: PublicKey | null = null

  constructor(connection: Connection) {
    this.connection = connection
  }

  // Get or create collection (main entry point)
  async getOrCreateCollection(
    authority: PublicKey,
    signTransaction: (transaction: Transaction) => Promise<Transaction>
  ): Promise<CollectionCreationResult> {
    try {
      // First, try to get existing collection from database
      const existingCollection = await this.getCollectionFromDatabase()
      
      if (existingCollection) {
        console.log("✅ Using existing collection:", existingCollection.collectionMint)
        this.collectionMint = new PublicKey(existingCollection.collectionMint)
        return {
          success: true,
          collectionMint: existingCollection.collectionMint,
        }
      }

      // If no collection exists, create a new one
      console.log("🎨 Creating new collection...")
      return await this.createNewCollection(authority, signTransaction)
    } catch (error) {
      console.error("Error in getOrCreateCollection:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  // Get collection from database
  private async getCollectionFromDatabase(): Promise<CollectionInfo | null> {
    try {
      const response = await fetch("/api/collection")
      if (response.ok) {
        const data = await response.json()
        return data.collection || null
      }
      return null
    } catch (error) {
      console.error("Error fetching collection from database:", error)
      return null
    }
  }

  // Create new collection and store in database
  private async createNewCollection(
    authority: PublicKey,
    signTransaction: (transaction: Transaction) => Promise<Transaction>
  ): Promise<CollectionCreationResult> {
    try {
      const collectionMint = Keypair.generate()
      const transaction = new Transaction()

      // Get fresh blockhash
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash("confirmed")
      transaction.recentBlockhash = blockhash
      transaction.lastValidBlockHeight = lastValidBlockHeight
      transaction.feePayer = authority

      // Calculate rent for mint account
      const mintRent = await getMinimumBalanceForRentExemptMint(this.connection)

      // 1. Create mint account
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: authority,
          newAccountPubkey: collectionMint.publicKey,
          space: 82, // Mint account size
          lamports: mintRent,
          programId: TOKEN_PROGRAM_ID,
        })
      )

      // 2. Initialize mint (0 decimals for NFT)
      transaction.add(
        createInitializeMintInstruction(
          collectionMint.publicKey,
          0, // 0 decimals for NFT
          authority, // mint authority
          authority, // freeze authority
          TOKEN_PROGRAM_ID
        )
      )

      // 3. Get associated token account
      const associatedTokenAccount = await getAssociatedTokenAddress(
        collectionMint.publicKey,
        authority,
        false,
        TOKEN_PROGRAM_ID
      )

      // 4. Create associated token account
      transaction.add(
        createAssociatedTokenAccountInstruction(
          authority, // payer
          associatedTokenAccount, // ata
          authority, // owner
          collectionMint.publicKey, // mint
          TOKEN_PROGRAM_ID
        )
      )

      // 5. Mint 1 token to authority
      transaction.add(
        createMintToInstruction(
          collectionMint.publicKey,
          associatedTokenAccount,
          authority,
          1,
          [],
          TOKEN_PROGRAM_ID
        )
      )

      // 6. Create metadata account (simplified for now)
      // TODO: Add metadata creation back once dependencies are resolved
      console.log("Collection mint created without metadata for now:", collectionMint.publicKey.toString())

      // Sign and send transaction
      transaction.partialSign(collectionMint)
      const signedTransaction = await signTransaction(transaction)
      
      const signature = await this.connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: "confirmed",
        }
      )

      // Confirm transaction
      await this.connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      })

      // Store collection in database
      await this.storeCollectionInDatabase({
        collectionMint: collectionMint.publicKey.toString(),
        createdAt: new Date().toISOString(),
        createdBy: authority.toString(),
        transactionSignature: signature,
        totalMinted: 0,
        maxSupply: COLLECTION_CONFIG.maxSupply,
      })

      // Set collection mint for future use
      this.collectionMint = collectionMint.publicKey

      console.log("✅ Collection created successfully!")
      console.log("Collection Mint:", collectionMint.publicKey.toString())

      return {
        success: true,
        collectionMint: collectionMint.publicKey.toString(),
        signature,
      }
    } catch (error) {
      console.error("Error creating collection:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create collection",
      }
    }
  }

  // Store collection info in database
  private async storeCollectionInDatabase(collectionInfo: CollectionInfo): Promise<void> {
    try {
      const response = await fetch("/api/collection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(collectionInfo),
      })

      if (!response.ok) {
        throw new Error("Failed to store collection in database")
      }

      console.log("✅ Collection stored in database")
    } catch (error) {
      console.error("Error storing collection in database:", error)
      throw error
    }
  }

  // Get current collection mint
  getCollectionMint(): PublicKey | null {
    return this.collectionMint
  }

  // Set collection mint (for when loading from database)
  setCollectionMint(collectionMint: PublicKey): void {
    this.collectionMint = collectionMint
  }

  // Update collection mint count
  async updateCollectionMintCount(): Promise<void> {
    if (!this.collectionMint) return

    try {
      await fetch("/api/collection/increment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          collectionMint: this.collectionMint.toString(),
        }),
      })
    } catch (error) {
      console.error("Error updating collection mint count:", error)
    }
  }
}
