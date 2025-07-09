/**
 * Utility functions for detecting and working with Phantom wallet
 */

import type { SolanaNetwork } from "@/config/solana"

// Check if Phantom is installed
export const isPhantomInstalled = (): boolean => {
  if (typeof window === "undefined") return false

  const provider = (window as any).solana
  return provider?.isPhantom === true
}

// Get the Phantom provider with a retry mechanism
export const getPhantomProvider = async (retries = 3, delay = 500): Promise<any> => {
  if (typeof window === "undefined") return null

  // If Phantom is already available, return it
  if ((window as any).solana?.isPhantom) {
    return (window as any).solana
  }

  // If we've run out of retries, return null
  if (retries <= 0) {
    return null
  }

  // Wait for the specified delay
  await new Promise((resolve) => setTimeout(resolve, delay))

  // Try again with one fewer retry
  return getPhantomProvider(retries - 1, delay)
}

// Detect Phantom provider with a promise-based approach
export const detectPhantomProvider = (timeout = 3000): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      return reject(new Error("Cannot detect Phantom in non-browser environment"))
    }

    // If Phantom is already available, resolve immediately
    if ((window as any).solana?.isPhantom) {
      return resolve((window as any).solana)
    }

    // Set a timeout to reject the promise if Phantom isn't detected in time
    const timeoutId = setTimeout(() => {
      cleanup()
      reject(new Error("Timeout: Phantom wallet not detected"))
    }, timeout)

    // Function to clean up event listeners
    const cleanup = () => {
      clearTimeout(timeoutId)
      window.removeEventListener("load", checkForPhantom)
      window.removeEventListener("DOMContentLoaded", checkForPhantom)
    }

    // Function to check for Phantom
    const checkForPhantom = () => {
      if ((window as any).solana?.isPhantom) {
        cleanup()
        resolve((window as any).solana)
      }
    }

    // Check immediately and also on window load
    checkForPhantom()
    window.addEventListener("load", checkForPhantom)
    window.addEventListener("DOMContentLoaded", checkForPhantom)
  })
}

// Check if we're on the correct Solana network
export const checkSolanaNetwork = async (
  provider: any,
  expectedNetwork?: SolanaNetwork,
): Promise<{ isCorrectNetwork: boolean; network: string }> => {
  try {
    // Check if provider is connected
    if (!provider || !provider.isConnected) {
      return {
        isCorrectNetwork: false,
        network: "disconnected",
      }
    }

    // Get the network from the RPC endpoint
    let network = "unknown"

    // Modern Phantom API approach
    if (provider.connection && provider.connection.rpcEndpoint) {
      const endpoint = provider.connection.rpcEndpoint.toLowerCase()

      if (endpoint.includes("devnet")) {
        network = "devnet"
      } else if (endpoint.includes("testnet")) {
        network = "testnet"
      } else if (endpoint.includes("mainnet")) {
        network = "mainnet-beta"
      }
    }

    // Fallback to checking if we can connect and then determine network
    if (network === "unknown" && provider.connect) {
      try {
        // Try to connect first (this won't prompt if already connected)
        await provider.connect({ onlyIfTrusted: true })

        // After connection, check if we can determine network from connection
        if (provider.connection && provider.connection.rpcEndpoint) {
          const endpoint = provider.connection.rpcEndpoint.toLowerCase()

          if (endpoint.includes("devnet")) {
            network = "devnet"
          } else if (endpoint.includes("testnet")) {
            network = "testnet"
          } else if (endpoint.includes("mainnet")) {
            network = "mainnet-beta"
          }
        }
      } catch (connectError) {
        console.log("Connection check failed:", connectError)
        // Continue with unknown network
      }
    }

    // If no expected network is provided, just return the current network
    if (!expectedNetwork) {
      return {
        isCorrectNetwork: true,
        network,
      }
    }

    // Compare with expected network
    const normalizedExpected = expectedNetwork.toLowerCase()
    const normalizedActual = network.toLowerCase()

    // Handle "mainnet-beta" vs "mainnet" case
    const isMainnetMatch =
      (normalizedExpected === "mainnet" && normalizedActual.includes("mainnet")) ||
      (normalizedExpected.includes("mainnet") && normalizedActual === "mainnet")

    const isCorrectNetwork = normalizedActual === normalizedExpected || isMainnetMatch

    return {
      isCorrectNetwork,
      network,
    }
  } catch (error) {
    console.error("Error checking Solana network:", error)
    return {
      isCorrectNetwork: false,
      network: "unknown",
    }
  }
}

// Helper to suggest installing Phantom
export const suggestPhantomInstall = () => {
  const confirmed = window.confirm(
    "Phantom wallet is required to use this application. Would you like to install it now?",
  )

  if (confirmed) {
    window.open("https://phantom.app/", "_blank")
  }

  return confirmed
}

// Helper to suggest switching to the correct network
export const suggestSwitchToNetwork = (network: SolanaNetwork) => {
  alert(
    `Please switch to Solana ${network} in your Phantom wallet settings:\n\n` +
      "1. Open Phantom wallet\n" +
      "2. Click on the gear icon (Settings)\n" +
      "3. Select 'Change Network'\n" +
      `4. Choose '${network.charAt(0).toUpperCase() + network.slice(1)}'\n\n` +
      "Then refresh this page.",
  )
}
