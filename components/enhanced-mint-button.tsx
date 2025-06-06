"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useWallet } from "@/contexts/wallet-context"
import { EnhancedUSDCService } from "@/services/enhanced-usdc-service"
import { EnhancedNFTMintingService } from "@/services/enhanced-nft-minting-service"
import { Loader2, CheckCircle, AlertCircle, Coins, Gift, ExternalLink, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { getNetworkInfo, getExplorerUrl } from "@/config/solana"

interface TokenBalance {
  mint: string
  balance: number
  symbol?: string
}

export function EnhancedMintButton() {
  const { connected, publicKey, signTransaction, connection } = useWallet()
  const [loading, setLoading] = useState(false)
  const [usdcBalance, setUsdcBalance] = useState<number>(0)
  const [allTokenBalances, setAllTokenBalances] = useState<TokenBalance[]>([])
  const [hasAlreadyMinted, setHasAlreadyMinted] = useState(false)
  const [mintProgress, setMintProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [mintedNFT, setMintedNFT] = useState("")
  const [checkingTokens, setCheckingTokens] = useState(false)
  const router = useRouter()

  useEffect(() => {
    console.log("Network Info:", getNetworkInfo())
  }, [])

  const nftService = new EnhancedNFTMintingService(connection)
  const usdcService = new EnhancedUSDCService(connection)

  // Check USDC balance and mint status
  useEffect(() => {
    if (connected && publicKey) {
      checkAllTokenBalances()
      checkMintStatus()
    }
  }, [connected, publicKey])

  const checkAllTokenBalances = async () => {
    if (!publicKey) return
    setCheckingTokens(true)

    try {
      // Get all token balances
      const tokenBalances = await usdcService.getAllTokenBalances(publicKey)
      setAllTokenBalances(tokenBalances)

      // Get USDC balance specifically
      const usdcBal = await usdcService.getUSDCBalance(publicKey)
      setUsdcBalance(usdcBal)

      console.log("All token balances:", tokenBalances)
      console.log("USDC balance:", usdcBal)
    } catch (error) {
      console.error("Error checking token balances:", error)
    } finally {
      setCheckingTokens(false)
    }
  }

  const checkMintStatus = async () => {
    if (!publicKey) return
    try {
      const hasMinted = await nftService.hasAlreadyMinted(publicKey)
      setHasAlreadyMinted(hasMinted)
    } catch (error) {
      console.error("Error checking mint status:", error)
    }
  }

  const updateProgress = (stepId: string, completed = true) => {
    setCurrentStep(stepId)
    const progress = completed ? 100 : 50
    setMintProgress(progress)
  }

  const handleMint = async () => {
    if (!connected || !publicKey || !signTransaction) {
      setError("Please connect your wallet first")
      return
    }

    if (hasAlreadyMinted) {
      setError("You have already minted your NFT. Only 1 NFT per wallet is allowed.")
      return
    }

    if (usdcBalance < 10) {
      setError("Insufficient USDC balance. You need at least 10 USDC to mint.")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")
    setMintProgress(0)

    try {
      updateProgress("validate")
      await new Promise((resolve) => setTimeout(resolve, 1000))

      updateProgress("payment")
      setCurrentStep("Processing USDC payment and minting NFT...")

      const result = await nftService.mintNFT(publicKey, signTransaction, (progress) => {
        setCurrentStep(progress.message)
        setMintProgress(progress.progress)
      })

      if (result.success && result.mintAddress) {
        updateProgress("complete")
        setMintedNFT(result.mintAddress)
        setSuccess(`🎉 Welcome to RewardNFT Community! Your exclusive NFT: ${result.mintAddress} 🚀`)
        setHasAlreadyMinted(true)

        await checkAllTokenBalances()

        setTimeout(() => {
          router.push(`/congratulations?nft=${result.mintAddress}&signature=${result.signature}`)
        }, 3000)
      } else {
        setError(result.error || "Failed to mint NFT")
      }
    } catch (err: any) {
      setError(err.message || "Failed to mint NFT")
    } finally {
      setLoading(false)
    }
  }

  const getExplorerLink = (address: string) => {
    return getExplorerUrl(address, "address")
  }

  if (!connected) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-600 mb-4">Connect your wallet to mint your NFT</p>
          <Badge variant="outline">Wallet Required</Badge>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Token Debug Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Token Balances</span>
            <Button variant="ghost" size="sm" onClick={checkAllTokenBalances} disabled={checkingTokens}>
              <RefreshCw className={`w-4 h-4 ${checkingTokens ? "animate-spin" : ""}`} />
            </Button>
          </CardTitle>
          <CardDescription>Your current token balances on devnet</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {checkingTokens ? (
            <div className="flex items-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Checking token balances...
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-lg font-semibold">USDC Balance: {usdcBalance.toFixed(2)} USDC</div>
              {allTokenBalances.length > 0 && (
                <div className="text-sm space-y-1">
                  <p className="font-medium">All Token Accounts:</p>
                  {allTokenBalances.map((token, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span>{token.symbol || `${token.mint.slice(0, 8)}...${token.mint.slice(-4)}`}</span>
                      <span>{token.balance.toFixed(6)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* NFT Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Gift className="w-5 h-5 mr-2" />
            RewardNFT Membership
          </CardTitle>
          <CardDescription>Exclusive NFT with referral access and platform benefits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
            <div>
              <p className="font-medium">Mint Price</p>
              <p className="text-sm text-gray-600">USDC Payment Required</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-purple-600">10 USDC</p>
              <Badge variant="outline">+ network fees</Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Your USDC Balance:</strong> {usdcBalance.toFixed(2)} USDC
            </div>
            <div>
              <strong>Status:</strong>{" "}
              {hasAlreadyMinted ? (
                <Badge variant="secondary">Already Minted</Badge>
              ) : (
                <Badge variant="outline">Available</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Card */}
      {loading && (
        <Card>
          <CardHeader>
            <CardTitle>Minting Progress</CardTitle>
            <CardDescription>{currentStep}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={mintProgress} className="w-full" />
          </CardContent>
        </Card>
      )}

      {/* Status Messages */}
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{success}</span>
            {mintedNFT && (
              <a
                href={getExplorerLink(mintedNFT)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Mint Button */}
      <Button
        onClick={handleMint}
        disabled={loading || hasAlreadyMinted || usdcBalance < 10}
        className="w-full h-12 text-lg"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Minting NFT...
          </>
        ) : hasAlreadyMinted ? (
          <>
            <CheckCircle className="w-5 h-5 mr-2" />
            Already Minted ✓
          </>
        ) : usdcBalance < 10 ? (
          <>
            <AlertCircle className="w-5 h-5 mr-2" />
            Insufficient USDC ({usdcBalance.toFixed(2)}/10)
          </>
        ) : (
          <>
            <Coins className="w-5 h-5 mr-2" />
            Mint NFT (10 USDC)
          </>
        )}
      </Button>

      {/* Info */}
      <div className="text-center text-sm text-gray-600">
        <p>• Maximum 1 NFT per wallet</p>
        <p>• Grants access to referral system</p>
        <p>• All transactions on Solana Devnet</p>
        <p>• Supports multiple USDC mints</p>
      </div>
    </div>
  )
}
