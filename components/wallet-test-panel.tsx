"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWallet } from "@/contexts/wallet-context"
import { MockWalletProvider } from "@/utils/mock-wallet-provider"
import { generateRandomWalletAddress, generateRandomUsdcAmount } from "@/utils/test-data-generator"

export function WalletTestPanel() {
  const wallet = useWallet()
  const [mockProvider] = useState(() => new MockWalletProvider())
  const [solAmount, setSolAmount] = useState("1")
  const [usdcAmount, setUsdcAmount] = useState("10")

  // Connect mock wallet
  const connectMockWallet = async () => {
    try {
      // Set up mock wallet
      mockProvider.setState({
        connected: true,
        publicKey: generateRandomWalletAddress(),
        solBalance: Number.parseFloat(solAmount),
        usdcBalance: Number.parseFloat(usdcAmount),
      })

      // Connect to the real wallet context
      await wallet.connectWallet()
    } catch (error) {
      console.error("Error connecting mock wallet:", error)
    }
  }

  // Disconnect wallet
  const disconnectWallet = () => {
    wallet.disconnectWallet()
  }

  // Set balances
  const setBalances = () => {
    if (wallet.connected) {
      // In a real implementation, this would update the mock provider
      // and then refresh the wallet context
      console.log("Setting balances:", { sol: solAmount, usdc: usdcAmount })
    }
  }

  // Generate random balances
  const generateRandomBalances = () => {
    const randomSol = (Math.random() * 10).toFixed(2)
    const randomUsdc = generateRandomUsdcAmount(1, 100).toFixed(2)

    setSolAmount(randomSol)
    setUsdcAmount(randomUsdc)
  }

  return (
    <Card className="bg-white/5 backdrop-blur-sm border-white/10">
      <CardHeader>
        <CardTitle className="text-white">Wallet Test Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="solAmount" className="text-white">
              SOL Balance
            </Label>
            <Input
              id="solAmount"
              value={solAmount}
              onChange={(e) => setSolAmount(e.target.value)}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="usdcAmount" className="text-white">
              USDC Balance
            </Label>
            <Input
              id="usdcAmount"
              value={usdcAmount}
              onChange={(e) => setUsdcAmount(e.target.value)}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={connectMockWallet} disabled={wallet.connected}>
            Connect Mock Wallet
          </Button>
          <Button onClick={disconnectWallet} disabled={!wallet.connected} variant="outline">
            Disconnect
          </Button>
          <Button onClick={setBalances} disabled={!wallet.connected}>
            Set Balances
          </Button>
          <Button onClick={generateRandomBalances} variant="outline">
            Random Balances
          </Button>
        </div>

        {wallet.connected && (
          <div className="mt-4 p-4 bg-white/10 rounded-lg">
            <h3 className="text-white font-medium mb-2">Current Wallet State</h3>
            <div className="space-y-1 text-sm">
              <p className="text-white/80">
                <span className="text-white/60">Connected:</span> {wallet.connected ? "Yes" : "No"}
              </p>
              <p className="text-white/80">
                <span className="text-white/60">Public Key:</span> {wallet.publicKey?.toString()}
              </p>
              <p className="text-white/80">
                <span className="text-white/60">SOL Balance:</span> {wallet.solBalance}
              </p>
              <p className="text-white/80">
                <span className="text-white/60">USDC Balance:</span> {wallet.usdcBalance}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
