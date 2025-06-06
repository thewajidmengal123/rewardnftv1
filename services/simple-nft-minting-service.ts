"use client"

import {
  Connection,
  PublicKey,
  Transaction,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js"
import {
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  getMinimumBalanceForRentExemptMint,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  createTransferInstruction,
  MINT_SIZE,
  getAccount,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError,
} from "@solana/spl-token"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { 
  createMetadataAccountV3,
  mplTokenMetadata 
} from "@metaplex-foundation/mpl-token-metadata"
import {
  fromWeb3JsPublicKey,
  toWeb3JsPublicKey,
} from "@metaplex-foundation/umi-web3js-adapters"
import { SimpleCollectionService } from "./simple-collection-service"
import { EnhancedUSDCService } from "./enhanced-usdc-service"

// USDC Mint addresses for different networks
const USDC_MINT_ADDRESSES = {
  mainnet: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  devnet: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  testnet: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
}

export const NFT_CONFIG = {
  maxSupply: 1000,
  pricePerNFT: 10, // 🎯 EXACTLY 10 USDC per NFT (EACH NFT costs 10 USDC)
  maxPerWallet: 1, // Allow only 1 NFT per wallet
  treasuryWallet: new PublicKey("A9GT8pYUR5F1oRwUsQ9ADeZTWq7LJMfmPQ3TZLmV6cQP"), // Updated treasury wallet
  referralReward: 4, // USDC to referrer per NFT (when referred: 4 to referrer + 6 to treasury = 10 per NFT)
  treasuryAmount: 6, // USDC to treasury per NFT when referred (when no referrer: full 10 to treasury per NFT)
  usdcDecimals: 6, // USDC has 6 decimal places
  network: (process.env.NEXT_PUBLIC_SOLANA_NETWORK as keyof typeof USDC_MINT_ADDRESSES) || "devnet",
  // NFT Metadata
  name: "RewardNFT Collection",
  symbol: "RNFT",
  description: "Exclusive NFT collection for the RewardNFT platform with referral rewards and quest access.",
  image: "https://quicknode.quicknode-ipfs.com/ipfs/QmWrmCfPm6L85p1o8KMc9WZCsdwsgW89n37nQMJ6UCVYNW", // ✅ Image URL
  external_url: "https://rewardnft.com",
  seller_fee_basis_points: 500, // 5% royalty
 
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
  private usdcMint: PublicKey

  constructor(connection: Connection) {
    this.connection = connection
    this.collectionService = new SimpleCollectionService(connection)
    this.usdcService = new EnhancedUSDCService(connection)
    this.usdcMint = new PublicKey(USDC_MINT_ADDRESSES[NFT_CONFIG.network as keyof typeof USDC_MINT_ADDRESSES])
  }

  // Main minting function with USDC payment (10 USDC per NFT)
  async mintNFTs(
    minter: PublicKey,
    quantity: number,
    signTransaction: (transaction: Transaction) => Promise<Transaction>,
    referrerWallet?: PublicKey,
    onProgress?: (progress: MintProgress) => void
  ): Promise<NFTMintResult> {
    try {
      console.log("🚀 Starting USDC-based NFT minting: 10 USDC per NFT...")
      
      // Validate quantity
      if (quantity <= 0 || quantity > NFT_CONFIG.maxPerWallet) {
        return {
          success: false,
          error: `Invalid quantity. Must be between 1 and ${NFT_CONFIG.maxPerWallet}`,
        }
      }

      const totalCost = quantity * NFT_CONFIG.pricePerNFT
      
      console.log(`💰 Payment Summary:`, {
        quantity: quantity,
        pricePerNFT: NFT_CONFIG.pricePerNFT,
        totalCost: totalCost,
        hasReferrer: !!referrerWallet,
        network: NFT_CONFIG.network
      })

      onProgress?.({
        step: "initializing",
        message: `Preparing to mint ${quantity} NFT(s) at 10 USDC each (${totalCost} USDC total)...`,
        progress: 5,
      })

      // Step 1: Validate SOL balance for transaction fees
      const solBalance = await this.connection.getBalance(minter)
      const requiredSolForFees = quantity * 0.015 * LAMPORTS_PER_SOL // More accurate estimate per NFT
      
      if (solBalance < requiredSolForFees) {
        return {
          success: false,
          error: `Insufficient SOL balance. You need at least ${requiredSolForFees / LAMPORTS_PER_SOL} SOL for transaction fees.`,
        }
      }

      // Step 2: Validate USDC balance for ALL NFTs (10 USDC each)
      onProgress?.({
        step: "validation",
        message: `Validating USDC balance for ${totalCost} USDC total...`,
        progress: 10,
      })

      const usdcValidation = await this.validateUSDCBalance(minter, totalCost)
      if (!usdcValidation.success) {
        return {
          success: false,
          error: usdcValidation.error,
        }
      }

      // Step 3: Get or create collection
      onProgress?.({
        step: "collection",
        message: "Setting up collection...",
        progress: 15,
      })

      const collectionResult = await this.collectionService.getOrCreateCollection(minter, signTransaction)
      
      if (!collectionResult.success || !collectionResult.collectionMint) {
        return {
          success: false,
          error: collectionResult.error || "Failed to setup collection",
        }
      }

      console.log("✅ Collection ready:", collectionResult.collectionMint)

      // Step 4: Mint each NFT with GUARANTEED 10 USDC payment
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
          message: `💰 Paying 10 USDC + Minting NFT ${i + 1} of ${quantity}...`,
          progress: 20 + (i / quantity) * 70,
          currentNFT: i + 1,
          totalNFTs: quantity,
        })

        console.log(`🎯 Minting NFT ${i + 1}: GUARANTEED 10 USDC payment`)

        const nftResult = await this.mintSingleNFTWithPayment(
          minter,
          new PublicKey(collectionResult.collectionMint),
          signTransaction,
          i + 1,
          referrerWallet
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

          console.log(`✅ NFT ${i + 1} minted with 10 USDC payment:`, nftResult.mintAddress)
        } else {
          return {
            success: false,
            error: nftResult.error || `Failed to mint NFT ${i + 1}`,
          }
        }
      }

      onProgress?.({
        step: "complete",
        message: `🎉 Congratulations! ${quantity} exclusive RewardNFT${quantity > 1 ? 's' : ''} minted for ${totalCost} USDC! Welcome to the community! 🚀`,
        progress: 100,
      })

      console.log(`🎉 SUCCESS: All ${quantity} NFTs minted! Total paid: ${totalCost} USDC`)

      // Record NFT data in database
      onProgress?.({
        step: "recording",
        message: "Recording NFT data in database...",
        progress: 98,
      })

      try {
        // Record each minted NFT in the database
        for (let i = 0; i < mintAddresses.length; i++) {
          const mintAddress = mintAddresses[i]
          const signature = signatures[i]
          const nft = nftData[i]

          const response = await fetch("/api/nfts/mint", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              mintAddress,
              ownerWallet: minter.toString(),
              transactionSignature: signature,
              name: nft.name || `RewardNFT Collection #${i + 1}`,
              symbol: "RNFT",
              description: "Exclusive NFT from RewardNFT Platform",
              image: nft.image || "/nft-reward-token.png",
              attributes: [
                { trait_type: "Platform", value: "RewardNFT" },
                { trait_type: "Utility", value: "Membership" },
                { trait_type: "Rarity", value: "Common" },
                { trait_type: "Collection", value: "Genesis" }
              ],
              mintCost: NFT_CONFIG.pricePerNFT,
              collectionAddress: collectionResult.collectionMint,
              metadata: nft.metadata,
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

      // Handle referral rewards if applicable
      if (referrerWallet && referrerWallet.toString() !== minter.toString()) {
        try {
          const referralReward = quantity * 4 // 4 USDC per NFT for referrer

          const response = await fetch("/api/referrals/reward", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              referrerWallet: referrerWallet.toString(),
              referredWallet: minter.toString(),
              rewardAmount: referralReward,
              nftsMinted: quantity,
              mintSignatures: signatures,
            }),
          })

          if (response.ok) {
            console.log(`✅ Processed referral reward: ${referralReward} USDC to ${referrerWallet.toString()}`)
          } else {
            console.error("Failed to process referral reward")
          }
        } catch (error) {
          console.error("Error processing referral reward:", error)
        }
      }

      return {
        success: true,
        mintAddresses,
        signatures,
        usdcSignature: signatures[0], // Each transaction includes USDC payment
        totalCost,
        nftData,
      }
    } catch (error) {
      console.error("❌ Error in NFT minting process:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  }

  // Validate USDC balance and token account
  private async validateUSDCBalance(
    minter: PublicKey,
    requiredAmount: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const requiredUSDCAmount = requiredAmount * Math.pow(10, NFT_CONFIG.usdcDecimals)
      
      // Get user's USDC token account
      const userUsdcTokenAccount = await getAssociatedTokenAddress(
        this.usdcMint,
        minter
      )

      // Check if user has USDC token account and sufficient balance
      try {
        const userUsdcAccount = await getAccount(this.connection, userUsdcTokenAccount)
        
        console.log(`💰 USDC Balance Check:`, {
          required: requiredAmount,
          available: Number(userUsdcAccount.amount) / Math.pow(10, NFT_CONFIG.usdcDecimals),
          sufficientFunds: userUsdcAccount.amount >= requiredUSDCAmount
        })
        
        if (userUsdcAccount.amount < requiredUSDCAmount) {
          return {
            success: false,
            error: `Insufficient USDC balance. You need ${requiredAmount} USDC total (${requiredAmount / NFT_CONFIG.pricePerNFT} NFT(s) × 10 USDC each).`,
          }
        }

        return { success: true }
      } catch (error) {
        if (error instanceof TokenAccountNotFoundError || error instanceof TokenInvalidAccountOwnerError) {
          return {
            success: false,
            error: "USDC token account not found. You need to have USDC tokens in your wallet to mint NFTs.",
          }
        }
        throw error
      }
    } catch (error) {
      console.error("Error validating USDC balance:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to validate USDC balance",
      }
    }
  }

  // Mint single NFT with GUARANTEED 10 USDC payment
  private async mintSingleNFTWithPayment(
    minter: PublicKey,
    collectionMint: PublicKey,
    signTransaction: (transaction: Transaction) => Promise<Transaction>,
    nftNumber: number,
    referrerWallet?: PublicKey
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
      console.log(`🎨 Creating NFT #${nftNumber} with GUARANTEED 10 USDC payment...`)

      // Initialize UMI with proper plugin setup
      const umi = createUmi(this.connection.rpcEndpoint)
        .use(mplTokenMetadata())

      // Create new mint keypair
      const mintKeypair = Keypair.generate()
      const mintPublicKey = mintKeypair.publicKey

      // Calculate rent for the mint account
      const lamports = await getMinimumBalanceForRentExemptMint(this.connection)

      // Get the associated token account address
      const associatedTokenAddress = await getAssociatedTokenAddress(
        mintPublicKey,
        minter
      )

      // Prepare metadata URI with image
      const metadataUri = "https://amber-lazy-hippopotamus-119.mypinata.cloud/ipfs/bafkreic57mp46j7r64skk7younicsucjlxxoxf6ua7ajk25sxo4c6ztvwy"

      // Create a PublicKey from the metadata program ID string
      const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")

      // Find the metadata account PDA
      const [metadataAccount] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          METADATA_PROGRAM_ID.toBuffer(),
          mintPublicKey.toBuffer(),
        ],
        METADATA_PROGRAM_ID
      )

      // Build complete transaction instructions
      const allInstructions = []

      // 🎯 STEP 1: ALWAYS add 10 USDC payment instructions (NEVER skip this!)
      console.log(`💰 Adding GUARANTEED 10 USDC payment instructions...`)
      const usdcInstructions = await this.createUSDCPaymentInstructions(
        minter,
        NFT_CONFIG.pricePerNFT, // Always exactly 10 USDC
        referrerWallet
      )
      allInstructions.push(...usdcInstructions)
      console.log(`✅ Added ${usdcInstructions.length} USDC payment instructions`)

      // 🎯 STEP 2: Add NFT minting instructions
      const nftInstructions = [
        // Create the mint account
        SystemProgram.createAccount({
          fromPubkey: minter,
          newAccountPubkey: mintPublicKey,
          space: MINT_SIZE,
          lamports,
          programId: TOKEN_PROGRAM_ID,
        }),

        // Initialize the mint
        createInitializeMintInstruction(
          mintPublicKey,
          0, // Decimals
          minter,
          minter,
          TOKEN_PROGRAM_ID
        ),

        // Create the associated token account for the user
        createAssociatedTokenAccountInstruction(
          minter,
          associatedTokenAddress,
          minter,
          mintPublicKey
        ),

        // Mint one token to the user's associated token account
        createMintToInstruction(
          mintPublicKey, // mint
          associatedTokenAddress, // destination
          minter, // authority
          1, // amount (1 for NFT)
          [], // multisig signers (empty for single authority)
          TOKEN_PROGRAM_ID // explicitly specify the program ID
        ),
      ]

      allInstructions.push(...nftInstructions)
      console.log(`✅ Added ${nftInstructions.length} NFT minting instructions`)

      // 🎯 STEP 3: Add metadata instruction
      try {
        const umiMinter = fromWeb3JsPublicKey(minter)
        const umiMintPublicKey = fromWeb3JsPublicKey(mintPublicKey)
        const umiMetadataAccount = fromWeb3JsPublicKey(metadataAccount)

        // Only mark the minter as verified creator
        const validatedCreators = [
          {
            address: umiMinter,
            verified: true,
            share: 100,
          }
        ]

        const nftName = `${NFT_CONFIG.name}`.substring(0, 32)
        const nftSymbol = NFT_CONFIG.symbol.substring(0, 10)
        const validatedUri = metadataUri

        const metadataArgs = {
          data: {
            name: nftName,
            symbol: nftSymbol,
            image: NFT_CONFIG.image,
            uri: validatedUri,
            sellerFeeBasisPoints: NFT_CONFIG.seller_fee_basis_points,
            creators: validatedCreators,
            collection: null,
            uses: null,
          },
          isMutable: true,
          collectionDetails: null,
        }

        const accounts = {
          metadata: umiMetadataAccount,
          mint: umiMintPublicKey,
          mintAuthority: umiMinter,
          payer: umiMinter,
          updateAuthority: umiMinter,
        }


        const fullArgs = { ...accounts, ...metadataArgs }
        //@ts-ignore
        const metadataBuilder = createMetadataAccountV3(umi, fullArgs)
        const instructions = metadataBuilder.getInstructions()
        
        if (instructions && instructions.length > 0) {
          const metadataIx = instructions[0]
          
          const convertedIx = {
            programId: toWeb3JsPublicKey(metadataIx.programId),
            keys: metadataIx.keys.map((key) => ({
              pubkey: toWeb3JsPublicKey(key.pubkey),
              isSigner: Boolean(key.isSigner),
              isWritable: Boolean(key.isWritable),
            })),
            data: Buffer.from(metadataIx.data),
          }

          allInstructions.push(convertedIx)
          console.log("✅ Added metadata instruction")
        }
      } catch (error) {
        console.error("❌ Error creating metadata instruction:", error)
        console.log("⚠️ Continuing without metadata")
      }

      // 🎯 STEP 4: Send the complete transaction
      console.log(`📦 Sending transaction with ${allInstructions.length} instructions (including USDC payment)`)

      const { blockhash } = await this.connection.getLatestBlockhash("confirmed")
      const transaction = new Transaction()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = minter

      // Add all instructions (USDC payment + NFT minting + metadata)
      allInstructions.forEach((instruction) => transaction.add(instruction))

      // Sign with mint keypair
      transaction.partialSign(mintKeypair)

      // Sign with user wallet
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
        lastValidBlockHeight: (await this.connection.getLatestBlockhash()).lastValidBlockHeight,
      })

      console.log(`✅ SUCCESS: NFT #${nftNumber} + 10 USDC payment completed:`, signature)

      return {
        success: true,
        mintAddress: mintPublicKey.toString(),
        signature,
        name: `${NFT_CONFIG.name} `,
        image: NFT_CONFIG.image,
        metadata: {
          name: `${NFT_CONFIG.name} `,
          symbol: NFT_CONFIG.symbol,
          uri: metadataUri,
        },
      }
    } catch (error) {
      console.error(`❌ Error in single NFT mint with payment:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to mint NFT with payment",
      }
    }
  }

  // Create USDC payment instructions (GUARANTEED 10 USDC per call)
  private async createUSDCPaymentInstructions(
    minter: PublicKey,
    amount: number, // Should always be 10 USDC
    referrerWallet?: PublicKey
  ): Promise<any[]> {
    try {
      console.log(`💰 Creating USDC payment instructions for ${amount} USDC`)

      // VALIDATION: Must be exactly 10 USDC
      if (amount !== NFT_CONFIG.pricePerNFT) {
        throw new Error(`Invalid amount: Expected ${NFT_CONFIG.pricePerNFT} USDC, got ${amount} USDC`)
      }

      const usdcAmount = amount * Math.pow(10, NFT_CONFIG.usdcDecimals) // Convert to smallest units

      // Get user's USDC token account
      const userUsdcTokenAccount = await getAssociatedTokenAddress(
        this.usdcMint,
        minter
      )

      const paymentInstructions = []

      // CRITICAL: Ensure user's USDC token account exists and has sufficient balance
      try {
        const userAccount = await getAccount(this.connection, userUsdcTokenAccount)
        console.log("✅ User USDC account exists")

        const userBalance = Number(userAccount.amount)
        console.log(`💰 User USDC balance: ${userBalance} units (${userBalance / Math.pow(10, NFT_CONFIG.usdcDecimals)} USDC)`)

        if (userBalance < usdcAmount) {
          throw new Error(`Insufficient USDC balance. Required: ${amount} USDC, Available: ${userBalance / Math.pow(10, NFT_CONFIG.usdcDecimals)} USDC`)
        }

        console.log("✅ User has sufficient USDC balance")
      } catch (error) {
        if (error instanceof TokenAccountNotFoundError) {
          console.log("⚠️ Creating user USDC token account")
          paymentInstructions.push(
            createAssociatedTokenAccountInstruction(minter, userUsdcTokenAccount, minter, this.usdcMint)
          )
        } else {
          throw error
        }
      }

      console.log(referrerWallet, "referrerWallet1111")
      if (referrerWallet) {
        // Split: 4 USDC to referrer + 6 USDC to treasury = 10 USDC total
        const referrerAmount = NFT_CONFIG.referralReward * Math.pow(10, NFT_CONFIG.usdcDecimals) // 4 USDC
        const treasuryAmount = NFT_CONFIG.treasuryAmount * Math.pow(10, NFT_CONFIG.usdcDecimals) // 6 USDC

        console.log(`💰 Referral split: ${NFT_CONFIG.referralReward} USDC → Referrer, ${NFT_CONFIG.treasuryAmount} USDC → Treasury`)
        console.log(`💰 Amounts in smallest units: ${referrerAmount} → Referrer, ${treasuryAmount} → Treasury`)

        // Get token accounts
        const referrerUsdcAccount = await getAssociatedTokenAddress(this.usdcMint, referrerWallet)
        const treasuryUsdcAccount = await getAssociatedTokenAddress(this.usdcMint, NFT_CONFIG.treasuryWallet)

        console.log(`📍 Account addresses:`)
        console.log(`   User: ${userUsdcTokenAccount.toString()}`)
        console.log(`   Referrer: ${referrerUsdcAccount.toString()}`)
        console.log(`   Treasury: ${treasuryUsdcAccount.toString()}`)

        // Create referrer account if needed
        try {
          await getAccount(this.connection, referrerUsdcAccount)
          console.log("✅ Referrer USDC account exists")
        } catch (error) {
          if (error instanceof TokenAccountNotFoundError) {
            console.log("⚠️ Creating referrer USDC token account")
            paymentInstructions.push(
              createAssociatedTokenAccountInstruction(minter, referrerUsdcAccount, referrerWallet, this.usdcMint)
            )
          } else {
            throw error
          }
        }

        // Create treasury account if needed
        try {
          await getAccount(this.connection, treasuryUsdcAccount)
          console.log("✅ Treasury USDC account exists")
        } catch (error) {
          if (error instanceof TokenAccountNotFoundError) {
            console.log("⚠️ Creating treasury USDC token account")
            paymentInstructions.push(
              createAssociatedTokenAccountInstruction(minter, treasuryUsdcAccount, NFT_CONFIG.treasuryWallet, this.usdcMint)
            )
          } else {
            throw error
          }
        }

        // Transfer to treasury (6 USDC)
        console.log(`💸 Creating treasury transfer: ${treasuryAmount} units (${NFT_CONFIG.treasuryAmount} USDC)`)
        paymentInstructions.push(
          createTransferInstruction(
            userUsdcTokenAccount,    // from: user's USDC account
            treasuryUsdcAccount,     // to: treasury USDC account
            minter,                  // authority: user wallet
            treasuryAmount,          // amount: 6 USDC in smallest units
            [],                      // multisig signers
            TOKEN_PROGRAM_ID         // program ID
          )
        )

        // Transfer to referrer (4 USDC)
        console.log(`💸 Creating referrer transfer: ${referrerAmount} units (${NFT_CONFIG.referralReward} USDC)`)
        paymentInstructions.push(
          createTransferInstruction(
            userUsdcTokenAccount,    // from: user's USDC account
            referrerUsdcAccount,     // to: referrer USDC account
            minter,                  // authority: user wallet
            referrerAmount,          // amount: 4 USDC in smallest units
            [],                      // multisig signers
            TOKEN_PROGRAM_ID         // program ID
          )
        )
      } else {
        // No referrer: Full 10 USDC to treasury
        console.log(`💰 Full payment: ${amount} USDC → Treasury`)
        console.log(`💰 Amount in smallest units: ${usdcAmount} (${amount} USDC)`)

        const treasuryUsdcAccount = await getAssociatedTokenAddress(this.usdcMint, NFT_CONFIG.treasuryWallet)

        console.log(`📍 Account addresses:`)
        console.log(`   User: ${userUsdcTokenAccount.toString()}`)
        console.log(`   Treasury: ${treasuryUsdcAccount.toString()}`)

        // Create treasury account if needed
        try {
          await getAccount(this.connection, treasuryUsdcAccount)
          console.log("✅ Treasury USDC account exists")
        } catch (error) {
          if (error instanceof TokenAccountNotFoundError) {
            console.log("⚠️ Creating treasury USDC token account")
            paymentInstructions.push(
              createAssociatedTokenAccountInstruction(minter, treasuryUsdcAccount, NFT_CONFIG.treasuryWallet, this.usdcMint)
            )
          } else {
            throw error
          }
        }

        // Transfer full amount to treasury
        console.log(`💸 Creating treasury transfer: ${usdcAmount} units (${amount} USDC)`)
        paymentInstructions.push(
          createTransferInstruction(
            userUsdcTokenAccount,    // from: user's USDC account
            treasuryUsdcAccount,     // to: treasury USDC account
            minter,                  // authority: user wallet
            usdcAmount,              // amount: 10 USDC in smallest units
            [],                      // multisig signers
            TOKEN_PROGRAM_ID         // program ID
          )
        )
      }

      console.log(`✅ Created ${paymentInstructions.length} USDC payment instructions for ${amount} USDC`)
      return paymentInstructions
    } catch (error) {
      console.error("❌ Error creating USDC payment instructions:", error)
      throw error
    }
  }

  // Create metadata JSON with GUARANTEED image inclusion
 
  // Get wallet mint count
  async getWalletMintCount(wallet: PublicKey): Promise<number> {
    try {
      return 0 // Placeholder implementation
    } catch (error) {
      console.error("Error getting wallet mint count:", error)
      return 0
    }
  }

  // Get supply info
  async getSupplyInfo(): Promise<{ totalSupply: number; maxSupply: number; available: number }> {
    return await this.collectionService.getSupplyInfo()
  }

  // Get USDC balance for a wallet
  async getUSDCBalance(wallet: PublicKey): Promise<number> {
    try {
      const userUsdcTokenAccount = await getAssociatedTokenAddress(this.usdcMint, wallet)
      const account = await getAccount(this.connection, userUsdcTokenAccount)
      return Number(account.amount) / Math.pow(10, NFT_CONFIG.usdcDecimals)
    } catch (error) {
      console.error("Error getting USDC balance:", error)
      return 0
    }
  }
}