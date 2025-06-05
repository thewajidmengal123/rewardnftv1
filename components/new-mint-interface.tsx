"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useWallet } from "@/contexts/wallet-context"
import { useFirebaseReferrals, useReferralCodeHandler } from "@/hooks/use-firebase-referrals"
import { SimpleNFTMintingService, NFT_CONFIG, type MintProgress } from "@/services/simple-nft-minting-service"
import { Minus, Plus, Loader2 } from "lucide-react"
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

  const nftService = new SimpleNFTMintingService(connection)

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
      // Check USDC balance (temporarily set to 1000 for testing)
      setUsdcBalance(1000) // TODO: Re-enable actual USDC balance check

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
      localStorage.getItem("pendingReferralCode")
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

      if (result.success && result.mintAddresses && result.nftData) {
        // Clear pending referral code
        localStorage.removeItem("pendingReferralCode")

        // Store minted NFTs in localStorage for immediate access with proper metadata
        const existingNFTs = JSON.parse(localStorage.getItem(`minted_nfts_${publicKey.toString()}`) || '[]')
        const newNFTs = result.nftData.map((nft) => ({
          mintAddress: nft.mint,
          mintedAt: new Date().toISOString(),
          transactionSignature: nft.signature,
          name: nft.name,
          image: nft.image,
          metadata: nft.metadata
        }))
        const allNFTs = [...existingNFTs, ...newNFTs]
        localStorage.setItem(`minted_nfts_${publicKey.toString()}`, JSON.stringify(allNFTs))

        // Process NFT mint completion for Firebase and referral system
        if (result.mintAddresses[0]) {
          try {
            const { processNFTMintCompletion } = await import("@/utils/firebase-referral-integration")
            await processNFTMintCompletion(
              publicKey.toString(),
              result.mintAddresses[0],
              result.signatures?.[0] || ''
            )
          } catch (error) {
            console.error("Error processing NFT mint completion:", error)
          }
        }

        // Redirect to success page with NFT data
        const mintParams = result.nftData.map((nft, i) => `mint${i + 1}=${nft.mint}`).join('&')
        const sigParams = result.nftData.map((nft, i) => `sig${i + 1}=${nft.signature}`).join('&')
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
    <div className="grid lg:grid-cols-2 gap-12 items-start">
      {/* Left Side - NFT Preview */}
      <div className="space-y-6">
        <div className="relative bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 p-1 rounded-2xl">
          <div className="bg-gray-900/90 backdrop-blur-sm rounded-2xl overflow-hidden">
            <div className="relative aspect-square">
              <img
                src="https://quicknode.quicknode-ipfs.com/ipfs/QmWrmCfPm6L85p1o8KMc9WZCsdwsgW89n37nQMJ6UCVYNW"
                alt="RewardNFT Collection"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1578632292335-df3abbb0d586?q=80&w=1528&auto=format&fit=crop&ixlib=rb-4.0.3"
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 text-white">
                <h3 className="text-3xl font-bold mb-2">RewardNFT Collection</h3>
                <p className="text-gray-200 text-lg">Limited to 1,000 NFTs</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Mint Details */}
      <div className="space-y-6">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 space-y-8">
          <h2 className="text-3xl font-bold text-white">Mint Details</h2>

          {/* Price per NFT */}
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-300 text-lg">Price per NFT</span>
            <span className="text-white font-bold text-xl">10 USDC</span>
          </div>

          {/* Available */}
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-300 text-lg">Available</span>
            <span className="text-white font-bold text-xl">{supplyInfo.available} / {supplyInfo.maxSupply}</span>
          </div>

            {/* Mint Amount */}
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-300 text-lg">Mint Amount</span>
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMintAmountChange(-1)}
                    disabled={mintAmount <= 1}
                    className="w-10 h-10 p-0 bg-gray-700/50 border-gray-600 hover:bg-gray-600 text-white"
                  >
                    <Minus className="w-5 h-5" />
                  </Button>
                  <span className="text-white font-bold text-2xl w-12 text-center">{mintAmount}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMintAmountChange(1)}
                    disabled={mintAmount >= (NFT_CONFIG.maxPerWallet - walletMintCount)}
                    className="w-10 h-10 p-0 bg-gray-700/50 border-gray-600 hover:bg-gray-600 text-white"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              <div className="text-sm text-gray-400 text-center">
                Max {NFT_CONFIG.maxPerWallet - walletMintCount} more NFTs (You have {walletMintCount}/{NFT_CONFIG.maxPerWallet})
              </div>
            </div>

            {/* Total Price */}
            <div className="flex justify-between items-center py-3 border-t border-gray-700/50">
              <span className="text-gray-300 text-lg">Total Cost</span>
              <span className="text-white font-bold text-2xl">{totalPrice} USDC</span>
            </div>

            {/* Referral Info */}
            {referrerWallet && (
              <div className="bg-green-900/30 border border-green-700/50 rounded-xl p-4">
                <p className="text-green-400 text-sm">
                  🎉 You were referred! Your referrer will receive 4 USDC when you mint.
                </p>
              </div>
            )}

            {/* Progress Indicator */}
            {mintProgress && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">{mintProgress.message}</span>
                  {mintProgress.currentNFT && mintProgress.totalNFTs && (
                    <span className="text-teal-400">
                      {mintProgress.currentNFT}/{mintProgress.totalNFTs}
                    </span>
                  )}
                </div>
                <Progress value={mintProgress.progress} className="h-3" />
              </div>
            )}

            {/* Mint Button */}
            <Button
              onClick={handleMint}
              disabled={isButtonDisabled()}
              className="w-full h-14 text-xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-black border-0 rounded-xl transition-all duration-200 hover:scale-105"
            >
              {loading && <Loader2 className="w-6 h-6 mr-3 animate-spin" />}
              {getButtonText()}
            </Button>

            {/* Terms */}
            <p className="text-sm text-gray-400 text-center">
              By minting, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>

        {/* Wallet Info */}
        {connected && (
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 text-lg">Your USDC Balance:</span>
              <span className="text-white font-bold text-lg">{usdcBalance.toFixed(2)} USDC</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300 text-lg">Mint Status:</span>
              <Badge
                variant={hasReachedLimit ? "secondary" : "outline"}
                className={hasReachedLimit ? "bg-red-900/50 text-red-300 border-red-700" : "bg-green-900/50 text-green-300 border-green-700"}
              >
                {hasReachedLimit ? `Max Reached (${walletMintCount}/${NFT_CONFIG.maxPerWallet})` : "Available"}
              </Badge>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
