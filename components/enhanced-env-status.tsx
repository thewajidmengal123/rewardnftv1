"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Settings, Zap } from "lucide-react"
import { getNetworkInfo } from "@/config/solana"
import { enhancedRPCService } from "@/services/enhanced-rpc-service"

interface EnvironmentCheck {
  name: string
  status: "success" | "warning" | "error"
  value?: string
  description: string
}

export function EnhancedEnvStatus() {
  const [checks, setChecks] = useState<EnvironmentCheck[]>([])
  const [rpcStatus, setRpcStatus] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runEnvironmentChecks = async () => {
    setIsLoading(true)
    const networkInfo = getNetworkInfo()

    const environmentChecks: EnvironmentCheck[] = [
      {
        name: "Network",
        status: networkInfo.currentNetwork === "devnet" ? "warning" : "success",
        value: networkInfo.currentNetwork.toUpperCase(),
        description: "Current Solana network environment",
      },
      {
        name: "RPC Endpoint",
        status: networkInfo.rpcEndpoint ? "success" : "error",
        value: networkInfo.rpcEndpoint.includes("vercel") ? "Custom RPC ✓" : "Default RPC",
        description: "Solana RPC endpoint configuration",
      },
      {
        name: "Explorer URL",
        status: networkInfo.explorerUrl ? "success" : "error",
        value: networkInfo.explorerUrl.includes("explorer.solana.com") ? "Solana Explorer ✓" : "Custom Explorer ✓",
        description: "Blockchain explorer URL configuration",
      },
      {
        name: "Collection",
        status: networkInfo.collectionMint ? "success" : "error",
        value: `${networkInfo.collectionMint.slice(0, 12)}...`,
        description: "NFT Collection mint address",
      },
      {
        name: "Candy Machine",
        status: networkInfo.candyMachineId ? "success" : "error",
        value: `${networkInfo.candyMachineId.slice(0, 12)}...`,
        description: "Candy Machine program address",
      },
      {
        name: "USDC Token",
        status: networkInfo.usdcAddress ? "success" : "error",
        value: `${networkInfo.usdcAddress.slice(0, 12)}...`,
        description: "USDC token mint address for payments",
      },
    ]

    setChecks(environmentChecks)

    // Check RPC status
    try {
      const status = await enhancedRPCService.getConnectionStatus()
      setRpcStatus(status)
    } catch (error) {
      console.error("Failed to get RPC status:", error)
    }

    setIsLoading(false)
  }

  useEffect(() => {
    runEnvironmentChecks()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "default"
      case "warning":
        return "secondary"
      case "error":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Environment Configuration
          </CardTitle>
          <CardDescription>Environment variables and configuration status with your custom settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Configuration Checks</h3>
            <Button variant="outline" size="sm" onClick={runEnvironmentChecks} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <div className="space-y-3">
            {checks.map((check, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(check.status)}
                  <div>
                    <div className="font-medium">{check.name}</div>
                    <div className="text-sm text-muted-foreground">{check.description}</div>
                  </div>
                </div>
                <Badge variant={getStatusColor(check.status) as any}>{check.value}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {rpcStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              RPC Endpoints Status
            </CardTitle>
            <CardDescription>Current: {rpcStatus.current} | Real-time endpoint health monitoring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rpcStatus.endpoints.map((endpoint: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {endpoint.healthy ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <div>
                      <div className="font-medium">{endpoint.name}</div>
                      <div className="text-sm text-muted-foreground font-mono">
                        {endpoint.url.length > 50 ? `${endpoint.url.substring(0, 50)}...` : endpoint.url}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {endpoint.latency && <Badge variant="outline">{endpoint.latency}ms</Badge>}
                    <Badge variant={endpoint.healthy ? "default" : "destructive"}>
                      {endpoint.healthy ? "Healthy" : "Unhealthy"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
