"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/contexts/wallet-context"
import { WalletSelectionModal } from "@/components/wallet-selection-modal"
import { Loader2 } from "lucide-react"
import Image from "next/image"

interface WalletConnectButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  fullWidth?: boolean
}

export function WalletConnectButton({
  variant = "default",
  size = "default",
  className = "",
  fullWidth = false,
}: WalletConnectButtonProps) {
  const { connected, connecting, disconnect, selectedWallet, availableWallets, isMobile } = useWallet()
  const [showWalletModal, setShowWalletModal] = useState(false)

  const handleClick = () => {
    if (connected) {
      disconnect()
    } else {
      setShowWalletModal(true)
    }
  }

  // Get the current wallet icon
  const getWalletIcon = () => {
    if (!selectedWallet) return null
    const wallet = availableWallets.find((w) => w.name.toLowerCase() === selectedWallet.toLowerCase())
    return wallet?.icon || null
  }

  return (
    <>
      <Button
        variant={className.includes('gradient') ? undefined : variant}
        size={size}
        className={`${className} ${fullWidth ? "w-full" : ""} ${isMobile ? "py-6" : ""}`}
        onClick={handleClick}
        disabled={connecting}
      >
        {connecting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <span className="text-base">Connecting...</span>
          </>
        ) : connected ? (
          <div className="flex items-center gap-2">
            {getWalletIcon() && (
              <div className="relative h-5 w-5">
                <Image
                  src={getWalletIcon()! || "/placeholder.svg"}
                  alt={selectedWallet!}
                  fill
                  className="object-contain"
                />
              </div>
            )}
            <span className={`${isMobile ? "text-base" : ""}`}>Disconnect</span>
          </div>
        ) : (
          <span className={`${isMobile ? "text-base" : ""}`}>Connect Wallet</span>
        )}
      </Button>

      <WalletSelectionModal open={showWalletModal} onOpenChange={setShowWalletModal} />
    </>
  )
}
