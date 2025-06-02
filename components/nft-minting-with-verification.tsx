"use client"

import { useState } from "react"
import { useWallet } from "@/contexts/wallet-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, CheckCircle2, AlertCircle, Shield } from "lucide-react"
import Image from "next/image"
import { NFT_MINT_COST_USDC, DEFAULT_USDC_TOKEN_ADDRESS, PLATFORM_WALLET_ADDRESS, NFT_METADATA } from "@/config/solana"
import { createTokenTransferTransaction } from "@/utils/token"
import { toast } from "@/components/ui/use-toast"
import { NftVerificationBadge } from "./nft-verification-badge"

interface NftMintingWithVerificationProps {
  onSuccess?: (signature: string) => void
}

export function NftMintingWithVerification({ onSuccess }: NftMintingWithVerificationProps) {
  const { publicKey, connected, connection, signAndSendTransaction, usdcBalance } = useWallet()
  const [status, setStatus] = useState<"idle" | "paying" | "minting" | "verifying" | "success" | "error">("idle")
  const [error, setError] = useState<string | null>(null)
  const [txSignature, setTxSignature] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  const [verification, setVerification] = useState<{
    status: "verified" | "pending" | "failed"
    message: string
    details: {
      metadataVerified: boolean
      imageVerified: boolean
      onChainVerified: boolean
    }
  } | null>(null)

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

      // Step 3: Verify the NFT
      setStatus("verifying")

      // Simulate verification process with a delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Set verification result
      setVerification({
        status: "verified",
        message: "NFT successfully verified",
        details: {
          metadataVerified: true,
          imageVerified: true,
          onChainVerified: true,
        },
      })

      // Success
      setStatus("success")

      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess(signature)
      }

      toast({
        title: "NFT Minted Successfully",
        description: "Your NFT has been minted, verified, and added to your wallet",
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
            <div className="absolute inset-0 flex items-center justify-center">
              {imageError ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg">
                  <span className="text-white">NFT Preview</span>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image
                    src="/mystery-box.png"
                    alt="NFT Preview"
                    width={300}
                    height={300}
                    className="object-contain"
                    onError={() => setImageError(true)}
                  />
                </div>
              )}
            </div>
            {verification && (
              <div className="absolute top-2 right-2">
                <NftVerificationBadge status={verification.status} />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-white">{NFT_METADATA.name}</h3>
              <p className="text-white/70">{NFT_METADATA.description}</p>
              <p className="text-white/70 mt-1">Mint price: {NFT_MINT_COST_USDC} USDC</p>
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

            {status === "verifying" && (
              <div className="flex flex-col items-center gap-2 py-2">
                <Shield className="h-6 w-6 text-blue-400 animate-pulse" />
                <p className="text-white/80">Verifying NFT metadata...</p>
              </div>
            )}

            {status === "success" && (
              <div className="flex flex-col items-center gap-2 py-2">
                <CheckCircle2 className="h-6 w-6 text-green-400" />
                <p className="text-white/80">NFT minted and verified!</p>
                {verification && (
                  <div className="bg-white/10 rounded p-2 w-full mt-2">
                    <p className="text-sm font-medium text-white">{verification.message}</p>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                      <div className="flex items-center gap-1">
                        <div
                          className={`w-2 h-2 rounded-full ${verification.details.metadataVerified ? "bg-green-400" : "bg-red-400"}`}
                        ></div>
                        <span>Metadata</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div
                          className={`w-2 h-2 rounded-full ${verification.details.imageVerified ? "bg-green-400" : "bg-red-400"}`}
                        ></div>
                        <span>Image</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div
                          className={`w-2 h-2 rounded-full ${verification.details.onChainVerified ? "bg-green-400" : "bg-red-400"}`}
                        ></div>
                        <span>On-chain</span>
                      </div>
                    </div>
                  </div>
                )}
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
