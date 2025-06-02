"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { useWallet } from "@/contexts/wallet-context"
import { TransactionStatus } from "@/components/transaction-status"
import { createNftMintTransaction } from "@/utils/nft"
import { toast } from "@/components/ui/use-toast"
import { NFT_METADATA } from "@/config/solana"

interface NftMintingProps {
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function NftMinting({ onSuccess, onError }: NftMintingProps) {
  const { connected, publicKey, connection, signTransaction } = useWallet()
  const [mintingStatus, setMintingStatus] = useState<
    "idle" | "preparing" | "signing" | "confirming" | "success" | "error"
  >("idle")
  const [transactionSignature, setTransactionSignature] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleMintNft = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to mint an NFT",
        variant: "destructive",
      })
      return
    }

    try {
      // Start minting process
      setMintingStatus("preparing")
      setErrorMessage(null)

      // Create the NFT mint transaction
      const { transaction, mint } = await createNftMintTransaction(connection, publicKey)

      // Update status to signing
      setMintingStatus("signing")

      // Sign the transaction
      const signedTransaction = await signTransaction(transaction)

      // Partially sign with the mint keypair
      signedTransaction.partialSign(mint)

      // Update status to confirming
      setMintingStatus("confirming")

      // Send the signed transaction
      const serializedTransaction = signedTransaction.serialize()
      const signature = await connection.sendRawTransaction(serializedTransaction, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      })

      // Set the transaction signature for tracking
      setTransactionSignature(signature)

      // Confirm the transaction
      await connection.confirmTransaction({
        signature,
        blockhash: transaction.recentBlockhash!,
        lastValidBlockHeight: transaction.lastValidBlockHeight!,
      })

      // Update status to success
      setMintingStatus("success")

      // Call onSuccess callback if provided
      onSuccess && onSuccess()

      toast({
        title: "NFT Minted Successfully",
        description: "Your NFT has been minted and added to your wallet",
      })
    } catch (error: any) {
      console.error("NFT minting error:", error)
      setMintingStatus("error")
      setErrorMessage(error.message || "Failed to mint NFT")

      // Call onError callback if provided
      onError && onError(error)

      toast({
        title: "Mint Failed",
        description: error.message || "Failed to mint NFT. Please try again.",
        variant: "destructive",
      })
    }
  }

  const renderMintingStatus = () => {
    switch (mintingStatus) {
      case "idle":
        return (
          <Button onClick={handleMintNft} className="w-full bg-white hover:bg-white/90 text-black py-6 text-lg">
            Mint NFT
          </Button>
        )
      case "preparing":
        return (
          <div className="bg-white/20 rounded-lg p-4 flex items-center justify-center">
            <Loader2 className="animate-spin h-6 w-6 text-white mr-2" />
            <span className="text-white">Preparing transaction...</span>
          </div>
        )
      case "signing":
        return (
          <div className="bg-white/20 rounded-lg p-4 flex items-center justify-center">
            <Loader2 className="animate-spin h-6 w-6 text-white mr-2" />
            <span className="text-white">Please sign the transaction in your wallet...</span>
          </div>
        )
      case "confirming":
        return (
          <div className="space-y-4">
            <div className="bg-white/20 rounded-lg p-4 flex items-center justify-center">
              <Loader2 className="animate-spin h-6 w-6 text-white mr-2" />
              <span className="text-white">Minting in progress...</span>
            </div>
            <Progress value={65} className="h-2 bg-white/10" />
          </div>
        )
      case "success":
        return (
          <div className="bg-green-500/20 rounded-lg p-4 flex items-center">
            <CheckCircle2 className="h-6 w-6 text-green-400 mr-2" />
            <span className="text-white">NFT successfully minted!</span>
          </div>
        )
      case "error":
        return (
          <div className="space-y-4">
            <div className="bg-red-500/20 rounded-lg p-4 flex items-center">
              <AlertCircle className="h-6 w-6 text-red-400 mr-2" />
              <span className="text-white">{errorMessage || "Error minting NFT. Please try again."}</span>
            </div>
            <Button onClick={handleMintNft} className="w-full bg-white hover:bg-white/90 text-black">
              Try Again
            </Button>
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center">
        <div className="relative w-64 h-64 mb-4">
          <Image
            src={NFT_METADATA.image || "/placeholder.svg"}
            alt={NFT_METADATA.name}
            fill
            className="object-cover rounded-lg"
          />
          {mintingStatus === "success" && (
            <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
          )}
        </div>
        <h3 className="text-xl font-bold text-white">{NFT_METADATA.name}</h3>
        <p className="text-white/60 text-sm mt-1">{NFT_METADATA.description}</p>
      </div>

      {renderMintingStatus()}

      {transactionSignature && <TransactionStatus signature={transactionSignature} connection={connection} />}
    </div>
  )
}
