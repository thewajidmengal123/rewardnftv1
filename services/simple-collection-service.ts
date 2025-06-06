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

// Simple collection configuration
export const SIMPLE_COLLECTION_CONFIG = {
  name: "RewardNFT Collection",
  symbol: "RNFT",
  maxSupply: 1000,
  pricePerNFT: 10, // USDC
  maxPerWallet: 1,
  treasuryWallet: "8QY2zcWZWwBZYMeiSfPivWAiPBbLZe1mbnyJauWe8ms6",
}

export interface SimpleCollectionInfo {
  collectionMint: string
  createdAt: string
  createdBy: string
  transactionSignature: string
  totalMinted: number
  maxSupply: number
}

export interface SimpleCollectionResult {
  success: boolean
  collectionMint?: string
  signature?: string
  error?: string
}

export class SimpleCollectionService {
  private connection: Connection
  private collectionMint: PublicKey | null = null

  constructor(connection: Connection) {
    this.connection = connection
  }

  // Get or create collection (main entry point)
  async getOrCreateCollection(
    authority: PublicKey,
    signTransaction: (transaction: Transaction) => Promise<Transaction>
  ): Promise<SimpleCollectionResult> {
    try {
      console.log("🔍 Checking for existing collection...")
      
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

  // Get collection from database (using temp API for testing)
  private async getCollectionFromDatabase(): Promise<SimpleCollectionInfo | null> {
    try {
      const response = await fetch("/api/collection-temp")
      if (response.ok) {
        const data = await response.json()
        return data.collection || null
      }
      console.log("No existing collection found in database")
      return null
    } catch (error) {
      console.error("Error fetching collection from database:", error)
      return null
    }
  }

  // Create new collection (simplified - just a basic mint)
  private async createNewCollection(
    authority: PublicKey,
    signTransaction: (transaction: Transaction) => Promise<Transaction>
  ): Promise<SimpleCollectionResult> {
    try {
      console.log("🏗️ Creating collection mint...")
      
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

      // 5. Mint 1 token to authority (makes it a collection)
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

      console.log("📝 Signing transaction...")
      
      // Sign and send transaction
      transaction.partialSign(collectionMint)
      const signedTransaction = await signTransaction(transaction)
      
      console.log("📡 Sending transaction...")
      
      const signature = await this.connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: "confirmed",
        }
      )

      console.log("⏳ Confirming transaction...")
      
      // Confirm transaction
      await this.connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      })

      console.log("💾 Storing collection in database...")
      
      // Store collection in database
      await this.storeCollectionInDatabase({
        collectionMint: collectionMint.publicKey.toString(),
        createdAt: new Date().toISOString(),
        createdBy: authority.toString(),
        transactionSignature: signature,
        totalMinted: 0,
        maxSupply: SIMPLE_COLLECTION_CONFIG.maxSupply,
      })

      // Set collection mint for future use
      this.collectionMint = collectionMint.publicKey

      console.log("✅ Collection created successfully!")
      console.log("Collection Mint:", collectionMint.publicKey.toString())
      console.log("Transaction:", signature)

      return {
        success: true,
        collectionMint: collectionMint.publicKey.toString(),
        signature,
      }
    } catch (error) {
      console.error("❌ Error creating collection:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create collection",
      }
    }
  }

  // Store collection info in database (using temp API for testing)
  private async storeCollectionInDatabase(collectionInfo: SimpleCollectionInfo): Promise<void> {
    try {
      const response = await fetch("/api/collection-temp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(collectionInfo),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Failed to store collection in database: ${response.status} ${errorData}`)
      }

      console.log("✅ Collection stored in database")
    } catch (error) {
      console.error("❌ Error storing collection in database:", error)
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
      const response = await fetch("/api/collection-temp/increment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          collectionMint: this.collectionMint.toString(),
        }),
      })

      if (!response.ok) {
        console.error("Failed to update collection mint count:", response.status)
      }
    } catch (error) {
      console.error("Error updating collection mint count:", error)
    }
  }

  // Get supply info (using temp API for testing)
  async getSupplyInfo(): Promise<{ totalSupply: number; maxSupply: number; available: number }> {
    try {
      const response = await fetch("/api/collection-temp")
      if (response.ok) {
        const data = await response.json()
        if (data.collection) {
          const totalSupply = data.collection.totalMinted || 0
          const maxSupply = data.collection.maxSupply || SIMPLE_COLLECTION_CONFIG.maxSupply
          return {
            totalSupply,
            maxSupply,
            available: maxSupply - totalSupply,
          }
        }
      }

      // Fallback values
      return {
        totalSupply: 0,
        maxSupply: SIMPLE_COLLECTION_CONFIG.maxSupply,
        available: SIMPLE_COLLECTION_CONFIG.maxSupply,
      }
    } catch (error) {
      console.error("Error getting supply info:", error)
      return {
        totalSupply: 0,
        maxSupply: SIMPLE_COLLECTION_CONFIG.maxSupply,
        available: SIMPLE_COLLECTION_CONFIG.maxSupply,
      }
    }
  }
}
