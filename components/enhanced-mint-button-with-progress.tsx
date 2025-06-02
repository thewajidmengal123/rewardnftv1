"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useWallet } from "@/contexts/wallet-context"
import { EnhancedNFTMintingService, type MintProgress } from "@/services/enhanced-nft-minting-service"
import { NFT_MINT_COST_USDC } from "@/config/solana"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Wallet, CheckCircle, DollarSign, Zap } from "lucide-react"
import NFTService from "@/services/nft-service"

interface EnhancedMintButtonProps {
  onSuccess?: (signature: string, mintAddress: string) => void
  className?: string
}

export function EnhancedMintButtonWithProgress({ onSuccess, className = "" }: EnhancedMintButtonProps) {
  const { connected, publicKey, connection, signTransaction, connectWallet } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [mintingService] = useState(() => new EnhancedNFTMintingService(connection))
  const [nftService] = useState(() => NFTService)
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null)
  const [checkingBalance, setCheckingBalance] = useState(false)
  const [mintProgress, setMintProgress] = useState<MintProgress | null>(null)
  const router = useRouter()

  // Check USDC balance
  const checkBalance = async () => {
    if (!publicKey) return

    setCheckingBalance(true)
    try {
      const balance = await mintingService.checkUSDCBalance(publicKey)
      setUsdcBalance(balance)
    } catch (error) {
      console.error("Error checking balance:", error)
      setUsdcBalance(0)
    } finally {
      setCheckingBalance(false)
    }
  }

  useEffect(() => {
    if (connected && publicKey) {
      checkBalance()
    }
  }, [connected, publicKey])

  const handleMint = async () => {
    if (!connected || !publicKey) {
      await connectWallet()
      return
    }

    setIsLoading(true)
    setMintProgress(null)

    try {
      const result = await mintingService.mintNFT(publicKey, signTransaction, (progress) => {
        setMintProgress(progress)
      })

      if (result.success) {
        toast({
          title: "🎉 NFT Minted Successfully!",
          description: "Your NFT has been minted and referral access granted!",
        })

        if (onSuccess && result.signature && result.mintAddress) {
          onSuccess(result.signature, result.mintAddress)
        }

        // Redirect to success page
        router.push(
          `/mint/success?signature=${result.signature}&mint=${result.mintAddress}&usdc=${result.usdcSignature}`,
        )
      } else {
        toast({
          title: "Minting Failed",
          description: result.error || "An error occurred during minting.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Minting error:", error)
      toast({
        title: "Minting Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setMintProgress(null)
    }
  }

  // Check if wallet has already minted
  const hasAlreadyMinted = connected && publicKey ? mintingService.hasAlreadyMinted(publicKey) : false

  // Check if user has sufficient USDC
  const hasSufficientUSDC = usdcBalance !== null && usdcBalance >= NFT_MINT_COST_USDC

  const getButtonContent = () => {
    if (!connected) {
      return (
        <>
          <Wallet className="w-4 h-4 mr-2" />
          Connect Wallet to Mint
        </>
      )
    }

    if (checkingBalance) {
      return (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Checking Balance...
        </>
      )
    }

    if (hasAlreadyMinted) {
      return (
        <>
          <CheckCircle className="w-4 h-4 mr-2" />
          Already Minted
        </>
      )
    }

    if (!hasSufficientUSDC) {
      return (
        <>
          <DollarSign className="w-4 h-4 mr-2" />
          Insufficient USDC ({usdcBalance?.toFixed(2) || 0}/{NFT_MINT_COST_USDC})
        </>
      )
    }

    if (isLoading) {
      return (
        <>
          <Zap className="w-4 h-4 mr-2" />
          {mintProgress?.message || "Minting NFT..."}
        </>
      )
    }

    return (
      <>
        <Zap className="w-4 h-4 mr-2" />
        Mint NFT ({NFT_MINT_COST_USDC} USDC)
      </>
    )
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={handleMint}
        disabled={isLoading || hasAlreadyMinted || checkingBalance || (connected && !hasSufficientUSDC)}
        className={`w-full ${className}`}
        size="lg"
      >
        {getButtonContent()}
      </Button>

      {/* Progress Bar */}
      {mintProgress && (
        <div className="space-y-2">
          <Progress value={mintProgress.progress} className="w-full" />
          <p className="text-sm text-center text-muted-foreground">{mintProgress.message}</p>
        </div>
      )}

      {/* Balance Display */}
      {connected && usdcBalance !== null && (
        <div className="text-sm text-center text-muted-foreground">
          USDC Balance: {usdcBalance.toFixed(2)} USDC
          {hasAlreadyMinted && (
            <div className="text-green-600 font-medium mt-1">✅ NFT Already Minted - Referral Access Granted</div>
          )}
        </div>
      )}
    </div>
  )
}
