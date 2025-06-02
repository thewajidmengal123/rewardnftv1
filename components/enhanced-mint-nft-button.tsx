"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEnhancedWallet } from "@/contexts/enhanced-wallet-context"
import { getNFTService } from "@/services/nft-service"
import { getAccessControlService } from "@/services/access-control-service"
import { toast } from "@/components/ui/use-toast"

interface EnhancedMintNftButtonProps {
  size?: "default" | "sm" | "lg" | "icon"
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  className?: string
}

export function EnhancedMintNftButton({
  size = "default",
  variant = "default",
  className = "",
}: EnhancedMintNftButtonProps) {
  const [isMinting, setIsMinting] = useState(false)
  const [isCheckingBalance, setIsCheckingBalance] = useState(false)
  const { publicKey, connected, connection, setHasNFT } = useEnhancedWallet()
  const router = useRouter()
  const nftService = getNFTService(connection)
  const accessControlService = getAccessControlService()

  const handleMint = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to mint an NFT",
        variant: "destructive",
      })
      return
    }

    try {
      setIsCheckingBalance(true)

      // Check if user has sufficient balance
      const hasBalance = await nftService.checkBalance(publicKey)

      setIsCheckingBalance(false)

      if (!hasBalance) {
        toast({
          title: "Insufficient Balance",
          description: "You need at least 10 USDC to mint an NFT",
          variant: "destructive",
        })
        return
      }

      setIsMinting(true)

      // Mint NFT
      const result = await nftService.mintNFT(publicKey)

      if (result.success) {
        // Record NFT mint
        accessControlService.recordNFTMint(publicKey.toString())

        // Update NFT ownership status
        setHasNFT(true)

        toast({
          title: "NFT Minted Successfully",
          description: "Your NFT has been minted successfully!",
        })

        // Redirect to success page
        router.push("/mint/success")
      } else {
        toast({
          title: "Minting Failed",
          description: result.error || "Failed to mint NFT. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error minting NFT:", error)
      toast({
        title: "Minting Error",
        description: "An error occurred while minting your NFT. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsMinting(false)
    }
  }

  return (
    <Button
      onClick={handleMint}
      disabled={isMinting || isCheckingBalance || !connected}
      size={size}
      variant={variant}
      className={className}
    >
      {isCheckingBalance ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Checking Balance...
        </>
      ) : isMinting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Minting...
        </>
      ) : (
        "Mint NFT"
      )}
    </Button>
  )
}
