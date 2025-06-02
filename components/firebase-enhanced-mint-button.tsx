"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/contexts/wallet-context"
import { useFirebaseUser } from "@/hooks/use-firebase-user"
import { firebaseNFTService } from "@/services/firebase-nft-service"
import { firebaseUserService } from "@/services/firebase-user-service"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Coins } from "lucide-react"

export function FirebaseEnhancedMintButton() {
  const { connected, publicKey, signTransaction } = useWallet()
  const { user } = useFirebaseUser(publicKey?.toString() || null)
  const [isMinting, setIsMinting] = useState(false)

  const handleMint = async () => {
    if (!connected || !publicKey || !signTransaction) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to mint an NFT",
        variant: "destructive",
      })
      return
    }

    // Check if user already minted
    const hasAlreadyMinted = await firebaseNFTService.hasWalletMinted(publicKey.toString())
    if (hasAlreadyMinted) {
      toast({
        title: "Already Minted",
        description: "This wallet has already minted an NFT",
        variant: "destructive",
      })
      return
    }

    setIsMinting(true)

    try {
      // Create or update user profile
      await firebaseUserService.createOrUpdateUser(publicKey.toString(), {
        displayName: user?.displayName || `User ${publicKey.toString().slice(0, 8)}`,
      })

      // Simulate minting process (replace with actual minting logic)
      const mintAddress = `mint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const transactionSignature = `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Record NFT mint in Firebase
      await firebaseNFTService.recordNFTMint({
        mintAddress,
        ownerWallet: publicKey.toString(),
        transactionSignature,
        name: "RewardNFT Mint Pass",
        symbol: "RNFT",
        description: "Your gateway to rewards and referrals",
        image: "/nft-reward-token.png",
        attributes: [
          { trait_type: "Collection", value: "Solana Rewards" },
          { trait_type: "Rarity", value: "Legendary" },
          { trait_type: "Type", value: "Membership" },
        ],
        mintCost: 10,
        isVerified: true,
        isTransferred: false,
      })

      // Update user NFT data
      await firebaseUserService.updateUserNFTData(publicKey.toString(), mintAddress)

      toast({
        title: "NFT Minted Successfully!",
        description: "Your RewardNFT has been minted and recorded",
      })

      // Redirect to success page
      window.location.href = `/mint/success?signature=${transactionSignature}&mint=${mintAddress}`
    } catch (error: any) {
      console.error("Minting error:", error)
      toast({
        title: "Minting Failed",
        description: error.message || "Failed to mint NFT. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsMinting(false)
    }
  }

  if (!connected) {
    return (
      <Button disabled className="w-full">
        Connect Wallet to Mint
      </Button>
    )
  }

  return (
    <Button
      onClick={handleMint}
      disabled={isMinting}
      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
    >
      {isMinting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Minting NFT...
        </>
      ) : (
        <>
          <Coins className="mr-2 h-4 w-4" />
          Mint NFT for 10 USDC
        </>
      )}
    </Button>
  )
}
