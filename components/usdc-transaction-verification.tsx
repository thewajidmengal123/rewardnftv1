"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { USDCService } from "@/services/usdc-service"
import { useWallet } from "@/contexts/wallet-context"
import { CheckCircle, XCircle, Search } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export function USDCTransactionVerification() {
  const { connection } = useWallet()
  const [signature, setSignature] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean
    details?: any
  } | null>(null)
  const [usdcService] = useState(() => new USDCService(connection))

  const verifyTransaction = async () => {
    if (!signature.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a transaction signature",
        variant: "destructive",
      })
      return
    }

    setIsVerifying(true)
    setVerificationResult(null)

    try {
      // Get transaction details
      const details = await usdcService.getUSDCTransactionDetails(signature)

      if (details) {
        setVerificationResult({
          isValid: true,
          details,
        })
        toast({
          title: "Transaction Verified",
          description: `USDC transfer of ${details.amount} verified successfully`,
        })
      } else {
        setVerificationResult({
          isValid: false,
        })
        toast({
          title: "Verification Failed",
          description: "Transaction not found or invalid",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Verification error:", error)
      setVerificationResult({
        isValid: false,
      })
      toast({
        title: "Verification Error",
        description: "An error occurred while verifying the transaction",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>USDC Transaction Verification</CardTitle>
        <CardDescription>Verify USDC transactions on the Solana blockchain</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="signature">Transaction Signature</Label>
          <Input
            id="signature"
            placeholder="Enter transaction signature..."
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
          />
        </div>

        <Button onClick={verifyTransaction} disabled={isVerifying} className="w-full">
          {isVerifying ? (
            <>
              <Search className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Verify Transaction
            </>
          )}
        </Button>

        {verificationResult && (
          <div className={`p-4 rounded-lg ${verificationResult.isValid ? "bg-green-50" : "bg-red-50"}`}>
            <div className="flex items-center mb-2">
              {verificationResult.isValid ? (
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 mr-2 text-red-600" />
              )}
              <span className={`font-medium ${verificationResult.isValid ? "text-green-800" : "text-red-800"}`}>
                {verificationResult.isValid ? "Transaction Verified" : "Verification Failed"}
              </span>
            </div>

            {verificationResult.isValid && verificationResult.details && (
              <div className="space-y-1 text-sm text-green-700">
                <p>Amount: {verificationResult.details.amount} USDC</p>
                <p>
                  From: {verificationResult.details.from.slice(0, 8)}...{verificationResult.details.from.slice(-8)}
                </p>
                <p>
                  To: {verificationResult.details.to.slice(0, 8)}...{verificationResult.details.to.slice(-8)}
                </p>
                <p>Time: {new Date(verificationResult.details.timestamp * 1000).toLocaleString()}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
