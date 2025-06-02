"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useWallet } from "@/contexts/wallet-context"
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token"
import { PublicKey } from "@solana/web3.js"
import { RefreshCw, CheckCircle, XCircle } from "lucide-react"

interface USDCAccountInfo {
  mint: string
  mintName: string
  tokenAccount: string
  exists: boolean
  balance: number
}

export function USDCAccountDebug() {
  const { connected, publicKey, connection } = useWallet()
  const [loading, setLoading] = useState(false)
  const [accounts, setAccounts] = useState<USDCAccountInfo[]>([])

  const USDC_MINTS = [
    { address: "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr", name: "USDC-Dev (Your Wallet)" },
    { address: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", name: "Official Devnet USDC" },
    { address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", name: "Mainnet USDC" },
  ]

  const checkUSDCAccounts = async () => {
    if (!connected || !publicKey) return

    setLoading(true)
    const accountInfos: USDCAccountInfo[] = []

    for (const mint of USDC_MINTS) {
      try {
        const mintPubkey = new PublicKey(mint.address)
        const tokenAccount = await getAssociatedTokenAddress(mintPubkey, publicKey)

        let exists = false
        let balance = 0

        try {
          const accountInfo = await getAccount(connection, tokenAccount)
          exists = true
          balance = Number(accountInfo.amount) / 1_000_000 // Convert to USDC
        } catch (error) {
          exists = false
        }

        accountInfos.push({
          mint: mint.address,
          mintName: mint.name,
          tokenAccount: tokenAccount.toString(),
          exists,
          balance,
        })

        console.log(`${mint.name}: exists=${exists}, balance=${balance}`)
      } catch (error) {
        console.error(`Error checking ${mint.name}:`, error)
      }
    }

    setAccounts(accountInfos)
    setLoading(false)
  }

  useEffect(() => {
    if (connected && publicKey) {
      checkUSDCAccounts()
    }
  }, [connected, publicKey])

  if (!connected) {
    return (
      <Card>
        <CardContent className="text-center py-4">
          <p className="text-gray-600">Connect wallet to debug USDC accounts</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>USDC Account Debug</span>
          <Button variant="ghost" size="sm" onClick={checkUSDCAccounts} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-center">Checking USDC accounts...</p>
        ) : (
          accounts.map((account, index) => (
            <div key={index} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{account.mintName}</span>
                {account.exists ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Found
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    <XCircle className="w-3 h-3 mr-1" />
                    Not Found
                  </Badge>
                )}
              </div>
              <div className="text-sm text-gray-600">
                <p>
                  Mint: {account.mint.slice(0, 8)}...{account.mint.slice(-4)}
                </p>
                <p>
                  Account: {account.tokenAccount.slice(0, 8)}...{account.tokenAccount.slice(-4)}
                </p>
                {account.exists && (
                  <p className="font-semibold text-green-600">Balance: {account.balance.toFixed(2)} USDC</p>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
