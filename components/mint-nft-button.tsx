"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/contexts/wallet-context"
import { NFT_MINT_COST_USDC, DEFAULT_USDC_TOKEN_ADDRESS, PLATFORM_WALLET_ADDRESS } from "@/config/solana"
import { createTokenTransferTransaction } from "@/utils/token"
import { toast } from "@/components/ui/use-toast"
import { SecureTransactionButton } from "@/components/secure-transaction-button"
import type { Transaction } from "@solana/web3.js"

interface MintNftButtonProps {
  onSuccess?: (signature: string) => void
  className?: string
}

export function MintNftButton({ onSuccess, className = "" }: MintNftButtonProps) {
  const { publicKey, connected, connection, usdcBalance } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const createMintTransaction = async (): Promise<Transaction> => {
    if (!connected || !publicKey) {
      throw new Error("Wallet not connected")
    }

    if (!usdcBalance || usdcBalance < NFT_MINT_COST_USDC) {
      throw new Error(`Insufficient USDC balance. You need at least ${NFT_MINT_COST_USDC} USDC to mint an NFT.`)
    }

    // Create a transaction to transfer USDC to the platform wallet
    return createTokenTransferTransaction(
      connection,
      publicKey,
      PLATFORM_WALLET_ADDRESS,
      DEFAULT_USDC_TOKEN_ADDRESS,
      NFT_MINT_COST_USDC,
    )
  }

  const handleSuccess = (signature: string) => {
    // Simulate NFT minting process with a delay
    setIsLoading(true)

    setTimeout(() => {
      // Store the mint status in localStorage for demo purposes
      // In a real app, you would verify this on-chain or with your backend
      if (publicKey) {
        localStorage.setItem(`nft_minted_${publicKey.toString()}`, "true")
      }

      toast({
        title: "NFT Minted Successfully",
        description: "Your NFT has been minted and added to your wallet",
      })

      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess(signature)
      }

      // Redirect to the success page
      router.push("/mint/success")
      setIsLoading(false)
    }, 2000)
  }

  const handleError = (error: Error) => {
    setIsLoading(false)
    toast({
      title: "Minting Failed",
      description: error.message || "An error occurred during the minting process",
      variant: "destructive",
    })
  }

  return (
    <SecureTransactionButton
      createTransaction={createMintTransaction}
      onSuccess={handleSuccess}
      onError={handleError}
      verificationOptions={{
        maxFeeLimit: 500000, // 0.0005 SOL
        requireRecentBlockhash: true,
      }}
      confirmationMessage="Your NFT is being minted and will appear in your wallet shortly."
      className={className}
      disabled={isLoading || !connected || !usdcBalance || usdcBalance < NFT_MINT_COST_USDC}
    >
      {isLoading
        ? "Minting..."
        : !connected
          ? "Connect Wallet to Mint"
          : !usdcBalance || usdcBalance < NFT_MINT_COST_USDC
            ? `Insufficient USDC (${usdcBalance || 0} USDC)`
            : "Mint NFT"}
    </SecureTransactionButton>
  )
}
