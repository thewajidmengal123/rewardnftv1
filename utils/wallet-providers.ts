"use client"

export interface WalletProviderInfo {
  name: string
  displayName: string
  icon: string
  installed: boolean
  mobile: boolean
  priority: number
  adapter?: any
}

// Check if wallet is installed
export function isWalletInstalled(walletName: string): boolean {
  if (typeof window === "undefined") return false

  switch (walletName.toLowerCase()) {
    case "awwallet":
      return !!(window as any).awwallet
    case "phantom":
      return !!(window as any).solana?.isPhantom
    case "solflare":
      return !!(window as any).solflare
    case "backpack":
      return !!(window as any).backpack
    case "glow":
      return !!(window as any).glow
    default:
      return false
  }
}

// Get wallet adapter
export function getWalletAdapter(walletName: string): any {
  if (typeof window === "undefined") return null

  switch (walletName.toLowerCase()) {
    case "awwallet":
      return (window as any).awwallet
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

// Detect all available wallet providers
export function detectWalletProviders(): WalletProviderInfo[] {
  const wallets: WalletProviderInfo[] = [
    {
      name: "awwallet",
      displayName: "AWWallet",
      icon: "/images/awwallet-icon.png",
      installed: isWalletInstalled("awwallet"),
      mobile: true,
      priority: 1, // Highest priority - default wallet
    },
    {
      name: "phantom",
      displayName: "Phantom",
      icon: "/images/phantom-icon.png",
      installed: isWalletInstalled("phantom"),
      mobile: true,
      priority: 2,
    },
    {
      name: "solflare",
      displayName: "Solflare",
      icon: "/images/solflare-icon.png",
      installed: isWalletInstalled("solflare"),
      mobile: false,
      priority: 3,
    },
    {
      name: "backpack",
      displayName: "Backpack",
      icon: "/images/backpack-icon.png",
      installed: isWalletInstalled("backpack"),
      mobile: false,
      priority: 4,
    },
    {
      name: "glow",
      displayName: "Glow",
      icon: "/images/glow-icon.png",
      installed: isWalletInstalled("glow"),
      mobile: false,
      priority: 5,
    },
  ]

  // Sort by priority (lower number = higher priority)
  return wallets.sort((a, b) => a.priority - b.priority)
}

// Get default wallet (awwallet if available, otherwise first installed)
export function getDefaultWallet(): string | null {
  const providers = detectWalletProviders()

  // First priority: awwallet if installed
  const awwallet = providers.find((p) => p.name === "awwallet" && p.installed)
  if (awwallet) return "awwallet"

  // Second priority: first installed wallet by priority
  const firstInstalled = providers.find((p) => p.installed)
  return firstInstalled?.name || null
}

// Check if we're on mobile
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}
