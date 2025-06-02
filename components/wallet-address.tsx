"use client"

import { useState } from "react"
import { useWallet } from "@/contexts/wallet-context"
import { Copy, Check, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

interface WalletAddressProps {
  showExplorer?: boolean
  showCopy?: boolean
  className?: string
}

export function WalletAddress({ showExplorer = true, showCopy = true, className = "" }: WalletAddressProps) {
  const { publicKey, connected } = useWallet()
  const [copied, setCopied] = useState(false)

  if (!connected || !publicKey) {
    return <div className={`text-white/60 ${className}`}>Wallet not connected</div>
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(publicKey.toString())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: "Address Copied",
      description: "Wallet address copied to clipboard",
    })
  }

  const openExplorer = () => {
    window.open(`https://explorer.solana.com/address/${publicKey.toString()}?cluster=devnet`, "_blank")
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-white font-medium">
        {publicKey.toString().slice(0, 6)}...{publicKey.toString().slice(-4)}
      </span>

      {showCopy && (
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-white/60" />}
        </Button>
      )}

      {showExplorer && (
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={openExplorer}>
          <ExternalLink className="h-4 w-4 text-white/60" />
        </Button>
      )}
    </div>
  )
}
