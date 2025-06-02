import { type Connection, PublicKey, Transaction, SystemProgram, Keypair } from "@solana/web3.js"
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
  MPL_TOKEN_METADATA_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata"
import { NFT_MINT_COST_USDC, NFT_METADATA } from "@/config/solana"
import { USDCService } from "./usdc-service"
import { enhancedRPCService } from "@/services/enhanced-rpc-service"

export interface MintResult {
  success: boolean
  signature?: string
  mintAddress?: string
  error?: string
  usdcSignature?: string
}

export interface MintProgress {
  step: "checking" | "payment" | "minting" | "confirming" | "complete"
  message: string
  progress: number
}

export class EnhancedNFTMintingService {
  private connection: Connection
  private usdcService: USDCService
  private mintedWallets: Set<string> = new Set()

  constructor(connection?: Connection) {
    this.connection = connection || enhancedRPCService.getConnection()
    this.usdcService = new USDCService(this.connection)
    this.loadMintedWallets()
  }

  // Load minted wallets from localStorage
  private loadMintedWallets() {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("mintedWallets")
      if (stored) {
        this.mintedWallets = new Set(JSON.parse(stored))
      }
    }
  }

  // Save minted wallets to localStorage
  private saveMintedWallets() {
    if (typeof window !== "undefined") {
      localStorage.setItem("mintedWallets", JSON.stringify(Array.from(this.mintedWallets)))
    }
  }

  // Check if wallet has already minted
  hasAlreadyMinted(walletAddress: PublicKey): boolean {
    return this.mintedWallets.has(walletAddress.toString())
  }

  // Check USDC balance
  async checkUSDCBalance(walletAddress: PublicKey): Promise<number> {
    try {
      return await this.usdcService.getUSDCBalance(walletAddress)
    } catch (error) {
      console.error("Error checking USDC balance:", error)
      return 0
    }
  }

  // Create metadata URI
  private createMetadataUri(): string {
    // In production, you would upload this to IPFS or Arweave
    // For now, we'll use the IPFS URL directly
    return JSON.stringify(NFT_METADATA)
  }

  // Create NFT mint transaction with metadata
  async createNFTMintTransaction(walletAddress: PublicKey): Promise<{
    transaction: Transaction
    mintKeypair: Keypair
  }> {
    const mintKeypair = Keypair.generate()
    const transaction = new Transaction()

    try {
      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.lastValidBlockHeight = lastValidBlockHeight
      transaction.feePayer = walletAddress

      // Calculate rent for mint account
      const mintRent = await getMinimumBalanceForRentExemptMint(this.connection)

      // Create mint account
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: walletAddress,
          newAccountPubkey: mintKeypair.publicKey,
          space: 82,
          lamports: mintRent,
          programId: TOKEN_PROGRAM_ID,
        }),
      )

      // Initialize mint
      transaction.add(
        createInitializeMintInstruction(
          mintKeypair.publicKey,
          0, // 0 decimals for NFT
          walletAddress, // mint authority
          walletAddress, // freeze authority
          TOKEN_PROGRAM_ID,
        ),
      )

      // Get associated token account for the user
      const userTokenAccount = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        walletAddress,
        false,
        TOKEN_PROGRAM_ID,
      )

      // Create associated token account
      transaction.add(
        createAssociatedTokenAccountInstruction(
          walletAddress,
          userTokenAccount,
          walletAddress,
          mintKeypair.publicKey,
          TOKEN_PROGRAM_ID,
        ),
      )

      // Mint 1 token to user's account
      transaction.add(
        createMintToInstruction(
          mintKeypair.publicKey,
          userTokenAccount,
          walletAddress,
          1, // amount
          [],
          TOKEN_PROGRAM_ID,
        ),
      )

      // Create metadata account
      const metadataAccount = PublicKey.findProgramAddressSync(
        [Buffer.from("metadata"), MPL_TOKEN_METADATA_PROGRAM_ID.toBuffer(), mintKeypair.publicKey.toBuffer()],
        MPL_TOKEN_METADATA_PROGRAM_ID,
      )[0]

      transaction.add(
        createCreateMetadataAccountV3Instruction(
          {
            metadata: metadataAccount,
            mint: mintKeypair.publicKey,
            mintAuthority: walletAddress,
            payer: walletAddress,
            updateAuthority: walletAddress,
          },
          {
            createMetadataAccountArgsV3: {
              data: {
                name: NFT_METADATA.name,
                symbol: NFT_METADATA.symbol,
                uri: this.createMetadataUri(),
                sellerFeeBasisPoints: 0,
                creators: [
                  {
                    address: walletAddress,
                    verified: true,
                    share: 100,
                  },
                ],
                collection: null,
                uses: null,
              },
              isMutable: true,
              collectionDetails: null,
            },
          },
        ),
      )

      return { transaction, mintKeypair }
    } catch (error) {
      console.error("Error creating NFT mint transaction:", error)
      throw error
    }
  }

  // Complete minting process with progress tracking
  async mintNFT(
    walletAddress: PublicKey,
    signTransaction: (transaction: Transaction) => Promise<Transaction>,
    onProgress?: (progress: MintProgress) => void,
  ): Promise<MintResult> {
    try {
      // Step 1: Initial checks
      onProgress?.({
        step: "checking",
        message: "Checking wallet eligibility...",
        progress: 10,
      })

      // Check if wallet has already minted
      if (this.hasAlreadyMinted(walletAddress)) {
        return {
          success: false,
          error: "This wallet has already minted an NFT. Only one NFT per wallet is allowed.",
        }
      }

      // Check USDC balance
      const usdcBalance = await this.checkUSDCBalance(walletAddress)
      if (usdcBalance < NFT_MINT_COST_USDC) {
        return {
          success: false,
          error: `Insufficient USDC balance. You need ${NFT_MINT_COST_USDC} USDC to mint an NFT.`,
        }
      }

      // Step 2: Process payment
      onProgress?.({
        step: "payment",
        message: "Processing USDC payment...",
        progress: 30,
      })

      // Create USDC transfer transaction
      const usdcTransaction = await this.usdcService.createPlatformUSDCTransfer(walletAddress, NFT_MINT_COST_USDC)

      // Sign USDC transfer transaction
      const signedUsdcTransaction = await signTransaction(usdcTransaction)

      // Send USDC transfer transaction
      const usdcSignature = await this.connection.sendRawTransaction(signedUsdcTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      })

      // Confirm USDC transfer
      await this.connection.confirmTransaction({
        signature: usdcSignature,
        blockhash: usdcTransaction.recentBlockhash!,
        lastValidBlockHeight: usdcTransaction.lastValidBlockHeight!,
      })

      // Step 3: Mint NFT
      onProgress?.({
        step: "minting",
        message: "Minting your NFT...",
        progress: 60,
      })

      // Create NFT mint transaction
      const { transaction: nftTransaction, mintKeypair } = await this.createNFTMintTransaction(walletAddress)

      // Sign NFT transaction
      const signedNftTransaction = await signTransaction(nftTransaction)

      // Add mint keypair signature
      signedNftTransaction.partialSign(mintKeypair)

      // Send NFT transaction
      const nftSignature = await this.connection.sendRawTransaction(signedNftTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      })

      // Step 4: Confirm transaction
      onProgress?.({
        step: "confirming",
        message: "Confirming transaction...",
        progress: 80,
      })

      // Confirm NFT transaction
      await this.connection.confirmTransaction({
        signature: nftSignature,
        blockhash: nftTransaction.recentBlockhash!,
        lastValidBlockHeight: nftTransaction.lastValidBlockHeight!,
      })

      // Step 5: Complete
      onProgress?.({
        step: "complete",
        message: "NFT minted successfully!",
        progress: 100,
      })

      // Mark wallet as having minted
      this.mintedWallets.add(walletAddress.toString())
      this.saveMintedWallets()

      // Grant referral access
      this.grantReferralAccess(walletAddress)

      return {
        success: true,
        signature: nftSignature,
        mintAddress: mintKeypair.publicKey.toString(),
        usdcSignature,
      }
    } catch (error: any) {
      console.error("Minting error:", error)
      return {
        success: false,
        error: error.message || "Failed to mint NFT. Please try again.",
      }
    }
  }

  // Grant referral access
  private grantReferralAccess(walletAddress: PublicKey) {
    if (typeof window !== "undefined") {
      localStorage.setItem(`referral_access_${walletAddress.toString()}`, "true")
    }
  }

  // Check if user has referral access
  hasReferralAccess(walletAddress: PublicKey): boolean {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`referral_access_${walletAddress.toString()}`) === "true"
    }
    return false
  }
}
