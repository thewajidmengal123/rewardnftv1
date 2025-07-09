"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"
import { useWallet } from "@/contexts/wallet-context"
import { toast } from "@/components/ui/use-toast"
import { defaultConnectionManager } from "@/utils/wallet-adapter"

export function RpcStatus() {
  const { connection } = useWallet()
  const [status, setStatus] = useState<"checking" | "connected" | "error">("checking")
  const [latency, setLatency] = useState<number | null>(null)
  const [checking, setChecking] = useState(false)

  const checkConnection = async () => {
    if (checking) return

    setChecking(true)
    setStatus("checking")
    setLatency(null)

    try {
      const startTime = performance.now()

      // Use the connection from context if available, otherwise use the default connection manager
      const conn = connection || defaultConnectionManager.connection

      if (!conn) {
        throw new Error("No connection available")
      }

      // Try to get a recent blockhash to test the connection
      await conn.getLatestBlockhash()

      const endTime = performance.now()
      setLatency(Math.round(endTime - startTime))
      setStatus("connected")
    } catch (error) {
      console.error("RPC connection error:", error)
      setStatus("error")
      toast({
        title: "RPC Connection Error",
        description: "Failed to connect to the Solana RPC endpoint",
        variant: "destructive",
      })
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    // Add a small delay to ensure context is properly initialized
    const timer = setTimeout(() => {
      checkConnection()
    }, 1000)

    // Check connection every 5 minutes
    const interval = setInterval(checkConnection, 5 * 60 * 1000)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [connection]) // Re-run when connection changes

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`h-8 px-2 flex items-center gap-1 ${
        status === "connected" ? "text-green-500" : status === "error" ? "text-red-500" : "text-yellow-500"
      }`}
      onClick={checkConnection}
      disabled={checking}
    >
      {status === "checking" || checking ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : status === "connected" ? (
        <CheckCircle className="h-4 w-4" />
      ) : (
        <AlertCircle className="h-4 w-4" />
      )}
      <span className="text-xs">
        {status === "checking" || checking
          ? "Checking..."
          : status === "connected"
            ? `RPC ${latency ? `(${latency}ms)` : ""}`
            : "RPC Error"}
      </span>
      {!checking && <RefreshCw className="h-3 w-3 ml-1" />}
    </Button>
  )
}
