import {
  type Connection,
  type PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  Keypair,
  type Signer,
} from "@solana/web3.js"
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token"
import { WalletError } from "./wallet-adapter"

// Build a SOL transfer transaction
export async function buildSolTransferTransaction(
  connection: Connection,
  fromPublicKey: PublicKey,
  toPublicKey: PublicKey,
  amount: number, // in SOL
): Promise<Transaction> {
  try {
    // Create a new transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromPublicKey,
        toPubkey: toPublicKey,
        lamports: amount * LAMPORTS_PER_SOL,
      }),
    )

    // Get the latest blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.lastValidBlockHeight = lastValidBlockHeight
    transaction.feePayer = fromPublicKey

    return transaction
  } catch (error) {
    console.error("Error building SOL transfer transaction:", error)
    throw new WalletError("Failed to build SOL transfer transaction", error as Error)
  }
}

// Build a token transfer transaction
export async function buildTokenTransferTransaction(
  connection: Connection,
  fromPublicKey: PublicKey,
  toPublicKey: PublicKey,
  tokenMint: PublicKey,
  amount: number, // in token units
  decimals = 6, // Default for USDC/USDT
): Promise<Transaction> {
  try {
    // Get the associated token accounts for sender and receiver
    const fromTokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      fromPublicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    )

    const toTokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      toPublicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    )

    // Create a new transaction
    const transaction = new Transaction()

    // Check if the receiver's token account exists
    try {
      await connection.getTokenAccountBalance(toTokenAccount)
    } catch (error) {
      // If the receiver's token account doesn't exist, create it
      transaction.add(
        createAssociatedTokenAccountInstruction(
          fromPublicKey,
          toTokenAccount,
          toPublicKey,
          tokenMint,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID,
        ),
      )
    }

    // Add the transfer instruction
    transaction.add(
      createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        fromPublicKey,
        amount * 10 ** decimals,
        [],
        TOKEN_PROGRAM_ID,
      ),
    )

    // Get the latest blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.lastValidBlockHeight = lastValidBlockHeight
    transaction.feePayer = fromPublicKey

    return transaction
  } catch (error) {
    console.error("Error building token transfer transaction:", error)
    throw new WalletError("Failed to build token transfer transaction", error as Error)
  }
}

// Send a signed transaction
export async function sendSignedTransaction(connection: Connection, signedTransaction: Transaction): Promise<string> {
  try {
    // Serialize the transaction
    const rawTransaction = signedTransaction.serialize()

    // Send the transaction
    const signature = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    })

    // Confirm the transaction
    await connection.confirmTransaction({
      signature,
      blockhash: signedTransaction.recentBlockhash!,
      lastValidBlockHeight: signedTransaction.lastValidBlockHeight!,
    })

    return signature
  } catch (error) {
    console.error("Error sending transaction:", error)
    throw new WalletError("Failed to send transaction", error as Error)
  }
}

// Example: Create and send a transaction with a local signer (for testing)
export async function createAndSendTransactionWithSigner(
  connection: Connection,
  instructions: any[],
  feePayer: PublicKey,
  signers: Signer[],
): Promise<string> {
  try {
    // Create a new transaction with the provided instructions
    const transaction = new Transaction().add(...instructions)

    // Get the latest blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.lastValidBlockHeight = lastValidBlockHeight
    transaction.feePayer = feePayer

    // Sign the transaction with all signers
    transaction.sign(...signers)

    // Send and confirm the transaction
    const signature = await sendAndConfirmTransaction(connection, transaction, signers, {
      commitment: "confirmed",
      skipPreflight: false,
    })

    return signature
  } catch (error) {
    console.error("Error creating and sending transaction:", error)
    throw new WalletError("Failed to create and send transaction", error as Error)
  }
}

// Create a test wallet for development purposes
export function createTestWallet(): Keypair {
  return Keypair.generate()
}
