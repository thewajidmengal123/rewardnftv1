"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/contexts/wallet-context"
import { Button } from "@/components/ui/button"
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { firebaseUserService } from "@/services/firebase-user-service"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiresNFT?: boolean
}

export function ProtectedRoute({ children, requiresNFT = false }: ProtectedRouteProps) {
  const { connected, publicKey } = useWallet()
  const router = useRouter()
  const [hasNFT, setHasNFT] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user has NFT
    const checkNFTOwnership = async () => {
      if (!connected || !publicKey) {
        setHasNFT(false)
        setIsLoading(false)
        return
      }

      try {
        // Check Firebase for user's NFT count
        const user = await firebaseUserService.getUserByWallet(publicKey.toString())
        const hasNFTs = user && user.nftsMinted > 0
        setHasNFT(hasNFTs || false)

        // Also check localStorage as fallback
        if (!hasNFTs) {
          const mintedNFTsData = localStorage.getItem(`minted_nfts_${publicKey.toString()}`)
          const nfts = mintedNFTsData ? JSON.parse(mintedNFTsData) : []
          setHasNFT(nfts.length > 0)
        }
      } catch (error) {
        console.error("Error checking NFT ownership:", error)
        // Fallback to localStorage check
        try {
          const mintedNFTsData = localStorage.getItem(`minted_nfts_${publicKey.toString()}`)
          const nfts = mintedNFTsData ? JSON.parse(mintedNFTsData) : []
          setHasNFT(nfts.length > 0)
        } catch (localError) {
          console.error("Error checking localStorage:", localError)
          setHasNFT(false)
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (connected && requiresNFT) {
      checkNFTOwnership()
    } else {
      setIsLoading(false)
    }
  }, [connected, publicKey, requiresNFT])

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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex flex-col items-center justify-center p-4">
        <div className="max-w-lg w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-8 rounded-2xl shadow-2xl text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-teal-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Referrals Coming Soon!</h1>
            <p className="text-lg text-gray-300 mb-6">
              You need to mint at least one NFT to unlock the referral program and start tracking referrals.
            </p>
            <div className="bg-teal-900/20 border border-teal-700/50 rounded-xl p-4 mb-6">
              <p className="text-teal-300 text-sm">
                🎉 Once you mint your first NFT, you'll get access to:
              </p>
              <ul className="text-left text-gray-300 text-sm mt-2 space-y-1">
                <li>• Your unique referral link</li>
                <li>• Referral tracking and analytics</li>
                <li>• Real-time leaderboard rankings</li>
                <li>• Referral history tracking</li>
              </ul>
            </div>
          </div>
          <Button
            onClick={() => router.push("/mint")}
            size="lg"
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-black font-bold h-12 text-lg"
          >
            Mint Your First NFT
          </Button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
