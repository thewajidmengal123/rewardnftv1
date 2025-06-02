"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, Settings } from "lucide-react"
import { getNetworkInfo } from "@/config/solana"

export function EnvironmentStatus() {
  const networkInfo = getNetworkInfo()

  const envChecks = [
    {
      name: "Network",
      value: networkInfo.currentNetwork.toUpperCase(),
      status: networkInfo.currentNetwork === "devnet" ? "warning" : "success",
    },
    {
      name: "RPC Endpoint",
      value: networkInfo.rpcEndpoint.includes("vercel") ? "Custom RPC" : "Default RPC",
      status: "success",
    },
    {
      name: "Explorer",
      value: networkInfo.explorerUrl.includes("explorer.solana.com") ? "Solana Explorer" : "Custom Explorer",
      status: "success",
    },
    {
      name: "Collection",
      value: `${networkInfo.collectionMint.slice(0, 8)}...`,
      status: "success",
    },
    {
      name: "Candy Machine",
      value: `${networkInfo.candyMachineId.slice(0, 8)}...`,
      status: "success",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Environment Configuration
        </CardTitle>
        <CardDescription>Current environment variables and network settings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {envChecks.map((check, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                {check.status === "success" ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                )}
                <span className="font-medium">{check.name}</span>
              </div>
              <Badge variant={check.status === "success" ? "default" : "secondary"}>{check.value}</Badge>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Full Configuration</h4>
          <div className="text-sm space-y-1 font-mono">
            <div>RPC: {networkInfo.rpcEndpoint}</div>
            <div>Explorer: {networkInfo.explorerUrl}</div>
            <div>USDC: {networkInfo.usdcAddress}</div>
            <div>Platform: {networkInfo.platformWallet}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
