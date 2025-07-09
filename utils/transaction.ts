import {
  type Connection,
  Transaction,
  type PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  type VersionedTransaction,
} from "@solana/web3.js"
import { createTransferInstruction, getAssociatedTokenAddress } from "@solana/spl-token"

// Function to create a SOL transfer transaction
export async function createSolTransferTransaction(
  connection: Connection,
  fromPublicKey: PublicKey,
  toPublicKey: PublicKey,
  amount: number, // in SOL
): Promise<Transaction> {
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
}

// Function to create a token transfer transaction
export async function createTokenTransferTransaction(
  connection: Connection,
  fromPublicKey: PublicKey,
  toPublicKey: PublicKey,
  tokenMint: PublicKey,
  amount: number, // in token units
  decimals = 6, // USDC has 6 decimals
): Promise<Transaction> {
  // Get the associated token accounts for sender and receiver
  const fromTokenAccount = await getAssociatedTokenAddress(tokenMint, fromPublicKey)
  const toTokenAccount = await getAssociatedTokenAddress(tokenMint, toPublicKey)

  // Create the transfer instruction
  const transferInstruction = createTransferInstruction(
    fromTokenAccount,
    toTokenAccount,
    fromPublicKey,
    amount * 10 ** decimals,
  )

  // Create the transaction
  const transaction = new Transaction().add(transferInstruction)

  // Get the latest blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
  transaction.recentBlockhash = blockhash
  transaction.lastValidBlockHeight = lastValidBlockHeight
  transaction.feePayer = fromPublicKey

  return transaction
}

// Function to send a signed transaction
export async function sendSignedTransaction(
  connection: Connection,
  signedTransaction: Transaction | VersionedTransaction,
): Promise<string> {
  // Serialize and send the transaction
  const serializedTransaction =
    signedTransaction instanceof Transaction ? signedTransaction.serialize() : signedTransaction.serialize()

  const signature = await connection.sendRawTransaction(serializedTransaction, {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  })

  // Confirm the transaction
  await connection.confirmTransaction({
    signature,
    blockhash: (signedTransaction as Transaction).recentBlockhash!,
    lastValidBlockHeight: (signedTransaction as Transaction).lastValidBlockHeight!,
  })

  return signature
}
