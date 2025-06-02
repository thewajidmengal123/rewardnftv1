"use client"

// Mobile wallet adapter utilities
import { toast } from "@/components/ui/use-toast"
import { useMobile } from "@/hooks/use-mobile"

// Check if the user is on a mobile device
export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// Check if the Phantom app is installed (this is an approximation as we can't directly check)
export function isPhantomAppInstalled(): boolean {
  return (
    typeof window !== "undefined" &&
    (window.phantom?.solana ||
      // Check for mobile app protocol handler
      navigator.userAgent.includes("Phantom"))
  )
}

// Generate a deep link to open the Phantom app
export function getPhantomDeepLink(url: string): string {
  // Encode the callback URL
  const encodedUrl = encodeURIComponent(url)
  return `https://phantom.app/ul/browse/${encodedUrl}`
}

// Generate a universal link for Phantom
export function getPhantomUniversalLink(action: string, params: Record<string, string> = {}): string {
  const baseUrl = "https://phantom.app/ul"
  const queryParams = new URLSearchParams(params).toString()
  return `${baseUrl}/${action}?${queryParams}`
}

// Handle connecting to Phantom on mobile
export async function connectToPhantomMobile(): Promise<void> {
  try {
    // Get the current URL to use as a callback
    const currentUrl = window.location.href

    // Create a deep link to open Phantom
    const deepLink = getPhantomDeepLink(currentUrl)

    // Open the deep link
    window.location.href = deepLink

    // We can't directly get the result from the mobile app
    // The user will be redirected back to our app after connecting

    // Show a toast to guide the user
    toast({
      title: "Opening Phantom App",
      description: "Please approve the connection request in the Phantom app",
    })
  } catch (error) {
    console.error("Error connecting to Phantom mobile:", error)
    toast({
      title: "Connection Failed",
      description: "Failed to connect to Phantom mobile. Please try again.",
      variant: "destructive",
    })
    throw error
  }
}

// Custom hook for mobile wallet connection
export function useMobileWalletConnection() {
  const { isMobile } = useMobile()

  const connectWallet = async (walletName: string) => {
    if (isMobile && walletName === "phantom") {
      // Use mobile-specific connection method
      await connectToPhantomMobile()
      return true
    }

    // Return false to indicate we didn't handle the connection
    // and the regular connection flow should be used
    return false
  }

  return {
    connectWallet,
    isMobileDevice: isMobile,
  }
}
