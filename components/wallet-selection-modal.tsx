"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2, Star } from "lucide-react"
import Image from "next/image"
import { useWallet } from "@/contexts/wallet-context"
import { toast } from "@/components/ui/use-toast"

interface WalletSelectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WalletSelectionModal({ open, onOpenChange }: WalletSelectionModalProps) {
  const {
    connecting,
    connectWallet,
    walletProviders,
    autoConnectEnabled,
    setAutoConnectEnabled,
    preferredWallet,
    setPreferredWallet,
    isMobile,
  } = useWallet()

  const [selectedWallet, setSelectedWallet] = useState<string | null>(null)

  const handleConnect = async (walletName: string) => {
    try {
      setSelectedWallet(walletName)
      await connectWallet(walletName)
      onOpenChange(false)
    } catch (error) {
      console.error("Connection failed:", error)
    } finally {
      setSelectedWallet(null)
    }
  }

  const handleSetPreferred = (walletName: string) => {
    setPreferredWallet(walletName)
    toast({
      title: "Preferred Wallet Set",
      description: `${walletName} is now your preferred wallet`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
          <DialogDescription>Choose your wallet to connect to the Reward NFT Platform</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Auto-connect setting */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <Label htmlFor="auto-connect" className="text-sm font-medium">
              Auto-connect on page load
            </Label>
            <Switch id="auto-connect" checked={autoConnectEnabled} onCheckedChange={setAutoConnectEnabled} />
          </div>

          {/* Wallet list */}
          <div className="space-y-2">
            {walletProviders.map((wallet) => (
              <div key={wallet.name} className="relative">
                <Button
                  variant="outline"
                  className={`w-full h-16 justify-between ${
                    !wallet.installed && !isMobile ? "opacity-50" : ""
                  } ${preferredWallet === wallet.name ? "ring-2 ring-primary" : ""}`}
                  onClick={() => handleConnect(wallet.name)}
                  disabled={(!wallet.installed && !isMobile) || connecting}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative h-8 w-8">
                      <Image
                        src={wallet.icon || "/placeholder.svg"}
                        alt={wallet.displayName}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{wallet.displayName}</span>
                      {!wallet.installed && !isMobile && <span className="text-xs text-muted-foreground">Not installed</span>}
                      {!wallet.installed && isMobile && wallet.name === 'phantom' && (
                        <span className="text-xs text-green-400">Opens in Phantom browser</span>
                      )}
                      {!wallet.installed && isMobile && wallet.name !== 'phantom' && (
                        <span className="text-xs text-blue-400">Available on mobile</span>
                      )}
                      {wallet.installed && isMobile && (
                        <span className="text-xs text-green-400">Mobile ready</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Preferred wallet indicator */}
                    {preferredWallet === wallet.name && <Star className="h-4 w-4 text-primary fill-current" />}

                    {/* Set as preferred button */}
                    {wallet.installed && preferredWallet !== wallet.name && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSetPreferred(wallet.name)
                        }}
                        className="h-6 px-2 text-xs"
                      >
                        Set Default
                      </Button>
                    )}

                    {/* Loading indicator */}
                    {connecting && selectedWallet === wallet.name && <Loader2 className="h-5 w-5 animate-spin" />}
                  </div>
                </Button>
              </div>
            ))}
          </div>

          {/* Install wallet message */}
          {walletProviders.filter((w) => w.installed).length === 0 && (
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-3">No supported wallets detected</p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open("https://phantom.app", "_blank")}
                  className="w-full"
                >
                  Install Phantom
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open("https://solflare.com", "_blank")}
                  className="w-full"
                >
                  Install Solflare
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
