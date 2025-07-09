"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWallet } from "@/contexts/wallet-context"
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { DailyGmPoints } from "@/components/daily-gm-points"
import { Sun, Gift, Trophy, ArrowRight } from "lucide-react"

export function DailyGmPageContent() {
  const { connected } = useWallet()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-white">Daily GM</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {connected ? (
            <Tabs defaultValue="daily" className="w-full">
              <TabsList className="w-full bg-white/10 mb-6">
                <TabsTrigger value="daily" className="flex-1">
                  Daily Check-in
                </TabsTrigger>
                <TabsTrigger value="rewards" className="flex-1">
                  Rewards
                </TabsTrigger>
                <TabsTrigger value="history" className="flex-1">
                  History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="daily" className="mt-0">
                <DailyGmPoints />
              </TabsContent>

              <TabsContent value="rewards" className="mt-0">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Available Rewards</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-white/5 rounded-lg p-4 flex items-start gap-4">
                        <div className="bg-white/10 rounded-full p-2">
                          <Gift className="h-5 w-5 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className="text-lg font-medium text-white">1 USDC Reward</h3>
                            <span className="bg-white/10 text-white text-xs rounded-full px-2 py-1">100 Points</span>
                          </div>
                          <p className="text-white/70 mt-1 mb-3">Redeem your points for USDC rewards</p>
                          <Button size="sm" disabled>
                            Redeem
                          </Button>
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-lg p-4 flex items-start gap-4">
                        <div className="bg-white/10 rounded-full p-2">
                          <Gift className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className="text-lg font-medium text-white">Exclusive NFT</h3>
                            <span className="bg-white/10 text-white text-xs rounded-full px-2 py-1">500 Points</span>
                          </div>
                          <p className="text-white/70 mt-1 mb-3">Redeem for a special edition NFT</p>
                          <Button size="sm" disabled>
                            Redeem
                          </Button>
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-lg p-4 flex items-start gap-4">
                        <div className="bg-white/10 rounded-full p-2">
                          <Gift className="h-5 w-5 text-green-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className="text-lg font-medium text-white">Quest Boost</h3>
                            <span className="bg-white/10 text-white text-xs rounded-full px-2 py-1">200 Points</span>
                          </div>
                          <p className="text-white/70 mt-1 mb-3">2x rewards on your next completed quest</p>
                          <Button size="sm" disabled>
                            Redeem
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="mt-0">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Check-in History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3 border-b border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="bg-green-500/20 rounded-full p-2">
                            <Sun className="h-4 w-4 text-green-400" />
                          </div>
                          <div>
                            <p className="text-white">Daily Check-in</p>
                            <p className="text-white/60 text-xs">May 5, 2023</p>
                          </div>
                        </div>
                        <span className="text-white font-medium">+10 points</span>
                      </div>

                      <div className="flex items-center justify-between py-3 border-b border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="bg-purple-500/20 rounded-full p-2">
                            <Trophy className="h-4 w-4 text-purple-400" />
                          </div>
                          <div>
                            <p className="text-white">Streak Bonus</p>
                            <p className="text-white/60 text-xs">May 5, 2023</p>
                          </div>
                        </div>
                        <span className="text-white font-medium">+5 points</span>
                      </div>

                      <div className="flex items-center justify-between py-3 border-b border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="bg-green-500/20 rounded-full p-2">
                            <Sun className="h-4 w-4 text-green-400" />
                          </div>
                          <div>
                            <p className="text-white">Daily Check-in</p>
                            <p className="text-white/60 text-xs">May 4, 2023</p>
                          </div>
                        </div>
                        <span className="text-white font-medium">+10 points</span>
                      </div>

                      <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-green-500/20 rounded-full p-2">
                            <Sun className="h-4 w-4 text-green-400" />
                          </div>
                          <div>
                            <p className="text-white">Daily Check-in</p>
                            <p className="text-white/60 text-xs">May 3, 2023</p>
                          </div>
                        </div>
                        <span className="text-white font-medium">+10 points</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
                <h2 className="text-xl font-bold text-white">Connect Your Wallet</h2>
                <p className="text-white/60 text-center mb-4">
                  Connect your wallet to check in daily and earn GM points
                </p>
                <WalletConnectButton />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">About GM Points</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/70 mb-4">
                GM Points are a way to reward our community for daily engagement. Check in every day to earn points and
                build your streak for bonus rewards!
              </p>
              <ul className="space-y-2 text-white/70">
                <li className="flex items-start gap-2">
                  <Sun className="h-4 w-4 text-yellow-400 mt-1 shrink-0" />
                  <span>Check in daily to earn 10 base points</span>
                </li>
                <li className="flex items-start gap-2">
                  <Trophy className="h-4 w-4 text-purple-400 mt-1 shrink-0" />
                  <span>Maintain a streak for bonus points (3-day and 7-day bonuses)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Gift className="h-4 w-4 text-green-400 mt-1 shrink-0" />
                  <span>Redeem points for USDC, NFTs, and other rewards</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Top Point Earners</CardTitle>
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
                  <span className="text-white font-medium">750 pts</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-gray-500/20 rounded-full w-6 h-6 flex items-center justify-center text-xs text-white">
                      2
                    </div>
                    <span className="text-white">0x456...def</span>
                  </div>
                  <span className="text-white font-medium">680 pts</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-amber-700/20 rounded-full w-6 h-6 flex items-center justify-center text-xs text-white">
                      3
                    </div>
                    <span className="text-white">0x789...ghi</span>
                  </div>
                  <span className="text-white font-medium">590 pts</span>
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
        </div>
      </div>
    </div>
  )
}
