"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { rpcConnectionService } from "@/services/rpc-connection-service"
import { RefreshCw, Wifi, WifiOff } from "lucide-react"

export function RPCStatusIndicator() {
  const [status, setStatus] = useState<{
    success: boolean
    latency?: number
    blockHeight?: number
    error?: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const checkConnection = async () => {
    setIsLoading(true)
    try {
      const result = await rpcConnectionService.testConnection()
      setStatus(result)
    } catch (error) {
      setStatus({
        success: false,
        error: "Connection test failed",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkConnection()
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = () => {
    if (!status) return "secondary"
    if (status.success) {
      if (status.latency && status.latency < 500) return "default"
      if (status.latency && status.latency < 1000) return "secondary"
      return "destructive"
    }
    return "destructive"
  }

  const getStatusText = () => {
    if (!status) return "Checking..."
    if (status.success) {
      return `Connected (${status.latency}ms)`
    }
    return "Disconnected"
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant={getStatusColor()} className="flex items-center gap-1">
        {status?.success ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
        {getStatusText()}
      </Badge>

      <Button variant="ghost" size="sm" onClick={checkConnection} disabled={isLoading} className="h-6 w-6 p-0">
        <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
      </Button>

      {status?.blockHeight && (
        <Badge variant="outline" className="text-xs">
          Block: {status.blockHeight.toLocaleString()}
        </Badge>
      )}
    </div>
  )
}
