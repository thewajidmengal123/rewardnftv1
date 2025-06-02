"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search, Trophy, ArrowRight } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"

export function LeaderboardPageContent() {
  const [connected, setConnected] = useState(false)

  // Sample leaderboard data
  const referralLeaderboard = [
    { position: 1, avatar: "S", address: "Satoshi", referrals: 42, earned: 168, color: "bg-yellow-500" },
    { position: 2, avatar: "V", address: "Vitalik", referrals: 36, earned: 144, color: "bg-gray-400" },
    { position: 3, avatar: "A", address: "Alice", referrals: 29, earned: 116, color: "bg-amber-700" },
    { position: 4, avatar: "B", address: "Bob", referrals: 25, earned: 100, color: "bg-blue-500" },
    { position: 5, avatar: "C", address: "Charlie", referrals: 21, earned: 84, color: "bg-green-500" },
    { position: 6, avatar: "D", address: "Dave", referrals: 18, earned: 72, color: "bg-purple-500" },
    { position: 7, avatar: "E", address: "Eve", referrals: 16, earned: 64, color: "bg-pink-500" },
    { position: 8, avatar: "F", address: "Frank", referrals: 14, earned: 56, color: "bg-orange-500" },
    { position: 9, avatar: "G", address: "Grace", referrals: 12, earned: 48, color: "bg-teal-500" },
    { position: 10, avatar: "H", address: "Hank", referrals: 10, earned: 40, color: "bg-indigo-500" },
  ]

  const questLeaderboard = [
    { position: 1, avatar: "A", address: "Alice", quests: 32, points: 1680, color: "bg-yellow-500" },
    { position: 2, avatar: "S", address: "Satoshi", quests: 28, points: 1440, color: "bg-gray-400" },
    { position: 3, avatar: "V", address: "Vitalik", quests: 25, points: 1250, color: "bg-amber-700" },
    { position: 4, avatar: "G", address: "Grace", quests: 22, points: 1120, color: "bg-blue-500" },
    { position: 5, avatar: "F", address: "Frank", quests: 20, points: 1000, color: "bg-green-500" },
    { position: 6, avatar: "E", address: "Eve", quests: 18, points: 900, color: "bg-purple-500" },
    { position: 7, avatar: "D", address: "Dave", quests: 16, points: 800, color: "bg-pink-500" },
    { position: 8, avatar: "C", address: "Charlie", quests: 14, points: 700, color: "bg-orange-500" },
    { position: 9, avatar: "B", address: "Bob", quests: 12, points: 600, color: "bg-teal-500" },
    { position: 10, avatar: "H", address: "Hank", quests: 10, points: 500, color: "bg-indigo-500" },
  ]

  const myRank = { position: 15, referrals: 8, earned: 32 }

  return (
    <ProtectedRoute requireNft={true}>
      {/* Existing leaderboard page content */}
      <div className="min-h-screen flex flex-col">
        {/* Your existing leaderboard content */}
        <main className="flex-1 py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h1 className="text-5xl font-bold text-white mb-2">Leaderboard</h1>
                <p className="text-xl text-white/80">See the top performers on the platform</p>
              </div>

              {connected && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4">
                  <div className="flex items-center gap-8">
                    <div>
                      <p className="text-white/60 text-sm">Your Rank</p>
                      <p className="text-2xl font-bold text-white">#{myRank.position}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Your Referrals</p>
                      <p className="text-2xl font-bold text-white">{myRank.referrals}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">USDC Earned</p>
                      <p className="text-2xl font-bold text-white">{myRank.earned}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center w-full sm:w-auto relative">
                <Input
                  type="text"
                  placeholder="Search by username or address"
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 w-full"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto">
                <Select defaultValue="weekly">
                  <SelectTrigger className="w-full sm:w-[180px] bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Tabs defaultValue="referrals" className="w-full">
              <TabsList className="bg-white/10 border border-white/20 mb-8">
                <TabsTrigger value="referrals" className="data-[state=active]:bg-white/20 text-white">
                  Referrals
                </TabsTrigger>
                <TabsTrigger value="quests" className="data-[state=active]:bg-white/20 text-white">
                  Quests
                </TabsTrigger>
              </TabsList>

              <TabsContent value="referrals" className="mt-0">
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 p-6 sm:p-8">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left text-white/60 py-4 px-2 sm:px-4">#</th>
                          <th className="text-left text-white/60 py-4 px-2 sm:px-4">User</th>
                          <th className="text-right text-white/60 py-4 px-2 sm:px-4">Referrals</th>
                          <th className="text-right text-white/60 py-4 px-2 sm:px-4">USDC Earned</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referralLeaderboard.map((user) => (
                          <tr
                            key={user.position}
                            className={`border-b border-white/10 last:border-0 ${user.position <= 3 ? "bg-white/5" : ""}`}
                          >
                            <td className="py-4 px-2 sm:px-4">
                              <div className="flex items-center">
                                {user.position <= 3 ? (
                                  <div className="bg-white/10 rounded-full h-8 w-8 flex items-center justify-center">
                                    <Trophy
                                      className={`h-4 w-4 ${
                                        user.position === 1
                                          ? "text-yellow-400"
                                          : user.position === 2
                                            ? "text-gray-300"
                                            : "text-amber-600"
                                      }`}
                                    />
                                  </div>
                                ) : (
                                  <span className="text-white font-medium pl-2">{user.position}</span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-2 sm:px-4">
                              <div className="flex items-center gap-3">
                                <Avatar className={`${user.color} h-8 w-8`}>
                                  <AvatarFallback className="text-white">{user.avatar}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-white font-medium">{user.address}</p>
                                  <p className="text-white/60 text-xs">
                                    0x{Math.random().toString(16).substring(2, 10)}...
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="text-right text-white font-medium py-4 px-2 sm:px-4">{user.referrals}</td>
                            <td className="text-right text-white font-medium py-4 px-2 sm:px-4">{user.earned} USDC</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-center mt-8">
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                    View All Rankings
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="quests" className="mt-0">
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 p-6 sm:p-8">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left text-white/60 py-4 px-2 sm:px-4">#</th>
                          <th className="text-left text-white/60 py-4 px-2 sm:px-4">User</th>
                          <th className="text-right text-white/60 py-4 px-2 sm:px-4">Quests</th>
                          <th className="text-right text-white/60 py-4 px-2 sm:px-4">Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {questLeaderboard.map((user) => (
                          <tr
                            key={user.position}
                            className={`border-b border-white/10 last:border-0 ${user.position <= 3 ? "bg-white/5" : ""}`}
                          >
                            <td className="py-4 px-2 sm:px-4">
                              <div className="flex items-center">
                                {user.position <= 3 ? (
                                  <div className="bg-white/10 rounded-full h-8 w-8 flex items-center justify-center">
                                    <Trophy
                                      className={`h-4 w-4 ${
                                        user.position === 1
                                          ? "text-yellow-400"
                                          : user.position === 2
                                            ? "text-gray-300"
                                            : "text-amber-600"
                                      }`}
                                    />
                                  </div>
                                ) : (
                                  <span className="text-white font-medium pl-2">{user.position}</span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-2 sm:px-4">
                              <div className="flex items-center gap-3">
                                <Avatar className={`${user.color} h-8 w-8`}>
                                  <AvatarFallback className="text-white">{user.avatar}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-white font-medium">{user.address}</p>
                                  <p className="text-white/60 text-xs">
                                    0x{Math.random().toString(16).substring(2, 10)}...
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="text-right text-white font-medium py-4 px-2 sm:px-4">{user.quests}</td>
                            <td className="text-right text-white font-medium py-4 px-2 sm:px-4">{user.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-center mt-8">
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                    View All Rankings
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {/* Rewards for Top Players */}
            <div className="mt-16">
              <h2 className="text-3xl font-bold text-white mb-6">Rewards for Top Players</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 text-center">
                  <div className="bg-yellow-500/20 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                    <Trophy className="h-8 w-8 text-yellow-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">1st Place</h3>
                  <p className="text-white/80 mb-4">Top referrer of the month</p>
                  <p className="text-3xl font-bold text-white mb-2">50 USDC</p>
                  <p className="text-white/60 text-sm">Plus exclusive NFT bonus</p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 text-center">
                  <div className="bg-gray-500/20 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                    <Trophy className="h-8 w-8 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">2nd Place</h3>
                  <p className="text-white/80 mb-4">Runner-up referrer</p>
                  <p className="text-3xl font-bold text-white mb-2">25 USDC</p>
                  <p className="text-white/60 text-sm">Plus platform bonus rewards</p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 text-center">
                  <div className="bg-amber-700/20 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                    <Trophy className="h-8 w-8 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">3rd Place</h3>
                  <p className="text-white/80 mb-4">Third place referrer</p>
                  <p className="text-3xl font-bold text-white mb-2">15 USDC</p>
                  <p className="text-white/60 text-sm">Plus platform bonus rewards</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-16 bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 p-8 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Ready to Join the Competition?</h2>
              <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                Mint your NFT, start referring friends, and climb the leaderboard to earn USDC rewards.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-white hover:bg-white/90 text-black">
                  <Link href="/mint">Mint Your NFT</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  <Link href="/referrals">
                    View Referral Program
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
