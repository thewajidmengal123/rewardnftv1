"use client"

import { useState } from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { useSecureWallet } from "@/contexts/secure-wallet-context"
import { useWallet } from "@/contexts/wallet-context"
import type { Transaction } from "@solana/web3.js"
import { Loader2, AlertCircle, Shield, CheckCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import type { TransactionVerificationOptions } from "@/utils/transaction-verification"

interface SecureTransactionButtonProps extends ButtonProps {
  createTransaction: () => Promise<Transaction>
  onSuccess?: (signature: string) => void
  onError?: (error: Error) => void
  verificationOptions?: TransactionVerificationOptions
  confirmationMessage?: string
}

export function SecureTransactionButton({
  children,
  createTransaction,
  onSuccess,
  onError,
  verificationOptions,
  confirmationMessage,
  ...props
}: SecureTransactionButtonProps) {
  const { connected } = useWallet()
  const { secureSignAndSendTransaction, isRateLimited } = useSecureWallet()
  const [status, setStatus] = useState<"idle" | "loading" | "verifying" | "success" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  const handleTransaction = async () => {
    if (!connected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to continue",
        variant: "destructive",
      })
      return
    }

    if (isRateLimited) {
      toast({
        title: "Rate limited",
        description: "Too many transactions. Please try again later.",
        variant: "destructive",
      })
      return
    }

    try {
      setStatus("loading")
      setError(null)

      // Create transaction
      const transaction = await createTransaction()

      // Verify transaction
      setStatus("verifying")

      // Sign and send transaction
      const signature = await secureSignAndSendTransaction(transaction, verificationOptions)

      // Success
      setStatus("success")

      if (confirmationMessage) {
        toast({
          title: "Transaction Successful",
          description: confirmationMessage,
        })
      }

      // Call onSuccess callback
      if (onSuccess) {
        onSuccess(signature)
      }

      // Reset status after 2 seconds
      setTimeout(() => {
        setStatus("idle")
      }, 2000)
    } catch (err: any) {
      console.error("Transaction error:", err)
      setStatus("error")
      setError(err.message || "An error occurred")

      // Call onError callback
      if (onError) {
        onError(err)
      }
    }
  }

  return (
    <Button
      onClick={handleTransaction}
      disabled={!connected || status === "loading" || status === "verifying" || isRateLimited}
      {...props}
    >
      {status === "idle" && children}

      {status === "loading" && (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Preparing...
        </>
      )}

      {status === "verifying" && (
        <>
          <Shield className="mr-2 h-4 w-4" />
          Verifying...
        </>
      )}

      {status === "success" && (
        <>
          <CheckCircle className="mr-2 h-4 w-4" />
          Success
        </>
      )}

      {status === "error" && (
        <>
          <AlertCircle className="mr-2 h-4 w-4" />
          {error ? "Error" : "Failed"}
        </>
      )}
    </Button>
  )
}
