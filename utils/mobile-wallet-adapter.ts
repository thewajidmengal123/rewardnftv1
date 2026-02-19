"use client"

// Extend Window interface
declare global {
  interface Window {
    phantom?: { solana?: any; [key: string]: any }
    solflare?: { isSolflare?: boolean; [key: string]: any }
    solana?: any
    backpack?: any
    glow?: any
  }
}

// ==================== MOBILE DETECTION ====================

export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export function isIOSDevice(): boolean {
  if (typeof navigator === "undefined") return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.userAgent.includes('Mac') && navigator.maxTouchPoints > 1)
}

export function isIOSSafari(): boolean {
  if (!isIOSDevice()) return false
  const ua = navigator.userAgent.toLowerCase()
  return ua.includes('webkit') && !ua.includes('chrome') && !ua.includes('firefox')
}

export function isInWalletBrowser(): boolean {
  if (typeof window === "undefined") return false
  const ua = navigator.userAgent.toLowerCase()
  return ua.includes("phantom") || ua.includes("solflare")
}

// ==================== SESSION STORAGE ====================

const CONNECTION_ATTEMPT_KEY = 'wallet_connection_attempt'

export function savePendingConnection(walletName: string): void {
  if (typeof window === "undefined") return
  
  const attemptData = {
    wallet: walletName,
    timestamp: Date.now(),
    url: window.location.href,
    method: 'browse'
  }
  
  sessionStorage.setItem(CONNECTION_ATTEMPT_KEY, JSON.stringify(attemptData))
}

export function getPendingConnection(): { wallet: string; timestamp: number; url?: string; method?: string } | null {
  if (typeof window === "undefined") return null
  
  const data = sessionStorage.getItem(CONNECTION_ATTEMPT_KEY)
  if (!data) return null
  
  try {
    const attempt = JSON.parse(data)
    if (Date.now() - attempt.timestamp > 5 * 60 * 1000) {
      clearPendingConnection()
      return null
    }
    return attempt
  } catch {
    return null
  }
}

export function clearPendingConnection(): void {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(CONNECTION_ATTEMPT_KEY)
}

// ==================== DEEP LINKS ====================

export function getWalletDeepLink(walletName: string, action: string = 'connect'): string {
  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''
  const encodedUrl = encodeURIComponent(currentUrl)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  switch (walletName.toLowerCase()) {
    case 'phantom':
      if (action === 'connect') {
        return `https://phantom.app/ul/v1/browse/${encodedUrl}?ref=${encodeURIComponent(origin)}`
      }
      return `https://phantom.app/ul/v1/${action}`

    case 'solflare':
      if (action === 'connect') {
        return `https://solflare.com/ul/browse/${encodedUrl}?ref=${encodeURIComponent(origin)}`
      }
      return `solflare://${action}`

    default:
      return currentUrl
  }
}

export function getWalletUniversalLink(walletName: string): string {
  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''
  const encodedUrl = encodeURIComponent(currentUrl)

  switch (walletName.toLowerCase()) {
    case 'phantom':
      return `https://phantom.app/ul/v1/browse/${encodedUrl}`
    case 'solflare':
      return `https://solflare.com/ul/browse/${encodedUrl}`
    default:
      return currentUrl
  }
}

// Legacy functions
export function getPhantomDeepLink(url: string): string {
  return getWalletDeepLink('phantom', 'connect')
}

export function getPhantomUniversalLink(action: string, params: Record<string, string> = {}): string {
  return getWalletDeepLink('phantom', action)
}

// ==================== REDIRECT ====================

export function redirectToWalletApp(walletName: string): void {
  const deepLink = getWalletUniversalLink(walletName)
  
  console.log("Redirecting to:", deepLink)
  savePendingConnection(walletName)
  
  if (isIOSDevice()) {
    window.location.href = deepLink
  } else {
    window.location.replace(deepLink)
  }
}

export async function connectToMobileWallet(walletName: string): Promise<boolean> {
  try {
    savePendingConnection(walletName)
    const universalLink = getWalletUniversalLink(walletName)
    
    if (isIOSDevice()) {
      window.location.href = universalLink
    } else {
      window.location.replace(universalLink)
    }
    
    return true
  } catch (error) {
    console.error(`Failed to connect to ${walletName} mobile:`, error)
    return false
  }
}

// ==================== CHECK RETURN ====================

export async function checkMobileReturn(): Promise<boolean> {
  const pending = getPendingConnection()
  if (!pending) return false
  
  console.log("Checking return from:", pending.wallet)
  await new Promise(r => setTimeout(r, 1000))
  
  const provider = (window as any).solana || (window as any).solflare
  
  if (provider?.isConnected && provider?.publicKey) {
    clearPendingConnection()
    return true
  }
  
  try {
    await provider?.connect?.({ onlyIfTrusted: true })
    if (provider?.isConnected) {
      clearPendingConnection()
      return true
    }
  } catch (e) {
    console.log("Silent connect failed")
  }
  
  clearPendingConnection()
  return false
}

export function checkConnectionReturn(): { wallet: string; timestamp: number; url?: string; method?: string } | null {
  return getPendingConnection()
}

// ==================== DEBUG ====================

export function debugMobileWalletConnection(walletName: string) {
  console.log('Mobile Wallet Debug:', {
    walletName,
    isMobile: isMobileDevice(),
    isIOS: isIOSDevice(),
    isSafari: isIOSSafari(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
    universalLink: getWalletUniversalLink(walletName),
    deepLink: getWalletDeepLink(walletName, 'connect')
  })
}

// ==================== HOOK ====================

export function useMobileWallet() {
  return {
    isMobile: isMobileDevice(),
    isIOS: isIOSDevice(),
    isIOSSafari: isIOSSafari(),
    isInWalletBrowser: isInWalletBrowser(),
    redirectToWallet: redirectToWalletApp,
    connectMobile: connectToMobileWallet,
    checkReturn: checkMobileReturn,
    getPending: getPendingConnection,
    clearPending: clearPendingConnection,
    debug: debugMobileWalletConnection
  }
}
