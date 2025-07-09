/**
 * Enhanced Wallet Persistence Service
 * Handles cross-page wallet connection persistence
 */

// Storage keys
const STORAGE_KEYS = {
  SELECTED_WALLET: "solana_selected_wallet",
  CONNECTION_TIMESTAMP: "solana_connection_timestamp",
  AUTO_CONNECT: "solana_auto_connect",
  WALLET_ADDRESS: "solana_wallet_address",
  SESSION_TOKEN: "solana_session_token",
  PREFERRED_WALLET: "solana_preferred_wallet",
} as const

// Session duration (24 hours)
const SESSION_DURATION = 24 * 60 * 60 * 1000

export interface WalletSession {
  walletName: string
  address: string
  timestamp: number
  sessionToken: string
}

/**
 * Save wallet session
 */
export function saveWalletSession(walletName: string, address: string): void {
  if (typeof window === "undefined") return

  try {
    const session: WalletSession = {
      walletName,
      address,
      timestamp: Date.now(),
      sessionToken: generateSessionToken(),
    }

    localStorage.setItem(STORAGE_KEYS.SELECTED_WALLET, walletName)
    localStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, address)
    localStorage.setItem(STORAGE_KEYS.CONNECTION_TIMESTAMP, session.timestamp.toString())
    localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, session.sessionToken)


  } catch (error) {
    console.error("Failed to save wallet session:", error)
  }
}

/**
 * Get wallet session
 */
export function getWalletSession(): WalletSession | null {
  if (typeof window === "undefined") return null

  try {
    const walletName = localStorage.getItem(STORAGE_KEYS.SELECTED_WALLET)
    const address = localStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS)
    const timestamp = localStorage.getItem(STORAGE_KEYS.CONNECTION_TIMESTAMP)
    const sessionToken = localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN)

    if (!walletName || !address || !timestamp || !sessionToken) {
      return null
    }

    return {
      walletName,
      address,
      timestamp: Number.parseInt(timestamp, 10),
      sessionToken,
    }
  } catch (error) {
    console.error("Failed to get wallet session:", error)
    return null
  }
}

/**
 * Check if session is valid
 */
export function isSessionValid(): boolean {
  const session = getWalletSession()
  if (!session) return false

  const now = Date.now()
  const sessionAge = now - session.timestamp

  return sessionAge < SESSION_DURATION
}

/**
 * Get preferred wallet (phantom by default)
 */
export function getPreferredWallet(): string {
  if (typeof window === "undefined") return "phantom"

  try {
    return localStorage.getItem(STORAGE_KEYS.PREFERRED_WALLET) || "phantom"
  } catch (error) {
    return "phantom"
  }
}

/**
 * Set preferred wallet
 */
export function setPreferredWallet(walletName: string): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(STORAGE_KEYS.PREFERRED_WALLET, walletName)
  } catch (error) {
    console.error("Failed to set preferred wallet:", error)
  }
}

/**
 * Clear wallet session
 */
export function clearWalletSession(): void {
  if (typeof window === "undefined") return

  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key)
    })
  } catch (error) {
    console.error("Failed to clear wallet session:", error)
  }
}

/**
 * Should auto-connect on page load
 */
export function shouldAutoConnect(): boolean {
  if (typeof window === "undefined") return false

  try {
    const autoConnect = localStorage.getItem(STORAGE_KEYS.AUTO_CONNECT)
    return autoConnect !== "false" // Default to true
  } catch (error) {
    return true
  }
}

/**
 * Set auto-connect preference
 */
export function setAutoConnect(enabled: boolean): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(STORAGE_KEYS.AUTO_CONNECT, enabled.toString())
  } catch (error) {
    console.error("Failed to set auto-connect:", error)
  }
}

/**
 * Generate session token
 */
function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * Cross-tab synchronization
 */
export function setupCrossTabSync(onSessionChange: () => void): () => void {
  if (typeof window === "undefined") return () => {}

  const handleStorageChange = (event: StorageEvent) => {
    if (Object.values(STORAGE_KEYS).includes(event.key as any)) {
      onSessionChange()
    }
  }

  window.addEventListener("storage", handleStorageChange)
  return () => window.removeEventListener("storage", handleStorageChange)
}

export function saveConnectionPreferences(prefs: any) {
  throw new Error("Function not implemented.")
}
