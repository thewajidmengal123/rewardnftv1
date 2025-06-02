"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search, Trophy, ArrowRight, RefreshCw, Users, Award, DollarSign } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { useWallet } from "@/contexts/wallet-context"
import { useFirebaseLeaderboard } from "@/hooks/use-firebase-leaderboard"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

export function LeaderboardPageContent() {
  const { connected } = useWallet()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTab, setSelectedTab] = useState<"referrals" | "quests" | "earnings" | "overall">("referrals")
  const [timeframe, setTimeframe] = useState("all")

  // Firebase leaderboard hooks for different types
  const {
    leaderboard: referralLeaderboard,
    stats,
    userStats,
    loading: referralLoading,
    refreshing: referralRefreshing,
    refresh: refreshReferrals,
    error: referralError,
  } = useFirebaseLeaderboard("referrals", 50)

  const {
    leaderboard: questLeaderboard,
    loading: questLoading,
    refreshing: questRefreshing,
    refresh: refreshQuests,
    error: questError,
  } = useFirebaseLeaderboard("quests", 50)

  const {
    leaderboard: earningsLeaderboard,
    loading: earningsLoading,
    refreshing: earningsRefreshing,
    refresh: refreshEarnings,
    error: earningsError,
  } = useFirebaseLeaderboard("earnings", 50)

  // Filter leaderboard based on search term
  const filteredReferralLeaderboard = useMemo(() => {
    if (!searchTerm) return referralLeaderboard
    return referralLeaderboard.filter(
      (user) =>
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.walletAddress.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [referralLeaderboard, searchTerm])

  const filteredQuestLeaderboard = useMemo(() => {
    if (!searchTerm) return questLeaderboard
    return questLeaderboard.filter(
      (user) =>
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.walletAddress.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [questLeaderboard, searchTerm])

  const filteredEarningsLeaderboard = useMemo(() => {
    if (!searchTerm) return earningsLeaderboard
    return earningsLeaderboard.filter(
      (user) =>
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.walletAddress.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [earningsLeaderboard, searchTerm])

  // Get current leaderboard data based on selected tab
  const getCurrentLeaderboard = () => {
    switch (selectedTab) {
      case "referrals":
        return filteredReferralLeaderboard
      case "quests":
        return filteredQuestLeaderboard
      case "earnings":
        return filteredEarningsLeaderboard
      default:
        return filteredReferralLeaderboard
    }
  }

  const getCurrentLoading = () => {
    switch (selectedTab) {
      case "referrals":
        return referralLoading
      case "quests":
        return questLoading
      case "earnings":
        return earningsLoading
      default:
        return referralLoading
    }
  }

  const getCurrentRefreshing = () => {
    switch (selectedTab) {
      case "referrals":
        return referralRefreshing
      case "quests":
        return questRefreshing
      case "earnings":
        return earningsRefreshing
      default:
        return referralRefreshing
    }
  }

  const getCurrentError = () => {
    switch (selectedTab) {
      case "referrals":
        return referralError
      case "quests":
        return questError
      case "earnings":
        return earningsError
      default:
        return referralError
    }
  }

  const handleRefresh = () => {
    switch (selectedTab) {
      case "referrals":
        refreshReferrals()
        break
      case "quests":
        refreshQuests()
        break
      case "earnings":
        refreshEarnings()
        break
      default:
        refreshReferrals()
    }
  }

  const getAvatarColor = (index: number) => {
    const colors = ["bg-yellow-500", "bg-gray-400", "bg-amber-700", "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500", "bg-orange-500", "bg-teal-500", "bg-indigo-500"]
    return colors[index % colors.length]
  }

  return (
    <ProtectedRoute requiresNFT={true}>
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 py-12 px-6">
          <div className="max-w-7xl mx-auto">
            {/* Header with Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h1 className="text-5xl font-bold text-white mb-2">Leaderboard</h1>
                <p className="text-xl text-white/80">See the top performers on the platform</p>
                {stats && (
                  <div className="flex items-center gap-4 mt-4">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {stats.totalUsers} Users
                    </Badge>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Award className="h-3 w-3" />
                      {stats.totalReferrals} Referrals
                    </Badge>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {stats.totalRewards} USDC Distributed
                    </Badge>
                  </div>
                )}
              </div>

              {connected && userStats && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4">
                  <div className="flex items-center gap-8">
                    <div>
                      <p className="text-white/60 text-sm">Your Rank</p>
                      <p className="text-2xl font-bold text-white">#{userStats.referralRank || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Your Referrals</p>
                      <p className="text-2xl font-bold text-white">{userStats.totalReferrals}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">USDC Earned</p>
                      <p className="text-2xl font-bold text-white">{userStats.totalEarned}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Search and Controls */}
            <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center w-full sm:w-auto relative">
                <Input
                  type="text"
                  placeholder="Search by username or address"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 w-full"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto">
                <Button
                  onClick={handleRefresh}
                  disabled={getCurrentRefreshing()}
                  variant="outline"
                  size="sm"
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${getCurrentRefreshing() ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Select value={timeframe} onValueChange={setTimeframe}>
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

            {/* Error Display */}
            {getCurrentError() && (
              <Alert className="mb-6">
                <AlertDescription>{getCurrentError()}</AlertDescription>
              </Alert>
            )}

            <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as any)} className="w-full">
              <TabsList className="bg-white/10 border border-white/20 mb-8">
                <TabsTrigger value="referrals" className="data-[state=active]:bg-white/20 text-white">
                  Referrals
                  {stats && <Badge variant="secondary" className="ml-2">{stats.totalReferrals}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="quests" className="data-[state=active]:bg-white/20 text-white">
                  Quests
                </TabsTrigger>
                <TabsTrigger value="earnings" className="data-[state=active]:bg-white/20 text-white">
                  Earnings
                  {stats && <Badge variant="secondary" className="ml-2">{stats.totalRewards} USDC</Badge>}
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
                        {getCurrentLoading() ? (
                          // Loading skeleton
                          [...Array(5)].map((_, i) => (
                            <tr key={i} className="border-b border-white/10 animate-pulse">
                              <td className="py-4 px-2 sm:px-4">
                                <div className="bg-gray-600 h-8 w-8 rounded-full"></div>
                              </td>
                              <td className="py-4 px-2 sm:px-4">
                                <div className="flex items-center gap-3">
                                  <div className="bg-gray-600 h-8 w-8 rounded-full"></div>
                                  <div>
                                    <div className="bg-gray-600 h-4 w-24 rounded mb-1"></div>
                                    <div className="bg-gray-600 h-3 w-16 rounded"></div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-2 sm:px-4">
                                <div className="bg-gray-600 h-4 w-12 rounded ml-auto"></div>
                              </td>
                              <td className="py-4 px-2 sm:px-4">
                                <div className="bg-gray-600 h-4 w-16 rounded ml-auto"></div>
                              </td>
                            </tr>
                          ))
                        ) : filteredReferralLeaderboard.length > 0 ? (
                          filteredReferralLeaderboard.map((user, index) => (
                            <tr
                              key={user.walletAddress}
                              className={`border-b border-white/10 last:border-0 ${user.rank <= 3 ? "bg-white/5" : ""}`}
                            >
                              <td className="py-4 px-2 sm:px-4">
                                <div className="flex items-center">
                                  {user.rank <= 3 ? (
                                    <div className="bg-white/10 rounded-full h-8 w-8 flex items-center justify-center">
                                      <Trophy
                                        className={`h-4 w-4 ${
                                          user.rank === 1
                                            ? "text-yellow-400"
                                            : user.rank === 2
                                              ? "text-gray-300"
                                              : "text-amber-600"
                                        }`}
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-white font-medium pl-2">{user.rank}</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-2 sm:px-4">
                                <div className="flex items-center gap-3">
                                  <Avatar className={`${getAvatarColor(index)} h-8 w-8`}>
                                    <AvatarFallback className="text-white">
                                      {user.displayName.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-white font-medium">{user.displayName}</p>
                                    <p className="text-white/60 text-xs">
                                      {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="text-right text-white font-medium py-4 px-2 sm:px-4">
                                {user.totalReferrals}
                              </td>
                              <td className="text-right text-white font-medium py-4 px-2 sm:px-4">
                                {user.totalEarned} USDC
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-white/60">
                              {searchTerm ? "No users found matching your search." : "No referrals yet. Be the first!"}
                            </td>
                          </tr>
                        )}
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
                        {getCurrentLoading() ? (
                          // Loading skeleton
                          [...Array(5)].map((_, i) => (
                            <tr key={i} className="border-b border-white/10 animate-pulse">
                              <td className="py-4 px-2 sm:px-4">
                                <div className="bg-gray-600 h-8 w-8 rounded-full"></div>
                              </td>
                              <td className="py-4 px-2 sm:px-4">
                                <div className="flex items-center gap-3">
                                  <div className="bg-gray-600 h-8 w-8 rounded-full"></div>
                                  <div>
                                    <div className="bg-gray-600 h-4 w-24 rounded mb-1"></div>
                                    <div className="bg-gray-600 h-3 w-16 rounded"></div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-2 sm:px-4">
                                <div className="bg-gray-600 h-4 w-12 rounded ml-auto"></div>
                              </td>
                              <td className="py-4 px-2 sm:px-4">
                                <div className="bg-gray-600 h-4 w-16 rounded ml-auto"></div>
                              </td>
                            </tr>
                          ))
                        ) : filteredQuestLeaderboard.length > 0 ? (
                          filteredQuestLeaderboard.map((user, index) => (
                            <tr
                              key={user.walletAddress}
                              className={`border-b border-white/10 last:border-0 ${user.rank <= 3 ? "bg-white/5" : ""}`}
                            >
                              <td className="py-4 px-2 sm:px-4">
                                <div className="flex items-center">
                                  {user.rank <= 3 ? (
                                    <div className="bg-white/10 rounded-full h-8 w-8 flex items-center justify-center">
                                      <Trophy
                                        className={`h-4 w-4 ${
                                          user.rank === 1
                                            ? "text-yellow-400"
                                            : user.rank === 2
                                              ? "text-gray-300"
                                              : "text-amber-600"
                                        }`}
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-white font-medium pl-2">{user.rank}</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-2 sm:px-4">
                                <div className="flex items-center gap-3">
                                  <Avatar className={`${getAvatarColor(index)} h-8 w-8`}>
                                    <AvatarFallback className="text-white">
                                      {user.displayName.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-white font-medium">{user.displayName}</p>
                                    <p className="text-white/60 text-xs">
                                      {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="text-right text-white font-medium py-4 px-2 sm:px-4">
                                {user.questsCompleted}
                              </td>
                              <td className="text-right text-white font-medium py-4 px-2 sm:px-4">
                                {user.score}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-white/60">
                              {searchTerm ? "No users found matching your search." : "No quest completions yet. Be the first!"}
                            </td>
                          </tr>
                        )}
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

              <TabsContent value="earnings" className="mt-0">
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 p-6 sm:p-8">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/20">
                          <th className="text-left text-white/60 py-4 px-2 sm:px-4">Rank</th>
                          <th className="text-left text-white/60 py-4 px-2 sm:px-4">User</th>
                          <th className="text-right text-white/60 py-4 px-2 sm:px-4">USDC Earned</th>
                          <th className="text-right text-white/60 py-4 px-2 sm:px-4">Referrals</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getCurrentLoading() ? (
                          // Loading skeleton
                          [...Array(5)].map((_, i) => (
                            <tr key={i} className="border-b border-white/10 animate-pulse">
                              <td className="py-4 px-2 sm:px-4">
                                <div className="bg-gray-600 h-8 w-8 rounded-full"></div>
                              </td>
                              <td className="py-4 px-2 sm:px-4">
                                <div className="flex items-center gap-3">
                                  <div className="bg-gray-600 h-8 w-8 rounded-full"></div>
                                  <div>
                                    <div className="bg-gray-600 h-4 w-24 rounded mb-1"></div>
                                    <div className="bg-gray-600 h-3 w-16 rounded"></div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-2 sm:px-4">
                                <div className="bg-gray-600 h-4 w-16 rounded ml-auto"></div>
                              </td>
                              <td className="py-4 px-2 sm:px-4">
                                <div className="bg-gray-600 h-4 w-12 rounded ml-auto"></div>
                              </td>
                            </tr>
                          ))
                        ) : filteredEarningsLeaderboard.length > 0 ? (
                          filteredEarningsLeaderboard.map((user, index) => (
                            <tr
                              key={user.walletAddress}
                              className={`border-b border-white/10 last:border-0 ${user.rank <= 3 ? "bg-white/5" : ""}`}
                            >
                              <td className="py-4 px-2 sm:px-4">
                                <div className="flex items-center">
                                  {user.rank <= 3 ? (
                                    <div className="bg-white/10 rounded-full h-8 w-8 flex items-center justify-center">
                                      <Trophy
                                        className={`h-4 w-4 ${
                                          user.rank === 1
                                            ? "text-yellow-400"
                                            : user.rank === 2
                                              ? "text-gray-300"
                                              : "text-amber-600"
                                        }`}
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-white font-medium pl-2">{user.rank}</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-2 sm:px-4">
                                <div className="flex items-center gap-3">
                                  <Avatar className={`${getAvatarColor(index)} h-8 w-8`}>
                                    <AvatarFallback className="text-white">
                                      {user.displayName.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-white font-medium">{user.displayName}</p>
                                    <p className="text-white/60 text-xs">
                                      {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="text-right text-white font-medium py-4 px-2 sm:px-4">
                                {user.totalEarned} USDC
                              </td>
                              <td className="text-right text-white font-medium py-4 px-2 sm:px-4">
                                {user.totalReferrals}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-white/60">
                              {searchTerm ? "No users found matching your search." : "No earnings yet. Start referring to earn!"}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-center mt-8">
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                    View All Earnings
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
