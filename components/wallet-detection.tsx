"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, ExternalLink } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CURRENT_NETWORK } from "@/config/solana"

export function WalletDetection() {
  const [hasPhantom, setHasPhantom] = useState<boolean | null>(null)
  const [isCorrectNetwork, setIsCorrectNetwork] = useState<boolean | null>(null)
  const [currentNetwork, setCurrentNetwork] = useState<string | null>(null)

  useEffect(() => {
    // Check if Phantom is installed
    const checkPhantomWallet = async () => {
      if (typeof window !== "undefined") {
        const solana = (window as any).solana

        if (solana?.isPhantom) {
          setHasPhantom(true)

          // Check if on the correct network using a more reliable method
          try {
            // Get network from RPC endpoint
            let network = "unknown"

            if (solana.connection && solana.connection.rpcEndpoint) {
              const endpoint = solana.connection.rpcEndpoint.toLowerCase()

              if (endpoint.includes("devnet")) {
                network = "devnet"
              } else if (endpoint.includes("testnet")) {
                network = "testnet"
              } else if (endpoint.includes("mainnet")) {
                network = "mainnet-beta"
              }
            }

            setCurrentNetwork(network)

            // Compare with expected network
            const normalizedExpected = CURRENT_NETWORK.toLowerCase()
            const normalizedActual = network.toLowerCase()

            // Handle "mainnet-beta" vs "mainnet" case
            const isMainnetMatch =
              (normalizedExpected === "mainnet" && normalizedActual.includes("mainnet")) ||
              (normalizedExpected.includes("mainnet") && normalizedActual === "mainnet")

            setIsCorrectNetwork(normalizedActual === normalizedExpected || isMainnetMatch)
          } catch (error) {
            console.error("Error checking network:", error)
            setIsCorrectNetwork(false)
          }
        } else {
          setHasPhantom(false)
        }
      }
    }

    checkPhantomWallet()

    // Re-check if the window object changes
    window.addEventListener("load", checkPhantomWallet)
    return () => window.removeEventListener("load", checkPhantomWallet)
  }, [])

  if (hasPhantom === null) {
    return null // Still checking
  }

  if (hasPhantom === false) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Phantom Wallet Not Detected</AlertTitle>
        <AlertDescription className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mt-2">
          <span>Phantom wallet is required to use this platform.</span>
          <Button asChild variant="outline" size="sm" className="whitespace-nowrap">
            <a href="https://phantom.app/" target="_blank" rel="noopener noreferrer">
              Install Phantom <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (isCorrectNetwork === false) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Network Mismatch</AlertTitle>
        <AlertDescription className="mt-2">
          Please switch to Solana {CURRENT_NETWORK.charAt(0).toUpperCase() + CURRENT_NETWORK.slice(1)} in your Phantom
          wallet settings.
          {currentNetwork && ` Current network: ${currentNetwork}.`}
        </AlertDescription>
      </Alert>
    )
  }

  return null // Phantom is installed and on correct network, no need to show anything
}
