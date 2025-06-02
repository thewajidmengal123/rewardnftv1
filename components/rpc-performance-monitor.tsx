"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { rpcConnectionService } from "@/services/rpc-connection-service"
import { Activity, Clock, TrendingUp } from "lucide-react"

interface PerformanceMetrics {
  latency: number
  timestamp: number
}

export function RPCPerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([])
  const [currentLatency, setCurrentLatency] = useState<number | null>(null)
  const [isMonitoring, setIsMonitoring] = useState(false)

  const measureLatency = async () => {
    try {
      const result = await rpcConnectionService.testConnection()
      if (result.success && result.latency) {
        const newMetric = {
          latency: result.latency,
          timestamp: Date.now(),
        }

        setCurrentLatency(result.latency)
        setMetrics((prev) => [...prev.slice(-9), newMetric]) // Keep last 10 measurements
      }
    } catch (error) {
      console.error("Latency measurement failed:", error)
    }
  }

  useEffect(() => {
    if (isMonitoring) {
      measureLatency() // Initial measurement
      const interval = setInterval(measureLatency, 5000) // Every 5 seconds
      return () => clearInterval(interval)
    }
  }, [isMonitoring])

  useEffect(() => {
    setIsMonitoring(true)
    return () => setIsMonitoring(false)
  }, [])

  const averageLatency = metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.latency, 0) / metrics.length : 0

  const getLatencyColor = (latency: number) => {
    if (latency < 200) return "text-green-600"
    if (latency < 500) return "text-yellow-600"
    return "text-red-600"
  }

  const getLatencyProgress = (latency: number) => {
    return Math.min((latency / 1000) * 100, 100)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          RPC Performance
        </CardTitle>
        <CardDescription>Real-time QuickNode RPC performance metrics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentLatency !== null && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Current Latency
              </span>
              <span className={`text-sm font-mono ${getLatencyColor(currentLatency)}`}>{currentLatency}ms</span>
            </div>
            <Progress value={getLatencyProgress(currentLatency)} className="h-2" />
          </div>
        )}

        {averageLatency > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Average Latency
            </span>
            <span className={`text-sm font-mono ${getLatencyColor(averageLatency)}`}>
              {Math.round(averageLatency)}ms
            </span>
          </div>
        )}

        <div className="text-xs text-muted-foreground">Monitoring QuickNode devnet performance</div>
      </CardContent>
    </Card>
  )
}
