"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWallet } from "@/contexts/wallet-context"
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { PostMintGame } from "@/components/post-mint-game"
import { Trophy, ArrowRight } from "lucide-react"

export function PostMintGamePageContent() {
  const { connected } = useWallet()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {connected ? (
            <PostMintGame />
          ) : (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
                <h2 className="text-xl font-bold text-white">Connect Your Wallet</h2>
                <p className="text-white/60 text-center mb-4">Connect your wallet to play the post-mint runner game</p>
                <WalletConnectButton />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Game Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-yellow-500/20 rounded-full w-6 h-6 flex items-center justify-center text-xs text-white">
                      1
                    </div>
                    <span className="text-white">0x123...abc</span>
                  </div>
                  <span className="text-white font-medium">1250 pts</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-gray-500/20 rounded-full w-6 h-6 flex items-center justify-center text-xs text-white">
                      2
                    </div>
                    <span className="text-white">0x456...def</span>
                  </div>
                  <span className="text-white font-medium">980 pts</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-amber-700/20 rounded-full w-6 h-6 flex items-center justify-center text-xs text-white">
                      3
                    </div>
                    <span className="text-white">0x789...ghi</span>
                  </div>
                  <span className="text-white font-medium">820 pts</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-white/10 rounded-full w-6 h-6 flex items-center justify-center text-xs text-white">
                      4
                    </div>
                    <span className="text-white">0xabc...123</span>
                  </div>
                  <span className="text-white font-medium">750 pts</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-white/10 rounded-full w-6 h-6 flex items-center justify-center text-xs text-white">
                      5
                    </div>
                    <span className="text-white">0xdef...456</span>
                  </div>
                  <span className="text-white font-medium">680 pts</span>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4 border-white/20 text-white hover:bg-white/10" asChild>
                <Link href="/leaderboard">
                  View Full Leaderboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Game Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-400" />
                    <span className="text-white">Top Score (Weekly)</span>
                  </div>
                  <span className="text-white font-medium">5 USDC</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-gray-400" />
                    <span className="text-white">Second Place</span>
                  </div>
                  <span className="text-white font-medium">3 USDC</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-700" />
                    <span className="text-white">Third Place</span>
                  </div>
                  <span className="text-white font-medium">2 USDC</span>
                </div>
              </div>
              <p className="text-white/60 text-sm mt-4">
                Rewards are distributed every Monday. Play daily to improve your score and climb the leaderboard!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
