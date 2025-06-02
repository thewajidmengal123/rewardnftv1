"use client"

import { useState, useEffect } from "react"
import type { Connection, TransactionSignature } from "@solana/web3.js"
import { Loader2, CheckCircle, XCircle, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useWallet } from "@/contexts/wallet-context"

interface TransactionStatusProps {
  signature: TransactionSignature | null
  connection: Connection
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function TransactionStatus({ signature, connection, onSuccess, onError }: TransactionStatusProps) {
  const { explorerUrl } = useWallet()
  const [status, setStatus] = useState<"processing" | "confirmed" | "error">("processing")
  const [confirmations, setConfirmations] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!signature) return

    const checkSignature = async () => {
      try {
        const { value } = await connection.getSignatureStatus(signature, {
          searchTransactionHistory: true,
        })

        if (value?.err) {
          setStatus("error")
          setError("Transaction failed")
          onError && onError(new Error("Transaction failed"))
          return
        }

        if (value?.confirmationStatus === "confirmed" || value?.confirmationStatus === "finalized") {
          setStatus("confirmed")
          onSuccess && onSuccess()
          return
        }

        if (value?.confirmations) {
          setConfirmations(value.confirmations)
        }

        // Check again in 2 seconds
        setTimeout(checkSignature, 2000)
      } catch (err: any) {
        setStatus("error")
        setError(err.message || "Failed to check transaction status")
        onError && onError(err)
      }
    }

    checkSignature()
  }, [signature, connection, onSuccess, onError])

  if (!signature) return null

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4 mt-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-medium">Transaction Status</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => window.open(`${explorerUrl}/tx/${signature}`, "_blank")}
        >
          <ExternalLink className="h-4 w-4 text-white/60" />
        </Button>
      </div>

      {status === "processing" && (
        <>
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="h-5 w-5 text-white animate-spin" />
            <span className="text-white">Processing transaction...</span>
          </div>
          <Progress value={confirmations * 20} className="h-2 bg-white/10" />
          <p className="text-white/60 text-sm mt-2">Confirmations: {confirmations}/5</p>
        </>
      )}

      {status === "confirmed" && (
        <div className="flex items-center gap-2 text-green-400">
          <CheckCircle className="h-5 w-5" />
          <span>Transaction confirmed!</span>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-2 text-red-400">
          <XCircle className="h-5 w-5" />
          <span>{error || "Transaction failed"}</span>
        </div>
      )}
    </div>
  )
}
