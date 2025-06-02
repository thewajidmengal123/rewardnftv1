"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { PublicKey, Connection, Transaction } from "@solana/web3.js"
import { toast } from "@/components/ui/use-toast"
import { enhancedRPCService } from "@/services/enhanced-rpc-service"
import {
  detectWalletProviders,
  getDefaultWallet,
  getWalletAdapter,
  type WalletProviderInfo,
  isMobileDevice,
} from "@/utils/wallet-providers"
import * as WalletPersistence from "@/services/wallet-persistence-service"

interface WalletContextType {
  publicKey: PublicKey | null
  connected: boolean
  connecting: boolean
  reconnecting: boolean
  walletProviders: WalletProviderInfo[]
  selectedWallet: string | null
  currentWallet: string | null
  availableWallets: WalletProviderInfo[]
  connect: (providerName?: string) => Promise<void>
  connectWallet: (providerName?: string) => Promise<void>
  disconnect: () => Promise<void>
  disconnectWallet: () => Promise<void>
  signTransaction: (transaction: Transaction) => Promise<Transaction>
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array; publicKey: PublicKey }>
  connection: Connection
  hasNFT: boolean
  setHasNFT: (value: boolean) => void
  checkNFTOwnership: () => Promise<boolean>
  isCheckingNFT: boolean
  autoConnectEnabled: boolean
  setAutoConnectEnabled: (enabled: boolean) => void
  mintedNFTs: any[]
  setMintedNFTs: (nfts: any[]) => void
  refreshNFTs: () => Promise<void>
  isMobile: boolean
  solBalance: number | null
  usdcBalance: number | null
  preferredWallet: string
  setPreferredWallet: (wallet: string) => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null)
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [reconnecting, setReconnecting] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null)
  const [walletAdapter, setWalletAdapter] = useState<any>(null)
  const [hasNFT, setHasNFT] = useState(false)
  const [isCheckingNFT, setIsCheckingNFT] = useState(false)
  const [autoConnectEnabled, setAutoConnectEnabled] = useState(true)
  const [mintedNFTs, setMintedNFTs] = useState<any[]>([])
  const [solBalance, setSolBalance] = useState<number | null>(null)
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null)
  const [walletProviders, setWalletProviders] = useState<WalletProviderInfo[]>([])
  const [preferredWallet, setPreferredWalletState] = useState("awwallet")

  const isMobile = isMobileDevice()

  // Initialize wallet providers and preferred wallet
  useEffect(() => {
    const providers = detectWalletProviders()
    setWalletProviders(providers)

    const preferred = WalletPersistence.getPreferredWallet()
    setPreferredWalletState(preferred)
  }, [])

  // Auto-reconnect on page load
  useEffect(() => {
    const attemptAutoReconnect = async () => {
      const session = WalletPersistence.getWalletSession()
      const shouldAuto = WalletPersistence.shouldAutoConnect()

      if (!session || !shouldAuto || !WalletPersistence.isSessionValid()) {
        return
      }

      // Check if the wallet from session is still available
      const providers = detectWalletProviders()
      const sessionWallet = providers.find((p) => p.name === session.walletName && p.installed)

      if (!sessionWallet) {
        // Wallet no longer available, clear session
        WalletPersistence.clearWalletSession()
        return
      }

      try {
        setReconnecting(true)
        await connectToWallet(session.walletName, true)
      } catch (error) {
        console.error("Auto-reconnect failed:", error)
        WalletPersistence.clearWalletSession()
      } finally {
        setReconnecting(false)
      }
    }

    // Wait for providers to be detected
    if (walletProviders.length > 0) {
      attemptAutoReconnect()
    }
  }, [walletProviders])

  // Cross-tab synchronization
  useEffect(() => {
    const cleanup = WalletPersistence.setupCrossTabSync(() => {
      const session = WalletPersistence.getWalletSession()
      if (session && WalletPersistence.isSessionValid()) {
        // Another tab connected
        if (!connected || selectedWallet !== session.walletName) {
          connectToWallet(session.walletName, true)
        }
      } else if (!session && connected) {
        // Another tab disconnected
        handleDisconnect(true)
      }
    })

    return cleanup
  }, [connected, selectedWallet])

  // Connect to specific wallet
  const connectToWallet = useCallback(async (walletName: string, silent = false) => {
    try {
      if (!silent) setConnecting(true)

      const adapter = getWalletAdapter(walletName)
      if (!adapter) {
        throw new Error(`${walletName} wallet not found`)
      }

      // Connect based on wallet type
      let result
      if (walletName === "awwallet") {
        result = await adapter.connect()
      } else if (walletName === "phantom") {
        result = await adapter.connect()
      } else if (walletName === "solflare") {
        await adapter.connect()
        result = { publicKey: adapter.publicKey }
      } else {
        result = await adapter.connect()
      }

      const pubKey = result.publicKey
      if (!pubKey) {
        throw new Error("No public key received from wallet")
      }

      // Create PublicKey object
      const publicKeyObj =
        typeof pubKey === "string" ? ({ toString: () => pubKey, toBase58: () => pubKey } as PublicKey) : pubKey

      setWalletAdapter(adapter)
      setSelectedWallet(walletName)
      setPublicKey(publicKeyObj)
      setConnected(true)

      // Save session
      WalletPersistence.saveWalletSession(walletName, publicKeyObj.toString())

      // Set as preferred if it's awwallet
      if (walletName === "awwallet") {
        setPreferredWallet("awwallet")
      }

      // Mock balances for demo
      setSolBalance(2.5)
      setUsdcBalance(4000)

      // Check NFTs
      await checkNFTOwnership()
      await refreshNFTs()

      if (!silent) {
        toast({
          title: "Wallet Connected",
          description: `Connected to ${walletName} (${publicKeyObj.toString().slice(0, 4)}...${publicKeyObj.toString().slice(-4)})`,
        })
      }
    } catch (error: any) {
      console.error(`Error connecting to ${walletName}:`, error)
      if (!silent) {
        toast({
          title: "Connection Failed",
          description: error.message || `Failed to connect to ${walletName}`,
          variant: "destructive",
        })
      }
      throw error
    } finally {
      if (!silent) setConnecting(false)
    }
  }, [])

  // Main connect function
  const connectWallet = useCallback(
    async (providerName?: string) => {
      const walletToConnect = providerName || preferredWallet || getDefaultWallet() || "awwallet"

      // Check if wallet is installed
      const providers = detectWalletProviders()
      const provider = providers.find((p) => p.name === walletToConnect)

      if (!provider?.installed) {
        toast({
          title: "Wallet Not Found",
          description: `${walletToConnect} is not installed. Please install it first.`,
          variant: "destructive",
        })
        return
      }

      await connectToWallet(walletToConnect)
    },
    [preferredWallet, connectToWallet],
  )

  // Disconnect function
  const handleDisconnect = useCallback(
    async (silent = false) => {
      try {
        if (walletAdapter?.disconnect) {
          await walletAdapter.disconnect()
        }
      } catch (error) {
        console.error("Error during wallet disconnect:", error)
      }

      setWalletAdapter(null)
      setSelectedWallet(null)
      setPublicKey(null)
      setConnected(false)
      setHasNFT(false)
      setMintedNFTs([])
      setSolBalance(null)
      setUsdcBalance(null)

      WalletPersistence.clearWalletSession()

      if (!silent) {
        toast({
          title: "Wallet Disconnected",
          description: "Your wallet has been disconnected",
        })
      }
    },
    [walletAdapter],
  )

  // Set preferred wallet
  const setPreferredWallet = useCallback((wallet: string) => {
    setPreferredWalletState(wallet)
    WalletPersistence.setPreferredWallet(wallet)
  }, [])

  // Sign transaction
  const signTransaction = useCallback(
    async (transaction: Transaction): Promise<Transaction> => {
      if (!walletAdapter || !connected) {
        throw new Error("Wallet not connected")
      }
      return await walletAdapter.signTransaction(transaction)
    },
    [walletAdapter, connected],
  )

  // Sign message
  const signMessage = useCallback(
    async (message: Uint8Array) => {
      if (!walletAdapter || !connected) {
        throw new Error("Wallet not connected")
      }
      return await walletAdapter.signMessage(message)
    },
    [walletAdapter, connected],
  )

  // Check NFT ownership
  const checkNFTOwnership = useCallback(async (): Promise<boolean> => {
    if (!connected || !publicKey) return false

    setIsCheckingNFT(true)
    try {
      const mintedNFTsData = localStorage.getItem(`minted_nfts_${publicKey.toString()}`)
      const nfts = mintedNFTsData ? JSON.parse(mintedNFTsData) : []
      const hasMinted = nfts.length > 0
      setHasNFT(hasMinted)
      setMintedNFTs(nfts)
      return hasMinted
    } catch (error) {
      console.error("Error checking NFT ownership:", error)
      return false
    } finally {
      setIsCheckingNFT(false)
    }
  }, [connected, publicKey])

  // Refresh NFTs
  const refreshNFTs = useCallback(async () => {
    if (!connected || !publicKey) return

    try {
      const mintedNFTsData = localStorage.getItem(`minted_nfts_${publicKey.toString()}`)
      const nfts = mintedNFTsData ? JSON.parse(mintedNFTsData) : []
      setMintedNFTs(nfts)
      setHasNFT(nfts.length > 0)
    } catch (error) {
      console.error("Error refreshing NFTs:", error)
    }
  }, [connected, publicKey])

  const value = {
    publicKey,
    connected,
    connecting,
    reconnecting,
    walletProviders,
    selectedWallet,
    currentWallet: selectedWallet,
    availableWallets: walletProviders,
    connect: connectWallet,
    connectWallet,
    disconnect: handleDisconnect,
    disconnectWallet: handleDisconnect,
    signTransaction,
    signMessage,
    connection: enhancedRPCService.getConnection(),
    hasNFT,
    setHasNFT,
    checkNFTOwnership,
    isCheckingNFT,
    autoConnectEnabled,
    setAutoConnectEnabled,
    mintedNFTs,
    setMintedNFTs,
    refreshNFTs,
    isMobile,
    solBalance,
    usdcBalance,
    preferredWallet,
    setPreferredWallet,
  }

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}
