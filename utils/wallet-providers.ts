"use client"

export interface WalletProviderInfo {
  name: string
  displayName: string
  icon: string
  installed: boolean
  mobile: boolean
  priority: number
  adapter?: any
  url?: string // Download URL for wallet
  mobileSupported?: boolean
  deepLinkSupported?: boolean
  appStoreUrl?: string
  playStoreUrl?: string
  iosSupported?: boolean
  androidSupported?: boolean
}

// Standard Solana Wallet Adapter interface
export interface SolanaWalletAdapter {
  name: string
  url: string
  icon: string
  readyState: 'Installed' | 'NotDetected' | 'Loadable' | 'Unsupported'
  publicKey: any | null
  connecting: boolean
  connected: boolean
  connect(): Promise<void>
  disconnect(): Promise<void>
  sendTransaction?: (transaction: any, connection: any, options?: any) => Promise<string>
  signTransaction?: (transaction: any) => Promise<any>
  signAllTransactions?: (transactions: any[]) => Promise<any[]>
  signMessage?: (message: Uint8Array) => Promise<Uint8Array>
}

// Enhanced wallet detection with mobile support
export function isWalletInstalled(walletName: string): boolean {
  if (typeof window === "undefined") return false

  const isMobile = isMobileDevice()

  switch (walletName.toLowerCase()) {


    case "phantom":
      // Desktop extension detection
      const hasPhantomExtension = !!(window as any).solana?.isPhantom
      // Mobile app detection - check if we're in Phantom's in-app browser
      const isInPhantomApp = navigator.userAgent.includes("Phantom")
      // For mobile, we assume Phantom is available via universal links
      // This allows the connection flow to handle app installation gracefully
      return hasPhantomExtension || isInPhantomApp || isMobile

    case "solflare":
      // Desktop extension detection
      const hasSolflareExtension = !!(window as any).solflare?.isSolflare
      // Mobile app detection
      const isInSolflareApp = navigator.userAgent.includes("Solflare")
      // For mobile, we assume Solflare is available
      return hasSolflareExtension || isInSolflareApp || isMobile

    case "backpack":
      // Desktop extension detection
      const hasBackpackExtension = !!(window as any).backpack?.isBackpack
      // For mobile, Backpack has limited support but we'll allow it
      return hasBackpackExtension || isMobile

    case "glow":
      // Desktop extension detection
      const hasGlowExtension = !!(window as any).glow
      // Glow is primarily desktop-focused
      return hasGlowExtension

    default:
      return false
  }
}

// Get wallet adapter following Solana Wallet Adapter standards
export function getWalletAdapter(walletName: string): any {
  if (typeof window === "undefined") return null

  switch (walletName.toLowerCase()) {

    case "phantom":
      return (window as any).solana
    case "solflare":
      return (window as any).solflare
    case "backpack":
      return (window as any).backpack
    case "glow":
      return (window as any).glow
    default:
      return null
  }
}

// Enhanced wallet provider detection with mobile optimization
export function detectWalletProviders(): WalletProviderInfo[] {
  const isMobile = isMobileDevice()

  const wallets: WalletProviderInfo[] = [
   
    {
      name: "phantom",
      displayName: "Phantom",
      icon: "/images/phantom.jpg",
      installed: isWalletInstalled("phantom"),
      mobile: true,
      priority: 2,
      url: "https://phantom.app",
      mobileSupported: true,
      deepLinkSupported: isMobile,
      appStoreUrl: "https://apps.apple.com/app/phantom-solana-wallet/id1598432977",
      playStoreUrl: "https://play.google.com/store/apps/details?id=app.phantom",
    },
    {
      name: "solflare",
      displayName: "Solflare",
      icon: "/images/solflare.jpg",
      installed: isWalletInstalled("solflare"),
      mobile: true, // Solflare has mobile support
      priority: 3,
      url: "https://solflare.com",
      mobileSupported: true,
      deepLinkSupported: isMobile,
      appStoreUrl: "https://apps.apple.com/app/solflare/id1580902717",
      playStoreUrl: "https://play.google.com/store/apps/details?id=com.solflare.mobile",
      iosSupported: true,
      androidSupported: true,
    }
  ]

  // Sort by priority (lower number = higher priority)
  // Sort by priority and filter for mobile if needed
  let sortedWallets = wallets.sort((a, b) => a.priority - b.priority)

  // On mobile, prioritize wallets with better mobile support
  if (isMobile) {
    sortedWallets = sortedWallets.sort((a, b) => {
      // Prioritize wallets with mobile support
      const aMobileScore = (a.mobileSupported ? 2 : 0) + (a.deepLinkSupported ? 1 : 0)
      const bMobileScore = (b.mobileSupported ? 2 : 0) + (b.deepLinkSupported ? 1 : 0)

      if (aMobileScore !== bMobileScore) {
        return bMobileScore - aMobileScore // Higher score first
      }

      return a.priority - b.priority // Fall back to original priority
    })
  }

  return sortedWallets
}

// Get mobile-optimized wallet providers
export function getMobileWalletProviders(): WalletProviderInfo[] {
  const allProviders = detectWalletProviders()
  return allProviders.filter(provider => provider.mobileSupported)
}

// Get wallet providers for specific platform
export function getWalletProvidersForPlatform(platform: 'ios' | 'android' | 'desktop'): WalletProviderInfo[] {
  const allProviders = detectWalletProviders()

  switch (platform) {
    case 'ios':
      return allProviders.filter(provider => provider.iosSupported)
    case 'android':
      return allProviders.filter(provider => provider.androidSupported)
    case 'desktop':
      return allProviders.filter(provider => !provider.mobile || provider.installed)
    default:
      return allProviders
  }
}

// Get default wallet (first installed wallet by priority)
export function getDefaultWallet(): string | null {
  const providers = detectWalletProviders()

  // Get first installed wallet by priority
  const firstInstalled = providers.find((p) => p.installed)
  return firstInstalled?.name || null
}

// Check if we're on mobile
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}
