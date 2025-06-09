"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ProfessionalErrorModal } from "@/components/professional-error-modal"

export default function TestErrorModalPage() {
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    error: "",
    title: ""
  })

  const showError = (error: string, title: string) => {
    setErrorModal({
      isOpen: true,
      error,
      title
    })
  }

  const closeErrorModal = () => {
    setErrorModal({
      isOpen: false,
      error: "",
      title: ""
    })
  }

  const testErrors = [
    {
      title: "Insufficient SOL Balance",
      error: `💰 Insufficient SOL Balance

You need SOL to pay for blockchain transaction fees.

📊 Balance Details:
• Current SOL: 0.0012 SOL
• Required SOL: 0.0150 SOL
• Shortage: 0.0138 SOL

💡 Solution:
Please add SOL to your wallet to cover transaction fees. You can purchase SOL from exchanges like Coinbase, Binance, or use a SOL faucet if available.`
    },
    {
      title: "Insufficient USDC Balance", 
      error: `💳 Insufficient USDC Balance

You need USDC tokens to mint NFTs on our platform.

📊 Balance Details:
• Current USDC: 2.50 USDC
• Required USDC: 10.00 USDC
• Shortage: 7.50 USDC

💰 NFT Pricing:
• Price per NFT: 10 USDC
• Quantity: 1 NFT(s)

💡 Solution:
Please add USDC to your wallet. You can:
1. Purchase USDC from exchanges (Coinbase, Binance, etc.)
2. Swap SOL to USDC using Jupiter or Raydium
3. Transfer USDC from another wallet`
    },
    {
      title: "Network Connection Error",
      error: `🌐 Network Connection Error

There was a problem connecting to the Solana network.

🔍 Error Details:
Failed to connect to RPC endpoint: Connection timeout

💡 Solutions:
• Check your internet connection
• Refresh the page and try again
• The network may be experiencing high traffic`
    },
    {
      title: "Transaction Failed",
      error: `⚠️ Transaction Failed

The blockchain transaction could not be completed.

🔍 Error Details:
Transaction simulation failed: Insufficient funds for transaction fee

💡 Possible Solutions:
• Network congestion - try again in a few minutes
• Insufficient SOL for fees
• RPC endpoint issues - refresh and retry
• Check your wallet connection`
    }
  ]

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Professional Error Modal Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testErrors.map((testError, index) => (
            <Button
              key={index}
              onClick={() => showError(testError.error, testError.title)}
              variant="outline"
              className="h-auto p-4 text-left"
            >
              <div>
                <div className="font-semibold">{testError.title}</div>
                <div className="text-sm text-gray-400 mt-1">
                  Click to test this error modal
                </div>
              </div>
            </Button>
          ))}
        </div>

        <ProfessionalErrorModal
          isOpen={errorModal.isOpen}
          onClose={closeErrorModal}
          error={errorModal.error}
          title={errorModal.title}
          onRetry={() => {
            closeErrorModal()
            console.log("Retry clicked")
          }}
          showRetryButton={true}
          showSupportButton={true}
        />
      </div>
    </div>
  )
}
