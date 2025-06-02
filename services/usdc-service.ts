import { type Connection, type PublicKey, Transaction } from "@solana/web3.js"
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  getAccount,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError,
} from "@solana/spl-token"
import { getCurrentUSDCAddress, CURRENT_NETWORK, PLATFORM_WALLET_ADDRESS } from "@/config/solana"
import { rpcConnectionService } from "@/services/rpc-connection-service"

export class USDCService {
  private connection: Connection
  private usdcMintAddress: PublicKey

  constructor(connection?: Connection) {
    // Use provided connection or get from RPC service
    this.connection = connection || rpcConnectionService.getConnection()

    // Use the correct USDC mint address for the current network
    this.usdcMintAddress = getCurrentUSDCAddress()

    console.log(`USDC Service initialized for network: ${CURRENT_NETWORK}`)
    console.log(`USDC Mint Address: ${this.usdcMintAddress.toString()}`)
  }

  /**
   * Get USDC mint address
   */
  getUSDCMintAddress(): PublicKey {
    return this.usdcMintAddress
  }

  /**
   * Get associated token account address for USDC
   */
  async getUSDCTokenAccount(walletAddress: PublicKey): Promise<PublicKey | null> {
    try {
      if (!walletAddress || !this.usdcMintAddress) {
        console.warn("Invalid wallet address or USDC mint address")
        return null
      }

      return await getAssociatedTokenAddress(this.usdcMintAddress, walletAddress, false, TOKEN_PROGRAM_ID)
    } catch (error) {
      console.error("Error getting USDC token account:", error)
      return null
    }
  }

  /**
   * Check if USDC token account exists
   */
  async checkUSDCTokenAccountExists(walletAddress: PublicKey): Promise<boolean> {
    try {
      const tokenAccount = await this.getUSDCTokenAccount(walletAddress)
      if (!tokenAccount) return false

      const accountInfo = await this.connection.getAccountInfo(tokenAccount)
      return accountInfo !== null
    } catch (error) {
      console.error("Error checking USDC token account:", error)
      return false
    }
  }

  /**
   * Get USDC balance for a wallet
   */
  async getUSDCBalance(walletAddress: PublicKey): Promise<number> {
    try {
      // Validate inputs
      if (!walletAddress) {
        console.warn("No wallet address provided")
        return 0
      }

      if (!this.connection) {
        console.warn("No connection available")
        return 0
      }

      if (!this.usdcMintAddress) {
        console.warn("No USDC mint address configured")
        return 0
      }

      const tokenAccount = await this.getUSDCTokenAccount(walletAddress)

      if (!tokenAccount) {
        console.warn("Could not get token account")
        return 0
      }

      try {
        const account = await getAccount(this.connection, tokenAccount)
        const balance = Number(account.amount) / 1e6 // USDC has 6 decimals
        console.log(`USDC Balance for ${walletAddress.toString()}: ${balance}`)
        return balance
      } catch (error) {
        if (error instanceof TokenAccountNotFoundError || error instanceof TokenInvalidAccountOwnerError) {
          // Token account doesn't exist yet, balance is 0
          console.log(`USDC token account not found for ${walletAddress.toString()}, balance: 0`)
          return 0
        }
        throw error
      }
    } catch (error) {
      console.error("Error getting USDC balance:", error)
      return 0
    }
  }

  /**
   * Create USDC transfer transaction
   */
  async createUSDCTransferTransaction(
    fromWallet: PublicKey,
    toWallet: PublicKey,
    amount: number,
  ): Promise<Transaction> {
    const transaction = new Transaction()

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash("confirmed")
    transaction.recentBlockhash = blockhash
    transaction.lastValidBlockHeight = lastValidBlockHeight
    transaction.feePayer = fromWallet

    // Get sender's USDC token account
    const fromTokenAccount = await this.getUSDCTokenAccount(fromWallet)
    if (!fromTokenAccount) {
      throw new Error("Could not get sender's USDC token account")
    }

    // Get receiver's USDC token account
    const toTokenAccount = await this.getUSDCTokenAccount(toWallet)
    if (!toTokenAccount) {
      throw new Error("Could not get receiver's USDC token account")
    }

    // Check if receiver's token account exists, if not create it
    const toAccountExists = await this.checkUSDCTokenAccountExists(toWallet)
    if (!toAccountExists) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          fromWallet, // payer
          toTokenAccount, // associated token account
          toWallet, // owner
          this.usdcMintAddress, // mint
          TOKEN_PROGRAM_ID,
        ),
      )
    }

    // Add transfer instruction
    transaction.add(
      createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        fromWallet,
        Math.floor(amount * 1e6), // Convert to smallest unit (6 decimals)
        [],
        TOKEN_PROGRAM_ID,
      ),
    )

    return transaction
  }

  /**
   * Create USDC transfer to platform wallet
   */
  async createPlatformUSDCTransfer(fromWallet: PublicKey, amount: number): Promise<Transaction> {
    return this.createUSDCTransferTransaction(fromWallet, PLATFORM_WALLET_ADDRESS, amount)
  }

  /**
   * Get network info for debugging
   */
  getNetworkInfo() {
    return {
      network: CURRENT_NETWORK,
      usdcMint: this.usdcMintAddress.toString(),
      platformWallet: PLATFORM_WALLET_ADDRESS.toString(),
    }
  }
}
