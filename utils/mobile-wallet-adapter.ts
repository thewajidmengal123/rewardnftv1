"use client"

// Extend the Window interface to include wallet providers
declare global {
  interface Window {
    phantom?: {
      solana?: any
      [key: string]: any
    }
    solflare?: {
      isSolflare?: boolean
      [key: string]: any
    }
    solana?: any
    backpack?: any
    glow?: any
  }
}

// Mobile wallet adapter utilities
import { toast } from "@/components/ui/use-toast"
import { useMobile } from "@/hooks/use-mobile"
import { iosSafariHandler } from "@/utils/ios-safari-handler"

// Enhanced mobile device detection with iOS-specific checks
export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false

  // Check for mobile user agents (updated for 2024)
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i
  const isMobileUA = mobileRegex.test(navigator.userAgent)

  // Additional iOS detection (including iPadOS 13+)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes('Mac') && navigator.maxTouchPoints > 1)

  // Check for touch capability
  const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  // Check screen size for mobile-like dimensions (updated thresholds)
  const isMobileScreen = window.innerWidth <= 1024 || window.innerHeight <= 768

  // Additional checks for modern mobile browsers
  const isModernMobile = 'orientation' in window || 'DeviceOrientationEvent' in window

  return isMobileUA || isIOS || (hasTouchScreen && isMobileScreen) || isModernMobile
}

// Detect iOS specifically
export function isIOSDevice(): boolean {
  if (typeof navigator === "undefined") return false

  // Standard iOS detection
  const isStandardIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

  // iPadOS 13+ detection (reports as Mac)
  const isIPadOS = navigator.userAgent.includes('Mac') && navigator.maxTouchPoints > 1

  return isStandardIOS || isIPadOS
}

// Detect if running in iOS Safari
export function isIOSSafari(): boolean {
  if (!isIOSDevice()) return false

  const userAgent = navigator.userAgent.toLowerCase()
  const isWebKit = userAgent.includes('webkit')
  const isChrome = userAgent.includes('chrome')
  const isFirefox = userAgent.includes('firefox')

  // Safari is WebKit but not Chrome or Firefox
  return isWebKit && !isChrome && !isFirefox
}

// Enhanced Phantom app detection for mobile and desktop
export function isPhantomAppInstalled(): boolean {
  if (typeof window === "undefined") return false

  // Desktop extension detection
  const hasDesktopExtension = !!(window.phantom?.solana)

  // Mobile app detection - check for deep link support
  const isMobile = isMobileDevice()
  const hasPhantomUA = navigator.userAgent.includes("Phantom")

  // For mobile, we can't directly detect app installation
  // but we can check if we're in the Phantom in-app browser
  const isInPhantomApp = hasPhantomUA && isMobile

  return hasDesktopExtension || isInPhantomApp
}

// Check if Solflare is available
export function isSolflareAppInstalled(): boolean {
  if (typeof window === "undefined") return false

  // Desktop extension detection
  const hasDesktopExtension = !!(window.solflare?.isSolflare)

  // Mobile app detection
  const isMobile = isMobileDevice()
  const hasSolflareUA = navigator.userAgent.includes("Solflare")
  const isInSolflareApp = hasSolflareUA && isMobile

  return hasDesktopExtension || isInSolflareApp
}

// Generate proper mobile app deep links for different wallet apps
export function getWalletDeepLink(walletName: string, action: string = 'connect', params: Record<string, string> = {}): string {
  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''
  const encodedUrl = encodeURIComponent(currentUrl)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  switch (walletName.toLowerCase()) {
    case 'phantom':
      // Use official Phantom universal links (recommended by Phantom docs)
      if (action === 'connect') {
        // For mobile web integration, use browse method to open dApp in Phantom's in-app browser
        return `https://phantom.app/ul/v1/browse/${encodedUrl}?ref=${encodeURIComponent(origin)}`
      }
      // For other actions, use the appropriate universal link
      return `https://phantom.app/ul/v1/${action}?${new URLSearchParams(params).toString()}`

    case 'solflare':
      // Solflare mobile app deep link
      if (action === 'connect') {
        return `https://solflare.com/ul/browse/${encodedUrl}?ref=${encodeURIComponent(origin)}`
      }
      return `solflare://${action}?${new URLSearchParams(params).toString()}`

    case 'backpack':
      // Backpack mobile app deep link
      return `https://backpack.app/connect?origin=${encodedUrl}&ref=${encodeURIComponent(origin)}`

    default:
      return currentUrl
  }
}

// Generate fallback universal links (for when app is not installed)
export function getWalletUniversalLink(walletName: string): string {
  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''
  const encodedUrl = encodeURIComponent(currentUrl)

  switch (walletName.toLowerCase()) {
    case 'phantom':
      // Use official Phantom universal link for browse method
      return `https://phantom.app/ul/v1/browse/${encodedUrl}`

    case 'solflare':
      return `https://solflare.com/ul/browse/${encodedUrl}`

    case 'backpack':
      return `https://backpack.app/connect?origin=${encodedUrl}`

    default:
      return currentUrl
  }
}

// Generate a universal link for Phantom (legacy support)
export function getPhantomDeepLink(url: string): string {
  return getWalletDeepLink('phantom', 'connect', { url })
}

// Generate a universal link for Phantom (legacy support)
export function getPhantomUniversalLink(action: string, params: Record<string, string> = {}): string {
  return getWalletDeepLink('phantom', action, params)
}

// Generate proper Phantom connect URL with required parameters
export function generatePhantomConnectURL(): string {
  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''
  const appUrl = encodeURIComponent(currentUrl)
  const redirectLink = encodeURIComponent(currentUrl)

  // For demo purposes, we'll use a simple public key
  // In production, you should generate proper encryption keys
  const dappEncryptionPublicKey = 'DEMO_PUBLIC_KEY_' + Date.now()

  const params = new URLSearchParams({
    app_url: appUrl,
    dapp_encryption_public_key: dappEncryptionPublicKey,
    redirect_link: redirectLink,
    cluster: 'mainnet-beta' // or 'devnet' for testing
  })

  return `https://phantom.app/ul/v1/connect?${params.toString()}`
}

// Generate Phantom browse URL for mobile web integration
export function generatePhantomBrowseURL(): string {
  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''
  const encodedUrl = encodeURIComponent(currentUrl)

  return `https://phantom.app/ul/v1/browse/${encodedUrl}`
}

// Enhanced mobile wallet connection with proper deep linking and fallbacks
export async function connectToMobileWallet(walletName: string): Promise<boolean> {
  try {
    const isIOS = isIOSDevice()
    const isSafari = isIOSSafari()

    // Get the mobile app universal link (preferred) and deep link (fallback)
    const universalLink = getWalletUniversalLink(walletName)
    const deepLink = getWalletDeepLink(walletName, 'connect')

    console.log(`🔗 Attempting mobile wallet connection for ${walletName}`)
    console.log(`Universal link: ${universalLink}`)
    console.log(`Deep link: ${deepLink}`)

    // Store connection attempt for recovery
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('wallet_connection_attempt', JSON.stringify({
        wallet: walletName,
        timestamp: Date.now(),
        url: window.location.href,
        universalLink,
        deepLink,
        method: 'browse' // Using browse method for mobile web integration
      }))
    }

    // For Phantom, use the browse method which opens the dApp in Phantom's in-app browser
    if (walletName.toLowerCase() === 'phantom') {
      return await attemptPhantomMobileConnection(universalLink, deepLink)
    }

    // Use iOS Safari specific handler if applicable for other wallets
    if (isIOS && isSafari) {
      return await iosSafariHandler.connectWallet(walletName, universalLink)
    }

    // For other mobile browsers, try universal link first with deep link fallback
    return await attemptMobileConnection(walletName, universalLink, deepLink)

  } catch (error) {
    console.error(`Error connecting to ${walletName} mobile:`, error)
    toast({
      title: "Connection Failed",
      description: `Failed to connect to ${walletName} mobile. Please try again.`,
      variant: "destructive",
    })
    return false
  }
}

// Attempt Phantom mobile connection using browse method (recommended by Phantom)
async function attemptPhantomMobileConnection(universalLink: string, deepLink: string): Promise<boolean> {
  return new Promise((resolve) => {
    let resolved = false

    console.log(`🔗 Attempting Phantom mobile connection via browse method`)

    // Use the proper Phantom browse URL
    const phantomBrowseUrl = generatePhantomBrowseURL()
    console.log(`Phantom browse URL: ${phantomBrowseUrl}`)

    // For Phantom, we use the browse method which opens the dApp in Phantom's in-app browser
    // This is the recommended approach according to Phantom's documentation
    try {
      // Use the browse method for seamless mobile integration
      window.location.href = phantomBrowseUrl

      toast({
        title: "Opening in Phantom",
        description: "Your dApp is opening in Phantom's secure browser. If Phantom doesn't open, please install it from your app store.",
      })

      resolved = true
      resolve(true)
    } catch (error) {
      console.error('Phantom browse method failed, trying universal link fallback:', error)

      // Fallback to universal link if browse method fails
      try {
        window.location.href = universalLink
        resolved = true
        resolve(true)
      } catch (universalLinkError) {
        console.error('Universal link failed, trying deep link fallback:', universalLinkError)

        // Final fallback to deep link
        try {
          window.location.href = deepLink
          resolved = true
          resolve(true)
        } catch (deepLinkError) {
          console.error('All connection methods failed:', deepLinkError)
          resolved = true
          resolve(false)
        }
      }
    }

    // Timeout fallback
    setTimeout(() => {
      if (!resolved) {
        console.log('Phantom connection timeout, assuming success')
        resolved = true
        resolve(true)
      }
    }, 3000)
  })
}

// Attempt mobile connection with universal link and deep link fallback
async function attemptMobileConnection(walletName: string, universalLink: string, deepLink: string): Promise<boolean> {
  return new Promise((resolve) => {
    let resolved = false

    // Try universal link first (recommended approach)
    console.log(`🔗 Trying universal link for ${walletName}: ${universalLink}`)

    try {
      window.location.href = universalLink

      toast({
        title: `Opening ${walletName}`,
        description: "If the app doesn't open, please install it from your app store.",
      })

      // Check if page becomes hidden (app opened)
      const handleVisibilityChange = () => {
        if (document.hidden && !resolved) {
          console.log(`${walletName} app opened successfully via universal link`)

          toast({
            title: `${walletName} Opened`,
            description: "Please approve the connection in the wallet app and return to this page.",
          })

          resolved = true
          resolve(true)

          // Clean up
          document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)

      // Fallback timeout - if no visibility change, assume success
      setTimeout(() => {
        if (!resolved) {
          console.log(`${walletName} connection timeout, assuming success`)
          resolved = true
          resolve(true)
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }, 5000) // 5 second timeout

    } catch (error) {
      console.error(`Universal link failed for ${walletName}, trying deep link fallback:`, error)

      // Fallback to deep link if universal link fails
      try {
        window.location.href = deepLink
        resolved = true
        resolve(true)
      } catch (deepLinkError) {
        console.error(`Both universal link and deep link failed for ${walletName}:`, deepLinkError)
        resolved = true
        resolve(false)
      }
    }
  })
}

// Legacy Phantom mobile connection (for backward compatibility)
export async function connectToPhantomMobile(): Promise<void> {
  await connectToMobileWallet('phantom')
}

// Debug utility to log mobile wallet connection details
export function debugMobileWalletConnection(walletName: string) {
  const isMobile = isMobileDevice()
  const isIOS = isIOSDevice()
  const isSafari = isIOSSafari()
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'

  console.log('🔍 Mobile Wallet Debug Info:', {
    walletName,
    isMobile,
    isIOS,
    isSafari,
    userAgent,
    screenSize: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A',
    touchPoints: typeof navigator !== 'undefined' ? navigator.maxTouchPoints : 'N/A',
    phantomBrowseUrl: walletName.toLowerCase() === 'phantom' ? generatePhantomBrowseURL() : 'N/A',
    universalLink: getWalletUniversalLink(walletName),
    deepLink: getWalletDeepLink(walletName, 'connect')
  })
}

// Enhanced mobile wallet connection hook
export function useMobileWalletConnection() {
  const { isMobile } = useMobile()

  const connectWallet = async (walletName: string): Promise<boolean> => {
    // Debug logging
    debugMobileWalletConnection(walletName)

    if (!isMobile) {
      return false // Let desktop flow handle it
    }

    // Handle mobile wallet connections
    const supportedMobileWallets = ['phantom', 'solflare', 'backpack']

    if (supportedMobileWallets.includes(walletName.toLowerCase())) {
      return await connectToMobileWallet(walletName)
    }

    // For unsupported wallets on mobile, show guidance
    toast({
      title: "Mobile Wallet Not Supported",
      description: `${walletName} mobile connection is not yet supported. Please use a desktop browser.`,
      variant: "destructive",
    })

    return false
  }

  // Check if we're returning from a wallet connection attempt
  const checkConnectionReturn = () => {
    if (typeof window === 'undefined') return null

    const attemptData = sessionStorage.getItem('wallet_connection_attempt')
    if (attemptData) {
      try {
        const attempt = JSON.parse(attemptData)
        // Clear the attempt data
        sessionStorage.removeItem('wallet_connection_attempt')

        // Check if this was recent (within 5 minutes)
        const isRecent = Date.now() - attempt.timestamp < 5 * 60 * 1000

        if (isRecent) {
          return attempt
        }
      } catch (error) {
        console.error('Error parsing connection attempt data:', error)
      }
    }

    return null
  }

  return {
    connectWallet,
    isMobileDevice: isMobile,
    isIOSDevice: isIOSDevice(),
    isIOSSafari: isIOSSafari(),
    checkConnectionReturn,
  }
}
