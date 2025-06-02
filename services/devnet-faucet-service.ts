import { Connection, type PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { getAssociatedTokenAddress } from "@solana/spl-token"
import { USDC_MINT_ADDRESS, DEFAULT_RPC_ENDPOINT } from "@/config/solana"

export class DevnetFaucetService {
  private connection: Connection

  constructor() {
    this.connection = new Connection(DEFAULT_RPC_ENDPOINT, "confirmed")
  }

  /**
   * Request SOL from Solana devnet faucet
   */
  async requestSOL(
    walletAddress: PublicKey,
    amount = 2,
  ): Promise<{ success: boolean; signature?: string; error?: string }> {
    try {
      console.log(`Requesting ${amount} SOL for ${walletAddress.toString()}`)

      // Use Solana's official devnet faucet
      const response = await fetch("https://faucet.solana.com/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pubkey: walletAddress.toString(),
          lamports: amount * LAMPORTS_PER_SOL,
        }),
      })

      if (response.ok) {
        const result = await response.text()
        return {
          success: true,
          signature: result,
        }
      } else {
        const errorText = await response.text()
        return {
          success: false,
          error: `Faucet request failed: ${errorText}`,
        }
      }
    } catch (error: any) {
      console.error("Error requesting SOL:", error)
      return {
        success: false,
        error: error.message || "Failed to request SOL",
      }
    }
  }

  /**
   * Request USDC from a custom devnet faucet (simulated)
   */
  async requestUSDC(
    walletAddress: PublicKey,
    amount = 100,
  ): Promise<{ success: boolean; signature?: string; error?: string }> {
    try {
      console.log(`Requesting ${amount} USDC for ${walletAddress.toString()}`)

      // For devnet, we'll simulate getting USDC by creating a mock transaction
      // In a real scenario, you'd have a USDC faucet service

      // Get or create associated token account
      const tokenAccount = await getAssociatedTokenAddress(USDC_MINT_ADDRESS, walletAddress, false)

      // Check if account exists
      const accountInfo = await this.connection.getAccountInfo(tokenAccount)

      if (!accountInfo) {
        return {
          success: false,
          error: "USDC token account not found. You need to create one first or use a USDC faucet service.",
        }
      }

      // For devnet testing, we'll return a simulated success
      // In production, you'd integrate with a real USDC faucet
      return {
        success: true,
        signature: "simulated-usdc-faucet-" + Date.now(),
      }
    } catch (error: any) {
      console.error("Error requesting USDC:", error)
      return {
        success: false,
        error: error.message || "Failed to request USDC",
      }
    }
  }

  /**
   * Get current SOL balance
   */
  async getSOLBalance(walletAddress: PublicKey): Promise<number> {
    try {
      const balance = await this.connection.getBalance(walletAddress)
      return balance / LAMPORTS_PER_SOL
    } catch (error) {
      console.error("Error getting SOL balance:", error)
      return 0
    }
  }

  /**
   * Check if wallet needs funding
   */
  async checkFundingNeeds(walletAddress: PublicKey): Promise<{
    needsSOL: boolean
    needsUSDC: boolean
    solBalance: number
    usdcBalance: number
  }> {
    const solBalance = await this.getSOLBalance(walletAddress)

    // For USDC balance, we'll use a simplified check
    const usdcBalance = 0 // This would be fetched from USDCService

    return {
      needsSOL: solBalance < 0.5, // Need at least 0.5 SOL for transactions
      needsUSDC: usdcBalance < 10, // Need at least 10 USDC for minting
      solBalance,
      usdcBalance,
    }
  }
}
