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
import { COLLECTION_CONFIG } from "@/config/candy-machine-v3"

export interface CollectionCreationResult {
  success: boolean
  collectionMint?: string
  metadataAccount?: string
  masterEditionAccount?: string
  signature?: string
  error?: string
}

export interface CollectionMetadata {
  name: string
  symbol: string
  description: string
  image: string
  external_url: string
  seller_fee_basis_points: number
  creators: Array<{
    address: string
    verified: boolean
    share: number
  }>
  collection: {
    name: string
    family: string
  }
  attributes: Array<{
    trait_type: string
    value: string
  }>
}

export class CollectionCreationService {
  private connection: Connection

  constructor(connection?: Connection) {
    this.connection = connection || enhancedRPCService.getConnection()
  }

  // Create collection NFT with metadata
  async createCollection(
    authority: PublicKey,
    signTransaction: (transaction: Transaction) => Promise<Transaction>,
    metadata: CollectionMetadata = COLLECTION_CONFIG,
  ): Promise<CollectionCreationResult> {
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
        }),
      )

      // 2. Initialize mint (0 decimals for NFT)
      transaction.add(
        createInitializeMintInstruction(
          collectionMint.publicKey,
          0, // 0 decimals for NFT
          authority, // mint authority
          authority, // freeze authority
          TOKEN_PROGRAM_ID,
        ),
      )

      // 3. Get associated token account
      const associatedTokenAccount = await getAssociatedTokenAddress(
        collectionMint.publicKey,
        authority,
        false,
        TOKEN_PROGRAM_ID,
      )

      // 4. Create associated token account
      transaction.add(
        createAssociatedTokenAccountInstruction(
          authority, // payer
          associatedTokenAccount, // ata
          authority, // owner
          collectionMint.publicKey, // mint
          TOKEN_PROGRAM_ID,
        ),
      )

      // 5. Mint 1 token to create the collection NFT
      transaction.add(
        createMintToInstruction(
          collectionMint.publicKey, // mint
          associatedTokenAccount, // destination
          authority, // authority
          1, // amount (1 for NFT)
          [], // multiSigners
          TOKEN_PROGRAM_ID,
        ),
      )

      console.log("📝 Signing collection creation transaction...")

      // Sign transaction
      const signedTransaction = await signTransaction(transaction)
      signedTransaction.partialSign(collectionMint)

      console.log("🚀 Sending collection creation transaction...")

      // Send transaction
      const signature = await this.connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed",
        maxRetries: 3,
      })

      console.log("⏳ Confirming collection creation transaction...")

      // Confirm transaction
      await this.connection.confirmTransaction({
        signature,
        blockhash: transaction.recentBlockhash!,
        lastValidBlockHeight: transaction.lastValidBlockHeight!,
      })

      const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=devnet`

      console.log("✅ Collection created successfully!", {
        mint: collectionMint.publicKey.toString(),
        signature,
        explorer: explorerUrl,
      })

      // Store metadata off-chain (simplified)
      await this.storeCollectionMetadata(collectionMint.publicKey.toString(), metadata)

      return {
        success: true,
        collectionMint: collectionMint.publicKey.toString(),
        signature,
      }
    } catch (error: any) {
      console.error("❌ Collection creation error:", error)
      return {
        success: false,
        error: error.message || "Failed to create collection",
      }
    }
  }

  // Store collection metadata (simplified off-chain storage)
  private async storeCollectionMetadata(mintAddress: string, metadata: CollectionMetadata): Promise<void> {
    try {
      // In a real implementation, you would upload to IPFS or Arweave
      const metadataWithMint = {
        ...metadata,
        mint: mintAddress,
        created_at: new Date().toISOString(),
      }

      console.log("📄 Collection metadata:", metadataWithMint)

      // Store in localStorage for demo purposes
      localStorage.setItem(`collection_metadata_${mintAddress}`, JSON.stringify(metadataWithMint))
    } catch (error) {
      console.error("Failed to store collection metadata:", error)
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
      const metadata = localStorage.getItem(`collection_metadata_${collectionMint.toString()}`)

      return {
        exists: mintInfo.value !== null,
        mintData: mintInfo.value?.data,
        metadata: metadata ? JSON.parse(metadata) : null,
      }
    } catch (error) {
      console.error("Error getting collection info:", error)
      return { exists: false, mintData: null, metadata: null }
    }
  }
}

export default CollectionCreationService
