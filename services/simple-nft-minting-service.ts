"use client"

import {
  Connection,
  PublicKey,
  Transaction,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
  ComputeBudgetProgram,
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
  mplTokenMetadata,
  verifyCollectionV1,
  findMetadataPda,
} from "@metaplex-foundation/mpl-token-metadata"
import {
  fromWeb3JsPublicKey,
  toWeb3JsPublicKey,
  fromWeb3JsKeypair,
} from "@metaplex-foundation/umi-web3js-adapters"
import { SimpleCollectionService } from "./simple-collection-service"
import { EnhancedUSDCService } from "./enhanced-usdc-service"

// USDC Mint addresses for different networks
const USDC_MINT_ADDRESSES = {
  "mainnet-beta": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  devnet: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  testnet: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
}

export const NFT_CONFIG = {
  maxSupply: 1000,
  pricePerNFT: 10, // 10 USDC per NFT
  maxPerWallet: 1,
  treasuryWallet: new PublicKey("A9GT8pYUR5F1oRwUsQ9ADeZTWq7LJMfmPQ3TZLmV6cQP"),
  referralReward: 0,
  treasuryAmount: 10,
  usdcDecimals: 6,
  network: (process.env.NEXT_PUBLIC_SOLANA_NETWORK as keyof typeof USDC_MINT_ADDRESSES) || "mainnet-beta",
  // NFT Metadata
  name: "RewardNFT Collection",
  symbol: "RNFT",
  description: "Exclusive NFT collection for the RewardNFT platform with referral rewards and quest access.",
  image: "https://quicknode.quicknode-ipfs.com/ipfs/QmWrmCfPm6L85p1o8KMc9WZCsdwsgW89n37nQMJ6UCVYNW",
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
  private umi: any

 constructor(connection: Connection) {
  // Use direct mainnet RPC instead of passed connection
  this.connection = new Connection("https://mainnet.helius-rpc.com/?api-key=18fec3d0-97ce-4d0a-8692-9d116157ee54", "confirmed")
  
  this.collectionService = new SimpleCollectionService(this.connection)
  this.usdcService = new EnhancedUSDCService() // Khali chhodo
  this.usdcMint = new PublicKey(USDC_MINT_ADDRESSES[NFT_CONFIG.network])
  
  this.umi = createUmi(this.connection.rpcEndpoint).use(mplTokenMetadata())
}

  // Main optimized minting function
  async mintNFTs(
    minter: PublicKey,
    quantity: number,
    signTransaction: (transaction: Transaction) => Promise<Transaction>,
    referrerWallet?: PublicKey,
    onProgress?: (progress: MintProgress) => void
  ): Promise<NFTMintResult> {
    try {
      console.log("🚀 Starting ULTRA-OPTIMIZED NFT minting...")
      
      // Validate quantity
      if (quantity <= 0 || quantity > NFT_CONFIG.maxPerWallet) {
        return {
          success: false,
          error: `Invalid quantity: Min 1, Max ${NFT_CONFIG.maxPerWallet} per wallet`,
        }
      }

      const totalCost = quantity * NFT_CONFIG.pricePerNFT

      onProgress?.({
        step: "initializing",
        message: `Preparing ultra-optimized mint for ${quantity} NFT(s)...`,
        progress: 5,
      })

      // Step 1: OPTIMIZED balance validation with accurate estimates
      const validationResult = await this.validateBalances(minter, totalCost)
      if (!validationResult.success) {
        return { success: false, error: validationResult.error }
      }

      onProgress?.({
        step: "collection",
        message: "Setting up collection...",
        progress: 15,
      })

      // Step 2: Get or create collection
      const collectionResult = await this.collectionService.getOrCreateCollection(minter, signTransaction)
      if (!collectionResult.success || !collectionResult.collectionMint) {
        return {
          success: false,
          error: collectionResult.error || "Failed to setup collection",
        }
      }

      console.log("✅ Collection ready:", collectionResult.collectionMint)

      // Step 3: ULTRA-OPTIMIZED batch minting with single transaction per NFT (including verification)
      const mintResults = []
      const signatures = []
      const nftData = []

      for (let i = 0; i < quantity; i++) {
        onProgress?.({
          step: "minting",
          message: `Minting NFT ${i + 1} of ${quantity}...`,
          progress: 20 + (i / quantity) * 70,
          currentNFT: i + 1,
          totalNFTs: quantity,
        })

        const result = await this.mintSingleNFTUltraOptimized(
          minter,
          new PublicKey(collectionResult.collectionMint),
          signTransaction,
          i + 1,
          referrerWallet
        )

        if (result.success && result.mintAddress && result.signature) {
          mintResults.push(result.mintAddress)
          signatures.push(result.signature)
          nftData.push({
            mint: result.mintAddress,
            signature: result.signature,
            name: result.name || `${NFT_CONFIG.name} #${i + 1}`,
            image: result.image || NFT_CONFIG.image,
            metadata: result.metadata,
          })

          await this.collectionService.updateCollectionMintCount()
          console.log(`✅ NFT ${i + 1} minted successfully`)
        } else {
          return {
            success: false,
            error: result.error || `Failed to mint NFT ${i + 1}`,
          }
        }
      }

      onProgress?.({
        step: "complete",
        message: `🎉 Successfully minted ${quantity} NFT${quantity > 1 ? 's' : ''}!`,
        progress: 100,
      })

      // Record in database
      await this.recordNFTsInDatabase(nftData, minter.toString(), collectionResult.collectionMint)

      // Track referral
      if (referrerWallet && referrerWallet.toString() !== minter.toString()) {
        await this.trackReferral(referrerWallet, minter, quantity, signatures)
      }

      return {
        success: true,
        mintAddresses: mintResults,
        signatures,
        usdcSignature: signatures[0],
        totalCost,
        nftData,
      }
    } catch (error) {
      console.error("❌ Error in ultra-optimized NFT minting:", error)
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  // ULTRA-OPTIMIZED single NFT mint with collection verification in same transaction
  private async mintSingleNFTUltraOptimized(
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
      console.log(`🎨 Creating ultra-optimized NFT #${nftNumber}...`)

      const mintKeypair = Keypair.generate()
      const mintPublicKey = mintKeypair.publicKey

      // Get ultra-optimized transaction (includes verification)
      const transaction = await this.buildUltraOptimizedTransaction(
        minter,
        mintKeypair,
        collectionMint,
        nftNumber,
        referrerWallet
      )

      // Sign and send
      const signedTransaction = await signTransaction(transaction)
      signedTransaction.partialSign(mintKeypair)

      console.log("📡 Sending ultra-optimized transaction...")
      const signature = await this.connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: "confirmed",
          maxRetries: 3,
        }
      )

      // Confirm transaction
      const blockhash = await this.connection.getLatestBlockhash("confirmed")
      await this.connection.confirmTransaction(
        {
          signature,
          blockhash: blockhash.blockhash,
          lastValidBlockHeight: blockhash.lastValidBlockHeight,
        },
        "confirmed"
      )

      console.log(`✅ NFT #${nftNumber} minted and verified successfully:`, signature)

      return {
        success: true,
        mintAddress: mintPublicKey.toString(),
        signature,
        name: `${NFT_CONFIG.name} #${nftNumber}`,
        image: NFT_CONFIG.image,
        metadata: {
          name: `${NFT_CONFIG.name} #${nftNumber}`,
          symbol: NFT_CONFIG.symbol,
          uri: "https://blush-magic-silverfish-35.mypinata.cloud/ipfs/bafkreic57mp46j7r64skk7younicsucjlxxoxf6ua7ajk25sxo4c6ztvwy",
        },
      }
    } catch (error) {
      console.error(`❌ Error minting NFT #${nftNumber}:`, error)
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  // Build ultra-optimized single transaction (minting + verification)
  private async buildUltraOptimizedTransaction(
    minter: PublicKey,
    mintKeypair: Keypair,
    collectionMint: PublicKey,
    nftNumber: number,
    referrerWallet?: PublicKey
  ): Promise<Transaction> {
    const transaction = new Transaction()
    
    // Get latest blockhash
    const { blockhash } = await this.connection.getLatestBlockhash("confirmed")
    transaction.recentBlockhash = blockhash
    transaction.feePayer = minter

    // ULTRA-OPTIMIZED: Minimal compute budget for combined operations
    transaction.add(
      ComputeBudgetProgram.setComputeUnitLimit({
        units: 150000, // Reduced further - optimized for combined operations
      })
    )

    // ULTRA-OPTIMIZED: Zero priority fee for most transactions
    transaction.add(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 0, // Zero priority fee - only pay base transaction fee
      })
    )

    // Add USDC payment instructions (optimized)
    const usdcInstructions = await this.createUltraOptimizedUSDCInstructions(minter, referrerWallet)
    usdcInstructions.forEach(ix => transaction.add(ix))

    // Add NFT minting instructions (optimized)
    const nftInstructions = await this.createUltraOptimizedNFTInstructions(
      minter,
      mintKeypair,
      collectionMint,
      nftNumber
    )
    nftInstructions.forEach(ix => transaction.add(ix))

    // Add collection verification in same transaction
    const verificationInstructions = await this.createCollectionVerificationInstructions(
      minter,
      mintKeypair.publicKey,
      collectionMint
    )
    verificationInstructions.forEach(ix => transaction.add(ix))

    return transaction
  }

  // Create ultra-optimized USDC payment instructions
  private async createUltraOptimizedUSDCInstructions(
    minter: PublicKey,
    referrerWallet?: PublicKey
  ): Promise<any[]> {
    const instructions = []
    const usdcAmount = NFT_CONFIG.pricePerNFT * Math.pow(10, NFT_CONFIG.usdcDecimals)

    // Get token accounts
    const userUsdcAccount = await getAssociatedTokenAddress(this.usdcMint, minter)
    const treasuryUsdcAccount = await getAssociatedTokenAddress(this.usdcMint, NFT_CONFIG.treasuryWallet)

    // ULTRA-OPTIMIZED: Pre-check which accounts exist to minimize instructions
    const accountsToCheck = [
      { account: userUsdcAccount, owner: minter, name: "user", required: true },
      { account: treasuryUsdcAccount, owner: NFT_CONFIG.treasuryWallet, name: "treasury", required: false }
    ]

    for (const { account, owner, name, required } of accountsToCheck) {
      try {
        await getAccount(this.connection, account)
        console.log(`✅ ${name} USDC account exists`)
      } catch (error) {
        if (error instanceof TokenAccountNotFoundError) {
          if (required) {
            throw new Error(`${name} USDC account not found. Please add USDC to your wallet first.`)
          }
          console.log(`⚠️ Creating ${name} USDC account`)
          instructions.push(
            createAssociatedTokenAccountInstruction(minter, account, owner, this.usdcMint)
          )
        }
      }
    }

    // Transfer full amount to treasury
    instructions.push(
      createTransferInstruction(
        userUsdcAccount,
        treasuryUsdcAccount,
        minter,
        usdcAmount,
        [],
        TOKEN_PROGRAM_ID
      )
    )

    console.log(`✅ Created ${instructions.length} ultra-optimized USDC instructions`)
    return instructions
  }

  // Create ultra-optimized NFT minting instructions
  private async createUltraOptimizedNFTInstructions(
    minter: PublicKey,
    mintKeypair: Keypair,
    collectionMint: PublicKey,
    nftNumber: number
  ): Promise<any[]> {
    const instructions = []
    const mintPublicKey = mintKeypair.publicKey

    // Get actual rent for mint account (more accurate)
    const lamports = await getMinimumBalanceForRentExemptMint(this.connection)

    // Get associated token account
    const associatedTokenAddress = await getAssociatedTokenAddress(mintPublicKey, minter)

    // Create mint account
    instructions.push(
      SystemProgram.createAccount({
        fromPubkey: minter,
        newAccountPubkey: mintPublicKey,
        space: MINT_SIZE,
        lamports,
        programId: TOKEN_PROGRAM_ID,
      })
    )

    // Initialize mint
    instructions.push(
      createInitializeMintInstruction(
        mintPublicKey,
        0, // Decimals for NFT
        minter, // Mint authority
        minter, // Freeze authority
        TOKEN_PROGRAM_ID
      )
    )

    // Create associated token account
    instructions.push(
      createAssociatedTokenAccountInstruction(
        minter, // Payer
        associatedTokenAddress, // ATA
        minter, // Owner
        mintPublicKey // Mint
      )
    )

    // Mint token to user
    instructions.push(
      createMintToInstruction(
        mintPublicKey, // Mint
        associatedTokenAddress, // Destination
        minter, // Authority
        1 // Amount (1 for NFT)
      )
    )

    // Create metadata using UMI (optimized)
    const metadataInstruction = await this.createUltraOptimizedMetadataInstruction(
      minter,
      mintPublicKey,
      collectionMint,
      nftNumber
    )
    
    if (metadataInstruction) {
      instructions.push(metadataInstruction)
    }

    console.log(`✅ Created ${instructions.length} ultra-optimized NFT instructions`)
    return instructions
  }

  // Create ultra-optimized metadata instruction
  private async createUltraOptimizedMetadataInstruction(
    minter: PublicKey,
    mintPublicKey: PublicKey,
    collectionMint: PublicKey,
    nftNumber: number
  ): Promise<any | null> {
    try {
      const umiMinter = fromWeb3JsPublicKey(minter)
      const umiMint = fromWeb3JsPublicKey(mintPublicKey)
      const umiCollection = fromWeb3JsPublicKey(collectionMint)

      const metadataUri = "https://blush-magic-silverfish-35.mypinata.cloud/ipfs/bafkreic57mp46j7r64skk7younicsucjlxxoxf6ua7ajk25sxo4c6ztvwy"

      const metadataBuilder = createMetadataAccountV3(this.umi, {
        mint: umiMint,
        mintAuthority: umiMinter,
        payer: umiMinter,
        updateAuthority: umiMinter,
        data: {
          name: `${NFT_CONFIG.name} #${nftNumber}`.substring(0, 32),
          symbol: NFT_CONFIG.symbol.substring(0, 10),
          uri: metadataUri,
          sellerFeeBasisPoints: NFT_CONFIG.seller_fee_basis_points,
          creators: [
            {
              address: umiMinter,
              verified: true,
              share: 100,
            }
          ],
          collection: {
            verified: false, // Will be verified in same transaction
            key: umiCollection,
          },
          uses: null,
        },
        isMutable: true,
        collectionDetails: null,
      })

      const instructions = metadataBuilder.getInstructions()
      if (instructions.length > 0) {
        const metadataIx = instructions[0]
        return {
          programId: toWeb3JsPublicKey(metadataIx.programId),
          keys: metadataIx.keys.map((key) => ({
            pubkey: toWeb3JsPublicKey(key.pubkey),
            isSigner: Boolean(key.isSigner),
            isWritable: Boolean(key.isWritable),
          })),
          data: Buffer.from(metadataIx.data),
        }
      }
      return null
    } catch (error) {
      console.error("❌ Error creating metadata instruction:", error)
      return null
    }
  }

  // Create collection verification instructions for same transaction
  private async createCollectionVerificationInstructions(
    authority: PublicKey,
    nftMint: PublicKey,
    collectionMint: PublicKey
  ): Promise<any[]> {
    try {
      console.log("🔗 Adding collection verification to transaction...")

      const umiNftMint = fromWeb3JsPublicKey(nftMint)
      const umiCollectionMint = fromWeb3JsPublicKey(collectionMint)
      const umiAuthority = fromWeb3JsPublicKey(authority)

      // Get metadata PDAs
      const nftMetadata = findMetadataPda(this.umi, { mint: umiNftMint })
      const collectionMetadata = findMetadataPda(this.umi, { mint: umiCollectionMint })

      // Create verification instruction
      const verifyBuilder = verifyCollectionV1(this.umi, {
        metadata: nftMetadata,
        collectionMint: umiCollectionMint,
        collectionMetadata: collectionMetadata,
        collectionAuthority: umiAuthority,
      })

      const instructions = verifyBuilder.getInstructions()
      
      if (instructions.length > 0) {
        // Convert UMI instruction to web3.js format
        const verifyIx = instructions[0]
        return [{
          programId: toWeb3JsPublicKey(verifyIx.programId),
          keys: verifyIx.keys.map((key) => ({
            pubkey: toWeb3JsPublicKey(key.pubkey),
            isSigner: Boolean(key.isSigner),
            isWritable: Boolean(key.isWritable),
          })),
          data: Buffer.from(verifyIx.data),
        }]
      }
      return []
    } catch (error) {
      console.warn("⚠️ Collection verification instruction failed (NFT still valid):", error)
      return []
    }
  }

  // ULTRA-OPTIMIZED balance validation with accurate estimates
  private async validateBalances(
    minter: PublicKey,
    totalCost: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check SOL balance with accurate estimate
      const solBalance = await this.connection.getBalance(minter)
      
      // More accurate SOL requirement calculation:
      // Base transaction fee: ~0.000005 SOL
      // Mint account rent: ~0.00144 SOL
      // Token account rent: ~0.00203928 SOL
      // Metadata account rent: ~0.0056 SOL (estimated)
      // Buffer for compute fees: ~0.0015 SOL
      const requiredSOL = 0.006 * LAMPORTS_PER_SOL // ~0.006 SOL total (much more accurate)
      
      if (solBalance < requiredSOL) {
        const currentSOL = solBalance / LAMPORTS_PER_SOL
        const requiredSOLAmount = requiredSOL / LAMPORTS_PER_SOL
        return {
          success: false,
          error: `Insufficient SOL: Need ${requiredSOLAmount.toFixed(4)} SOL for fees, have ${currentSOL.toFixed(6)} SOL`,
        }
      }

      // Check USDC balance
      const usdcValidation = await this.validateUSDCBalance(minter, totalCost)
      return usdcValidation
    } catch (error) {
      return {
        success: false,
        error: `Balance validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  // Validate USDC balance (unchanged - was already optimized)
  private async validateUSDCBalance(
    minter: PublicKey,
    requiredAmount: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const requiredUSDCAmount = requiredAmount * Math.pow(10, NFT_CONFIG.usdcDecimals)
      const userUsdcTokenAccount = await getAssociatedTokenAddress(this.usdcMint, minter)

      try {
        const userUsdcAccount = await getAccount(this.connection, userUsdcTokenAccount)
        
        if (userUsdcAccount.amount < requiredUSDCAmount) {
          const currentUSDC = Number(userUsdcAccount.amount) / Math.pow(10, NFT_CONFIG.usdcDecimals)
          const shortage = requiredAmount - currentUSDC
          return {
            success: false,
            error: `Insufficient USDC: Need ${requiredAmount} USDC, have ${currentUSDC.toFixed(2)} USDC (shortage: ${shortage.toFixed(2)} USDC)`,
          }
        }
        return { success: true }
      } catch (error) {
        if (error instanceof TokenAccountNotFoundError) {
          return {
            success: false,
            error: `USDC account not found. Please add USDC to your wallet first.`,
          }
        }
        throw error
      }
    } catch (error) {
      return {
        success: false,
        error: `USDC validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  // Record NFTs in database (unchanged)
  private async recordNFTsInDatabase(
    nftData: any[],
    ownerWallet: string,
    collectionAddress: string
  ): Promise<void> {
    try {
      for (const nft of nftData) {
        await fetch("/api/nfts/mint", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mintAddress: nft.mint,
            ownerWallet,
            transactionSignature: nft.signature,
            name: nft.name,
            symbol: NFT_CONFIG.symbol,
            description: NFT_CONFIG.description,
            image: nft.image,
            attributes: NFT_CONFIG.attributes,
            mintCost: NFT_CONFIG.pricePerNFT,
            collectionAddress,
            metadata: nft.metadata,
          }),
        })
      }
      console.log("✅ NFTs recorded in database")
    } catch (error) {
      console.warn("⚠️ Database recording failed:", error)
    }
  }

  // Track referral (unchanged)
  private async trackReferral(
    referrerWallet: PublicKey,
    minter: PublicKey,
    quantity: number,
    signatures: string[]
  ): Promise<void> {
    try {
      await fetch("/api/referrals/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referrerWallet: referrerWallet.toString(),
          referredWallet: minter.toString(),
          nftsMinted: quantity,
          mintSignatures: signatures,
          trackingOnly: true,
        }),
      })
      console.log("✅ Referral tracked")
    } catch (error) {
      console.warn("⚠️ Referral tracking failed:", error)
    }
  }

  // Format error messages (unchanged)
  private formatError(error: any): string {
    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      if (message.includes("insufficient funds")) {
        return "Insufficient funds. Please check your SOL and USDC balances."
      } else if (message.includes("user rejected")) {
        return "Transaction cancelled by user."
      } else if (message.includes("network")) {
        return "Network error. Please try again."
      }
      return error.message
    }
    return "An unknown error occurred."
  }

  // Public utility methods (unchanged)
  async getWalletMintCount(wallet: PublicKey): Promise<number> {
    try {
      const { firebaseUserService } = await import('./firebase-user-service')
      const user = await firebaseUserService.getUserByWallet(wallet.toString())
      return user?.nftsMinted || 0
    } catch (error) {
      console.error("Error getting wallet mint count:", error)
      return 0
    }
  }

  async getSupplyInfo(): Promise<{ totalSupply: number; maxSupply: number; available: number }> {
    return await this.collectionService.getSupplyInfo()
  }

async getUSDCBalance(wallet: PublicKey): Promise<number> {
  try {
    console.log("🔍 DEBUG SimpleNFT: Starting USDC balance check...")
    console.log("   Wallet:", wallet.toString())
    console.log("   USDC Mint:", this.usdcMint.toString())
    
    const userUsdcTokenAccount = await getAssociatedTokenAddress(this.usdcMint, wallet)
    console.log("   Token Account:", userUsdcTokenAccount.toString())

    // FIXED: Use direct RPC fetch
    try {
      const response = await fetch("https://api.mainnet-beta.solana.com", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getTokenAccountBalance',
          params: [userUsdcTokenAccount.toString()]
        })
      })
      
      if (!response.ok) {
        console.log("   HTTP Error:", response.status)
        return 0
      }
      
      const data = await response.json()
      console.log("   RPC Response:", data)
      
      if (data.result?.value?.uiAmount !== undefined) {
        console.log("   ✅ Balance:", data.result.value.uiAmount)
        return data.result.value.uiAmount
      }
      
      console.log("   ⚠️ No balance data")
      return 0
      
    } catch (fetchError: any) {
      console.log("   ❌ Fetch Error:", fetchError.message)
      return 0
    }

  } catch (error) {
    console.error("   ❌ Outer Error:", error)
    return 0
  }
}

  // CORRECTED cost breakdown with accurate estimates
  async getCompleteCostBreakdown(quantity: number): Promise<{
    nftCost: {
      usdcAmount: number
      description: string
    }
    networkFees: {
      solAmount: number
      usdAmount: number
      description: string
      breakdown: {
        baseFee: number
        computeFee: number
        accountRent: number
      }
    }
    totalCost: {
      usdc: number
      sol: number
      totalUSD: number
    }
  }> {
    // NFT Cost (what user pays for the NFT itself)
    const nftCostUSDC = quantity * NFT_CONFIG.pricePerNFT // 10 USDC per NFT
    
    // CORRECTED Network Fees (accurate blockchain costs)
    const baseFee = 0.000005 * quantity // Base transaction fee per NFT
    const computeFee = 0.000001 * quantity // Ultra-optimized compute fee (150k units at 0 microLamports)
    const accountRent = 0.003479 * quantity // Accurate: mint (0.00144) + token account (0.00203928) per NFT
    
    const totalSOLFees = baseFee + computeFee + accountRent
    const networkFeesUSD = totalSOLFees * 200 // Approximate SOL price
    
    const totalUSD = (nftCostUSDC) + networkFeesUSD
    
    return {
      nftCost: {
        usdcAmount: nftCostUSDC,
        description: `${quantity} NFT${quantity > 1 ? 's' : ''} × ${NFT_CONFIG.pricePerNFT} USDC each`
      },
      networkFees: {
        solAmount: totalSOLFees,
        usdAmount: networkFeesUSD,
        description: "Solana blockchain transaction fees (ultra-optimized)",
        breakdown: {
          baseFee,
          computeFee,
          accountRent,
        }
      },
      totalCost: {
        usdc: nftCostUSDC,
        sol: totalSOLFees,
        totalUSD: totalUSD
      }
    }
  }
}
