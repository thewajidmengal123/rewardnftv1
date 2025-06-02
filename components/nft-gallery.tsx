"use client"

import Link from "next/link"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Loader2, ExternalLink } from "lucide-react"
import { useWallet } from "@/contexts/wallet-context"
import { NFT_METADATA } from "@/config/solana"

interface NftGalleryProps {
  className?: string
}

export function NftGallery({ className = "" }: NftGalleryProps) {
  const { connected, publicKey, connection, explorerUrl } = useWallet()
  const [loading, setLoading] = useState(false)
  const [nfts, setNfts] = useState<any[]>([])

  // Fetch user's NFTs
  useEffect(() => {
    const fetchNfts = async () => {
      if (!connected || !publicKey) return

      setLoading(true)
      try {
        // In a real implementation, you would fetch the user's NFTs from the blockchain
        // For now, we'll simulate this with a timeout and hardcoded data
        await new Promise((resolve) => setTimeout(resolve, 1500))

        // Simulate having the NFT if we're on the success page
        setNfts([
          {
            mint: "simulated-mint-address",
            name: NFT_METADATA.name,
            symbol: NFT_METADATA.symbol,
            image: NFT_METADATA.image,
            description: NFT_METADATA.description,
            attributes: NFT_METADATA.attributes,
          },
        ])
      } catch (error) {
        console.error("Error fetching NFTs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchNfts()
  }, [connected, publicKey, connection])

  if (!connected) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-white/80 mb-4">Connect your wallet to view your NFTs</p>
        <Button className="bg-white hover:bg-white/90 text-black">Connect Wallet</Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <Loader2 className="h-8 w-8 text-white animate-spin mb-4" />
        <p className="text-white/80">Loading your NFTs...</p>
      </div>
    )
  }

  if (nfts.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-white/80 mb-4">You don't have any NFTs yet</p>
        <Button asChild>
          <Link href="/mint">Mint Your First NFT</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${className}`}>
      {nfts.map((nft, index) => (
        <div
          key={index}
          className="bg-white/10 rounded-xl overflow-hidden border border-white/20 hover:border-white/40 transition-colors"
        >
          <div className="aspect-square relative">
            <Image src={nft.image || "/placeholder.svg"} alt={nft.name} fill className="object-cover" />
          </div>
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-white">{nft.name}</h3>
              <span className="bg-purple-500/30 text-purple-200 text-xs rounded-full px-2 py-1">{nft.symbol}</span>
            </div>
            <p className="text-white/60 text-sm mb-4">{nft.description}</p>
            <div className="flex justify-between items-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-white/80 hover:text-white hover:bg-white/10"
                onClick={() => window.open(`${explorerUrl}/address/${nft.mint}`, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-1" /> View on Explorer
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
