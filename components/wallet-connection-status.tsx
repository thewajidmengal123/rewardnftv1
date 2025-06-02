"use client"

import { useEffect, useState } from "react"
import { useEnhancedWallet } from "@/contexts/enhanced-wallet-context"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Loader2, Wifi, WifiOff } from "lucide-react"

export function WalletConnectionStatus() {
  const { connected, connecting, reconnecting, publicKey } = useEnhancedWallet()
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (!isOnline) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="destructive" className="gap-1">
              <WifiOff className="h-3 w-3" />
              Offline
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>You are currently offline. Please check your internet connection.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (connecting || reconnecting) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="gap-1 bg-yellow-500/20 text-yellow-500 border-yellow-500/50">
              <Loader2 className="h-3 w-3 animate-spin" />
              {reconnecting ? "Reconnecting" : "Connecting"}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{reconnecting ? "Reconnecting to your wallet..." : "Connecting to your wallet..."}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (connected && publicKey) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="gap-1 bg-green-500/20 text-green-500 border-green-500/50">
              <Wifi className="h-3 w-3" />
              Connected
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              Connected to {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="gap-1">
            <WifiOff className="h-3 w-3" />
            Not Connected
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Connect your wallet to access all features</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
