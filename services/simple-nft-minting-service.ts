"use client"

import { Connection, PublicKey, Transaction, Keypair, SystemProgram } from "@solana/web3.js"
import {
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  getMinimumBalanceForRentExemptMint,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  MINT_SIZE,
} from "@solana/spl-token"
import {
  createCreateMetadataAccountV3Instruction,
  createCreateMasterEditionV3Instruction,
  createVerifyCollectionInstruction,
  DataV2,
  Creator,
  Collection,
  Uses,
} from "@metaplex-foundation/mpl-token-metadata"

// Define the Token Metadata Program ID
const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
import { SimpleCollectionService, SIMPLE_COLLECTION_CONFIG } from "./simple-collection-service"
import { EnhancedUSDCService } from "./enhanced-usdc-service"

export const NFT_CONFIG = {
  maxSupply: 1000,
  pricePerNFT: 10, // USDC
  maxPerWallet: 5, // Allow up to 5 NFTs per wallet
  treasuryWallet: new PublicKey("8QY2zcWZWwBZYMeiSfPivWAiPBbLZe1mbnyJauWe8ms6"),
  referralReward: 4, // USDC to referrer
  treasuryAmount: 6, // USDC to treasury when referred
  // NFT Metadata
  name: "RewardNFT Collection",
  symbol: "RNFT",
  description: "Exclusive NFT collection for the RewardNFT platform with referral rewards and quest access.",
  image: "https://quicknode.quicknode-ipfs.com/ipfs/QmWrmCfPm6L85p1o8KMc9WZCsdwsgW89n37nQMJ6UCVYNW",
  external_url: "https://rewardnft.com",
  seller_fee_basis_points: 500, // 5% royalty
  creators: [
    {
      address: "8QY2zcWZWwBZYMeiSfPivWAiPBbLZe1mbnyJauWe8ms6",
      verified: true,
      share: 100,
    },
  ],
  attributes: [
    {
      trait_type: "Platform",
      value: "RewardNFT",
    },
    {
      trait_type: "Utility",
      value: "Referral Access",
    },
  ],
}

// Helper function to find metadata PDA
export function findMetadataPda(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  )
}

// Helper function to find master edition PDA
export function findMasterEditionPda(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
      Buffer.from("edition"),
    ],
    TOKEN_METADATA_PROGRAM_ID
  )
}

export interface NFTMintResult {
  success: boolean
  mintAddresses?: string[]
  signatures?: string[]
  usdcSignature?: string
  error?: string
  totalCost?: number
  nftData?: Array<{
    mint: string
    signature: string
    name: string
    image: string
    metadata?: any
  }>
}

export interface MintProgress {
  step: string
  message: string
  progress: number
  currentNFT?: number
  totalNFTs?: number
}

export class SimpleNFTMintingService {
  private connection: Connection
  private collectionService: SimpleCollectionService
  private usdcService: EnhancedUSDCService

  constructor(connection: Connection) {
    this.connection = connection
    this.collectionService = new SimpleCollectionService(connection)
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
      console.log("🚀 Starting NFT minting process...")
      
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

      const collectionResult = await this.collectionService.getOrCreateCollection(minter, signTransaction)
      
      if (!collectionResult.success || !collectionResult.collectionMint) {
        return {
          success: false,
          error: collectionResult.error || "Failed to setup collection",
        }
      }

      console.log("✅ Collection ready:", collectionResult.collectionMint)

      // Step 2: Handle USDC payment (temporarily disabled for testing)
      onProgress?.({
        step: "payment",
        message: "Skipping USDC payment for testing...",
        progress: 20,
      })

      // TODO: Re-enable USDC payment once testing is complete
      const usdcResult = { success: true, signature: "mock_payment_" + Date.now() }

      console.log("✅ USDC payment skipped for testing")

      // Step 3: Mint NFTs with proper Metaplex metadata
      const mintAddresses: string[] = []
      const signatures: string[] = []
      const nftData: Array<{
        mint: string
        signature: string
        name: string
        image: string
        metadata?: any
      }> = []

      for (let i = 0; i < quantity; i++) {
        onProgress?.({
          step: "minting",
          message: `Minting NFT ${i + 1} of ${quantity}...`,
          progress: 30 + (i / quantity) * 60,
          currentNFT: i + 1,
          totalNFTs: quantity,
        })

        const nftResult = await this.mintMetaplexNFT(
          minter,
          new PublicKey(collectionResult.collectionMint),
          signTransaction,
          i + 1
        )

        if (nftResult.success && nftResult.mintAddress && nftResult.signature) {
          mintAddresses.push(nftResult.mintAddress)
          signatures.push(nftResult.signature)
          nftData.push({
            mint: nftResult.mintAddress,
            signature: nftResult.signature,
            name: nftResult.name || `${NFT_CONFIG.name} #${i + 1}`,
            image: nftResult.image || NFT_CONFIG.image,
            metadata: nftResult.metadata,
          })

          // Update collection mint count
          await this.collectionService.updateCollectionMintCount()

          console.log(`✅ NFT ${i + 1} minted:`, nftResult.mintAddress)
        } else {
          return {
            success: false,
            error: nftResult.error || `Failed to mint NFT ${i + 1}`,
          }
        }
      }

      onProgress?.({
        step: "complete",
        message: "Minting completed successfully!",
        progress: 100,
      })

      console.log("🎉 All NFTs minted successfully!")

      return {
        success: true,
        mintAddresses,
        signatures,
        usdcSignature: usdcResult.signature,
        totalCost,
        nftData,
      }
    } catch (error) {
      console.error("❌ Error in mintNFTs:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  }

  // Handle USDC payment with referral logic
  private async handleUSDCPayment(
    minter: PublicKey,
    totalAmount: number,
    referrerWallet?: PublicKey,
    signTransaction?: (transaction: Transaction) => Promise<Transaction>
  ): Promise<{ success: boolean; signature?: string; error?: string }> {
    try {
      if (!signTransaction) {
        return { success: false, error: "Sign transaction function not provided" }
      }

      if (referrerWallet) {
        // Split payment: referrer gets 4 USDC per NFT, treasury gets 6 USDC per NFT
        const referrerAmount = (totalAmount / NFT_CONFIG.pricePerNFT) * NFT_CONFIG.referralReward
        const treasuryAmount = (totalAmount / NFT_CONFIG.pricePerNFT) * NFT_CONFIG.treasuryAmount

        console.log(`💰 Splitting payment: ${treasuryAmount} USDC to treasury, ${referrerAmount} USDC to referrer`)

        // TODO: Implement transferUSDCWithReferral method
        const result = { success: true, signature: "mock_referral_" + Date.now() }

        return result
      } else {
        // No referrer: all goes to treasury
        console.log(`💰 Sending ${totalAmount} USDC to treasury`)

        const result = await this.usdcService.transferUSDC(
          minter,
          NFT_CONFIG.treasuryWallet,
          totalAmount,
          signTransaction
        )

        return result
      }
    } catch (error) {
      console.error("❌ Error handling USDC payment:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Payment failed",
      }
    }
  }

  // Mint a proper Metaplex NFT with metadata and collection verification
  private async mintMetaplexNFT(
    minter: PublicKey,
    collectionMint: PublicKey,
    signTransaction: (transaction: Transaction) => Promise<Transaction>,
    nftNumber: number
  ): Promise<{
    success: boolean;
    mintAddress?: string;
    signature?: string;
    name?: string;
    image?: string;
    metadata?: any;
    error?: string;
  }> {
    try {
      console.log(`🎨 Creating NFT #${nftNumber} with proper Metaplex metadata...`)

      // Create new mint keypair
      const nftMint = Keypair.generate()
      const mint = nftMint.publicKey

      // Get associated token account
      const associatedTokenAccount = await getAssociatedTokenAddress(mint, minter)

      // Get metadata PDA
      const [metadataPda] = findMetadataPda(mint)

      // Get master edition PDA
      const [masterEditionPda] = findMasterEditionPda(mint)

      // Create NFT metadata
      const nftMetadata: DataV2 = {
        name: `${NFT_CONFIG.name} #${nftNumber}`,
        symbol: NFT_CONFIG.symbol,
        uri: await this.createMetadataJSON(nftNumber),
        sellerFeeBasisPoints: NFT_CONFIG.seller_fee_basis_points,
        creators: NFT_CONFIG.creators.map(creator => ({
          address: new PublicKey(creator.address),
          verified: creator.verified,
          share: creator.share,
        })) as Creator[],
        collection: {
          key: collectionMint,
        } as Collection,
        uses: undefined as Uses | undefined,
      }

      // Build transaction
      const transaction = new Transaction()

      // Get fresh blockhash
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash("confirmed")
      transaction.recentBlockhash = blockhash
      transaction.lastValidBlockHeight = lastValidBlockHeight
      transaction.feePayer = minter

      // Add rent for mint account
      const mintRent = await getMinimumBalanceForRentExemptMint(this.connection)
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: minter,
          newAccountPubkey: mint,
          space: MINT_SIZE,
          lamports: mintRent,
          programId: TOKEN_PROGRAM_ID,
        })
      )

      // Initialize mint
      transaction.add(
        createInitializeMintInstruction(
          mint,
          0, // 0 decimals for NFT
          minter, // mint authority
          minter  // freeze authority
        )
      )

      // Create associated token account
      transaction.add(
        createAssociatedTokenAccountInstruction(
          minter, // payer
          associatedTokenAccount,
          minter, // owner
          mint
        )
      )

      // Mint 1 token to the associated token account
      transaction.add(
        createMintToInstruction(
          mint,
          associatedTokenAccount,
          minter, // mint authority
          1 // amount (1 for NFT)
        )
      )

      // Create metadata account
      transaction.add(
        createCreateMetadataAccountV3Instruction(
          {
            metadata: metadataPda,
            mint: mint,
            mintAuthority: minter,
            payer: minter,
            updateAuthority: minter,
          },
          {
            createMetadataAccountArgsV3: {
              data: nftMetadata,
              isMutable: true,
              collectionDetails: null,
            },
          }
        )
      )

      // Create master edition (makes it an NFT)
      transaction.add(
        createCreateMasterEditionV3Instruction(
          {
            edition: masterEditionPda,
            mint: mint,
            updateAuthority: minter,
            mintAuthority: minter,
            payer: minter,
            metadata: metadataPda,
          },
          {
            createMasterEditionArgs: {
              maxSupply: 0, // 0 = unlimited editions, but we'll only mint 1
            },
          }
        )
      )

      // Add mint keypair as signer
      transaction.partialSign(nftMint)

      // Sign transaction
      const signedTransaction = await signTransaction(transaction)

      // Send transaction
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

      console.log(`✅ NFT #${nftNumber} created with proper metadata:`, mint.toString())
      console.log(`📝 Metadata PDA:`, metadataPda.toString())
      console.log(`🏆 Master Edition PDA:`, masterEditionPda.toString())

      return {
        success: true,
        mintAddress: mint.toString(),
        signature,
        name: nftMetadata.name,
        image: NFT_CONFIG.image,
        metadata: nftMetadata,
      }
    } catch (error) {
      console.error(`❌ Error minting NFT #${nftNumber}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to mint NFT",
      }
    }
  }

  // Create metadata JSON for the NFT
  private async createMetadataJSON(nftNumber: number): Promise<string> {
    const metadata = {
      name: `${NFT_CONFIG.name} #${nftNumber}`,
      symbol: NFT_CONFIG.symbol,
      description: NFT_CONFIG.description,
      image: NFT_CONFIG.image,
      external_url: NFT_CONFIG.external_url,
      attributes: [
        ...NFT_CONFIG.attributes,
        {
          trait_type: "Edition",
          value: nftNumber.toString(),
        },
        {
          trait_type: "Rarity",
          value: "Standard",
        },
      ],
      properties: {
        files: [
          {
            uri: NFT_CONFIG.image,
            type: "image/png",
          },
        ],
        category: "image",
        creators: NFT_CONFIG.creators,
      },
      collection: {
        name: NFT_CONFIG.name,
        family: NFT_CONFIG.name,
      },
    }

    // For now, return a data URI with the metadata
    // In production, you'd upload this to IPFS or Arweave
    const metadataString = JSON.stringify(metadata)
    const base64Metadata = Buffer.from(metadataString).toString('base64')
    return `data:application/json;base64,${base64Metadata}`
  }

  // Get wallet mint count (placeholder)
  async getWalletMintCount(wallet: PublicKey): Promise<number> {
    try {
      // For now, return 0 as placeholder
      // In a real implementation, you'd query the blockchain or database
      return 0
    } catch (error) {
      console.error("Error getting wallet mint count:", error)
      return 0
    }
  }

  // Get supply info
  async getSupplyInfo(): Promise<{ totalSupply: number; maxSupply: number; available: number }> {
    return await this.collectionService.getSupplyInfo()
  }
}
