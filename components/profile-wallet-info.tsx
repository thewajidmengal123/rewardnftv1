"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/contexts/wallet-context"
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { Copy, ExternalLink } from "lucide-react"
import { useState } from "react"
import { toast } from "@/components/ui/use-toast"
import Image from "next/image"

export function ProfileWalletInfo() {
  const { connected, publicKey, solBalance, usdcBalance, currentWallet } = useWallet()
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString())
      setCopied(true)
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getWalletIcon = () => {
    if (!currentWallet) return null

    if (currentWallet === "Phantom") {
      return "/images/phantom-icon.png"
    } else if (currentWallet === "Solflare") {
      return "/images/solflare-icon.png"
    }

    return null
  }

  // Format balances safely with fallbacks for undefined values
  const formattedSolBalance = typeof solBalance === "number" ? solBalance.toFixed(4) : "0.0000"
  const formattedUsdcBalance = typeof usdcBalance === "number" ? usdcBalance.toFixed(2) : "0.00"

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-white">Wallet</CardTitle>
      </CardHeader>
      <CardContent>
        {connected && publicKey ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {getWalletIcon() && (
                <div className="relative h-5 w-5">
                  <Image
                    src={getWalletIcon()! || "/placeholder.svg"}
                    alt={currentWallet!}
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              <span className="text-white font-medium">{currentWallet}</span>
            </div>

            <div className="flex items-center justify-between bg-white/5 p-2 rounded-md">
              <span className="text-white/70 text-sm truncate">
                {publicKey.toString().slice(0, 6)}...{publicKey.toString().slice(-4)}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-white/70 hover:text-white hover:bg-white/10"
                  onClick={handleCopy}
                >
                  <Copy className="h-4 w-4" />
                  <span className="sr-only">Copy address</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-white/70 hover:text-white hover:bg-white/10"
                  asChild
                >
                  <a
                    href={`https://explorer.solana.com/address/${publicKey.toString()}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="sr-only">View on explorer</span>
                  </a>
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-white/60">SOL Balance</span>
                <span className="font-medium text-white">{formattedSolBalance} SOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">USDC Balance</span>
                <span className="font-medium text-white">{formattedUsdcBalance} USDC</span>
              </div>
            </div>

            <WalletConnectButton
              variant="outline"
              className="w-full mt-2 border-white/20 text-white hover:bg-white/10"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 space-y-4">
            <p className="text-white/60 text-center">Connect your wallet to view your balance and NFTs</p>
            <WalletConnectButton />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
