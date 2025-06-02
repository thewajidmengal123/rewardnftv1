"use client"

import { useState, useEffect, useCallback } from "react"
import type { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js"
import {
  PhantomWalletAdapter,
  type WalletAdapter,
  WalletError,
  defaultConnectionManager,
  detectWalletProviders,
} from "@/utils/wallet-adapter"
import { toast } from "@/components/ui/use-toast"

interface UseSolanaWalletProps {
  autoConnect?: boolean
}

interface UseSolanaWalletReturn {
  wallet: WalletAdapter | null
  publicKey: PublicKey | null
  connected: boolean
  connecting: boolean
  walletProviders: string[]
  solBalance: number | null
  connectWallet: (walletName?: string) => Promise<void>
  disconnectWallet: () => Promise<void>
  signTransaction: <T extends Transaction | VersionedTransaction>(transaction: T) => Promise<T>
  signAllTransactions: <T extends Transaction | VersionedTransaction>(transactions: T[]) => Promise<T[]>
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array; publicKey: PublicKey }>
  refreshBalance: () => Promise<void>
}

export function useSolanaWallet({ autoConnect = false }: UseSolanaWalletProps = {}): UseSolanaWalletReturn {
  const [wallet, setWallet] = useState<WalletAdapter | null>(null)
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null)
  const [connected, setConnected] = useState<boolean>(false)
  const [connecting, setConnecting] = useState<boolean>(false)
  const [walletProviders, setWalletProviders] = useState<string[]>([])
  const [solBalance, setSolBalance] = useState<number | null>(null)

  // Detect available wallet providers
  useEffect(() => {
    if (typeof window !== "undefined") {
      const providers = detectWalletProviders()
      setWalletProviders(providers)
    }
  }, [])

  // Auto-connect if enabled
  useEffect(() => {
    if (autoConnect && walletProviders.includes("phantom") && !connected && !connecting) {
      connectWallet("phantom").catch(console.error)
    }
  }, [autoConnect, walletProviders, connected, connecting])

  // Connect to wallet
  const connectWallet = useCallback(async (walletName = "phantom"): Promise<void> => {
    try {
      setConnecting(true)

      // Currently only supporting Phantom
      if (walletName !== "phantom") {
        throw new WalletError(`Wallet ${walletName} is not supported yet`)
      }

      // Check if Phantom is installed
      if (typeof window === "undefined" || !(window as any).solana?.isPhantom) {
        toast({
          title: "Wallet Not Found",
          description: "Please install Phantom wallet extension",
          variant: "destructive",
        })
        throw new WalletError("Phantom wallet not found")
      }

      const phantomWallet = new PhantomWalletAdapter()
      await phantomWallet.connect()

      setWallet(phantomWallet)
      setPublicKey(phantomWallet.publicKey)
      setConnected(phantomWallet.connected)

      // Get initial balance
      if (phantomWallet.publicKey) {
        try {
          const balance = await defaultConnectionManager.getBalance(phantomWallet.publicKey)
          setSolBalance(balance)
        } catch (error) {
          console.error("Error getting initial balance:", error)
        }
      }

      return
    } catch (error) {
      console.error("Error connecting wallet:", error)

      if (error instanceof WalletError) {
        toast({
          title: "Connection Failed",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Connection Failed",
          description: "Failed to connect to wallet",
          variant: "destructive",
        })
      }

      throw error
    } finally {
      setConnecting(false)
    }
  }, [])

  // Disconnect wallet
  const disconnectWallet = useCallback(async (): Promise<void> => {
    if (wallet) {
      try {
        await wallet.disconnect()
        setWallet(null)
        setPublicKey(null)
        setConnected(false)
        setSolBalance(null)
      } catch (error) {
        console.error("Error disconnecting wallet:", error)
        toast({
          title: "Disconnection Failed",
          description: "Failed to disconnect wallet",
          variant: "destructive",
        })
        throw error
      }
    }
  }, [wallet])

  // Sign transaction
  const signTransaction = useCallback(
    async <T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> => {
      if (!wallet) {
        throw new WalletError("Wallet not connected")
      }

      try {
        return await wallet.signTransaction(transaction)
      } catch (error) {
        console.error("Error signing transaction:", error)
        toast({
          title: "Transaction Signing Failed",
          description: "Failed to sign transaction",
          variant: "destructive",
        })
        throw error
      }
    },
    [wallet],
  )

  // Sign all transactions
  const signAllTransactions = useCallback(
    async <T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]> => {
      if (!wallet) {
        throw new WalletError("Wallet not connected")
      }

      try {
        return await wallet.signAllTransactions(transactions)
      } catch (error) {
        console.error("Error signing transactions:", error)
        toast({
          title: "Transaction Signing Failed",
          description: "Failed to sign transactions",
          variant: "destructive",
        })
        throw error
      }
    },
    [wallet],
  )

  // Sign message
  const signMessage = useCallback(
    async (message: Uint8Array): Promise<{ signature: Uint8Array; publicKey: PublicKey }> => {
      if (!wallet) {
        throw new WalletError("Wallet not connected")
      }

      try {
        return await wallet.signMessage(message)
      } catch (error) {
        console.error("Error signing message:", error)
        toast({
          title: "Message Signing Failed",
          description: "Failed to sign message",
          variant: "destructive",
        })
        throw error
      }
    },
    [wallet],
  )

  // Refresh balance
  const refreshBalance = useCallback(async (): Promise<void> => {
    if (!publicKey) {
      setSolBalance(null)
      return
    }

    try {
      const balance = await defaultConnectionManager.getBalance(publicKey)
      setSolBalance(balance)
    } catch (error) {
      console.error("Error refreshing balance:", error)
      toast({
        title: "Balance Update Failed",
        description: "Failed to update balance",
        variant: "destructive",
      })
    }
  }, [publicKey])

  return {
    wallet,
    publicKey,
    connected,
    connecting,
    walletProviders,
    solBalance,
    connectWallet,
    disconnectWallet,
    signTransaction,
    signAllTransactions,
    signMessage,
    refreshBalance,
  }
}
