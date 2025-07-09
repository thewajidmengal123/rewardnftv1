import { Connection, type Commitment } from "@solana/web3.js"
import { APP_CONFIG } from "@/config/app"

interface RPCEndpoint {
  url: string
  name: string
  priority: number
}

export class EnhancedRPCService {
  private static instance: EnhancedRPCService
  private connections: Map<string, Connection> = new Map()
  private endpoints: RPCEndpoint[]
  private currentEndpoint: RPCEndpoint
  private healthStatus: Map<string, boolean> = new Map()

  private constructor() {
    // Configure RPC endpoints in priority order
    this.endpoints = [
      {
        url: APP_CONFIG.rpc.primary,
        name: "QuickNode",
        priority: 1,
      },
      {
        url: APP_CONFIG.rpc.fallback,
        name: "Solana Labs",
        priority: 2,
      },
    ]
    this.currentEndpoint = this.endpoints[0]
    this.initializeConnections()
  }

  public static getInstance(): EnhancedRPCService {
    if (!EnhancedRPCService.instance) {
      EnhancedRPCService.instance = new EnhancedRPCService()
    }
    return EnhancedRPCService.instance
  }

  private initializeConnections(): void {
    this.endpoints.forEach((endpoint) => {
      const connection = new Connection(endpoint.url, {
        commitment: "confirmed" as Commitment,
        confirmTransactionInitialTimeout: 60000,
        disableRetryOnRateLimit: false,
        httpHeaders: {
          "Content-Type": "application/json",
          "User-Agent": `${APP_CONFIG.name}/v${APP_CONFIG.version}`,
        },
      })
      this.connections.set(endpoint.url, connection)
    })
  }

  public async getHealthyConnection(): Promise<Connection> {
    // Try current endpoint first
    if (await this.testEndpointHealth(this.currentEndpoint)) {
      return this.connections.get(this.currentEndpoint.url)!
    }

    // Try fallback endpoint
    const fallbackEndpoint = this.endpoints[1]
    if (await this.testEndpointHealth(fallbackEndpoint)) {
      this.currentEndpoint = fallbackEndpoint
      return this.connections.get(fallbackEndpoint.url)!
    }

    // Return primary even if unhealthy
    console.warn("All RPC endpoints appear unhealthy, using primary endpoint")
    return this.connections.get(this.endpoints[0].url)!
  }

  private async testEndpointHealth(endpoint: RPCEndpoint): Promise<boolean> {
    try {
      const connection = this.connections.get(endpoint.url)!
      const startTime = Date.now()
      await connection.getBlockHeight()
      const latency = Date.now() - startTime

      const isHealthy = latency < 5000 // 5 second timeout
      this.healthStatus.set(endpoint.url, isHealthy)
      return isHealthy
    } catch (error) {
      this.healthStatus.set(endpoint.url, false)
      return false
    }
  }

  public async getConnectionStatus(): Promise<{
    current: string
    endpoints: Array<{
      name: string
      url: string
      healthy: boolean
      latency?: number
    }>
  }> {
    const endpointStatus = await Promise.all(
      this.endpoints.map(async (endpoint) => {
        const startTime = Date.now()
        const healthy = await this.testEndpointHealth(endpoint)
        const latency = healthy ? Date.now() - startTime : undefined

        return {
          name: endpoint.name,
          url: endpoint.url,
          healthy,
          latency,
        }
      }),
    )

    return {
      current: this.currentEndpoint.name,
      endpoints: endpointStatus,
    }
  }

  public getConnection(): Connection {
    return this.connections.get(this.currentEndpoint.url)!
  }
}

// Export singleton instance
export const enhancedRPCService = EnhancedRPCService.getInstance()
