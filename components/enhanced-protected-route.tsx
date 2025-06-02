"use client"

import { type ReactNode, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useEnhancedWallet } from "@/contexts/enhanced-wallet-context"
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { Loader2 } from "lucide-react"
import { getAccessControlService } from "@/services/access-control-service"
import { toast } from "@/components/ui/use-toast"

interface EnhancedProtectedRouteProps {
  children: ReactNode
  requireNft?: boolean
  feature?: "mint" | "referrals" | "quests" | "leaderboard" | "profile"
}

export function EnhancedProtectedRoute({
  children,
  requireNft = false,
  feature = "profile",
}: EnhancedProtectedRouteProps) {
  const { connected, publicKey, hasNFT, checkNFTOwnership, isCheckingNFT } = useEnhancedWallet()
  const [isLoading, setIsLoading] = useState(true)
  const [canAccess, setCanAccess] = useState(false)
  const router = useRouter()
  const accessControlService = getAccessControlService()

  useEffect(() => {
    const checkAccess = async () => {
      setIsLoading(true)

      if (!connected) {
        setCanAccess(false)
        setIsLoading(false)
        return
      }

      if (requireNft) {
        // Check NFT ownership if required
        await checkNFTOwnership()

        if (!hasNFT) {
          toast({
            title: "NFT Required",
            description: "You need to mint an NFT to access this feature",
            variant: "destructive",
          })
          setCanAccess(false)
          setIsLoading(false)
          return
        }
      }

      // Check feature access
      if (publicKey) {
        const hasAccess = await accessControlService.canAccessFeature(publicKey.toString(), feature)

        setCanAccess(hasAccess)

        if (!hasAccess && feature !== "mint" && feature !== "profile") {
          toast({
            title: "Access Denied",
            description: "You need to mint an NFT to access this feature",
            variant: "destructive",
          })
        }
      }

      setIsLoading(false)
    }

    checkAccess()
  }, [connected, publicKey, requireNft, feature, hasNFT, checkNFTOwnership])

  if (isLoading || isCheckingNFT) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Loading...</p>
      </div>
    )
  }

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="max-w-md w-full bg-gray-800/50 p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="mb-6 text-center max-w-md">Please connect your wallet to access this page</p>
          <WalletConnectButton size="lg" />
        </div>
      </div>
    )
  }

  if (requireNft && !hasNFT) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="max-w-md w-full bg-gray-800/50 p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold mb-4">NFT Required</h1>
          <p className="mb-6 text-center max-w-md">You need to mint an NFT to access this page</p>
          <button
            onClick={() => router.push("/mint")}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to Mint Page
          </button>
        </div>
      </div>
    )
  }

  if (!canAccess && feature !== "mint" && feature !== "profile") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="max-w-md w-full bg-gray-800/50 p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-6 text-center max-w-md">You need to mint an NFT to access this feature</p>
          <button
            onClick={() => router.push("/mint")}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to Mint Page
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
