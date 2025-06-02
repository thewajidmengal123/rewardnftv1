import {
  Connection,
  PublicKey,
  type Transaction,
  type VersionedTransaction,
  type SendOptions,
  type Commitment,
} from "@solana/web3.js"
import { toast } from "@/components/ui/use-toast"

// Define the wallet adapter interface
export interface WalletAdapter {
  publicKey: PublicKey | null
  connected: boolean
  connecting: boolean
  disconnect(): Promise<void>
  connect(): Promise<void>
  signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T>
  signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]>
  signMessage(message: Uint8Array): Promise<{ signature: Uint8Array; publicKey: PublicKey }>
}

// Define the wallet error class
export class WalletError extends Error {
  constructor(message?: string, error?: Error) {
    super(message)
    this.name = "WalletError"
    if (error) {
      this.cause = error
    }
  }
}

// Define the connection manager
export class ConnectionManager {
  private _connection: Connection | null = null
  private _endpoint: string
  private _commitment: Commitment

  constructor(endpoint: string, commitment: Commitment = "confirmed") {
    this._endpoint = endpoint
    this._commitment = commitment
  }

  get connection(): Connection {
    if (!this._connection) {
      this._connection = new Connection(this._endpoint, this._commitment)
    }
    return this._connection
  }

  updateEndpoint(endpoint: string, commitment?: Commitment): void {
    this._endpoint = endpoint
    if (commitment) {
      this._commitment = commitment
    }
    this._connection = new Connection(this._endpoint, this._commitment)
  }

  async getBalance(publicKey: PublicKey): Promise<number> {
    try {
      const balance = await this.connection.getBalance(publicKey)
      return balance / 10 ** 9 // Convert lamports to SOL
    } catch (error) {
      console.error("Error getting balance:", error)
      throw new WalletError("Failed to get balance", error as Error)
    }
  }

  async sendAndConfirmTransaction(
    transaction: Transaction,
    signers: Array<any>,
    options?: SendOptions,
  ): Promise<string> {
    try {
      return await this.connection.sendTransaction(transaction, signers, options)
    } catch (error) {
      console.error("Error sending transaction:", error)
      throw new WalletError("Failed to send transaction", error as Error)
    }
  }
}

// Phantom wallet adapter implementation
export class PhantomWalletAdapter implements WalletAdapter {
  private _publicKey: PublicKey | null = null
  private _connected = false
  private _connecting = false
  private _provider: any

  constructor() {
    if (typeof window !== "undefined") {
      this._provider = (window as any).solana
    }
  }

  get publicKey(): PublicKey | null {
    return this._publicKey
  }

  get connected(): boolean {
    return this._connected
  }

  get connecting(): boolean {
    return this._connecting
  }

  get provider(): any {
    return this._provider
  }

  async connect(): Promise<void> {
    try {
      if (this._connecting || this._connected) return
      if (!this._provider) throw new WalletError("Phantom wallet not found")

      this._connecting = true

      try {
        const response = await this._provider.connect()
        this._publicKey = new PublicKey(response.publicKey.toString())
        this._connected = true

        toast({
          title: "Wallet Connected",
          description: `Connected to ${this._publicKey.toString().slice(0, 4)}...${this._publicKey.toString().slice(-4)}`,
        })
      } catch (error: any) {
        if (error.code === 4001) {
          throw new WalletError("User rejected the connection request")
        } else {
          throw new WalletError("Failed to connect to Phantom wallet", error)
        }
      }
    } catch (error) {
      throw error
    } finally {
      this._connecting = false
    }
  }

  async disconnect(): Promise<void> {
    if (this._provider) {
      try {
        await this._provider.disconnect()
        this._publicKey = null
        this._connected = false

        toast({
          title: "Wallet Disconnected",
          description: "Your wallet has been disconnected",
        })
      } catch (error) {
        console.error("Error disconnecting wallet:", error)
        throw new WalletError("Failed to disconnect wallet", error as Error)
      }
    }
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> {
    if (!this._provider) throw new WalletError("Phantom wallet not found")
    if (!this._connected) throw new WalletError("Wallet not connected")

    try {
      return await this._provider.signTransaction(transaction)
    } catch (error) {
      console.error("Error signing transaction:", error)
      throw new WalletError("Failed to sign transaction", error as Error)
    }
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]> {
    if (!this._provider) throw new WalletError("Phantom wallet not found")
    if (!this._connected) throw new WalletError("Wallet not connected")

    try {
      return await this._provider.signAllTransactions(transactions)
    } catch (error) {
      console.error("Error signing transactions:", error)
      throw new WalletError("Failed to sign transactions", error as Error)
    }
  }

  async signMessage(message: Uint8Array): Promise<{ signature: Uint8Array; publicKey: PublicKey }> {
    if (!this._provider) throw new WalletError("Phantom wallet not found")
    if (!this._connected) throw new WalletError("Wallet not connected")

    try {
      const { signature, publicKey } = await this._provider.signMessage(message)
      return { signature, publicKey: new PublicKey(publicKey.toString()) }
    } catch (error) {
      console.error("Error signing message:", error)
      throw new WalletError("Failed to sign message", error as Error)
    }
  }
}

// Create a wallet adapter registry to support multiple wallet providers
export class WalletAdapterRegistry {
  private _adapters: Map<string, WalletAdapter> = new Map()
  private _activeAdapter: WalletAdapter | null = null

  registerAdapter(name: string, adapter: WalletAdapter): void {
    this._adapters.set(name, adapter)
  }

  getAdapter(name: string): WalletAdapter | undefined {
    return this._adapters.get(name)
  }

  get activeAdapter(): WalletAdapter | null {
    return this._activeAdapter
  }

  setActiveAdapter(name: string): void {
    const adapter = this._adapters.get(name)
    if (adapter) {
      this._activeAdapter = adapter
    } else {
      throw new WalletError(`Wallet adapter '${name}' not found`)
    }
  }

  get availableAdapters(): string[] {
    return Array.from(this._adapters.keys())
  }
}

// Helper function to detect available wallet providers
export function detectWalletProviders(): string[] {
  if (typeof window === "undefined") return []

  const providers: string[] = []

  if ((window as any).solana?.isPhantom) {
    providers.push("phantom")
  }

  if ((window as any).solflare) {
    providers.push("solflare")
  }

  // Add more wallet detections as needed

  return providers
}

// Initialize a default connection manager
export const defaultConnectionManager = new ConnectionManager(
  process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC || "https://api.devnet.solana.com",
)

// Initialize a wallet adapter registry
export const walletRegistry = new WalletAdapterRegistry()

// Register the Phantom wallet adapter by default
if (typeof window !== "undefined") {
  walletRegistry.registerAdapter("phantom", new PhantomWalletAdapter())
}
