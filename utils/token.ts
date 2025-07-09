import { type Connection, type PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token"
import { DEFAULT_USDC_TOKEN_ADDRESS } from "@/config/solana"

/**
 * Get the balance of a token for a wallet
 * @param connection Solana connection
 * @param walletAddress Wallet public key
 * @param tokenMintAddress Token mint address
 * @returns Token balance as a number
 */
export async function getTokenBalance(
  connection: Connection,
  walletAddress: PublicKey,
  tokenMintAddress: PublicKey,
): Promise<number> {
  try {
    // Get the associated token account address
    const tokenAccountAddress = await getAssociatedTokenAddress(
      tokenMintAddress,
      walletAddress,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    )

    // Get the token account info
    try {
      const tokenAccountInfo = await connection.getTokenAccountBalance(tokenAccountAddress)
      return Number(tokenAccountInfo.value.uiAmount)
    } catch (error) {
      // If the token account doesn't exist, return 0
      return 0
    }
  } catch (error) {
    console.error("Error getting token balance:", error)
    throw error
  }
}

/**
 * Get all token balances for a wallet
 * @param connection Solana connection
 * @param walletAddress Wallet public key
 * @returns Object with token mint addresses as keys and balances as values
 */
export async function getAllTokenBalances(
  connection: Connection,
  walletAddress: PublicKey,
): Promise<Record<string, number>> {
  try {
    // Get all token accounts owned by the wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(walletAddress, {
      programId: TOKEN_PROGRAM_ID,
    })

    // Create a map of token mint addresses to balances
    const balances: Record<string, number> = {}
    tokenAccounts.value.forEach((tokenAccount) => {
      const tokenMintAddress = tokenAccount.account.data.parsed.info.mint
      const balance = tokenAccount.account.data.parsed.info.tokenAmount.uiAmount
      balances[tokenMintAddress] = balance
    })

    return balances
  } catch (error) {
    console.error("Error getting all token balances:", error)
    throw error
  }
}

/**
 * Get or create an associated token account
 * @param connection Solana connection
 * @param payer Payer public key
 * @param mint Token mint address
 * @param owner Owner public key
 * @param transaction Transaction to add instructions to
 * @returns Associated token account address
 */
export async function getOrCreateAssociatedTokenAccount(
  connection: Connection,
  payer: PublicKey,
  mint: PublicKey,
  owner: PublicKey,
  transaction: Transaction,
): Promise<PublicKey> {
  // Get the associated token account address
  const associatedTokenAddress = await getAssociatedTokenAddress(
    mint,
    owner,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )

  // Check if the associated token account exists
  const accountInfo = await connection.getAccountInfo(associatedTokenAddress)

  // If the account doesn't exist, add an instruction to create it
  if (!accountInfo) {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        payer,
        associatedTokenAddress,
        owner,
        mint,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      ),
    )
  }

  return associatedTokenAddress
}

/**
 * Create a transaction to transfer tokens from one wallet to another
 * @param connection Solana connection
 * @param sender Sender public key
 * @param recipient Recipient public key
 * @param tokenMintAddress Token mint address
 * @param amount Amount to transfer
 * @returns Transaction
 */
export async function createTokenTransferTransaction(
  connection: Connection,
  sender: PublicKey,
  recipient: PublicKey,
  tokenMintAddress: PublicKey,
  amount: number,
): Promise<Transaction> {
  try {
    // Create a new transaction
    const transaction = new Transaction()

    // Get the recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.lastValidBlockHeight = lastValidBlockHeight
    transaction.feePayer = sender

    // Get or create the sender's associated token account
    const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      sender,
      tokenMintAddress,
      sender,
      transaction,
    )

    // Get or create the recipient's associated token account
    const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      sender,
      tokenMintAddress,
      recipient,
      transaction,
    )

    // Get the token decimals - USDC has 6 decimals
    const tokenDecimals = tokenMintAddress.equals(DEFAULT_USDC_TOKEN_ADDRESS) ? 6 : 9
    const amountInSmallestUnit = Math.floor(amount * 10 ** tokenDecimals)

    // Add the transfer instruction
    transaction.add(
      createTransferInstruction(
        senderTokenAccount,
        recipientTokenAccount,
        sender,
        amountInSmallestUnit,
        [],
        TOKEN_PROGRAM_ID,
      ),
    )

    return transaction
  } catch (error) {
    console.error("Error creating token transfer transaction:", error)
    throw error
  }
}

/**
 * Create a transaction to transfer SOL from one wallet to another
 * @param connection Solana connection
 * @param sender Sender public key
 * @param recipient Recipient public key
 * @param amount Amount to transfer in SOL
 * @returns Transaction
 */
export async function createSolTransferTransaction(
  connection: Connection,
  sender: PublicKey,
  recipient: PublicKey,
  amount: number,
): Promise<Transaction> {
  try {
    // Create a new transaction
    const transaction = new Transaction()

    // Get the recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.lastValidBlockHeight = lastValidBlockHeight
    transaction.feePayer = sender

    // Add the transfer instruction
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: sender,
        toPubkey: recipient,
        lamports: Math.floor(amount * LAMPORTS_PER_SOL),
      }),
    )

    return transaction
  } catch (error) {
    console.error("Error creating SOL transfer transaction:", error)
    throw error
  }
}

/**
 * Send a signed transaction and confirm it
 * @param connection Solana connection
 * @param signedTransaction Signed transaction
 * @returns Transaction signature
 */
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
    console.error("Error sending signed transaction:", error)
    throw error
  }
}
