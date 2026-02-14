import { Connection, PublicKey, Transaction } from "@solana/web3.js"
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token"
import {
  CURRENT_NETWORK,
  getCurrentUSDCAddress,
  isMainnet,
  isDevnet,
  PLATFORM_WALLET_ADDRESS,
  SOLANA_RPC_ENDPOINTS  // ✅ Yeh add karo
} from "@/config/solana"

interface TokenBalance {
  mint: string
  balance: number
  symbol?: string
}

export class EnhancedUSDCService {
  transferUSDCWithReferral(minter: PublicKey, treasuryWallet: PublicKey, referrerWallet: PublicKey, treasuryAmount: number, referrerAmount: number, signTransaction: (transaction: Transaction) => Promise<Transaction>) {
    throw new Error("Method not implemented.")
  }
  private connection: Connection
  private usdcMintAddress: PublicKey
  private currentNetwork: string

 constructor(connection?: Connection) {
  this.currentNetwork = CURRENT_NETWORK
  this.usdcMintAddress = getCurrentUSDCAddress()

  // Hamesha config se RPC lo
  const rpcUrl = SOLANA_RPC_ENDPOINTS[this.currentNetwork as keyof typeof SOLANA_RPC_ENDPOINTS]
  this.connection = new Connection(rpcUrl, 'confirmed')
  console.log(`Using RPC: ${rpcUrl}`)

  console.log(`🌐 Network: ${this.currentNetwork}`)
  console.log(`💰 USDC: ${this.usdcMintAddress.toString()}`)
}
async getUSDCBalance(walletAddress: PublicKey): Promise<number> {
  try {
    console.log("🔍 DEBUG: Starting USDC balance check...")
    console.log("   Wallet:", walletAddress.toString())
    console.log("   Network:", this.currentNetwork)
    console.log("   USDC Mint:", this.usdcMintAddress.toString())
    
    const tokenAccount = await getAssociatedTokenAddress(this.usdcMintAddress, walletAddress)
    console.log("   Token Account:", tokenAccount.toString())

    try {
      const response = await fetch("https://api.mainnet-beta.solana.com", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getTokenAccountBalance',
          params: [tokenAccount.toString()]
        })
      })
      
      const data = await response.json()
      console.log("   RPC Response:", data)
      
      if (data.result?.value?.uiAmount !== undefined) {
        const balance = data.result.value.uiAmount
        console.log("   ✅ Balance found:", balance)
        return balance
      }
      
      console.log("   ⚠️ No balance data")
      return 0
      
    } catch (rpcError: any) {
      console.log("   ❌ RPC Error:", rpcError.message)
      return 0
    }
    
  } catch (error) {
    console.error("   ❌ Error in getUSDCBalance:", error)
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
    // Network-aware token symbol mapping
    const symbolMap: { [key: string]: string } = {
      // Mainnet USDC
      "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": "USDC",
      // Devnet USDC
      "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU": "USDC-Dev",
      // Legacy devnet USDC addresses
      "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr": "USDC-Dev-Legacy",
    }

    // If it's the current network's USDC mint, return appropriate symbol
    if (mint === this.usdcMintAddress.toString()) {
      return isMainnet() ? "USDC" : "USDC-Dev"
    }

    return symbolMap[mint] || "Unknown"
  }

  /**
   * Get the current USDC mint address for the network
   */
  getUSDCMintAddress(): PublicKey {
    return this.usdcMintAddress
  }

  /**
   * Get current network information
   */
  getNetworkInfo() {
    return {
      network: this.currentNetwork,
      usdcMint: this.usdcMintAddress.toString(),
      isMainnet: isMainnet(),
      isDevnet: isDevnet(),
    }
  }

  /**
   * Check if the service is configured for mainnet
   */
  isMainnet(): boolean {
    return isMainnet()
  }

  /**
   * Check if the service is configured for devnet
   */
  isDevnet(): boolean {
    return isDevnet()
  }

  async transferUSDC(
    from: PublicKey,
    to: PublicKey,
    amount: number,
    signTransaction: any, // TODO: Implement actual transaction signing
  ): Promise<{ success: boolean; signature?: string; error?: string }> {
    try {
      // Check if user has sufficient USDC balance using network-specific mint
      const tokenAccount = await getAssociatedTokenAddress(this.usdcMintAddress, from)

      try {
        const accountInfo = await getAccount(this.connection, tokenAccount)
        const balance = Number(accountInfo.amount) / Math.pow(10, 6)

        if (balance < amount) {
          return {
            success: false,
            error: `Insufficient USDC balance. Required: ${amount}, Available: ${balance}`
          }
        }

        // Create transfer instruction (simplified for now)
        console.log(`Would transfer ${amount} USDC from ${from.toString()} to ${to.toString()}`)
        console.log(`Network: ${this.currentNetwork}, USDC Mint: ${this.usdcMintAddress.toString()}`)

        // For now, return success (implement actual transfer later)
        return {
          success: true,
          signature: "mock_signature_" + Date.now().toString(),
        }
      } catch (error) {
        return {
          success: false,
          error: `No USDC token account found for wallet on ${this.currentNetwork}`
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Transfer failed on ${this.currentNetwork}: ${error.message}`
      }
    }
  }

  /**
   * Create a split USDC transfer transaction (for referral payments)
   * @param from - Wallet address sending USDC
   * @param treasuryAmount - Amount to send to treasury (6 USDC)
   * @param referrerAmount - Amount to send to referrer (4 USDC)
   * @param referrerWallet - Referrer's wallet address
   */
  async createSplitUSDCTransfer(
    from: PublicKey,
    treasuryAmount: number,
    referrerAmount: number,
    referrerWallet: PublicKey
  ): Promise<Transaction> {
    const { createTokenTransferTransaction } = await import("@/utils/token")

    // Create transfer to treasury (6 USDC)
    const treasuryTransferTx = await createTokenTransferTransaction(
      this.connection,
      from,
      PLATFORM_WALLET_ADDRESS,
      this.usdcMintAddress,
      treasuryAmount
    )

    // Create transfer to referrer (4 USDC)
    const referrerTransferTx = await createTokenTransferTransaction(
      this.connection,
      from,
      referrerWallet,
      this.usdcMintAddress,
      referrerAmount
    )

    // Combine both transactions into one
    const combinedTransaction = new Transaction()

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash()
    combinedTransaction.recentBlockhash = blockhash
    combinedTransaction.lastValidBlockHeight = lastValidBlockHeight
    combinedTransaction.feePayer = from

    // Add instructions from both transactions
    combinedTransaction.add(...treasuryTransferTx.instructions)
    combinedTransaction.add(...referrerTransferTx.instructions)

    return combinedTransaction
  }

  /**
   * Create a platform USDC transfer transaction (full 10 USDC to treasury)
   */
  async createPlatformUSDCTransfer(from: PublicKey, amount: number): Promise<Transaction> {
    const { createTokenTransferTransaction } = await import("@/utils/token")

    return createTokenTransferTransaction(
      this.connection,
      from,
      PLATFORM_WALLET_ADDRESS,
      this.usdcMintAddress,
      amount
    )
  }
}

// Add default export for backward compatibility
export default EnhancedUSDCService
