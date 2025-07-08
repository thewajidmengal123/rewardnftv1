"use client"

// iOS Safari specific wallet handling utilities
import { toast } from "@/components/ui/use-toast"

// Check if running in iOS Safari
export function isIOSSafari(): boolean {
  if (typeof navigator === "undefined") return false
  
  const userAgent = navigator.userAgent.toLowerCase()
  const isIOS = /ipad|iphone|ipod/.test(userAgent) || 
    (navigator.userAgent.includes('Mac') && navigator.maxTouchPoints > 1)
  const isWebKit = userAgent.includes('webkit')
  const isChrome = userAgent.includes('chrome')
  const isFirefox = userAgent.includes('firefox')
  
  // Safari is WebKit but not Chrome or Firefox
  return isIOS && isWebKit && !isChrome && !isFirefox
}

// Check if running in iOS Chrome
export function isIOSChrome(): boolean {
  if (typeof navigator === "undefined") return false
  
  const userAgent = navigator.userAgent.toLowerCase()
  const isIOS = /ipad|iphone|ipod/.test(userAgent) || 
    (navigator.userAgent.includes('Mac') && navigator.maxTouchPoints > 1)
  const isChrome = userAgent.includes('crios') || userAgent.includes('chrome')
  
  return isIOS && isChrome
}

// Check if running in iOS Firefox
export function isIOSFirefox(): boolean {
  if (typeof navigator === "undefined") return false
  
  const userAgent = navigator.userAgent.toLowerCase()
  const isIOS = /ipad|iphone|ipod/.test(userAgent) || 
    (navigator.userAgent.includes('Mac') && navigator.maxTouchPoints > 1)
  const isFirefox = userAgent.includes('fxios') || userAgent.includes('firefox')
  
  return isIOS && isFirefox
}

// iOS Safari has specific limitations for deep links and wallet connections
export class IOSSafariWalletHandler {
  private static instance: IOSSafariWalletHandler
  private connectionAttempts: Map<string, number> = new Map()
  private readonly MAX_ATTEMPTS = 3
  private readonly ATTEMPT_TIMEOUT = 30000 // 30 seconds

  static getInstance(): IOSSafariWalletHandler {
    if (!IOSSafariWalletHandler.instance) {
      IOSSafariWalletHandler.instance = new IOSSafariWalletHandler()
    }
    return IOSSafariWalletHandler.instance
  }

  // Handle wallet connection with iOS Safari specific logic
  async connectWallet(walletName: string, deepLink: string): Promise<boolean> {
    if (!isIOSSafari()) {
      return false // Not iOS Safari, use regular flow
    }

    const attempts = this.connectionAttempts.get(walletName) || 0
    
    if (attempts >= this.MAX_ATTEMPTS) {
      toast({
        title: "Connection Limit Reached",
        description: `Too many connection attempts for ${walletName}. Please try again later.`,
        variant: "destructive",
      })
      return false
    }

    try {
      // Increment attempt counter
      this.connectionAttempts.set(walletName, attempts + 1)

      // iOS Safari specific deep link handling
      await this.handleIOSSafariDeepLink(walletName, deepLink)
      
      // Reset attempts on successful initiation
      setTimeout(() => {
        this.connectionAttempts.delete(walletName)
      }, this.ATTEMPT_TIMEOUT)

      return true
    } catch (error) {
      console.error(`iOS Safari wallet connection failed for ${walletName}:`, error)
      
      toast({
        title: "Connection Failed",
        description: `Failed to connect to ${walletName}. Please ensure the app is installed.`,
        variant: "destructive",
      })
      
      return false
    }
  }

  // Handle deep link with iOS Safari specific method
  private async handleIOSSafariDeepLink(walletName: string, deepLink: string): Promise<void> {
    // Store current page for return
    sessionStorage.setItem('ios_safari_return_url', window.location.href)
    sessionStorage.setItem('ios_safari_wallet_attempt', JSON.stringify({
      wallet: walletName,
      timestamp: Date.now(),
      deepLink
    }))

    // Method 1: Try iframe method (most reliable for iOS Safari)
    try {
      console.log(`🍎 iOS Safari: Attempting iframe method for ${walletName}`)

      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.src = deepLink

      document.body.appendChild(iframe)

      // Remove iframe after short delay
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe)
        }
      }, 1000)

      // Show user guidance
      this.showIOSSafariGuidance(walletName)

    } catch (error) {
      console.error('iOS Safari iframe method failed:', error)

      // Method 2: Try creating a temporary link
      try {
        console.log(`🍎 iOS Safari: Attempting link click method for ${walletName}`)

        const link = document.createElement('a')
        link.href = deepLink
        link.target = '_self' // Use _self for better iOS Safari compatibility

        // Add to DOM temporarily
        document.body.appendChild(link)

        // Trigger click programmatically
        link.click()

        // Clean up
        document.body.removeChild(link)

        this.showIOSSafariGuidance(walletName)

      } catch (linkError) {
        console.error('iOS Safari link method failed:', linkError)

        // Method 3: Last resort - direct navigation
        console.log(`🍎 iOS Safari: Attempting direct navigation for ${walletName}`)
        window.location.href = deepLink
      }
    }
  }

  // Show iOS Safari specific guidance
  private showIOSSafariGuidance(walletName: string): void {
    toast({
      title: `Opening ${walletName} App`,
      description: "If the app doesn't open automatically, please:\n1. Install the app from App Store\n2. Tap 'Open' when prompted\n3. Return to this page after connecting",
    })
  }

  // Check if user returned from wallet app
  checkWalletReturn(): { wallet: string; timestamp: number } | null {
    if (!isIOSSafari()) return null

    try {
      const attemptData = sessionStorage.getItem('ios_safari_wallet_attempt')
      if (attemptData) {
        const attempt = JSON.parse(attemptData)
        
        // Check if this was recent (within 5 minutes)
        const isRecent = Date.now() - attempt.timestamp < 5 * 60 * 1000
        
        if (isRecent) {
          // Clear the attempt data
          sessionStorage.removeItem('ios_safari_wallet_attempt')
          return attempt
        }
      }
    } catch (error) {
      console.error('Error checking wallet return:', error)
    }

    return null
  }

  // Handle page visibility change (when user returns from wallet app)
  setupVisibilityChangeHandler(onWalletReturn: (wallet: string) => void): () => void {
    if (!isIOSSafari()) {
      return () => {} // No-op for non-iOS Safari
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible again
        const returnData = this.checkWalletReturn()
        if (returnData) {
          console.log('User returned from wallet app:', returnData.wallet)
          onWalletReturn(returnData.wallet)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Return cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }

  // Clear connection attempts (useful for cleanup)
  clearAttempts(): void {
    this.connectionAttempts.clear()
  }
}

// Export singleton instance
export const iosSafariHandler = IOSSafariWalletHandler.getInstance()

// Utility function to check if deep links are supported
export function supportsDeepLinks(): boolean {
  if (!isIOSSafari()) return true // Assume supported for non-iOS Safari
  
  // iOS Safari supports deep links but with limitations
  // We can't reliably detect if an app is installed
  return true
}

// Utility function to get iOS Safari specific instructions
export function getIOSSafariInstructions(walletName: string): string {
  return `To connect your ${walletName} wallet on iOS Safari:
1. Ensure ${walletName} app is installed from the App Store
2. Tap the connect button below
3. When prompted, tap "Open" to launch ${walletName}
4. Complete the connection in the ${walletName} app
5. Return to this page - your wallet will be connected automatically`
}
