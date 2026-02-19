"use client"

import { useState, useEffect, useCallback } from "react"
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

// Detect if we're in Phantom's in-app browser
const isPhantomInAppBrowser = () => {
  if (typeof window === 'undefined') return false
  const userAgent = navigator.userAgent.toLowerCase()
  const hasPhantomProvider = !!(window as any).phantom?.solana?.isPhantom
  return userAgent.includes('phantom') || hasPhantomProvider
}

// Detect if mobile device
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}

export function WalletConnectButton({
  variant = "default",
  size = "default",
  className = "",
  fullWidth = false,
}: WalletConnectButtonProps) {
  const { connected, connecting, disconnect, selectedWallet, availableWallets, isMobile: contextIsMobile } = useWallet()
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [isPhantomBrowser, setIsPhantomBrowser] = useState(false)

  useEffect(() => {
    setIsPhantomBrowser(isPhantomInAppBrowser())
  }, [])

  const handleClick = useCallback(() => {
    if (connected) {
      disconnect()
      return
    }

    // If we're in Phantom's in-app browser, connect directly without modal
    if (isPhantomBrowser) {
      const phantomWallet = availableWallets.find(
        (w) => w.name.toLowerCase() === 'phantom'
      )
      if (phantomWallet) {
        // Direct connect - don't show modal
        phantomWallet.adapter.connect().catch((err: any) => {
          console.error("Phantom connection error:", err)
        })
        return
      }
    }

    // For other cases, show the modal
    setShowWalletModal(true)
  }, [connected, disconnect, isPhantomBrowser, availableWallets])

  const getWalletIcon = () => {
    if (!selectedWallet) return null
    const wallet = availableWallets.find(
      (w) => w.name.toLowerCase() === selectedWallet.toLowerCase()
    )
    return wallet?.icon || null
  }

  // Combine context mobile with our detection
  const isMobileView = contextIsMobile || isMobileDevice()

  return (
    <>
      <Button
        variant={className.includes("gradient") ? undefined : variant}
        size={size}
        className={`${className} ${fullWidth ? "w-full" : ""} ${isMobileView ? "py-6" : ""}`}
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
                  src={getWalletIcon() || "/placeholder.svg"}
                  alt={selectedWallet!}
                  fill
                  className="object-contain"
                />
              </div>
            )}
            <span className={`${isMobileView ? "text-base" : ""}`}>Disconnect</span>
          </div>
        ) : (
          <span className={`${isMobileView ? "text-base" : ""}`}>Connect Wallet</span>
        )}
      </Button>

      {/* Only show modal if not in Phantom browser */}
      {!isPhantomBrowser && (
        <WalletSelectionModal open={showWalletModal} onOpenChange={setShowWalletModal} />
      )}
    </>
  )
}
