import { type Connection, type PublicKey, Transaction, SystemProgram, Keypair } from "@solana/web3.js"
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createMintToInstruction,
  getMinimumBalanceForRentExemptMint,
} from "@solana/spl-token"
import { NFT_MINT_COST_USDC } from "@/config/solana"
import { USDCService } from "./usdc-service"
import { enhancedRPCService } from "@/services/enhanced-rpc-service"

export interface MintResult {
  success: boolean
  signature?: string
  mintAddress?: string
  error?: string
}

export class NFTMintingService {
  private connection: Connection
  private usdcService: USDCService
  private mintedWallets: Set<string> = new Set()

  constructor(connection?: Connection) {
    // Use provided connection or get from RPC service
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

  // Create USDC transfer transaction
  async createUSDCTransferTransaction(fromWallet: PublicKey, amount: number): Promise<Transaction> {
    return await this.usdcService.createPlatformUSDCTransfer(fromWallet, amount)
  }

  // Simplified NFT mint transaction (without metadata for now)
  async createSimpleNFTMintTransaction(walletAddress: PublicKey): Promise<{
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

      return { transaction, mintKeypair }
    } catch (error) {
      console.error("Error creating NFT mint transaction:", error)
      throw error
    }
  }

  // Complete minting process
  async mintNFT(
    walletAddress: PublicKey,
    signTransaction: (transaction: Transaction) => Promise<Transaction>,
  ): Promise<MintResult> {
    try {
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

      // Create USDC transfer transaction
      const usdcTransaction = await this.createUSDCTransferTransaction(walletAddress, NFT_MINT_COST_USDC)

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

      // Create simple NFT mint transaction (without metadata to avoid import issues)
      const { transaction: nftTransaction, mintKeypair } = await this.createSimpleNFTMintTransaction(walletAddress)

      // Sign NFT transaction
      const signedNftTransaction = await signTransaction(nftTransaction)

      // Add mint keypair signature
      signedNftTransaction.partialSign(mintKeypair)

      // Send NFT transaction
      const nftSignature = await this.connection.sendRawTransaction(signedNftTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      })

      // Confirm NFT transaction
      await this.connection.confirmTransaction({
        signature: nftSignature,
        blockhash: nftTransaction.recentBlockhash!,
        lastValidBlockHeight: nftTransaction.lastValidBlockHeight!,
      })

      // Mark wallet as having minted
      this.mintedWallets.add(walletAddress.toString())
      this.saveMintedWallets()

      return {
        success: true,
        signature: nftSignature,
        mintAddress: mintKeypair.publicKey.toString(),
      }
    } catch (error: any) {
      console.error("Minting error:", error)
      return {
        success: false,
        error: error.message || "Failed to mint NFT. Please try again.",
      }
    }
  }
}
