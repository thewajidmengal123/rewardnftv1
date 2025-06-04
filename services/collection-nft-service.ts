import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  Keypair,
  LAMPORTS_PER_SOL 
} from "@solana/web3.js"
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createMintToInstruction,
  getMinimumBalanceForRentExemptMint,
} from "@solana/spl-token"
import {
  createCreateMetadataAccountV3Instruction,
  createSetAndVerifyCollectionInstruction,
  MPL_TOKEN_METADATA_PROGRAM_ID,
  findMetadataPda,
  findMasterEditionPda,
} from "@metaplex-foundation/mpl-token-metadata"
import { EnhancedUSDCService } from "./enhanced-usdc-service"

// Collection Configuration
export const COLLECTION_CONFIG = {
  name: "RewardNFT Collection",
  symbol: "RNFT",
  description: "Exclusive NFT collection for the RewardNFT platform with referral rewards and quest access.",
  image: "https://quicknode.quicknode-ipfs.com/ipfs/QmWrmCfPm6L85p1o8KMc9WZCsdwsgW89n37nQMJ6UCVYNW",
  external_url: "https://rewardnft.com",
  seller_fee_basis_points: 500, // 5% royalty
  creators: [
    {
      address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM", // Treasury wallet
      verified: true,
      share: 100,
    },
  ],
  collection: {
    name: "RewardNFT Collection",
    family: "RewardNFT",
  },
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

export const NFT_CONFIG = {
  maxSupply: 1000,
  pricePerNFT: 10, // USDC
  maxPerWallet: 5, // Allow up to 5 NFTs per wallet
  treasuryWallet: new PublicKey("9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"),
  referralReward: 4, // USDC to referrer
  treasuryAmount: 6, // USDC to treasury when referred
}

export interface CollectionMintResult {
  success: boolean
  collectionMint?: string
  signature?: string
  error?: string
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

export class CollectionNFTService {
  private connection: Connection
  private usdcService: EnhancedUSDCService
  private collectionMint: PublicKey | null = null

  constructor(connection: Connection) {
    this.connection = connection
    this.usdcService = new EnhancedUSDCService(connection)
  }

  // Set the collection mint address (should be created once)
  setCollectionMint(collectionMint: PublicKey) {
    this.collectionMint = collectionMint
  }

  // Create the main collection NFT (one-time setup)
  async createCollection(
    authority: PublicKey,
    signTransaction: (transaction: Transaction) => Promise<Transaction>
  ): Promise<CollectionMintResult> {
    try {
      console.log("🎨 Creating collection NFT...")

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
          authority,
          associatedTokenAccount,
          authority,
          collectionMint.publicKey,
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

      // 6. Create metadata account
      const metadataPda = findMetadataPda(collectionMint.publicKey)
      const masterEditionPda = findMasterEditionPda(collectionMint.publicKey)

      transaction.add(
        createCreateMetadataAccountV3Instruction(
          {
            metadata: metadataPda,
            mint: collectionMint.publicKey,
            mintAuthority: authority,
            payer: authority,
            updateAuthority: authority,
            systemProgram: SystemProgram.programId,
            rent: new PublicKey("SysvarRent111111111111111111111111111111111"),
          },
          {
            createMetadataAccountArgsV3: {
              data: {
                name: COLLECTION_CONFIG.name,
                symbol: COLLECTION_CONFIG.symbol,
                uri: "", // Will be updated with proper metadata URI
                sellerFeeBasisPoints: COLLECTION_CONFIG.seller_fee_basis_points,
                creators: COLLECTION_CONFIG.creators.map(creator => ({
                  address: new PublicKey(creator.address),
                  verified: creator.verified,
                  share: creator.share,
                })),
                collection: null,
                uses: null,
              },
              isMutable: true,
              collectionDetails: {
                __kind: "V1",
                size: BigInt(NFT_CONFIG.maxSupply),
              },
            },
          }
        )
      )

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

      // Store collection mint for future use
      this.collectionMint = collectionMint.publicKey

      console.log("✅ Collection created successfully!")
      console.log("Collection Mint:", collectionMint.publicKey.toString())

      return {
        success: true,
        collectionMint: collectionMint.publicKey.toString(),
        signature,
      }
    } catch (error) {
      console.error("❌ Error creating collection:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  // Get current supply information
  async getSupplyInfo(): Promise<{
    totalSupply: number
    maxSupply: number
    available: number
  }> {
    try {
      // This would typically query your database or on-chain data
      // For now, we'll return mock data that matches the UI
      const totalSupply = 468 // NFTs already minted
      const maxSupply = NFT_CONFIG.maxSupply
      const available = maxSupply - totalSupply

      return {
        totalSupply,
        maxSupply,
        available,
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

  // Check how many NFTs a wallet has minted
  async getWalletMintCount(walletAddress: PublicKey): Promise<number> {
    try {
      // This would query your database for the wallet's mint count
      // For now, return 0 (implement with your database)
      return 0
    } catch (error) {
      console.error("Error getting wallet mint count:", error)
      return 0
    }
  }

  // Calculate pricing based on referral
  calculatePricing(quantity: number, hasReferrer: boolean): {
    totalCost: number
    treasuryAmount: number
    referrerAmount: number
  } {
    const totalCost = quantity * NFT_CONFIG.pricePerNFT

    if (hasReferrer) {
      return {
        totalCost,
        treasuryAmount: quantity * NFT_CONFIG.treasuryAmount,
        referrerAmount: quantity * NFT_CONFIG.referralReward,
      }
    } else {
      return {
        totalCost,
        treasuryAmount: totalCost,
        referrerAmount: 0,
      }
    }
  }

  // Mint multiple NFTs with referral support
  async mintNFTs(
    minter: PublicKey,
    quantity: number,
    signTransaction: (transaction: Transaction) => Promise<Transaction>,
    referrerWallet?: PublicKey,
    onProgress?: (progress: MintProgress) => void
  ): Promise<NFTMintResult> {
    try {
      if (!this.collectionMint) {
        return {
          success: false,
          error: "Collection not initialized. Please create collection first.",
        }
      }

      // Validate quantity
      if (quantity <= 0 || quantity > NFT_CONFIG.maxPerWallet) {
        return {
          success: false,
          error: `Invalid quantity. Must be between 1 and ${NFT_CONFIG.maxPerWallet}`,
        }
      }

      // Check current wallet mint count
      const currentMintCount = await this.getWalletMintCount(minter)
      if (currentMintCount + quantity > NFT_CONFIG.maxPerWallet) {
        return {
          success: false,
          error: `Exceeds maximum per wallet. You can mint ${NFT_CONFIG.maxPerWallet - currentMintCount} more NFTs.`,
        }
      }

      // Check supply
      const supplyInfo = await this.getSupplyInfo()
      if (quantity > supplyInfo.available) {
        return {
          success: false,
          error: `Insufficient supply. Only ${supplyInfo.available} NFTs available.`,
        }
      }

      // Calculate pricing
      const pricing = this.calculatePricing(quantity, !!referrerWallet)

      // Check USDC balance
      const usdcBalance = await this.usdcService.getUSDCBalance(minter)
      if (usdcBalance < pricing.totalCost) {
        return {
          success: false,
          error: `Insufficient USDC balance. Need ${pricing.totalCost} USDC, have ${usdcBalance.toFixed(2)} USDC.`,
        }
      }

      onProgress?.({
        step: "payment",
        message: "Processing USDC payment...",
        progress: 10,
      })

      // Process USDC payment
      let usdcSignature: string
      if (referrerWallet) {
        // Split payment: treasury + referrer
        usdcSignature = await this.processSplitPayment(
          minter,
          signTransaction,
          pricing.treasuryAmount,
          pricing.referrerAmount,
          referrerWallet
        )
      } else {
        // Full payment to treasury
        const usdcTransaction = await this.usdcService.createPlatformUSDCTransfer(
          minter,
          pricing.totalCost
        )
        const signedUsdcTransaction = await signTransaction(usdcTransaction)
        usdcSignature = await this.connection.sendRawTransaction(
          signedUsdcTransaction.serialize(),
          {
            skipPreflight: false,
            preflightCommitment: "confirmed",
          }
        )

        await this.connection.confirmTransaction({
          signature: usdcSignature,
          blockhash: usdcTransaction.recentBlockhash!,
          lastValidBlockHeight: usdcTransaction.lastValidBlockHeight!,
        })
      }

      onProgress?.({
        step: "minting",
        message: "Minting NFTs...",
        progress: 30,
      })

      // Mint NFTs
      const mintResults: string[] = []
      const signatures: string[] = []

      for (let i = 0; i < quantity; i++) {
        onProgress?.({
          step: "minting",
          message: `Minting NFT ${i + 1} of ${quantity}...`,
          progress: 30 + (i / quantity) * 60,
          currentNFT: i + 1,
          totalNFTs: quantity,
        })

        const nftResult = await this.mintSingleNFT(minter, signTransaction, i + 1)
        if (nftResult.success && nftResult.mintAddress && nftResult.signature) {
          mintResults.push(nftResult.mintAddress)
          signatures.push(nftResult.signature)
        } else {
          // If any NFT fails, we should handle it gracefully
          console.error(`Failed to mint NFT ${i + 1}:`, nftResult.error)
        }
      }

      onProgress?.({
        step: "complete",
        message: "Minting completed!",
        progress: 100,
      })

      return {
        success: true,
        mintAddresses: mintResults,
        signatures,
        usdcSignature,
        totalCost: pricing.totalCost,
      }
    } catch (error) {
      console.error("Error minting NFTs:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  // Process split payment for referrals
  private async processSplitPayment(
    minter: PublicKey,
    signTransaction: (transaction: Transaction) => Promise<Transaction>,
    treasuryAmount: number,
    referrerAmount: number,
    referrerWallet: PublicKey
  ): Promise<string> {
    const splitTransaction = await this.usdcService.createSplitUSDCTransfer(
      minter,
      treasuryAmount,
      referrerAmount,
      referrerWallet
    )

    const signedTransaction = await signTransaction(splitTransaction)
    const signature = await this.connection.sendRawTransaction(
      signedTransaction.serialize(),
      {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      }
    )

    await this.connection.confirmTransaction({
      signature,
      blockhash: splitTransaction.recentBlockhash!,
      lastValidBlockHeight: splitTransaction.lastValidBlockHeight!,
    })

    return signature
  }

  // Mint a single NFT as part of the collection
  private async mintSingleNFT(
    minter: PublicKey,
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
          0, // 0 decimals for NFT
          minter, // mint authority
          minter, // freeze authority
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

      // 5. Mint 1 token to minter
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

      // 6. Create metadata account
      const metadataPda = findMetadataPda(nftMint.publicKey)

      transaction.add(
        createCreateMetadataAccountV3Instruction(
          {
            metadata: metadataPda,
            mint: nftMint.publicKey,
            mintAuthority: minter,
            payer: minter,
            updateAuthority: minter,
            systemProgram: SystemProgram.programId,
            rent: new PublicKey("SysvarRent111111111111111111111111111111111"),
          },
          {
            createMetadataAccountArgsV3: {
              data: {
                name: `${COLLECTION_CONFIG.name} #${nftNumber}`,
                symbol: COLLECTION_CONFIG.symbol,
                uri: "", // Will be updated with proper metadata URI
                sellerFeeBasisPoints: COLLECTION_CONFIG.seller_fee_basis_points,
                creators: COLLECTION_CONFIG.creators.map(creator => ({
                  address: new PublicKey(creator.address),
                  verified: false, // Will be verified later
                  share: creator.share,
                })),
                collection: {
                  verified: false,
                  key: this.collectionMint!,
                },
                uses: null,
              },
              isMutable: true,
              collectionDetails: null,
            },
          }
        )
      )

      // 7. Verify collection (if collection mint is available)
      if (this.collectionMint) {
        const collectionMetadataPda = findMetadataPda(this.collectionMint)
        const collectionMasterEditionPda = findMasterEditionPda(this.collectionMint)

        transaction.add(
          createSetAndVerifyCollectionInstruction({
            metadata: metadataPda,
            collectionAuthority: minter,
            payer: minter,
            updateAuthority: minter,
            collectionMint: this.collectionMint,
            collection: collectionMetadataPda,
            collectionMasterEditionAccount: collectionMasterEditionPda,
            collectionAuthorityRecord: undefined,
          })
        )
      }

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
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }
}
