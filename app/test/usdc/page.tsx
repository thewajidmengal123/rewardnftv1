"use client"

import { USDCTransactionVerification } from "@/components/usdc-transaction-verification"
import { USDCBalanceDisplay } from "@/components/usdc-balance-display"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { USDC_TOKEN_ADDRESS, CURRENT_NETWORK } from "@/config/solana"

export default function USDCTestPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">USDC Integration Test</h1>
          <p className="text-gray-600 mb-4">Test and verify USDC functionality on Solana</p>
          <Badge variant="secondary">Network: {CURRENT_NETWORK.toUpperCase()}</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>USDC Configuration</CardTitle>
              <CardDescription>Current USDC token configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium">Network</p>
                <p className="text-sm text-gray-600">{CURRENT_NETWORK}</p>
              </div>
              <div>
                <p className="text-sm font-medium">USDC Mint Address</p>
                <p className="text-xs text-gray-600 font-mono break-all">
                  {USDC_TOKEN_ADDRESS[CURRENT_NETWORK].toString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Your USDC Balance</p>
                <USDCBalanceDisplay showRefresh={true} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Network Information</CardTitle>
              <CardDescription>Solana network details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium">Mainnet USDC</p>
                <p className="text-xs text-gray-600 font-mono">EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v</p>
              </div>
              <div>
                <p className="text-sm font-medium">Devnet USDC</p>
                <p className="text-xs text-gray-600 font-mono">4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU</p>
              </div>
              <div>
                <p className="text-sm font-medium">Current Network</p>
                <Badge variant={CURRENT_NETWORK === "mainnet" ? "default" : "secondary"}>{CURRENT_NETWORK}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <USDCTransactionVerification />
      </div>
    </div>
  )
}
