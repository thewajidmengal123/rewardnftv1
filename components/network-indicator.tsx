"use client"

import { Badge } from "@/components/ui/badge"
import { CURRENT_NETWORK } from "@/config/solana"

interface NetworkIndicatorProps {
  className?: string
}

export function NetworkIndicator({ className = "" }: NetworkIndicatorProps) {
  // Define colors based on network
  const getNetworkColor = () => {
    switch (CURRENT_NETWORK) {
      case "mainnet":
        return "bg-green-500 hover:bg-green-600"
      case "devnet":
        return "bg-blue-500 hover:bg-blue-600"
      case "testnet":
        return "bg-yellow-500 hover:bg-yellow-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  return (
    <Badge className={`${getNetworkColor()} ${className}`} variant="secondary">
      {CURRENT_NETWORK.charAt(0).toUpperCase() + CURRENT_NETWORK.slice(1)}
    </Badge>
  )
}
