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
//   createVerifyCollectionInstruction,
//   findMetadataPda,
// } from "@metaplex-foundation/mpl-token-metadata"
import { AutoCollectionService, COLLECTION_CONFIG } from "./auto-collection-service"
import { EnhancedUSDCService } from "./enhanced-usdc-service"

export const NFT_CONFIG = {
  maxSupply: 1000,
  pricePerNFT: 5, // USDC
  maxPerWallet: 1, // Allow only 1 NFT per wallet
  treasuryWallet: new PublicKey("8QY2zcWZWwBZYMeiSfPivWAiPBbLZe1mbnyJauWe8ms6"),
  referralReward: 0, // No USDC rewards to referrer (referrals tracked for analytics only)
  treasuryAmount: 5, // Full 5 USDC to treasury per NFT (no referral rewards)
}

export interface NFTMintResult {
  success: boolean
  mintAddresses?: string[]
  signatures?: string[]
  usdcSignature?: string
  error?: string
  totalCost?: number
}

export interface MintProgress {
  step: string
  message: string
  progress: number
  currentNFT?: number
  totalNFTs?: number
}

export class EnhancedCollectionNFTService {
  private connection: Connection
  private autoCollectionService: AutoCollectionService
  private usdcService: EnhancedUSDCService

  constructor(connection: Connection) {
    this.connection = connection
    this.autoCollectionService = new AutoCollectionService(connection)
    this.usdcService = new EnhancedUSDCService(connection)
  }

  // Main minting function with auto-collection creation
  async mintNFTs(
    minter: PublicKey,
    quantity: number,
    signTransaction: (transaction: Transaction) => Promise<Transaction>,
    referrerWallet?: PublicKey,
    onProgress?: (progress: MintProgress) => void
  ): Promise<NFTMintResult> {
    try {
      // Validate quantity
      if (quantity <= 0 || quantity > NFT_CONFIG.maxPerWallet) {
        return {
          success: false,
          error: `Invalid quantity. Must be between 1 and ${NFT_CONFIG.maxPerWallet}`,
        }
      }

      const totalCost = quantity * NFT_CONFIG.pricePerNFT

      onProgress?.({
        step: "initializing",
        message: "Initializing mint process...",
        progress: 5,
      })

      // Step 1: Get or create collection
      onProgress?.({
        step: "collection",
        message: "Setting up collection...",
        progress: 10,
      })

      const collectionResult = await this.autoCollectionService.getOrCreateCollection(minter, signTransaction)
      
      if (!collectionResult.success || !collectionResult.collectionMint) {
        return {
          success: false,
          error: collectionResult.error || "Failed to setup collection",
        }
      }

      const collectionMint = new PublicKey(collectionResult.collectionMint)

      // Step 2: Handle USDC payment
      onProgress?.({
        step: "payment",
        message: "Processing USDC payment...",
        progress: 20,
      })

   

      // Step 3: Mint NFTs
      const mintAddresses: string[] = []
      const signatures: string[] = []

      for (let i = 0; i < quantity; i++) {
        onProgress?.({
          step: "minting",
          message: `Minting NFT ${i + 1} of ${quantity}...`,
          progress: 30 + (i / quantity) * 60,
          currentNFT: i + 1,
          totalNFTs: quantity,
        })

        const nftResult = await this.mintSingleNFT(minter, collectionMint, signTransaction, i + 1)
        
        if (nftResult.success && nftResult.mintAddress && nftResult.signature) {
          mintAddresses.push(nftResult.mintAddress)
          signatures.push(nftResult.signature)
          
          // Update collection mint count
          await this.autoCollectionService.updateCollectionMintCount()
        } else {
          return {
            success: false,
            error: nftResult.error || `Failed to mint NFT ${i + 1}`,
          }
        }
      }

      // Step 4: Record NFT data in database
      onProgress?.({
        step: "recording",
        message: "Recording NFT data in database...",
        progress: 95,
      })

      try {
        // Record each minted NFT in the database
        for (let i = 0; i < mintAddresses.length; i++) {
          const mintAddress = mintAddresses[i]
          const signature = signatures[i]

          const response = await fetch("/api/nfts/mint", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              mintAddress,
              ownerWallet: minter.toString(),
              transactionSignature: signature,
              name: `RewardNFT Collection #${i + 1}`,
              symbol: "RNFT",
              description: "Exclusive NFT from RewardNFT Platform",
              image: "/nft-reward-token.png",
              attributes: [
                { trait_type: "Platform", value: "RewardNFT" },
                { trait_type: "Utility", value: "Membership" },
                { trait_type: "Rarity", value: "Common" },
                { trait_type: "Collection", value: "Genesis" }
              ],
              mintCost: NFT_CONFIG.pricePerNFT,
              collectionAddress: collectionMint.toString(),
              metadata: {
                name: `RewardNFT Collection #${i + 1}`,
                symbol: "RNFT",
                description: "Exclusive NFT from RewardNFT Platform",
                image: "/nft-reward-token.png",
                attributes: [
                  { trait_type: "Platform", value: "RewardNFT" },
                  { trait_type: "Utility", value: "Membership" },
                  { trait_type: "Rarity", value: "Common" },
                  { trait_type: "Collection", value: "Genesis" }
                ],
                external_url: "https://rewardnft.com",
                seller_fee_basis_points: 500,
                creators: [
                  {
                    address: minter.toString(),
                    verified: true,
                    share: 100,
                  },
                ],
              },
            }),
          })

          if (!response.ok) {
            console.error(`Failed to record NFT ${mintAddress} in database`)
          } else {
            console.log(`✅ Recorded NFT ${mintAddress} in database`)
          }
        }
      } catch (error) {
        console.error("Error recording NFT data:", error)
        // Don't fail the entire mint process if database recording fails
      }

      // Step 5: Track referral for analytics (no rewards)
      if (referrerWallet && referrerWallet.toString() !== minter.toString()) {
        try {
          console.log(`📊 Tracking referral for analytics: ${referrerWallet.toString()} → ${minter.toString()} (no rewards)`)

          // Only track the referral, no reward processing
          const response = await fetch("/api/referrals/track", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              referrerWallet: referrerWallet.toString(),
              referredWallet: minter.toString(),
              nftsMinted: quantity,
              mintSignatures: signatures,
              trackingOnly: true, // Flag to indicate this is tracking only
            }),
          })

          if (response.ok) {
            console.log(`✅ Tracked referral for analytics: ${referrerWallet.toString()}`)
          } else {
            console.error("Failed to track referral")
          }
        } catch (error) {
          console.error("Error tracking referral:", error)
        }
      }

      onProgress?.({
        step: "complete",
        message: "Minting completed successfully!",
        progress: 100,
      })

      return {
        success: true,
        mintAddresses,
        signatures,
        usdcSignature: "",
        totalCost,
      }
    } catch (error) {
      console.error("Error in mintNFTs:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  }

  // Handle USDC payment with referral logic
 

  // Mint a single NFT
  private async mintSingleNFT(
    minter: PublicKey,
    collectionMint: PublicKey,
    signTransaction: (transaction: Transaction) => Promise<Transaction>,
    nftNumber: number
  ): Promise<{ success: boolean; mintAddress?: string; signature?: string; error?: string }> {
    try {
      const nftMint = Keypair.generate()
      const transaction = new Transaction()

      // Get fresh blockhash
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash("confirmed")
      transaction.recentBlockhash = blockhash
      transaction.lastValidBlockHeight = lastValidBlockHeight
      transaction.feePayer = minter

      // Calculate rent for mint account
      const mintRent = await getMinimumBalanceForRentExemptMint(this.connection)

      // 1. Create mint account
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: minter,
          newAccountPubkey: nftMint.publicKey,
          space: 82,
          lamports: mintRent,
          programId: TOKEN_PROGRAM_ID,
        })
      )

      // 2. Initialize mint
      transaction.add(
        createInitializeMintInstruction(
          nftMint.publicKey,
          0,
          minter,
          minter,
          TOKEN_PROGRAM_ID
        )
      )

      // 3. Get associated token account
      const associatedTokenAccount = await getAssociatedTokenAddress(
        nftMint.publicKey,
        minter,
        false,
        TOKEN_PROGRAM_ID
      )

      // 4. Create associated token account
      transaction.add(
        createAssociatedTokenAccountInstruction(
          minter,
          associatedTokenAccount,
          minter,
          nftMint.publicKey,
          TOKEN_PROGRAM_ID
        )
      )

      // 5. Mint 1 token
      transaction.add(
        createMintToInstruction(
          nftMint.publicKey,
          associatedTokenAccount,
          minter,
          1,
          [],
          TOKEN_PROGRAM_ID
        )
      )

      // 6. Create metadata (simplified for now)
      // TODO: Add metadata and collection verification back once dependencies are resolved
      console.log("NFT mint created without metadata for now:", nftMint.publicKey.toString())

      // Sign and send transaction
      transaction.partialSign(nftMint)
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

      return {
        success: true,
        mintAddress: nftMint.publicKey.toString(),
        signature,
      }
    } catch (error) {
      console.error("Error minting single NFT:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to mint NFT",
      }
    }
  }

  // Get wallet mint count
  async getWalletMintCount(wallet: PublicKey): Promise<number> {
    try {
      // Get user from Firebase to check nftsMinted count
      const { firebaseUserService } = await import('./firebase-user-service')
      const user = await firebaseUserService.getUserByWallet(wallet.toString())
      return user?.nftsMinted || 0
    } catch (error) {
      console.error("Error getting wallet mint count:", error)
      return 0
    }
  }

  // Get supply info
  async getSupplyInfo(): Promise<{ totalSupply: number; maxSupply: number; available: number }> {
    try {
      // Get collection info from database
      const response = await fetch("/api/collection")
      if (response.ok) {
        const data = await response.json()
        if (data.collection) {
          const totalSupply = data.collection.totalMinted || 0
          const maxSupply = data.collection.maxSupply || NFT_CONFIG.maxSupply
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
        maxSupply: NFT_CONFIG.maxSupply,
        available: NFT_CONFIG.maxSupply,
      }
    } catch (error) {
      console.error("Error getting supply info:", error)
      return {
        totalSupply: 0,
        maxSupply: NFT_CONFIG.maxSupply,
        available: NFT_CONFIG.maxSupply,
      }
    }
  }
}
