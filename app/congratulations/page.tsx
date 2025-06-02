"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, ExternalLink, Share2, Trophy } from "lucide-react"
import Link from "next/link"
import { usePersistentWallet } from "@/contexts/persistent-wallet-context"

export default function CongratulationsPage() {
  const searchParams = useSearchParams()
  const { publicKey, mintedNFTs, refreshNFTs } = usePersistentWallet()
  const [nftData, setNftData] = useState<any>(null)

  const signature = searchParams.get("signature")
  const mintAddress = searchParams.get("mint")

  useEffect(() => {
    // Refresh NFTs when page loads
    refreshNFTs()

    // Get the latest minted NFT
    if (mintAddress && publicKey) {
      const mintedNFTsData = localStorage.getItem(`minted_nfts_${publicKey.toString()}`)
      const nfts = mintedNFTsData ? JSON.parse(mintedNFTsData) : []
      const latestNFT = nfts.find((nft: any) => nft.mint === mintAddress) || nfts[nfts.length - 1]
      setNftData(latestNFT)
    }
  }, [mintAddress, publicKey, refreshNFTs])

  const shareNFT = () => {
    const text = `🎉 I just minted my Reward NFT! Join me on the platform and start earning rewards! 🚀`
    const url = window.location.origin

    if (navigator.share) {
      navigator.share({
        title: "I minted an NFT!",
        text,
        url,
      })
    } else {
      navigator.clipboard.writeText(`${text} ${url}`)
      alert("Link copied to clipboard!")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Congratulations! 🎉</h1>
          <p className="text-xl text-gray-600">Your NFT has been successfully minted!</p>
        </div>

        {/* NFT Display Card */}
        <Card className="border-2 border-green-200 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Your Reward NFT
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* NFT Image */}
            <div className="flex justify-center">
              <div className="relative">
                <img
                  src="https://quicknode.quicknode-ipfs.com/ipfs/QmWrmCfPm6L85p1o8KMc9WZCsdwsgW89n37nQMJ6UCVYNW"
                  alt="Minted NFT"
                  className="w-64 h-64 object-cover rounded-lg border-4 border-yellow-300 shadow-lg"
                />
                <Badge className="absolute -top-2 -right-2 bg-green-500">Minted!</Badge>
              </div>
            </div>

            {/* NFT Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Collection</p>
                  <p className="font-semibold">Reward NFT Collection</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Token Standard</p>
                  <p className="font-semibold">SPL Token</p>
                </div>
                {mintAddress && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Mint Address</p>
                    <p className="font-mono text-sm break-all">{mintAddress}</p>
                  </div>
                )}
              </div>

              {/* Transaction Link */}
              {signature && (
                <div className="flex justify-center">
                  <Button variant="outline" asChild>
                    <a
                      href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View on Solana Explorer
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Benefits Card */}
        <Card>
          <CardHeader>
            <CardTitle>🎁 What's Next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Share2 className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Referral System</h3>
                  <p className="text-sm text-gray-600">You now have access to our referral program!</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-purple-100 p-2 rounded-full">
                  <Trophy className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Exclusive Quests</h3>
                  <p className="text-sm text-gray-600">Complete quests to earn more rewards!</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={shareNFT} className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Share Your NFT
          </Button>
          <Button variant="outline" asChild>
            <Link href="/profile">View Profile</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/referrals">Start Referring</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/quests">Explore Quests</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
