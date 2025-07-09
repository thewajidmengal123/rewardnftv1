import { type Connection, type PublicKey, Transaction, Keypair, SystemProgram } from "@solana/web3.js"
import {
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getMinimumBalanceForRentExemptMint,
  getAssociatedTokenAddress,
} from "@solana/spl-token"
import { enhancedRPCService } from "./enhanced-rpc-service"

export interface CollectionResult {
  success: boolean
  collectionMint?: string
  signature?: string
  error?: string
}

export class CollectionService {
  private connection: Connection

  constructor(connection?: Connection) {
    this.connection = connection || enhancedRPCService.getConnection()
  }

  // Create simple collection mint (without complex metadata)
  async createCollection(
    authority: PublicKey,
    signTransaction: (transaction: Transaction) => Promise<Transaction>,
  ): Promise<CollectionResult> {
    try {
      const collectionMint = Keypair.generate()
      const transaction = new Transaction()

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.lastValidBlockHeight = lastValidBlockHeight
      transaction.feePayer = authority

      // Calculate rent for mint account
      const mintRent = await getMinimumBalanceForRentExemptMint(this.connection)

      // Create mint account
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: authority,
          newAccountPubkey: collectionMint.publicKey,
          space: 82,
          lamports: mintRent,
          programId: TOKEN_PROGRAM_ID,
        }),
      )

      // Initialize mint
      transaction.add(
        createInitializeMintInstruction(
          collectionMint.publicKey,
          0, // 0 decimals for NFT
          authority,
          authority,
          TOKEN_PROGRAM_ID,
        ),
      )

      // Get associated token account
      const associatedTokenAccount = await getAssociatedTokenAddress(
        collectionMint.publicKey,
        authority,
        false,
        TOKEN_PROGRAM_ID,
      )

      // Create associated token account
      transaction.add(
        createAssociatedTokenAccountInstruction(
          authority,
          associatedTokenAccount,
          authority,
          collectionMint.publicKey,
          TOKEN_PROGRAM_ID,
        ),
      )

      // Mint 1 token to create the collection
      transaction.add(
        createMintToInstruction(collectionMint.publicKey, associatedTokenAccount, authority, 1, [], TOKEN_PROGRAM_ID),
      )

      // Sign transaction
      const signedTransaction = await signTransaction(transaction)
      signedTransaction.partialSign(collectionMint)

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

      console.log("Collection created:", {
        mint: collectionMint.publicKey.toString(),
        signature,
        explorer: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
      })

      return {
        success: true,
        collectionMint: collectionMint.publicKey.toString(),
        signature,
      }
    } catch (error: any) {
      console.error("Collection creation error:", error)
      return {
        success: false,
        error: error.message || "Failed to create collection",
      }
    }
  }

  // Verify collection exists
  async verifyCollection(collectionMint: PublicKey): Promise<boolean> {
    try {
      const accountInfo = await this.connection.getAccountInfo(collectionMint)
      return accountInfo !== null
    } catch (error) {
      console.error("Error verifying collection:", error)
      return false
    }
  }

  // Get collection info
  async getCollectionInfo(collectionMint: PublicKey) {
    try {
      const mintInfo = await this.connection.getParsedAccountInfo(collectionMint)
      return {
        exists: mintInfo.value !== null,
        data: mintInfo.value?.data,
      }
    } catch (error) {
      console.error("Error getting collection info:", error)
      return { exists: false, data: null }
    }
  }
}

// Default export for backward compatibility
export default CollectionService
