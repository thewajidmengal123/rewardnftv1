"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Server, Zap } from "lucide-react"
import { rpcConnectionService } from "@/services/rpc-connection-service"
import { CURRENT_NETWORK } from "@/config/solana"

export function QuickNodeConfigDisplay() {
  const endpoint = rpcConnectionService.getEndpoint()
  const isQuickNode = endpoint.includes("quiknode.pro")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="w-5 h-5" />
          RPC Configuration
        </CardTitle>
        <CardDescription>Current Solana RPC endpoint configuration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Network:</span>
          <Badge variant="outline" className="capitalize">
            {CURRENT_NETWORK}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Provider:</span>
          <Badge variant={isQuickNode ? "default" : "secondary"} className="flex items-center gap-1">
            {isQuickNode ? (
              <>
                <Zap className="w-3 h-3" />
                QuickNode
              </>
            ) : (
              "Standard RPC"
            )}
          </Badge>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium">Endpoint:</span>
          <div className="p-2 bg-muted rounded-md">
            <code className="text-xs break-all">{endpoint}</code>
          </div>
        </div>

        {isQuickNode && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="w-4 h-4" />
            <span>Enhanced performance with QuickNode</span>
            <a
              href="https://www.quicknode.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Learn more
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
