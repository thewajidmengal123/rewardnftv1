"use client"

import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js"
import { 
  isMobileDevice, 
  isInWalletBrowser, 
  redirectToWalletApp,
  getPendingConnection,
  clearPendingConnection
} from "./mobile-wallet-adapter"

// ==================== ERRORS ====================

export class WalletError extends Error {
  constructor(message: string, public code?: number) {
    super(message)
    this.name = "WalletError"
  }
}

export class WalletNotConnectedError extends WalletError {
  constructor() {
    super("Wallet not connected")
    this.name = "WalletNotConnectedError"
  }
}

export class WalletNotFoundError extends WalletError {
  constructor(walletName: string) {
    super(`${walletName} wallet not found`)
    this.name = "WalletNotFoundError"
  }
}

export class WalletConnectionError extends WalletError {
  constructor(message: string) {
    super(`Connection failed: ${message}`)
    this.name = "WalletConnectionError"
  }
}

// ==================== ADAPTER INTERFACE ====================

export enum WalletReadyState {
  Installed = "Installed",
  NotDetected = "NotDetected", 
  Loadable = "Loadable",
  Unsupported = "Unsupported",
}

export interface BaseWalletAdapter {
  name: string
  url: string
  icon: string
  readyState: WalletReadyState
  publicKey: PublicKey | null
  connecting: boolean
  connected: boolean
  
  connect(): Promise<void>
  disconnect(): Promise<void>
  signTransaction?(transaction: Transaction | VersionedTransaction): Promise<Transaction | VersionedTransaction>
  signAllTransactions?(transactions: (Transaction | VersionedTransaction)[]): Promise<(Transaction | VersionedTransaction)[]>
  signMessage?(message: Uint8Array): Promise<Uint8Array>
}

// ==================== PHANTOM ADAPTER ====================

export class PhantomWalletAdapter implements BaseWalletAdapter {
  name = "Phantom"
  url = "https://phantom.app"
  icon = "/images/phantom-icon.png"
  
  private _provider: any
  private _publicKey: PublicKey | null = null
  private _connecting = false
  private _connected = false

  constructor() {
    if (typeof window !== "undefined") {
      this._initializeProvider()
    }
  }

  private _initializeProvider(): void {
    this._provider = (window as any).solana || (window as any).phantom?.solflare
    
    if (this._provider?.isConnected && this._provider?.publicKey) {
      this._publicKey = new PublicKey(this._provider.publicKey.toString())
      this._connected = true
      this._setupEventListeners()
    }
  }

  private _setupEventListeners(): void {
    if (!this._provider) return
    
    this._provider.on?.("accountChanged", (publicKey: any) => {
      if (publicKey) {
        this._publicKey = new PublicKey(publicKey.toString())
        this._connected = true
      } else {
        this._publicKey = null
        this._connected = false
      }
    })

    this._provider.on?.("disconnect", () => {
      this._publicKey = null
      this._connected = false
    })
  }

  get readyState(): WalletReadyState {
    if (typeof window === "undefined") return WalletReadyState.Unsupported
    if (this._provider?.isPhantom) return WalletReadyState.Installed
    if (isMobileDevice()) return WalletReadyState.Loadable
    return WalletReadyState.NotDetected
  }

  get publicKey(): PublicKey | null {
    return this._publicKey
  }

  get connecting(): boolean {
    return this._connecting
  }

  get connected(): boolean {
    return this._connected
  }

  async connect(): Promise<void> {
    try {
      if (this._connecting || this._connected) return

      // Check if returning from mobile redirect
      const pending = getPendingConnection()
      if (pending?.wallet === 'phantom') {
        clearPendingConnection()
        await new Promise(r => setTimeout(r, 500))
        this._initializeProvider()
        
        if (this._connected && this._publicKey) {
          return
        }
      }

      // Mobile: redirect to app
      if (isMobileDevice() && !isInWalletBrowser()) {
        redirectToWalletApp('phantom')
        return new Promise(() => {}) // Never resolves, page reloads
      }

      // Desktop: normal connect
      if (!this._provider) {
        throw new WalletNotFoundError("Phantom")
      }

      this._connecting = true

      try {
        await this._provider.connect({ onlyIfTrusted: true })
      } catch (silentError) {
        await this._provider.connect()
      }

      if (!this._provider.publicKey) {
        throw new WalletConnectionError("No public key returned")
      }

      this._publicKey = new PublicKey(this._provider.publicKey.toString())
      this._connected = true
      this._setupEventListeners()

    } catch (error: any) {
      if (error.code === 4001) {
        throw new WalletConnectionError("User rejected the connection request")
      }
      throw new WalletConnectionError(error.message || "Unknown error")
    } finally {
      this._connecting = false
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this._provider && this._connected) {
        await this._provider.disconnect()
      }
    } catch (error) {
      console.warn("Error disconnecting:", error)
    } finally {
      this._publicKey = null
      this._connected = false
      this._connecting = false
      clearPendingConnection()
    }
  }

  async signTransaction(transaction: Transaction | VersionedTransaction): Promise<Transaction | VersionedTransaction> {
    if (!this._connected || !this._provider) throw new WalletNotConnectedError()
    try {
      return await this._provider.signTransaction(transaction)
    } catch (error: any) {
      throw new WalletError(`Signing failed: ${error.message}`)
    }
  }

  async signAllTransactions(transactions: (Transaction | VersionedTransaction)[]): Promise<(Transaction | VersionedTransaction)[]> {
    if (!this._connected || !this._provider) throw new WalletNotConnectedError()
    try {
      return await this._provider.signAllTransactions(transactions)
    } catch (error: any) {
      throw new WalletError(`Signing failed: ${error.message}`)
    }
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    if (!this._connected || !this._provider) throw new WalletNotConnectedError()
    try {
      const response = await this._provider.signMessage(message)
      return response.signature
    } catch (error: any) {
      throw new WalletError(`Signing failed: ${error.message}`)
    }
  }
}

// ==================== SOLFLARE ADAPTER ====================

export class SolflareWalletAdapter implements BaseWalletAdapter {
  name = "Solflare"
  url = "https://solflare.com"
  icon = "/images/solflare-icon.png"
  
  private _provider: any
  private _publicKey: PublicKey | null = null
  private _connecting = false
  private _connected = false

  constructor() {
    if (typeof window !== "undefined") {
      this._initializeProvider()
    }
  }

  private _initializeProvider(): void {
    this._provider = (window as any).solflare
    
    if (this._provider?.isConnected && this._provider?.publicKey) {
      this._publicKey = new PublicKey(this._provider.publicKey.toString())
      this._connected = true
      this._setupEventListeners()
    }
  }

  private _setupEventListeners(): void {
    if (!this._provider) return
    
    this._provider.on?.("accountChanged", (publicKey: any) => {
      if (publicKey) {
        this._publicKey = new PublicKey(publicKey.toString())
        this._connected = true
      } else {
        this._publicKey = null
        this._connected = false
      }
    })

    this._provider.on?.("disconnect", () => {
      this._publicKey = null
      this._connected = false
    })
  }

  get readyState(): WalletReadyState {
    if (typeof window === "undefined") return WalletReadyState.Unsupported
    if (this._provider?.isSolflare) return WalletReadyState.Installed
    if (isMobileDevice()) return WalletReadyState.Loadable
    return WalletReadyState.NotDetected
  }

  get publicKey(): PublicKey | null {
    return this._publicKey
  }

  get connecting(): boolean {
    return this._connecting
  }

  get connected(): boolean {
    return this._connected
  }

  async connect(): Promise<void> {
    try {
      if (this._connecting || this._connected) return

      const pending = getPendingConnection()
      if (pending?.wallet === 'solflare') {
        clearPendingConnection()
        await new Promise(r => setTimeout(r, 500))
        this._initializeProvider()
        
        if (this._connected && this._publicKey) {
          return
        }
      }

      if (isMobileDevice() && !isInWalletBrowser()) {
        redirectToWalletApp('solflare')
        return new Promise(() => {})
      }

      if (!this._provider) {
        throw new WalletNotFoundError("Solflare")
      }

      this._connecting = true

      try {
        await this._provider.connect({ onlyIfTrusted: true })
      } catch (silentError) {
        await this._provider.connect()
      }

      if (!this._provider.publicKey) {
        throw new WalletConnectionError("No public key returned")
      }

      this._publicKey = new PublicKey(this._provider.publicKey.toString())
      this._connected = true
      this._setupEventListeners()

    } catch (error: any) {
      if (error.code === 4001) {
        throw new WalletConnectionError("User rejected the connection request")
      }
      throw new WalletConnectionError(error.message || "Unknown error")
    } finally {
      this._connecting = false
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this._provider && this._connected) {
        await this._provider.disconnect()
      }
    } catch (error) {
      console.warn("Error disconnecting:", error)
    } finally {
      this._publicKey = null
      this._connected = false
      this._connecting = false
      clearPendingConnection()
    }
  }

  async signTransaction(transaction: Transaction | VersionedTransaction): Promise<Transaction | VersionedTransaction> {
    if (!this._connected || !this._provider) throw new WalletNotConnectedError()
    try {
      return await this._provider.signTransaction(transaction)
    } catch (error: any) {
      throw new WalletError(`Signing failed: ${error.message}`)
    }
  }

  async signAllTransactions(transactions: (Transaction | VersionedTransaction)[]): Promise<(Transaction | VersionedTransaction)[]> {
    if (!this._connected || !this._provider) throw new WalletNotConnectedError()
    try {
      return await this._provider.signAllTransactions(transactions)
    } catch (error: any) {
      throw new WalletError(`Signing failed: ${error.message}`)
    }
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    if (!this._connected || !this._provider) throw new WalletNotConnectedError()
    try {
      const response = await this._provider.signMessage(message)
      return response.signature
    } catch (error: any) {
      throw new WalletError(`Signing failed: ${error.message}`)
    }
  }
}

// ==================== FACTORY ====================

export function createWalletAdapter(walletName: string): BaseWalletAdapter | null {
  switch (walletName.toLowerCase()) {
    case "phantom":
      return new PhantomWalletAdapter()
    case "solflare":
      return new SolflareWalletAdapter()
    default:
      return null
  }
}

export function getAvailableWalletAdapters(): BaseWalletAdapter[] {
  const adapters: BaseWalletAdapter[] = []
  
  const phantom = new PhantomWalletAdapter()
  if (phantom.readyState !== WalletReadyState.Unsupported) {
    adapters.push(phantom)
  }
  
  const solflare = new SolflareWalletAdapter()
  if (solflare.readyState !== WalletReadyState.Unsupported) {
    adapters.push(solflare)
  }
  
  return adapters
}
