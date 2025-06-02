"use client"

import React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useWallet } from "@/contexts/wallet-context"
import { DevnetFaucetService } from "@/services/devnet-faucet-service"
import { USDCService } from "@/services/usdc-service"
import { Loader2, Coins, Droplets, ExternalLink, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function DevnetFaucet() {
  const { connected, publicKey, connection } = useWallet()
  const [loading, setLoading] = useState(false)
  const [solBalance, setSolBalance] = useState<number>(0)
  const [usdcBalance, setUsdcBalance] = useState<number>(0)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const { toast } = useToast()

  const faucetService = new DevnetFaucetService()
  const usdcService = new USDCService(connection)

  const refreshBalances = async () => {
    if (!publicKey) return

    setLoading(true)
    try {
      const [sol, usdc] = await Promise.all([
        faucetService.getSOLBalance(publicKey),
        usdcService.getUSDCBalance(publicKey),
      ])

      setSolBalance(sol)
      setUsdcBalance(usdc)
      setLastUpdate(new Date())
    } catch (error) {
      console.error("Error refreshing balances:", error)
    } finally {
      setLoading(false)
    }
  }

  const requestSOL = async () => {
    if (!publicKey) return

    setLoading(true)
    try {
      const result = await faucetService.requestSOL(publicKey, 2)

      if (result.success) {
        toast({
          title: "SOL Requested Successfully!",
          description: "2 SOL has been sent to your wallet. It may take a few moments to appear.",
        })

        // Refresh balances after a delay
        setTimeout(refreshBalances, 3000)
      } else {
        toast({
          title: "SOL Request Failed",
          description: result.error || "Failed to request SOL from faucet",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to request SOL",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const requestUSDC = async () => {
    if (!publicKey) return

    toast({
      title: "USDC Faucet Info",
      description: "For devnet USDC, please use external faucet services or contact the platform admin.",
    })
  }

  // Auto-refresh balances when wallet connects
  React.useEffect(() => {
    if (connected && publicKey) {
      refreshBalances()
    }
  }, [connected, publicKey])

  if (!connected) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-600 mb-4">Connect your wallet to access devnet faucets</p>
          <Badge variant="outline">Wallet Required</Badge>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Balance Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Coins className="w-5 h-5 mr-2" />
              Wallet Balances
            </span>
            <Button variant="outline" size="sm" onClick={refreshBalances} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </CardTitle>
          <CardDescription>
            Current balances on Solana Devnet
            <br />
            <span className="text-xs text-gray-500">Last updated: {lastUpdate.toLocaleTimeString()}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">SOL Balance</p>
                  <p className="text-2xl font-bold text-blue-600">{solBalance.toFixed(4)}</p>
                </div>
                <Badge variant={solBalance >= 0.5 ? "default" : "destructive"}>
                  {solBalance >= 0.5 ? "Sufficient" : "Low"}
                </Badge>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-900">USDC Balance</p>
                  <p className="text-2xl font-bold text-green-600">{usdcBalance.toFixed(2)}</p>
                </div>
                <Badge variant={usdcBalance >= 10 ? "default" : "destructive"}>
                  {usdcBalance >= 10 ? "Sufficient" : "Low"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <Alert>
            <Droplets className="h-4 w-4" />
            <AlertDescription>
              <strong>Minting Requirements:</strong>
              <br />• Minimum 0.5 SOL for transaction fees
              <br />• Exactly 10 USDC for NFT minting
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Faucet Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Droplets className="w-5 h-5 mr-2" />
            Devnet Faucets
          </CardTitle>
          <CardDescription>Get free tokens for testing on Solana Devnet</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* SOL Faucet */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">SOL Faucet</h3>
              <p className="text-sm text-gray-600">Get 2 SOL for transaction fees</p>
            </div>
            <Button
              onClick={requestSOL}
              disabled={loading || solBalance >= 2}
              variant={solBalance < 0.5 ? "default" : "outline"}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Get 2 SOL"}
            </Button>
          </div>

          {/* USDC Faucet */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">USDC Faucet</h3>
              <p className="text-sm text-gray-600">External USDC faucet required</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => window.open("https://faucet.circle.com/", "_blank")}>
                <ExternalLink className="w-4 h-4 mr-1" />
                Circle Faucet
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("https://spl-token-faucet.com/", "_blank")}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                SPL Faucet
              </Button>
            </div>
          </div>

          {/* Status */}
          <div className="text-center text-sm text-gray-600">
            <p>• All tokens are for Solana Devnet testing only</p>
            <p>• SOL is required for transaction fees</p>
            <p>• USDC is required for NFT minting (10 USDC)</p>
          </div>
        </CardContent>
      </Card>

      {/* Ready Status */}
      {solBalance >= 0.5 && usdcBalance >= 10 && (
        <Alert>
          <Coins className="h-4 w-4" />
          <AlertDescription className="text-green-600">
            <strong>✅ Ready to Mint!</strong> You have sufficient SOL and USDC to mint your NFT.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
