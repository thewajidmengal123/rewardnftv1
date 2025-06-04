"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useWallet } from "@/contexts/wallet-context"
import { useFirebaseReferrals, useReferralCodeHandler } from "@/hooks/use-firebase-referrals"
import { CollectionNFTService, NFT_CONFIG, type MintProgress } from "@/services/collection-nft-service"
import { EnhancedUSDCService } from "@/services/enhanced-usdc-service"
import { Minus, Plus, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import { PublicKey } from "@solana/web3.js"

export function NewMintInterface() {
  const { connected, publicKey, signTransaction, connection } = useWallet()
  const { user } = useFirebaseReferrals()
  const [mintAmount, setMintAmount] = useState(1)
  const [usdcBalance, setUsdcBalance] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [mintProgress, setMintProgress] = useState<MintProgress | null>(null)
  const [walletMintCount, setWalletMintCount] = useState(0)
  const [referrerWallet, setReferrerWallet] = useState<string | null>(null)
  const [supplyInfo, setSupplyInfo] = useState({
    totalSupply: 468,
    maxSupply: 1000,
    available: 532
  })
  const router = useRouter()
  const searchParams = useSearchParams()

  const nftService = new CollectionNFTService(connection)
  const usdcService = new EnhancedUSDCService(connection)

  // Set collection mint (this should be set from your deployed collection)
  // For now, we'll use a placeholder - in production, this should be your actual collection mint
  useEffect(() => {
    // TODO: Replace with your actual collection mint address
    // nftService.setCollectionMint(new PublicKey("YOUR_COLLECTION_MINT_ADDRESS"))
  }, [])

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

      // Check wallet mint count
      const mintCount = await nftService.getWalletMintCount(publicKey)
      setWalletMintCount(mintCount)

      // Get supply info
      const supply = await nftService.getSupplyInfo()
      setSupplyInfo(supply)

      // Check if referred (from user data)
      if (user?.referredBy) {
        setReferrerWallet(user.referredBy)
      }
    } catch (error) {
      console.error("Error checking wallet status:", error)
    }
  }

  const handleMintAmountChange = (delta: number) => {
    const maxAllowed = NFT_CONFIG.maxPerWallet - walletMintCount
    const newAmount = Math.max(1, Math.min(maxAllowed, mintAmount + delta))
    setMintAmount(newAmount)
  }

  const totalPrice = mintAmount * NFT_CONFIG.pricePerNFT
  const hasReachedLimit = walletMintCount >= NFT_CONFIG.maxPerWallet
  const canMintMore = walletMintCount < NFT_CONFIG.maxPerWallet

  const handleMint = async () => {
    if (!connected || !publicKey || !signTransaction) {
      return
    }

    if (hasReachedLimit) {
      return
    }

    if (usdcBalance < totalPrice) {
      return
    }

    setLoading(true)

    try {
      // Check for pending referral code and convert to PublicKey if exists
      const pendingReferralCode = localStorage.getItem("pendingReferralCode")
      let referrerPublicKey: PublicKey | undefined

      if (referrerWallet) {
        try {
          referrerPublicKey = new PublicKey(referrerWallet)
        } catch (error) {
          console.error("Invalid referrer wallet address:", error)
        }
      }

      // Use the new collection minting service
      const result = await nftService.mintNFTs(
        publicKey,
        mintAmount,
        signTransaction,
        referrerPublicKey,
        (progress: MintProgress) => {
          setMintProgress(progress)
          console.log("Minting progress:", progress)
        }
      )

      if (result.success && result.mintAddresses) {
        // Clear pending referral code
        localStorage.removeItem("pendingReferralCode")

        // Redirect to success page with multiple mint addresses
        const mintParams = result.mintAddresses.map((mint, i) => `mint${i + 1}=${mint}`).join('&')
        const sigParams = result.signatures?.map((sig, i) => `sig${i + 1}=${sig}`).join('&') || ''
        router.push(`/mint/success?${mintParams}&${sigParams}&usdc=${result.usdcSignature}&total=${result.totalCost}`)
      } else {
        console.error("Minting failed:", result.error)
        // TODO: Show error to user
      }
    } catch (error) {
      console.error("Minting error:", error)
      // TODO: Show error to user
    } finally {
      setLoading(false)
      setMintProgress(null)
    }
  }

  const getButtonText = () => {
    if (!connected) return "Connect Wallet"
    if (hasReachedLimit) return `Max Reached (${walletMintCount}/${NFT_CONFIG.maxPerWallet})`
    if (usdcBalance < totalPrice) return `Insufficient USDC (${usdcBalance.toFixed(2)}/${totalPrice})`
    if (loading) return mintProgress ? mintProgress.message : "Minting..."
    if (mintAmount > 1) return `Mint ${mintAmount} NFTs`
    return "Mint NFT"
  }

  const isButtonDisabled = () => {
    return !connected || hasReachedLimit || usdcBalance < totalPrice || loading
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      {/* Left Side - NFT Preview */}
      <div className="space-y-6">
        <Card className="bg-gray-800 border-gray-700 overflow-hidden">
          <CardContent className="p-0">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1617791160536-598cf32026fb?q=80&w=1528&auto=format&fit=crop&ixlib=rb-4.0.3"
                alt="RewardNFT Collection"
                className="w-full h-auto rounded-lg"
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
              <span className="text-white font-semibold">{supplyInfo.available} / {supplyInfo.maxSupply}</span>
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
                    disabled={mintAmount >= (NFT_CONFIG.maxPerWallet - walletMintCount)}
                    className="w-8 h-8 p-0 bg-gray-700 border-gray-600 hover:bg-gray-600"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="text-xs text-gray-400 text-center">
                Max {NFT_CONFIG.maxPerWallet - walletMintCount} more NFTs (You have {walletMintCount}/{NFT_CONFIG.maxPerWallet})
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

            {/* Progress Indicator */}
            {mintProgress && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">{mintProgress.message}</span>
                  {mintProgress.currentNFT && mintProgress.totalNFTs && (
                    <span className="text-teal-400">
                      {mintProgress.currentNFT}/{mintProgress.totalNFTs}
                    </span>
                  )}
                </div>
                <Progress value={mintProgress.progress} className="h-2" />
              </div>
            )}

            {/* Mint Button */}
            <Button
              onClick={handleMint}
              disabled={isButtonDisabled()}
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white"
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
                <Badge variant={hasReachedLimit ? "secondary" : "outline"}>
                  {hasReachedLimit ? `Max Reached (${walletMintCount}/${NFT_CONFIG.maxPerWallet})` : "Available"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
