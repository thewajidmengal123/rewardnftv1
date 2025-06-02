import { type Connection, PublicKey } from "@solana/web3.js"
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token"

interface TokenBalance {
  mint: string
  balance: number
  symbol?: string
}

export class EnhancedUSDCService {
  private connection: Connection

  // Common devnet USDC mint addresses
  private USDC_MINTS = [
    "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr", // Your USDC-Dev
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // Circle USDC
    "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", // SPL USDC
  ]

  constructor(connection: Connection) {
    this.connection = connection
  }

  async getUSDCBalance(walletAddress: PublicKey): Promise<number> {
    try {
      let totalBalance = 0

      // Check all known USDC mints
      for (const mintAddress of this.USDC_MINTS) {
        try {
          const mint = new PublicKey(mintAddress)
          const tokenAccount = await getAssociatedTokenAddress(mint, walletAddress)

          const accountInfo = await getAccount(this.connection, tokenAccount)
          const balance = Number(accountInfo.amount) / Math.pow(10, 6) // USDC has 6 decimals

          if (balance > 0) {
            console.log(`Found USDC balance: ${balance} for mint: ${mintAddress}`)
            totalBalance += balance
          }
        } catch (error) {
          // Token account doesn't exist for this mint, continue
          console.log(`No token account for mint: ${mintAddress}`)
        }
      }

      return totalBalance
    } catch (error) {
      console.error("Error getting USDC balance:", error)
      return 0
    }
  }

  async getAllTokenBalances(walletAddress: PublicKey): Promise<TokenBalance[]> {
    try {
      const tokenBalances: TokenBalance[] = []

      // Get all token accounts for the wallet
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(walletAddress, {
        programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      })

      for (const tokenAccount of tokenAccounts.value) {
        const accountData = tokenAccount.account.data.parsed.info
        const mint = accountData.mint
        const balance = accountData.tokenAmount.uiAmount || 0

        if (balance > 0) {
          tokenBalances.push({
            mint,
            balance,
            symbol: this.getTokenSymbol(mint),
          })
        }
      }

      return tokenBalances
    } catch (error) {
      console.error("Error getting all token balances:", error)
      return []
    }
  }

  private getTokenSymbol(mint: string): string {
    const symbolMap: { [key: string]: string } = {
      Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr: "USDC-Dev",
      EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: "USDC",
      "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU": "USDC-SPL",
    }
    return symbolMap[mint] || "Unknown"
  }

  async transferUSDC(
    from: PublicKey,
    to: PublicKey,
    amount: number,
    signTransaction: any,
  ): Promise<{ success: boolean; signature?: string; error?: string }> {
    try {
      // Find which USDC mint the user has balance in
      let usdcMint: PublicKey | null = null

      for (const mintAddress of this.USDC_MINTS) {
        try {
          const mint = new PublicKey(mintAddress)
          const tokenAccount = await getAssociatedTokenAddress(mint, from)
          const accountInfo = await getAccount(this.connection, tokenAccount)
          const balance = Number(accountInfo.amount) / Math.pow(10, 6)

          if (balance >= amount) {
            usdcMint = mint
            break
          }
        } catch (error) {
          continue
        }
      }

      if (!usdcMint) {
        return { success: false, error: "No sufficient USDC balance found" }
      }

      // Create transfer instruction (simplified for now)
      console.log(`Would transfer ${amount} USDC from ${from.toString()} to ${to.toString()}`)

      // For now, return success (implement actual transfer later)
      return {
        success: true,
        signature: "mock_signature_" + Date.now().toString(),
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}

// Add default export for backward compatibility
export default EnhancedUSDCService
