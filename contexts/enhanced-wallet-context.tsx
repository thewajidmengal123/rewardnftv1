"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { PublicKey, Connection } from "@solana/web3.js"
import { toast } from "@/components/ui/use-toast"
import { PhantomWalletAdapter, WalletError, defaultConnectionManager } from "@/utils/wallet-adapter"
import { detectWalletProviders } from "@/utils/wallet-providers"
import * as WalletPersistence from "@/services/wallet-persistence-service"

// Define the wallet context type
interface WalletContextType {
  publicKey: PublicKey | null
  connected: boolean
  connecting: boolean
  walletProviders: string[]
  selectedWallet: string | null
  connect: (providerName?: string) => Promise<void>
  disconnect: () => Promise<void>
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array; publicKey: PublicKey }>
  connection: Connection
  hasNFT: boolean
  setHasNFT: (value: boolean) => void
  checkNFTOwnership: () => Promise<boolean>
  isCheckingNFT: boolean
  autoConnectEnabled: boolean
  setAutoConnectEnabled: (enabled: boolean) => void
  connectionPreferences: WalletPersistence.WalletConnectionPreferences
  updateConnectionPreferences: (prefs: Partial<WalletPersistence.WalletConnectionPreferences>) => void
  reconnecting: boolean
}

// Create the wallet context
const WalletContext = createContext<WalletContextType | undefined>(undefined)

// Create the wallet provider component
export function EnhancedWalletProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null)
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [reconnecting, setReconnecting] = useState(false)
  const [walletProviders, setWalletProviders] = useState<string[]>([])
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null)
  const [adapter, setAdapter] = useState<PhantomWalletAdapter | null>(null)
  const [hasNFT, setHasNFT] = useState(false)
  const [isCheckingNFT, setIsCheckingNFT] = useState(false)
  const [autoConnectEnabled, setAutoConnectEnabled] = useState(true)
  const [connectionPreferences, setConnectionPreferences] = useState<WalletPersistence.WalletConnectionPreferences>(
    WalletPersistence.getConnectionPreferences(),
  )

  // Update connection preferences
  const updateConnectionPreferences = useCallback((prefs: Partial<WalletPersistence.WalletConnectionPreferences>) => {
    WalletPersistence.saveConnectionPreferences(prefs)
    setConnectionPreferences((prev) => ({ ...prev, ...prefs }))
  }, [])

  // Initialize wallet providers
  useEffect(() => {
    const providers = detectWalletProviders()
    setWalletProviders(providers)

    // Initialize adapter
    const phantomAdapter = new PhantomWalletAdapter()
    setAdapter(phantomAdapter)

    // Load auto-connect preference
    const preferences = WalletPersistence.getConnectionPreferences()
    setAutoConnectEnabled(preferences.autoConnect)
    setConnectionPreferences(preferences)

    // Setup cross-browser sync
    const cleanup = WalletPersistence.setupCrossBrowserSync(() => {
      // When wallet state changes in another tab
      const currentWallet = WalletPersistence.getSelectedWallet()
      if (currentWallet && currentWallet !== selectedWallet) {
        // Another tab connected a wallet
        if (providers.includes(currentWallet) && preferences.autoConnect) {
          connectWallet(currentWallet, true)
        }
      } else if (!currentWallet && selectedWallet) {
        // Another tab disconnected the wallet
        disconnectWallet(true)
      }
    })

    return cleanup
  }, [])

  // Auto-reconnect on page load if session is valid
  useEffect(() => {
    const attemptReconnection = async () => {
      const persistedWallet = WalletPersistence.getSelectedWallet()
      const sessionValid = WalletPersistence.isSessionValid()
      const shouldAutoConnect = WalletPersistence.shouldAutoConnect()

      if (persistedWallet && sessionValid && shouldAutoConnect && walletProviders.includes(persistedWallet)) {
        try {
          setReconnecting(true)
          await connectWallet(persistedWallet, true)
        } catch (error) {
          console.error("Auto-reconnection failed:", error)
        } finally {
          setReconnecting(false)
        }
      }
    }

    if (adapter && walletProviders.length > 0 && !connected && !connecting) {
      attemptReconnection()
    }
  }, [adapter, walletProviders, connected, connecting])

  // Refresh session periodically when connected
  useEffect(() => {
    if (connected) {
      // Refresh session timestamp every 5 minutes to extend it
      const intervalId = setInterval(
        () => {
          WalletPersistence.refreshSession()
        },
        5 * 60 * 1000,
      )

      return () => clearInterval(intervalId)
    }
  }, [connected])

  // Connect to wallet
  const connectWallet = useCallback(
    async (providerName?: string, isReconnect = false) => {
      if (!adapter) return

      try {
        if (!isReconnect) {
          setConnecting(true)
        }

        await adapter.connect()

        const walletName = providerName || "phantom"
        setSelectedWallet(walletName)

        // Save connection state
        WalletPersistence.saveSelectedWallet(walletName)
        if (adapter.publicKey) {
          WalletPersistence.saveWalletAddress(adapter.publicKey.toString())
        }

        setPublicKey(adapter.publicKey)
        setConnected(true)

        // Check if user has NFT after connecting
        checkNFTOwnership()

        if (!isReconnect) {
          toast({
            title: "Wallet Connected",
            description: `Successfully connected to ${adapter.publicKey?.toString().slice(0, 4)}...${adapter.publicKey?.toString().slice(-4)}`,
          })
        }
      } catch (error) {
        console.error("Error connecting wallet:", error)

        if (!isReconnect) {
          const errorMessage =
            error instanceof WalletError ? error.message : "Failed to connect wallet. Please try again."

          toast({
            title: "Connection Failed",
            description: errorMessage,
            variant: "destructive",
          })
        }
      } finally {
        if (!isReconnect) {
          setConnecting(false)
        }
      }
    },
    [adapter],
  )

  // Disconnect wallet
  const disconnectWallet = useCallback(
    async (silent = false) => {
      if (!adapter) return

      try {
        await adapter.disconnect()
        setPublicKey(null)
        setConnected(false)
        setSelectedWallet(null)
        setHasNFT(false)

        // Clear persisted data
        WalletPersistence.clearWalletData()

        if (!silent) {
          toast({
            title: "Wallet Disconnected",
            description: "Your wallet has been disconnected",
          })
        }
      } catch (error) {
        console.error("Error disconnecting wallet:", error)

        if (!silent) {
          toast({
            title: "Disconnection Failed",
            description: "Failed to disconnect wallet. Please try again.",
            variant: "destructive",
          })
        }
      }
    },
    [adapter],
  )

  // Sign message
  const signMessage = useCallback(
    async (message: Uint8Array) => {
      if (!adapter || !connected) {
        throw new WalletError("Wallet not connected")
      }

      try {
        return await adapter.signMessage(message)
      } catch (error) {
        console.error("Error signing message:", error)
        throw new WalletError("Failed to sign message", error as Error)
      }
    },
    [adapter, connected],
  )

  // Check if user has minted an NFT
  const checkNFTOwnership = useCallback(async (): Promise<boolean> => {
    if (!connected || !publicKey) return false

    setIsCheckingNFT(true)
    try {
      // In a real implementation, you would query the blockchain
      // For this demo, we'll use localStorage to simulate NFT ownership
      const hasMinted = localStorage.getItem(`nft_minted_${publicKey.toString()}`) === "true"

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      setHasNFT(hasMinted)
      return hasMinted
    } catch (error) {
      console.error("Error checking NFT ownership:", error)
      return false
    } finally {
      setIsCheckingNFT(false)
    }
  }, [connected, publicKey])

  // Update auto-connect setting
  useEffect(() => {
    WalletPersistence.setAutoConnect(autoConnectEnabled)
  }, [autoConnectEnabled])

  // Context value
  const value = {
    publicKey,
    connected,
    connecting,
    walletProviders,
    selectedWallet,
    connect: connectWallet,
    disconnect: disconnectWallet,
    signMessage,
    connection: defaultConnectionManager.connection,
    hasNFT,
    setHasNFT,
    checkNFTOwnership,
    isCheckingNFT,
    autoConnectEnabled,
    setAutoConnectEnabled,
    connectionPreferences,
    updateConnectionPreferences,
    reconnecting,
  }

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

// Create the useWallet hook
export function useEnhancedWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useEnhancedWallet must be used within a EnhancedWalletProvider")
  }
  return context
}
