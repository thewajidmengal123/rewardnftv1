"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, ExternalLink, Users, Gift, Zap, Copy } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { DEFAULT_SOLANA_EXPLORER_URL, NFT_IPFS_URLS } from "@/config/solana"
import Image from "next/image"

export function MintSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [copied, setCopied] = useState<string | null>(null)

  const signature = searchParams.get("signature")
  const mintAddress = searchParams.get("mint")
  const usdcSignature = searchParams.get("usdc")

  useEffect(() => {
    if (!signature || !mintAddress) {
      router.push("/mint")
    }
  }, [signature, mintAddress, router])

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

  if (!signature || !mintAddress) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold mb-4">🎉 Congratulations!</h1>
          <p className="text-lg text-gray-600 mb-4">Your NFT has been successfully minted!</p>
          <Badge variant="default" className="bg-green-600">
            Referral Access Granted
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* NFT Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Your NFT
              </CardTitle>
              <CardDescription>RewardNFT Mint Pass - Membership Token</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-square mb-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg overflow-hidden">
                <Image
                  src={NFT_IPFS_URLS.quicknode || "/placeholder.svg"}
                  alt="Your Minted NFT"
                  fill
                  className="object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/images/mint-nft-box.png"
                  }}
                />
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold">RewardNFT Mint Pass</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">🏆 Legendary</Badge>
                  <Badge variant="outline">🎫 Membership</Badge>
                  <Badge variant="outline">✅ Verified</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Mint Address:</span>
                    <div className="flex items-center">
                      <span className="font-mono text-xs">
                        {mintAddress.slice(0, 8)}...{mintAddress.slice(-8)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(mintAddress, "Mint Address")}
                        className="ml-1 h-6 w-6 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Gift className="w-5 h-5 mr-2" />
                What's Next?
              </CardTitle>
              <CardDescription>Explore your new benefits and opportunities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Benefits */}
              <div className="space-y-3">
                <h4 className="font-medium">🎯 Your Benefits:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    Referral system access
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    Exclusive quest participation
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    Daily GM points collection
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    Leaderboard ranking
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button onClick={() => router.push("/referrals")} className="w-full" size="lg">
                  <Users className="w-4 h-4 mr-2" />
                  Start Referring Friends
                </Button>

                <Button onClick={() => router.push("/quests")} variant="outline" className="w-full">
                  <Zap className="w-4 h-4 mr-2" />
                  Explore Quests
                </Button>

                <Button onClick={() => router.push("/profile")} variant="outline" className="w-full">
                  View Profile
                </Button>
              </div>

              {/* Transaction Links */}
              <div className="space-y-2 pt-4 border-t">
                <h4 className="font-medium text-sm">Transaction Details:</h4>
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(`${DEFAULT_SOLANA_EXPLORER_URL}/tx/${signature}`, "_blank")}
                    className="w-full justify-start text-xs"
                  >
                    <ExternalLink className="w-3 h-3 mr-2" />
                    View NFT Transaction
                  </Button>
                  {usdcSignature && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`${DEFAULT_SOLANA_EXPLORER_URL}/tx/${usdcSignature}`, "_blank")}
                      className="w-full justify-start text-xs"
                    >
                      <ExternalLink className="w-3 h-3 mr-2" />
                      View USDC Payment
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
