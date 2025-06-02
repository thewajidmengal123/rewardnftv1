"use client"

import { EnhancedMintButton } from "@/components/enhanced-mint-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap, Shield, Users, Gift } from "lucide-react"

export function MintPageContent() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Mint Your RewardNFT
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get exclusive access to our referral system and unlock special platform benefits with your membership NFT.
          </p>
          <div className="flex justify-center space-x-2">
            <Badge variant="outline">Limited Supply</Badge>
            <Badge variant="outline">1 per Wallet</Badge>
            <Badge variant="outline">10 USDC</Badge>
          </div>
        </div>

        {/* NFT Preview */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>NFT Preview</CardTitle>
                <CardDescription>Your exclusive membership NFT</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-square bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
                  <img
                    src="https://quicknode.quicknode-ipfs.com/ipfs/QmWrmCfPm6L85p1o8KMc9WZCsdwsgW89n37nQMJ6UCVYNW"
                    alt="RewardNFT Preview"
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg?height=400&width=400&text=RewardNFT"
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <EnhancedMintButton />
          </div>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-500" />
                Referral Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Unlock the referral system and earn rewards for bringing new users to the platform.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Gift className="w-5 h-5 mr-2 text-purple-500" />
                Exclusive Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Access special quests, airdrops, and exclusive platform features reserved for NFT holders.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2 text-green-500" />
                Verified Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Get verified status on the platform with enhanced privileges and priority support.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Technical Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Technical Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Blockchain:</strong> Solana (Devnet)
            </div>
            <div>
              <strong>Token Standard:</strong> SPL Token
            </div>
            <div>
              <strong>Payment Method:</strong> USDC
            </div>
            <div>
              <strong>Max Supply:</strong> 10,000 NFTs
            </div>
            <div>
              <strong>Mint Limit:</strong> 1 per wallet
            </div>
            <div>
              <strong>Network Fees:</strong> ~0.001 SOL
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
