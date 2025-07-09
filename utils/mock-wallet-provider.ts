import { PublicKey, type Transaction } from "@solana/web3.js"
import { generateRandomWalletAddress, generateRandomTransactionSignature } from "./test-data-generator"

// Mock wallet provider for testing
export class MockWalletProvider {
  private _publicKey: PublicKey | null = null
  private _connected = false
  private _solBalance = 0
  private _usdcBalance = 0

  constructor(initialState?: {
    connected?: boolean
    publicKey?: string
    solBalance?: number
    usdcBalance?: number
  }) {
    if (initialState) {
      this._connected = initialState.connected || false
      this._publicKey = initialState.publicKey ? new PublicKey(initialState.publicKey) : null
      this._solBalance = initialState.solBalance || 0
      this._usdcBalance = initialState.usdcBalance || 0
    }
  }

  // Connect to wallet
  async connect(): Promise<{ publicKey: PublicKey }> {
    if (!this._publicKey) {
      this._publicKey = new PublicKey(generateRandomWalletAddress())
    }

    this._connected = true
    return { publicKey: this._publicKey }
  }

  // Disconnect from wallet
  async disconnect(): Promise<void> {
    this._connected = false
  }

  // Sign and send transaction
  async signAndSendTransaction(transaction: Transaction): Promise<{ signature: string }> {
    if (!this._connected || !this._publicKey) {
      throw new Error("Wallet not connected")
    }

    // Simulate transaction processing
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Generate a random signature
    const signature = generateRandomTransactionSignature()

    return { signature }
  }

  // Sign transaction
  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this._connected || !this._publicKey) {
      throw new Error("Wallet not connected")
    }

    // Simulate transaction signing
    await new Promise((resolve) => setTimeout(resolve, 500))

    return transaction
  }

  // Get wallet state
  getState() {
    return {
      connected: this._connected,
      publicKey: this._publicKey,
      solBalance: this._solBalance,
      usdcBalance: this._usdcBalance,
    }
  }

  // Set wallet state (for testing)
  setState(state: {
    connected?: boolean
    publicKey?: string
    solBalance?: number
    usdcBalance?: number
  }) {
    if (state.connected !== undefined) this._connected = state.connected
    if (state.publicKey) this._publicKey = new PublicKey(state.publicKey)
    if (state.solBalance !== undefined) this._solBalance = state.solBalance
    if (state.usdcBalance !== undefined) this._usdcBalance = state.usdcBalance
  }
}
