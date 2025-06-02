"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/contexts/wallet-context"
import { Button } from "@/components/ui/button"
import { WalletConnectButton } from "@/components/wallet-connect-button"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiresNFT?: boolean
}

export function ProtectedRoute({ children, requiresNFT = false }: ProtectedRouteProps) {
  const { connected } = useWallet()
  const router = useRouter()
  const [hasNFT, setHasNFT] = useState(true) // For demo purposes, assume user has NFT
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user has NFT (mock implementation)
    const checkNFTOwnership = async () => {
      // In a real implementation, you would check if the user owns an NFT
      // For demo purposes, we'll just set it to true after a delay
      setTimeout(() => {
        setHasNFT(true)
        setIsLoading(false)
      }, 500)
    }

    if (connected && requiresNFT) {
      checkNFTOwnership()
    } else {
      setIsLoading(false)
    }
  }, [connected, requiresNFT])

  if (!connected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800/50 p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-gray-400 mb-6">You need to connect your wallet to access this page.</p>
          <WalletConnectButton size="lg" className="w-full" />
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        <p className="mt-4 text-gray-400">Loading...</p>
      </div>
    )
  }

  if (requiresNFT && !hasNFT) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800/50 p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold mb-4">NFT Required</h1>
          <p className="text-gray-400 mb-6">You need to mint an NFT to access this page.</p>
          <Button onClick={() => router.push("/mint")} size="lg" className="w-full">
            Mint NFT
          </Button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
