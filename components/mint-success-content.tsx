"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, ExternalLink, Users, Gift, Zap, Copy, QrCode, Scan, Share2, Download } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { DEFAULT_SOLANA_EXPLORER_URL, NFT_IPFS_URLS } from "@/config/solana"
import Image from "next/image"

// Loading component for Suspense fallback
function MintSuccessLoading() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading mint details...</p>
      </div>
    </div>
  )
}

// Component that uses useSearchParams
function MintSuccessContentInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [copied, setCopied] = useState<string | null>(null)
  const [showQRCode, setShowQRCode] = useState<string | null>(null)

  // Get multiple mint addresses and signatures
  const mint1 = searchParams.get("mint1") || searchParams.get("mint")
  const mint2 = searchParams.get("mint2")
  const mint3 = searchParams.get("mint3")
  const mint4 = searchParams.get("mint4")
  const mint5 = searchParams.get("mint5")

  const sig1 = searchParams.get("sig1") || searchParams.get("signature")
  const sig2 = searchParams.get("sig2")
  const sig3 = searchParams.get("sig3")
  const sig4 = searchParams.get("sig4")
  const sig5 = searchParams.get("sig5")

  const usdcSignature = searchParams.get("usdc")
  const totalCost = searchParams.get("total")

  // Collect all minted NFTs
  const mintedNFTs = [
    { mint: mint1, signature: sig1 },
    { mint: mint2, signature: sig2 },
    { mint: mint3, signature: sig3 },
    { mint: mint4, signature: sig4 },
    { mint: mint5, signature: sig5 },
  ].filter(nft => nft.mint && nft.signature)

  useEffect(() => {
    if (mintedNFTs.length === 0) {
      router.push("/mint")
    }
  }, [mintedNFTs.length, router])

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard`,
      })
      setTimeout(() => setCopied(null), 2000)
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please copy manually",
        variant: "destructive",
      })
    }
  }

  const generateQRCodeURL = (mintAddress: string) => {
    // Generate QR code URL for the NFT mint address
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${mintAddress}`
  }

  const shareNFT = async (mintAddress: string) => {
    const shareData = {
      title: 'Check out my new RewardNFT!',
      text: `I just minted a RewardNFT! Mint Address: ${mintAddress}`,
      url: `${window.location.origin}/nft/${mintAddress}`
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        copyToClipboard(shareData.text, "Share text")
      }
    } else {
      copyToClipboard(shareData.text, "Share text")
    }
  }

  if (mintedNFTs.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-16 h-16 text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
              🎉 Welcome to RewardNFT!
            </h1>
            <p className="text-xl text-gray-300 mb-6">
              Congratulations! {mintedNFTs.length === 1 ? 'Your exclusive RewardNFT has' : `Your ${mintedNFTs.length} exclusive RewardNFTs have`} been successfully minted for {totalCost} USDC!
              <br />
              <span className="text-teal-400 font-semibold">You're now part of our exclusive community! 🚀</span>
            </p>
            <div className="flex justify-center gap-4">
              <Badge variant="default" className="bg-green-600 text-white px-4 py-2 text-lg">
                ✅ Referral Access Granted
              </Badge>
              <Badge variant="outline" className="border-teal-500 text-teal-400 px-4 py-2 text-lg">
                💎 {mintedNFTs.length} NFT{mintedNFTs.length > 1 ? 's' : ''} Minted
              </Badge>
            </div>
          </div>

          {/* Minted NFTs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {mintedNFTs.map((nft, index) => (
              <Card key={nft.mint} className="bg-gray-800/50 border-gray-700 hover:border-teal-500 transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between text-white">
                    <span className="flex items-center">
                      <Zap className="w-5 h-5 mr-2 text-teal-400" />
                      NFT #{index + 1}
                    </span>
                    <Badge variant="outline" className="border-teal-500 text-teal-400">
                      Minted
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-gray-400">RewardNFT Collection - Membership Token</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* NFT Image */}
                  <div className="relative aspect-square bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 rounded-xl overflow-hidden p-1">
                    <div className="w-full h-full bg-gray-900 rounded-lg overflow-hidden">
                      <Image
                        src="https://quicknode.quicknode-ipfs.com/ipfs/QmWrmCfPm6L85p1o8KMc9WZCsdwsgW89n37nQMJ6UCVYNW"
                        alt={`RewardNFT #${index + 1}`}
                        width={300}
                        height={300}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1578632292335-df3abbb0d586?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3"
                        }}
                      />
                    </div>
                  </div>

                  {/* NFT Details */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-white">RewardNFT Collection #{index + 1}</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="border-yellow-500 text-yellow-400">🏆 Legendary</Badge>
                      <Badge variant="outline" className="border-purple-500 text-purple-400">🎫 Membership</Badge>
                      <Badge variant="outline" className="border-green-500 text-green-400">✅ Verified</Badge>
                    </div>

                    {/* Mint Address */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Mint Address:</span>
                        <div className="flex items-center">
                          <span className="font-mono text-xs text-gray-300">
                            {nft.mint!.slice(0, 8)}...{nft.mint!.slice(-8)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(nft.mint!, "Mint Address")}
                            className="ml-1 h-6 w-6 p-0 text-gray-400 hover:text-white"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowQRCode(showQRCode === nft.mint ? null : nft.mint)}
                        className="border-teal-600 text-teal-400 hover:bg-teal-600 hover:text-white"
                      >
                        <QrCode className="w-4 h-4 mr-1" />
                        {showQRCode === nft.mint ? 'Hide' : 'QR'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => shareNFT(nft.mint!)}
                        className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                      >
                        <Share2 className="w-4 h-4 mr-1" />
                        Share
                      </Button>
                    </div>

                    {/* QR Code Display */}
                    {showQRCode === nft.mint && (
                      <div className="mt-4 p-4 bg-white rounded-lg">
                        <div className="text-center">
                          <img
                            src={generateQRCodeURL(nft.mint!)}
                            alt="NFT QR Code"
                            className="mx-auto mb-2"
                          />
                          <p className="text-xs text-gray-600">Scan to view NFT details</p>
                        </div>
                      </div>
                    )}

                    {/* Transaction Link */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`${DEFAULT_SOLANA_EXPLORER_URL}/tx/${nft.signature}?cluster=devnet`, "_blank")}
                      className="w-full justify-start text-xs text-gray-400 hover:text-white"
                    >
                      <ExternalLink className="w-3 h-3 mr-2" />
                      View on Solana Explorer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Transaction Summary */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                  Transaction Summary
                </CardTitle>
                <CardDescription className="text-gray-400">Your minting transaction details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">NFTs Minted:</span>
                    <span className="text-white font-bold">{mintedNFTs.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Cost:</span>
                    <span className="text-white font-bold">{totalCost} USDC</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Network:</span>
                    <span className="text-white">Solana Devnet</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Status:</span>
                    <Badge className="bg-green-600 text-white">✅ Confirmed</Badge>
                  </div>
                </div>

                {/* Transaction Links */}
                <div className="space-y-2 pt-4 border-t border-gray-700">
                  <h4 className="font-medium text-sm text-white">View Transactions:</h4>
                  <div className="space-y-1">
                    {usdcSignature && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`${DEFAULT_SOLANA_EXPLORER_URL}/tx/${usdcSignature}?cluster=devnet`, "_blank")}
                        className="w-full justify-start text-xs text-gray-400 hover:text-white"
                      >
                        <ExternalLink className="w-3 h-3 mr-2" />
                        View USDC Payment Transaction
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What's Next */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Gift className="w-5 h-5 mr-2 text-teal-400" />
                  What's Next?
                </CardTitle>
                <CardDescription className="text-gray-400">Explore your new benefits and opportunities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Benefits */}
                <div className="space-y-3">
                  <h4 className="font-medium text-white">🎯 Your Benefits:</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                      <span className="text-gray-300">Referral system access</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                      <span className="text-gray-300">Exclusive quest participation</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                      <span className="text-gray-300">Daily GM points collection</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                      <span className="text-gray-300">Leaderboard ranking</span>
                    </li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={() => router.push("/referrals")}
                    className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-black font-bold"
                    size="lg"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Start Referring Friends
                  </Button>

                  <Button
                    onClick={() => router.push("/quests")}
                    variant="outline"
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Explore Quests
                  </Button>

                  <Button
                    onClick={() => router.push("/mint")}
                    variant="outline"
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Mint More NFTs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main export component with Suspense boundary
export function MintSuccessContent() {
  return (
    <Suspense fallback={<MintSuccessLoading />}>
      <MintSuccessContentInner />
    </Suspense>
  )
}
