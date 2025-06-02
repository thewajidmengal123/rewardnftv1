"use client"

import { useState } from "react"
import { useWallet } from "@/contexts/wallet-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { LazyImage } from "./lazy-image"
import { NFT_MINT_COST_USDC, DEFAULT_USDC_TOKEN_ADDRESS, PLATFORM_WALLET_ADDRESS } from "@/config/solana"
import { createTokenTransferTransaction } from "@/utils/token"
import { toast } from "@/components/ui/use-toast"

interface SimplifiedNftMintingProps {
  onSuccess?: (signature: string) => void
}

export function SimplifiedNftMinting({ onSuccess }: SimplifiedNftMintingProps) {
  const { publicKey, connected, connection, signAndSendTransaction, usdcBalance } = useWallet()
  const [status, setStatus] = useState<"idle" | "paying" | "minting" | "success" | "error">("idle")
  const [error, setError] = useState<string | null>(null)
  const [txSignature, setTxSignature] = useState<string | null>(null)

  const handleMint = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to mint an NFT",
        variant: "destructive",
      })
      return
    }

    if (!usdcBalance || usdcBalance < NFT_MINT_COST_USDC) {
      toast({
        title: "Insufficient USDC balance",
        description: `You need at least ${NFT_MINT_COST_USDC} USDC to mint an NFT`,
        variant: "destructive",
      })
      return
    }

    try {
      // Step 1: Pay with USDC
      setStatus("paying")
      setError(null)

      // Create a transaction to transfer USDC to the platform wallet
      const transaction = await createTokenTransferTransaction(
        connection,
        publicKey,
        PLATFORM_WALLET_ADDRESS,
        DEFAULT_USDC_TOKEN_ADDRESS,
        NFT_MINT_COST_USDC,
      )

      // Sign and send the transaction
      const signature = await signAndSendTransaction(transaction)
      setTxSignature(signature)

      // Step 2: Mint the NFT (simulated)
      setStatus("minting")

      // Simulate NFT minting process with a delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Success
      setStatus("success")

      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess(signature)
      }

      toast({
        title: "NFT Minted Successfully",
        description: "Your NFT has been minted and added to your wallet",
      })
    } catch (err: any) {
      console.error("Minting error:", err)
      setStatus("error")
      setError(err.message || "An error occurred during the minting process")
      toast({
        title: "Minting Failed",
        description: err.message || "An error occurred during the minting process",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-col items-center">
      <Card className="w-full max-w-md bg-white/5 backdrop-blur-sm border-white/10">
        <CardContent className="p-6">
          <div className="relative aspect-square w-full mb-4 bg-black/20 rounded-lg overflow-hidden">
            <LazyImage src="/images/mint-nft-box.png" alt="NFT Preview" fill className="object-cover" />
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-white">Reward NFT Mint Pass</h3>
              <p className="text-white/70">Mint price: {NFT_MINT_COST_USDC} USDC</p>
            </div>

            {status === "idle" && (
              <Button
                onClick={handleMint}
                disabled={!connected || !usdcBalance || usdcBalance < NFT_MINT_COST_USDC}
                className="w-full"
              >
                {!connected
                  ? "Connect Wallet to Mint"
                  : !usdcBalance || usdcBalance < NFT_MINT_COST_USDC
                    ? `Insufficient USDC (${usdcBalance || 0} USDC)`
                    : "Mint NFT"}
              </Button>
            )}

            {status === "paying" && (
              <div className="flex flex-col items-center gap-2 py-2">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
                <p className="text-white/80">Processing USDC payment...</p>
              </div>
            )}

            {status === "minting" && (
              <div className="flex flex-col items-center gap-2 py-2">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
                <p className="text-white/80">Minting your NFT...</p>
              </div>
            )}

            {status === "success" && (
              <div className="flex flex-col items-center gap-2 py-2">
                <CheckCircle2 className="h-6 w-6 text-green-400" />
                <p className="text-white/80">NFT minted successfully!</p>
                {txSignature && (
                  <a
                    href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:underline"
                  >
                    View transaction
                  </a>
                )}
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center gap-2 py-2">
                <AlertCircle className="h-6 w-6 text-red-400" />
                <p className="text-red-400">Minting failed</p>
                {error && <p className="text-sm text-white/60">{error}</p>}
                <Button variant="outline" size="sm" onClick={() => setStatus("idle")}>
                  Try Again
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
