"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2, ExternalLink } from "lucide-react"
import { DEFAULT_SOLANA_EXPLORER_URL } from "@/config/solana"

interface TransactionConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  status: "processing" | "success" | "error"
  message?: string
  txSignature?: string
  tokenSymbol?: string
  amount?: number
}

export function TransactionConfirmationDialog({
  isOpen,
  onClose,
  status,
  message,
  txSignature,
  tokenSymbol = "USDC",
  amount,
}: TransactionConfirmationDialogProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (status === "processing" && isOpen) {
      setProgress(0)
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval)
            return 95
          }
          return prev + 5
        })
      }, 500)

      return () => clearInterval(interval)
    } else if (status === "success") {
      setProgress(100)
    }
  }, [status, isOpen])

  const getExplorerLink = (signature: string) => {
    return `${DEFAULT_SOLANA_EXPLORER_URL}/tx/${signature}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {status === "processing" && "Processing Transaction"}
            {status === "success" && "Transaction Successful"}
            {status === "error" && "Transaction Failed"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {status === "processing" && (
            <>
              <div className="text-center text-sm text-muted-foreground">
                {message || `Sending ${amount} ${tokenSymbol}...`}
              </div>
              <Progress value={progress} className="h-2" />
            </>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <div className="text-center">
                <p className="font-medium">{message || `Successfully sent ${amount} ${tokenSymbol}`}</p>
                {txSignature && (
                  <a
                    href={getExplorerLink(txSignature)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center text-sm text-blue-500 hover:text-blue-700"
                  >
                    View on Explorer
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
              <div className="text-center">
                <p className="font-medium">{message || "Transaction failed. Please try again."}</p>
              </div>
            </div>
          )}

          <div className="flex justify-center pt-4">
            <Button
              onClick={onClose}
              disabled={status === "processing"}
              variant={status === "error" ? "destructive" : "default"}
            >
              {status === "processing" ? "Please wait..." : "Close"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
