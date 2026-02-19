"use client"

import { toast } from "@/components/ui/use-toast"

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

export function isInWalletBrowser(): boolean {
  if (typeof window === "undefined") return false
  const ua = navigator.userAgent.toLowerCase()
  return ua.includes("phantom") || ua.includes("solflare")
}

// ==================== SESSION STORAGE ====================

const PENDING_KEY = 'wallet_pending'
const PENDING_TIME_KEY = 'wallet_pending_time'

export function savePendingConnection(walletName: string): void {
  if (typeof window === "undefined") return
  sessionStorage.setItem(PENDING_KEY, walletName)
  sessionStorage.setItem(PENDING_TIME_KEY, Date.now().toString())
}

export function getPendingConnection(): string | null {
  if (typeof window === "undefined") return null
  
  const wallet = sessionStorage.getItem(PENDING_KEY)
  const time = sessionStorage.getItem(PENDING_TIME_KEY)
  
  if (!wallet || !time) return null
  
  // Expire after 5 minutes
  if (Date.now() - parseInt(time) > 5 * 60 * 1000) {
    clearPendingConnection()
    return null
  }
  
  return wallet
}

export function clearPendingConnection(): void {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(PENDING_KEY)
  sessionStorage.removeItem(PENDING_TIME_KEY)
}

// ==================== DEEP LINKS ====================

export function redirectToWalletApp(walletName: string): void {
  if (typeof window === "undefined") return
  
  const currentUrl = window.location.href
  const encodedUrl = encodeURIComponent(currentUrl)
  
  let deepLink = ''
  
  switch (walletName.toLowerCase()) {
    case 'phantom':
      deepLink = `https://phantom.app/ul/v1/browse/${encodedUrl}`
      break
    case 'solflare':
      deepLink = `https://solflare.com/ul/browse/${encodedUrl}`
      break
    default:
      return
  }
  
  console.log("Redirecting to:", deepLink)
  savePendingConnection(walletName)
  
  if (isIOSDevice()) {
    window.location.href = deepLink
  } else {
    window.location.replace(deepLink)
  }
}

// ==================== CONNECTION RESTORE ====================

export async function checkMobileReturn(): Promise<boolean> {
  const pending = getPendingConnection()
  if (!pending) return false
  
  console.log("Checking return from:", pending)
  await new Promise(r => setTimeout(r, 800))
  
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

// ==================== WALLET DETECTION ====================

export function isPhantomInstalled(): boolean {
  if (typeof window === "undefined") return false
  return !!(window.phantom?.solana) || isInWalletBrowser()
}

export function isSolflareInstalled(): boolean {
  if (typeof window === "undefined") return false
  return !!(window.solflare?.isSolflare) || isInWalletBrowser()
}

export function getWalletAdapter(walletName: string): any {
  if (typeof window === "undefined") return null
  
  switch (walletName.toLowerCase()) {
    case 'phantom':
      return window.solana || window.phantom?.solana
    case 'solflare':
      return window.solflare
    default:
      return null
  }
}

// ==================== HOOK ====================

export function useMobileWallet() {
  return {
    isMobile: isMobileDevice(),
    isIOS: isIOSDevice(),
    isInWalletBrowser: isInWalletBrowser(),
    redirectToWallet: redirectToWalletApp,
    checkReturn: checkMobileReturn,
    getPending: getPendingConnection,
    clearPending: clearPendingConnection
  }
}
