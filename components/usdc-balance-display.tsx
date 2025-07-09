"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/contexts/wallet-context"
import { USDCService } from "@/services/usdc-service"
import { Badge } from "@/components/ui/badge"
import { DollarSign, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface USDCBalanceDisplayProps {
  showRefresh?: boolean
  className?: string
}

export function USDCBalanceDisplay({ showRefresh = false, className = "" }: USDCBalanceDisplayProps) {
  const { connected, publicKey, connection } = useWallet()
  const [balance, setBalance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [usdcService] = useState(() => new USDCService(connection))

  const fetchBalance = async () => {
    if (!connected || !publicKey || !connection) {
      setBalance(null)
      return
    }

    setIsLoading(true)
    try {
      // Ensure we have a valid PublicKey object
      if (typeof publicKey === "string") {
        console.error("PublicKey is string, expected PublicKey object")
        setBalance(0)
        return
      }

      const usdcBalance = await usdcService.getUSDCBalance(publicKey)
      setBalance(usdcBalance)
    } catch (error) {
      console.error("Error fetching USDC balance:", error)
      setBalance(0)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (connected && publicKey && connection) {
      fetchBalance()
    } else {
      setBalance(null)
    }
  }, [connected, publicKey, connection])

  if (!connected) {
    return (
      <Badge variant="outline" className={className}>
        <DollarSign className="w-3 h-3 mr-1" />
        Connect Wallet
      </Badge>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant="secondary" className="flex items-center">
        <DollarSign className="w-3 h-3 mr-1" />
        {isLoading ? "Loading..." : `${balance?.toFixed(2) || "0.00"} USDC`}
      </Badge>
      {showRefresh && (
        <Button variant="ghost" size="sm" onClick={fetchBalance} disabled={isLoading} className="h-6 w-6 p-0">
          <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      )}
    </div>
  )
}
