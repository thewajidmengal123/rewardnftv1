"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle2 } from "lucide-react"
import { useSolanaWallet } from "@/hooks/use-solana-wallet"
import { EnhancedWalletConnect } from "@/components/enhanced-wallet-connect"
import { PublicKey, type Transaction } from "@solana/web3.js"
import { buildSolTransferTransaction, sendSignedTransaction } from "@/utils/transaction-builder"
import { defaultConnectionManager } from "@/utils/wallet-adapter"
import { toast } from "@/components/ui/use-toast"
import { DEFAULT_SOLANA_EXPLORER_URL } from "@/config/solana"

export function WalletIntegrationDemo() {
  const { connected, publicKey, solBalance, signTransaction, refreshBalance } = useSolanaWallet()

  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [isValidAddress, setIsValidAddress] = useState(false)
  const [sending, setSending] = useState(false)
  const [txSignature, setTxSignature] = useState<string | null>(null)

  // Validate Solana address
  const validateAddress = (address: string) => {
    try {
      new PublicKey(address)
      setIsValidAddress(true)
      return true
    } catch (error) {
      setIsValidAddress(false)
      return false
    }
  }

  // Handle recipient address change
  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setRecipient(value)
    if (value.length > 30) {
      validateAddress(value)
    } else {
      setIsValidAddress(false)
    }
  }

  // Handle amount change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and decimals
    const value = e.target.value.replace(/[^0-9.]/g, "")
    setAmount(value)
  }

  // Handle send transaction
  const handleSendTransaction = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return
    }

    if (!isValidAddress) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid Solana address",
        variant: "destructive",
      })
      return
    }

    const amountValue = Number.parseFloat(amount)
    if (isNaN(amountValue) || amountValue <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    if (solBalance !== null && amountValue > solBalance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough SOL for this transaction",
        variant: "destructive",
      })
      return
    }

    try {
      setSending(true)
      setTxSignature(null)

      // Create recipient public key
      const recipientPublicKey = new PublicKey(recipient)

      // Build the transaction
      const transaction = await buildSolTransferTransaction(
        defaultConnectionManager.connection,
        publicKey,
        recipientPublicKey,
        amountValue,
      )

      // Sign the transaction
      const signedTransaction = await signTransaction(transaction)

      // Send the transaction
      const signature = await sendSignedTransaction(
        defaultConnectionManager.connection,
        signedTransaction as Transaction,
      )

      setTxSignature(signature)

      toast({
        title: "Transaction Sent",
        description: "Your transaction has been sent successfully",
      })

      // Refresh balance after transaction
      setTimeout(() => {
        refreshBalance()
      }, 2000)
    } catch (error) {
      console.error("Error sending transaction:", error)
      toast({
        title: "Transaction Failed",
        description: (error as Error).message || "Failed to send transaction",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  // View transaction on explorer
  const viewTransaction = () => {
    if (txSignature) {
      window.open(`${DEFAULT_SOLANA_EXPLORER_URL}/tx/${txSignature}`, "_blank")
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Solana Wallet Integration</CardTitle>
        <CardDescription>Connect your wallet and send SOL</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {!connected && (
            <div className="flex justify-center py-4">
              <EnhancedWalletConnect size="lg" />
            </div>
          )}

          {connected && (
            <Tabs defaultValue="send" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="send">Send SOL</TabsTrigger>
                <TabsTrigger value="info">Wallet Info</TabsTrigger>
              </TabsList>

              <TabsContent value="send" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient Address</Label>
                  <Input
                    id="recipient"
                    placeholder="Enter Solana address"
                    value={recipient}
                    onChange={handleRecipientChange}
                  />
                  {recipient && !isValidAddress && <p className="text-xs text-destructive">Invalid Solana address</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (SOL)</Label>
                  <Input id="amount" placeholder="0.0" value={amount} onChange={handleAmountChange} />
                  {solBalance !== null && (
                    <p className="text-xs text-muted-foreground">Available: {solBalance.toFixed(4)} SOL</p>
                  )}
                </div>

                <Button
                  className="w-full"
                  onClick={handleSendTransaction}
                  disabled={sending || !isValidAddress || !amount || !connected}
                >
                  {sending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send SOL"
                  )}
                </Button>

                {txSignature && (
                  <Alert className="mt-4">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Transaction Successful</AlertTitle>
                    <AlertDescription className="flex flex-col gap-2">
                      <span className="text-xs break-all">Signature: {txSignature}</span>
                      <Button variant="outline" size="sm" className="mt-2" onClick={viewTransaction}>
                        View on Explorer
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="info" className="space-y-4 pt-4">
                {publicKey && (
                  <>
                    <div className="space-y-2">
                      <Label>Wallet Address</Label>
                      <div className="p-2 bg-muted rounded-md text-xs break-all">{publicKey.toString()}</div>
                    </div>

                    <div className="space-y-2">
                      <Label>SOL Balance</Label>
                      <div className="p-2 bg-muted rounded-md">
                        {solBalance !== null ? (
                          <span>{solBalance.toFixed(6)} SOL</span>
                        ) : (
                          <span className="text-muted-foreground">Loading...</span>
                        )}
                      </div>
                    </div>

                    <Button variant="outline" className="w-full" onClick={refreshBalance}>
                      Refresh Balance
                    </Button>
                  </>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {connected && <EnhancedWalletConnect variant="outline" />}
      </CardFooter>
    </Card>
  )
}
