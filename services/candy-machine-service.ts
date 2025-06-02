import { type Connection, type PublicKey, Transaction, Keypair, SystemProgram } from "@solana/web3.js"
import {
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  createTransferInstruction,
  getMinimumBalanceForRentExemptMint,
  getAssociatedTokenAddress,
} from "@solana/spl-token"
import { enhancedRPCService } from "./enhanced-rpc-service"
import { COMPANY_WALLET, USDC_MINT_ADDRESS, CANDY_MACHINE_CONFIG } from "@/config/candy-machine"

export interface CandyMachineResult {
  success: boolean
  candyMachine?: string
  signature?: string
  error?: string
}

export interface MintResult {
  success: boolean
  nftMint?: string
  signature?: string
  error?: string
}

export class CandyMachineService {
  private connection: Connection

  constructor(connection?: Connection) {
    this.connection = connection || enhancedRPCService.getConnection()
  }

  // Create candy machine (simplified as program account)
  async createCandyMachine(
    authority: PublicKey,
    collectionMint: PublicKey,
    signTransaction: (transaction: Transaction) => Promise<Transaction>,
  ): Promise<CandyMachineResult> {
    try {
      const candyMachineKeypair = Keypair.generate()
      const transaction = new Transaction()

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.lastValidBlockHeight = lastValidBlockHeight
      transaction.feePayer = authority

      // Create candy machine account (simplified as data account)
      const candyMachineSpace = 1024 // 1KB for configuration
      const candyMachineRent = await this.connection.getMinimumBalanceForRentExemption(candyMachineSpace)

      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: authority,
          newAccountPubkey: candyMachineKeypair.publicKey,
          space: candyMachineSpace,
          lamports: candyMachineRent,
          programId: SystemProgram.programId, // Using system program for simplicity
        }),
      )

      // Sign transaction
      const signedTransaction = await signTransaction(transaction)
      signedTransaction.partialSign(candyMachineKeypair)

      // Send transaction
      const signature = await this.connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      })

      // Confirm transaction
      await this.connection.confirmTransaction({
        signature,
        blockhash: transaction.recentBlockhash!,
        lastValidBlockHeight: transaction.lastValidBlockHeight!,
      })

      console.log("Candy Machine created:", {
        candyMachine: candyMachineKeypair.publicKey.toString(),
        signature,
        explorer: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
      })

      return {
        success: true,
        candyMachine: candyMachineKeypair.publicKey.toString(),
        signature,
      }
    } catch (error: any) {
      console.error("Candy Machine creation error:", error)
      return {
        success: false,
        error: error.message || "Failed to create Candy Machine",
      }
    }
  }

  // Mint NFT from candy machine
  async mintFromCandyMachine(
    candyMachine: PublicKey,
    minter: PublicKey,
    signTransaction: (transaction: Transaction) => Promise<Transaction>,
  ): Promise<MintResult> {
    try {
      const nftMint = Keypair.generate()
      const transaction = new Transaction()

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.lastValidBlockHeight = lastValidBlockHeight
      transaction.feePayer = minter

      // 1. Transfer USDC to company wallet
      const minterUSDCAccount = await getAssociatedTokenAddress(USDC_MINT_ADDRESS, minter)
      const companyUSDCAccount = await getAssociatedTokenAddress(USDC_MINT_ADDRESS, COMPANY_WALLET)

      // Convert 10 USDC to smallest unit (6 decimals)
      const usdcAmount = CANDY_MACHINE_CONFIG.price * 1_000_000

      transaction.add(
        createTransferInstruction(minterUSDCAccount, companyUSDCAccount, minter, usdcAmount, [], TOKEN_PROGRAM_ID),
      )

      // 2. Create NFT mint account
      const mintRent = await getMinimumBalanceForRentExemptMint(this.connection)

      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: minter,
          newAccountPubkey: nftMint.publicKey,
          space: 82,
          lamports: mintRent,
          programId: TOKEN_PROGRAM_ID,
        }),
      )

      // 3. Initialize NFT mint
      transaction.add(createInitializeMintInstruction(nftMint.publicKey, 0, minter, minter, TOKEN_PROGRAM_ID))

      // 4. Create associated token account for minter
      const minterTokenAccount = await getAssociatedTokenAddress(nftMint.publicKey, minter)

      transaction.add(
        createAssociatedTokenAccountInstruction(
          minter,
          minterTokenAccount,
          minter,
          nftMint.publicKey,
          TOKEN_PROGRAM_ID,
        ),
      )

      // 5. Mint 1 NFT to minter
      transaction.add(createMintToInstruction(nftMint.publicKey, minterTokenAccount, minter, 1, [], TOKEN_PROGRAM_ID))

      // Sign transaction
      const signedTransaction = await signTransaction(transaction)
      signedTransaction.partialSign(nftMint)

      // Send transaction
      const signature = await this.connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      })

      // Confirm transaction
      await this.connection.confirmTransaction({
        signature,
        blockhash: transaction.recentBlockhash!,
        lastValidBlockHeight: transaction.lastValidBlockHeight!,
      })

      console.log("NFT minted:", {
        nftMint: nftMint.publicKey.toString(),
        signature,
        explorer: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
      })

      return {
        success: true,
        nftMint: nftMint.publicKey.toString(),
        signature,
      }
    } catch (error: any) {
      console.error("NFT minting error:", error)
      return {
        success: false,
        error: error.message || "Failed to mint NFT",
      }
    }
  }

  // Verify candy machine exists
  async verifyCandyMachine(candyMachine: PublicKey): Promise<boolean> {
    try {
      const accountInfo = await this.connection.getAccountInfo(candyMachine)
      return accountInfo !== null
    } catch (error) {
      console.error("Error verifying candy machine:", error)
      return false
    }
  }
}

// Default export for backward compatibility
export default CandyMachineService
