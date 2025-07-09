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
import {
  connectToMobileWallet,
  isIOSDevice,
  isIOSSafari as checkIOSSafari,
} from "@/utils/mobile-wallet-adapter"
import { iosSafariHandler } from "@/utils/ios-safari-handler"
import {
  createWalletAdapter,
  type BaseWalletAdapter,
  WalletError,
  WalletNotFoundError,
  WalletNotConnectedError,
  WalletConnectionError,
} from "@/utils/solana-wallet-adapter"
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
  isIOS: boolean
  isIOSSafari: boolean
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
  const [preferredWallet, setPreferredWalletState] = useState("phantom")

  const isMobile = isMobileDevice()
  const isIOS = isIOSDevice()
  const isIOSSafari = checkIOSSafari()

  // Initialize wallet providers and preferred wallet
  useEffect(() => {
    const providers = detectWalletProviders()
    setWalletProviders(providers)

    const preferred = WalletPersistence.getPreferredWallet()
    setPreferredWalletState(preferred)

    // Check if we're returning from a mobile wallet connection attempt
    if (isMobile && typeof window !== 'undefined') {
      const attemptData = sessionStorage.getItem('wallet_connection_attempt')
      if (attemptData) {
        try {
          const attempt = JSON.parse(attemptData)
          const isRecent = Date.now() - attempt.timestamp < 5 * 60 * 1000

          if (isRecent) {
            console.log('Detected return from mobile wallet connection attempt:', attempt)
            // Clear the attempt data
            sessionStorage.removeItem('wallet_connection_attempt')

            // Try to reconnect silently with better error handling
            setTimeout(async () => {
              try {
                console.log(`🔄 Attempting silent reconnection for ${attempt.wallet}`)
                await connectToWallet(attempt.wallet, true)
              } catch (error) {
                console.error('Silent reconnection failed:', error)
                // Show user they need to manually connect
                toast({
                  title: "Connection Required",
                  description: `Please connect your ${attempt.wallet} wallet manually.`,
                })
              }
            }, 1000)
          }
        } catch (error) {
          console.error('Error parsing connection attempt data:', error)
        }
      }

      // Set up iOS Safari specific handling
      if (isIOSSafari) {
        const cleanup = iosSafariHandler.setupVisibilityChangeHandler((wallet) => {
          console.log('iOS Safari: User returned from wallet app:', wallet)
          // Try to reconnect silently
          setTimeout(() => {
            connectToWallet(wallet, true)
          }, 1000)
        })

        // Return cleanup function
        return cleanup
      }
    }
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

  // Connect to specific wallet using standardized Solana Wallet Adapter
  const connectToWallet = useCallback(async (walletName: string, silent = false) => {
    try {
      if (!silent) setConnecting(true)

      // Try to use standardized wallet adapter first
      let adapter = createWalletAdapter(walletName)

      if (!adapter) {
        // Fallback to legacy adapter for unsupported wallets
        const legacyAdapter = getWalletAdapter(walletName)
        if (!legacyAdapter) {
          throw new WalletNotFoundError(walletName)
        }

        // Handle legacy adapters
        const result = await legacyAdapter.connect()

        const pubKey = result.publicKey
        if (!pubKey) {
          throw new WalletConnectionError("No public key received from wallet")
        }

        // Create PublicKey object for legacy adapters with proper validation
        let publicKeyObj: PublicKey
        if (typeof pubKey === "string") {
          publicKeyObj = {
            toString: () => pubKey,
            toBase58: () => pubKey,
            toBytes: () => new Uint8Array(), // Add missing method
            equals: (other: PublicKey) => pubKey === other.toString()
          } as PublicKey
        } else if (pubKey && typeof pubKey.toString === "function") {
          publicKeyObj = pubKey
        } else {
          throw new WalletConnectionError("Invalid public key format received from wallet")
        }

        setWalletAdapter(legacyAdapter)
        setSelectedWallet(walletName)
        setPublicKey(publicKeyObj)
        setConnected(true)

        // Save session with proper error handling
        try {
          WalletPersistence.saveWalletSession(walletName, publicKeyObj.toString())
        } catch (error) {
          console.error("Error saving wallet session:", error)
        }
      } else {
        // Use standardized adapter
        await adapter.connect()

        if (!adapter.publicKey) {
          throw new WalletConnectionError("No public key received from wallet")
        }

        setWalletAdapter(adapter)
        setSelectedWallet(walletName)
        setPublicKey(adapter.publicKey)
        setConnected(true)

        // Save session
        WalletPersistence.saveWalletSession(walletName, adapter.publicKey.toString())
      }



      // Mock balances for demo
      setSolBalance(2.5)
      setUsdcBalance(4000)

      // Check NFTs
      await checkNFTOwnership()
      await refreshNFTs()

      if (!silent) {
        const publicKeyStr = publicKey?.toString()
        const displayAddress = publicKeyStr
          ? `${publicKeyStr.slice(0, 4)}...${publicKeyStr.slice(-4)}`
          : 'Unknown'

        toast({
          title: "Wallet Connected",
          description: `Connected to ${walletName} (${displayAddress})`,
        })
      }
    } catch (error: any) {
      console.error(`Error connecting to ${walletName}:`, error)

      let errorMessage = "Unknown error occurred"
      if (error instanceof WalletError) {
        errorMessage = error.message
      } else if (error.message) {
        errorMessage = error.message
      }

      if (!silent) {
        toast({
          title: "Connection Failed",
          description: errorMessage,
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
      const walletToConnect = providerName || preferredWallet || getDefaultWallet() || "phantom"

      // Handle mobile wallet connections
      if (isMobile) {
        const supportedMobileWallets = ['phantom', 'solflare', 'backpack']

        if (supportedMobileWallets.includes(walletToConnect.toLowerCase())) {
          try {
            console.log(`🔄 Initiating mobile wallet connection for ${walletToConnect}`)

            // For Phantom, use the browse method which opens the dApp in Phantom's in-app browser
            // This provides a seamless experience and follows Phantom's recommended integration
            if (walletToConnect.toLowerCase() === 'phantom') {
              console.log(`📱 Using Phantom browse method for mobile integration`)
            }

            const success = await connectToMobileWallet(walletToConnect)
            if (success) {
              console.log(`✅ Mobile wallet connection initiated for ${walletToConnect}`)

              // For Phantom browse method, the user will interact with the dApp within Phantom
              // For other wallets, they'll return to this page after connection
              if (walletToConnect.toLowerCase() === 'phantom') {
                toast({
                  title: "Opening in Phantom",
                  description: "Your dApp is opening in Phantom's secure browser.",
                })
              } else {
                toast({
                  title: `${walletToConnect} Opening`,
                  description: "Please approve the connection and return to this page.",
                })
              }
              return
            }
          } catch (error) {
            console.error('Mobile wallet connection failed:', error)
            toast({
              title: "Mobile Connection Failed",
              description: `Failed to open ${walletToConnect} app. Please ensure it's installed.`,
              variant: "destructive",
            })
            return // Don't fall through to desktop on mobile
          }
        } else {
          toast({
            title: "Wallet Not Supported",
            description: `${walletToConnect} is not supported on mobile devices.`,
            variant: "destructive",
          })
          return
        }
      }

      // Check if wallet is installed (for desktop)
      const providers = detectWalletProviders()

      // For development, allow connection even if provider detection fails
      if (providers.length === 0 && typeof window !== 'undefined') {
        console.warn('No wallet providers detected, attempting connection anyway...')
      }

      const provider = providers.find((p) => p.name === walletToConnect)

      if (providers.length > 0 && !provider?.installed && !isMobile) {
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

  // Sign transaction with standardized adapter support
  const signTransaction = useCallback(
    async (transaction: Transaction): Promise<Transaction> => {
      if (!walletAdapter || !connected) {
        throw new WalletNotConnectedError()
      }

      try {
        // Check if it's a standardized adapter
        if (walletAdapter.signTransaction) {
          return await walletAdapter.signTransaction(transaction)
        }

        // Fallback for legacy adapters
        throw new WalletError("Wallet does not support transaction signing")
      } catch (error: any) {
        if (error instanceof WalletError) {
          throw error
        }
        throw new WalletError(`Transaction signing failed: ${error.message}`)
      }
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
      const publicKeyStr = publicKey.toString()
      if (!publicKeyStr) {
        console.warn("Public key toString() returned empty string")
        return false
      }

      const mintedNFTsData = localStorage.getItem(`minted_nfts_${publicKeyStr}`)
      const nfts = mintedNFTsData ? JSON.parse(mintedNFTsData) : []
      const hasMinted = nfts.length > 0
      setHasNFT(hasMinted)
      setMintedNFTs(nfts)
      return hasMinted
    } catch (error) {
      console.error("Error checking NFT ownership:", error)
      setHasNFT(false)
      setMintedNFTs([])
      return false
    } finally {
      setIsCheckingNFT(false)
    }
  }, [connected, publicKey])

  // Refresh NFTs
  const refreshNFTs = useCallback(async () => {
    if (!connected || !publicKey) return

    try {
      const publicKeyStr = publicKey.toString()
      if (!publicKeyStr) {
        console.warn("Public key toString() returned empty string during refresh")
        return
      }

      const mintedNFTsData = localStorage.getItem(`minted_nfts_${publicKeyStr}`)
      const nfts = mintedNFTsData ? JSON.parse(mintedNFTsData) : []
      setMintedNFTs(nfts)
      setHasNFT(nfts.length > 0)
    } catch (error) {
      console.error("Error refreshing NFTs:", error)
      setMintedNFTs([])
      setHasNFT(false)
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
    isIOS,
    isIOSSafari,
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
