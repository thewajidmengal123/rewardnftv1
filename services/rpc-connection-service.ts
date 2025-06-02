import { Connection, type Commitment } from "@solana/web3.js"

export class RPCConnectionService {
  private static instance: RPCConnectionService
  private connection: Connection
  private endpoint: string

  private constructor() {
    // Use the provided QuickNode endpoint
    this.endpoint =
      process.env.NEXT_PUBLIC_SOLANA_RPC ||
      "https://morning-indulgent-energy.solana-devnet.quiknode.pro/450ae68bfe8c733d96e2301292cc52bab5ceb2cf/"

    // Configure connection with optimal settings for QuickNode
    this.connection = new Connection(this.endpoint, {
      commitment: "confirmed" as Commitment,
      confirmTransactionInitialTimeout: 60000, // 60 seconds
      disableRetryOnRateLimit: false,
      httpHeaders: {
        "Content-Type": "application/json",
      },
    })
  }

  public static getInstance(): RPCConnectionService {
    if (!RPCConnectionService.instance) {
      RPCConnectionService.instance = new RPCConnectionService()
    }
    return RPCConnectionService.instance
  }

  public getConnection(): Connection {
    return this.connection
  }

  public getEndpoint(): string {
    return this.endpoint
  }

  // Test connection health
  public async testConnection(): Promise<{
    success: boolean
    latency?: number
    blockHeight?: number
    error?: string
  }> {
    try {
      const startTime = Date.now()
      const blockHeight = await this.connection.getBlockHeight()
      const latency = Date.now() - startTime

      return {
        success: true,
        latency,
        blockHeight,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  // Get connection with retry logic
  public async getConnectionWithRetry(maxRetries = 3): Promise<Connection> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const health = await this.testConnection()
        if (health.success) {
          return this.connection
        }
      } catch (error) {
        console.warn(`Connection attempt ${i + 1} failed:`, error)
        if (i === maxRetries - 1) throw error
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
    throw new Error("Failed to establish connection after retries")
  }
}

// Export singleton instance
export const rpcConnectionService = RPCConnectionService.getInstance()
export const solanaConnection = rpcConnectionService.getConnection()
