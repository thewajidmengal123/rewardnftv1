import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"

export class SolPaymentService {
  private connection: Connection
  private treasuryWallet: PublicKey

  constructor() {
    this.connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com",
      "confirmed"
    )
    this.treasuryWallet = new PublicKey("8QY2zcWZWwBZYMeiSfPivWAiPBbLZe1mbnyJauWe8ms6")
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
    const { blockhash } = await this.connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = fromWallet

    return transaction
  }

  // Verify transaction signature
  async verifyTransaction(signature: string, expectedAmount: number): Promise<boolean> {
    try {
      const transaction = await this.connection.getTransaction(signature, {
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
      const balance = await this.connection.getBalance(wallet)
      return balance / LAMPORTS_PER_SOL
    } catch (error) {
      console.error("Error getting balance:", error)
      return 0
    }
  }
}

export const solPaymentService = new SolPaymentService()
