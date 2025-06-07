import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"

export class SolPaymentService {
  private _connection: Connection
  private treasuryWallet: PublicKey

  constructor() {
    this._connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com",
      "confirmed"
    )
    // Treasury wallet for login streak SOL payments
    this.treasuryWallet = new PublicKey("A9GT8pYUR5F1oRwUsQ9ADeZTWq7LJMfmPQ3TZLmV6cQP")

    console.log("🏦 SOL Payment Service initialized with treasury wallet:", this.treasuryWallet.toString())
  }

  // Getter for connection (used by quest components)
  get connection(): Connection {
    return this._connection
  }

  // Getter for treasury wallet
  get treasuryWalletAddress(): string {
    return this.treasuryWallet.toString()
  }

  // Create transaction for SOL payment
  async createPaymentTransaction(
    fromWallet: PublicKey,
    amount: number // Amount in SOL
  ): Promise<Transaction> {
    const lamports = Math.floor(amount * LAMPORTS_PER_SOL)
    
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromWallet,
        toPubkey: this.treasuryWallet,
        lamports,
      })
    )

    // Get recent blockhash
    const { blockhash } = await this._connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = fromWallet

    return transaction
  }

  // Verify transaction signature
  async verifyTransaction(signature: string, expectedAmount: number): Promise<boolean> {
    try {
      const transaction = await this._connection.getTransaction(signature, {
        commitment: "confirmed"
      })

      if (!transaction || !transaction.meta) {
        return false
      }

      // Check if transaction was successful
      if (transaction.meta.err) {
        return false
      }

      // Verify the amount transferred
      const expectedLamports = Math.floor(expectedAmount * LAMPORTS_PER_SOL)
      const actualLamports = Math.abs(transaction.meta.preBalances[0] - transaction.meta.postBalances[0])
      
      // Allow for small fee differences
      const tolerance = 0.001 * LAMPORTS_PER_SOL // 0.001 SOL tolerance
      return Math.abs(actualLamports - expectedLamports) <= tolerance

    } catch (error) {
      console.error("Error verifying transaction:", error)
      return false
    }
  }

  // Get wallet SOL balance
  async getBalance(wallet: PublicKey): Promise<number> {
    try {
      const balance = await this._connection.getBalance(wallet)
      return balance / LAMPORTS_PER_SOL
    } catch (error) {
      console.error("Error getting balance:", error)
      return 0
    }
  }

  // Check if wallet has sufficient balance for payment
  async hasSufficientBalance(wallet: PublicKey, amount: number): Promise<boolean> {
    try {
      const balance = await this.getBalance(wallet)
      const requiredAmount = amount + 0.001 // Add small buffer for transaction fees
      return balance >= requiredAmount
    } catch (error) {
      console.error("Error checking balance:", error)
      return false
    }
  }

  // Get treasury wallet balance
  async getTreasuryBalance(): Promise<number> {
    return this.getBalance(this.treasuryWallet)
  }

  // Create and send payment transaction in one call
  async processPayment(
    fromWallet: PublicKey,
    amount: number,
    signTransaction: (transaction: Transaction) => Promise<Transaction>
  ): Promise<{ success: boolean; signature?: string; error?: string }> {
    try {
      // Check balance first
      const hasBalance = await this.hasSufficientBalance(fromWallet, amount)
      if (!hasBalance) {
        return { success: false, error: "Insufficient SOL balance" }
      }

      // Create transaction
      const transaction = await this.createPaymentTransaction(fromWallet, amount)

      // Sign transaction
      const signedTransaction = await signTransaction(transaction)

      // Send transaction
      const signature = await this._connection.sendRawTransaction(signedTransaction.serialize())

      // Wait for confirmation
      await this._connection.confirmTransaction(signature, "confirmed")

      // Verify the transaction
      const isValid = await this.verifyTransaction(signature, amount)

      if (isValid) {
        console.log(`✅ SOL payment successful: ${amount} SOL sent to treasury (${signature})`)
        return { success: true, signature }
      } else {
        return { success: false, error: "Transaction verification failed" }
      }

    } catch (error) {
      console.error("Error processing SOL payment:", error)
      return { 
        success: false, 
        error: typeof error === "object" && error !== null && "message" in error ? String((error as { message?: unknown }).message) : String(error)
      }
    }
  }
}

export const solPaymentService = new SolPaymentService()
