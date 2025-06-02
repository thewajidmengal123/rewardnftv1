"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useWallet } from "@/contexts/wallet-context"
import { useFirebaseReferrals, useReferralCodeHandler } from "@/hooks/use-firebase-referrals"
import { EnhancedNFTMintingService } from "@/services/enhanced-nft-minting-service"
import { EnhancedUSDCService } from "@/services/enhanced-usdc-service"
import { Minus, Plus, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"

export function NewMintInterface() {
  const { connected, publicKey, signTransaction, connection } = useWallet()
  const { checkIfReferred } = useFirebaseReferrals()
  const [mintAmount, setMintAmount] = useState(1)
  const [usdcBalance, setUsdcBalance] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [hasAlreadyMinted, setHasAlreadyMinted] = useState(false)
  const [referrerWallet, setReferrerWallet] = useState<string | null>(null)
  const [availableSupply, setAvailableSupply] = useState(532) // From the image
  const router = useRouter()
  const searchParams = useSearchParams()

  const nftService = new EnhancedNFTMintingService(connection)
  const usdcService = new EnhancedUSDCService(connection)

  // Handle referral codes from URL
  useReferralCodeHandler()

  // Check for referral code in URL
  useEffect(() => {
    const referralCode = searchParams.get("ref")
    if (referralCode && connected && publicKey) {
      // Store referral code for later use during minting
      localStorage.setItem("pendingReferralCode", referralCode)
    }
  }, [searchParams, connected, publicKey])

  // Check wallet status
  useEffect(() => {
    if (connected && publicKey) {
      checkWalletStatus()
    }
  }, [connected, publicKey])

  const checkWalletStatus = async () => {
    if (!publicKey) return

    try {
      // Check USDC balance
      const balance = await usdcService.getUSDCBalance(publicKey)
      setUsdcBalance(balance)

      // Check if already minted
      const hasMinted = await nftService.hasAlreadyMinted(publicKey)
      setHasAlreadyMinted(hasMinted)

      // Check if referred
      const referrer = await checkIfReferred(publicKey.toString())
      setReferrerWallet(referrer)
    } catch (error) {
      console.error("Error checking wallet status:", error)
    }
  }

  const handleMintAmountChange = (delta: number) => {
    const newAmount = Math.max(1, Math.min(1, mintAmount + delta)) // Max 1 per wallet
    setMintAmount(newAmount)
  }

  const totalPrice = mintAmount * 10 // 10 USDC per NFT

  const handleMint = async () => {
    if (!connected || !publicKey || !signTransaction) {
      return
    }

    if (hasAlreadyMinted) {
      return
    }

    if (usdcBalance < totalPrice) {
      return
    }

    setLoading(true)

    try {
      // Check for pending referral code
      const pendingReferralCode = localStorage.getItem("pendingReferralCode")
      
      // Use the enhanced minting service with referral support
      const result = await nftService.mintNFTWithReferral(
        publicKey,
        signTransaction,
        pendingReferralCode,
        (progress) => {
          console.log("Minting progress:", progress)
        }
      )

      if (result.success && result.mintAddress) {
        // Clear pending referral code
        localStorage.removeItem("pendingReferralCode")
        
        // Redirect to success page
        router.push(`/mint/success?signature=${result.signature}&mint=${result.mintAddress}&usdc=${result.usdcSignature}`)
      } else {
        console.error("Minting failed:", result.error)
      }
    } catch (error) {
      console.error("Minting error:", error)
    } finally {
      setLoading(false)
    }
  }

  const getButtonText = () => {
    if (!connected) return "Connect Wallet"
    if (hasAlreadyMinted) return "Already Minted"
    if (usdcBalance < totalPrice) return `Insufficient USDC (${usdcBalance.toFixed(2)}/${totalPrice})`
    if (loading) return "Minting..."
    return "Mint NFT"
  }

  const isButtonDisabled = () => {
    return !connected || hasAlreadyMinted || usdcBalance < totalPrice || loading
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      {/* Left Side - NFT Preview */}
      <div className="space-y-6">
        <Card className="bg-gray-800 border-gray-700 overflow-hidden">
          <CardContent className="p-0">
            <div className="relative">
              <img
                src="https://quicknode.quicknode-ipfs.com/ipfs/QmWrmCfPm6L85p1o8KMc9WZCsdwsgW89n37nQMJ6UCVYNW"
                alt="RewardNFT Collection"
                className="w-full h-auto rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg?height=500&width=500&text=RewardNFT"
                }}
              />
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-2xl font-bold">RewardNFT Collection</h3>
                <p className="text-gray-300">Limited to 1,000 NFTs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Side - Mint Details */}
      <div className="space-y-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6 space-y-6">
            <h2 className="text-2xl font-bold text-white">Mint Details</h2>
            
            {/* Price per NFT */}
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Price per NFT</span>
              <span className="text-white font-semibold">$10 USDC</span>
            </div>

            {/* Available */}
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Available</span>
              <span className="text-white font-semibold">{availableSupply} / 1,000</span>
            </div>

            {/* Mint Amount */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Mint Amount</span>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMintAmountChange(-1)}
                    disabled={mintAmount <= 1}
                    className="w-8 h-8 p-0 bg-gray-700 border-gray-600 hover:bg-gray-600"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-white font-semibold w-8 text-center">{mintAmount}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMintAmountChange(1)}
                    disabled={mintAmount >= 1} // Max 1 per wallet
                    className="w-8 h-8 p-0 bg-gray-700 border-gray-600 hover:bg-gray-600"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Total Price */}
            <div className="flex justify-between items-center text-lg">
              <span className="text-gray-300">Total Price</span>
              <span className="text-white font-bold">${totalPrice.toFixed(2)} USDC</span>
            </div>

            {/* Referral Info */}
            {referrerWallet && (
              <div className="bg-green-900/20 border border-green-700 rounded-lg p-3">
                <p className="text-green-400 text-sm">
                  🎉 You were referred! Your referrer will receive 4 USDC when you mint.
                </p>
              </div>
            )}

            {/* Mint Button */}
            <Button
              onClick={handleMint}
              disabled={isButtonDisabled()}
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-green-400 to-yellow-500 hover:from-green-500 hover:to-yellow-600 text-black"
            >
              {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
              {getButtonText()}
            </Button>

            {/* Terms */}
            <p className="text-xs text-gray-400 text-center">
              By minting, you agree to our Terms of Service and Privacy Policy.
            </p>
          </CardContent>
        </Card>

        {/* Wallet Info */}
        {connected && (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">Your USDC Balance:</span>
                <span className="text-white">{usdcBalance.toFixed(2)} USDC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">Mint Status:</span>
                <Badge variant={hasAlreadyMinted ? "secondary" : "outline"}>
                  {hasAlreadyMinted ? "Already Minted" : "Available"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
