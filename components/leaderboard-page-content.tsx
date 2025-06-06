"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, Crown } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { useWallet } from "@/contexts/wallet-context"
import { useFirebaseLeaderboard } from "@/hooks/use-firebase-leaderboard"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function LeaderboardPageContent() {
  const { connected } = useWallet()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTab, setSelectedTab] = useState<"referrals" | "xp">("referrals")
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

  // For XP leaderboard, we'll use xp data
  const {
    leaderboard: xpLeaderboard,
    loading: xpLoading,
    refreshing: xpRefreshing,
    refresh: refreshXP,
    error: xpError,
  } = useFirebaseLeaderboard("xp", 50)

  // Filter leaderboard based on search term
  const filteredReferralLeaderboard = useMemo(() => {
    if (!searchTerm) return referralLeaderboard
    return referralLeaderboard.filter(
      (user) =>
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.walletAddress.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [referralLeaderboard, searchTerm])

  const filteredXPLeaderboard = useMemo(() => {
    if (!searchTerm) return xpLeaderboard
    return xpLeaderboard.filter(
      (user) =>
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.walletAddress.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [xpLeaderboard, searchTerm])

  // Get current leaderboard data based on selected tab
  const getCurrentLeaderboard = () => {
    switch (selectedTab) {
      case "referrals":
        return filteredReferralLeaderboard
      case "xp":
        return filteredXPLeaderboard
      default:
        return filteredReferralLeaderboard
    }
  }

  const getCurrentLoading = () => {
    switch (selectedTab) {
      case "referrals":
        return referralLoading
      case "xp":
        return xpLoading
      default:
        return referralLoading
    }
  }

  const getCurrentRefreshing = () => {
    switch (selectedTab) {
      case "referrals":
        return referralRefreshing
      case "xp":
        return xpRefreshing
      default:
        return referralRefreshing
    }
  }

  const getCurrentError = () => {
    switch (selectedTab) {
      case "referrals":
        return referralError
      case "xp":
        return xpError
      default:
        return referralError
    }
  }

  const handleRefresh = () => {
    switch (selectedTab) {
      case "referrals":
        refreshReferrals()
        break
      case "xp":
        refreshXP()
        break
      default:
        refreshReferrals()
    }
  }



  // Get top 3 users for podium display
  const topThreeUsers = getCurrentLeaderboard().slice(0, 3)

  return (
    <ProtectedRoute requiresNFT={true}>
      <div className="min-h-screen bg-black text-white">
        <main className="py-12 px-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold text-white mb-4">
                Community <span className="bg-gradient-to-r from-green-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">Leaderboard</span>
              </h1>
              <p className="text-xl text-gray-400">
                See who's leading the pack in referrals and XP points.
              </p>
            </div>

            {/* Platform Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <div className="bg-gradient-to-br from-teal-900/50 to-teal-800/50 rounded-xl p-6 border border-teal-700/30 backdrop-blur-sm">
                <div className="text-center">
                  <div className="text-3xl font-bold text-teal-400 mb-2">
                    {stats?.totalUsers || 0}
                  </div>
                  <div className="text-gray-300 text-sm font-medium">Total Players</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-900/50 to-green-800/50 rounded-xl p-6 border border-green-700/30 backdrop-blur-sm">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">
                    ${stats?.totalRewards?.toFixed(0) || 0}
                  </div>
                  <div className="text-gray-300 text-sm font-medium">Total USDC Earned</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/50 rounded-xl p-6 border border-yellow-700/30 backdrop-blur-sm">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400 mb-2">
                    {stats?.totalReferrals || 0}
                  </div>
                  <div className="text-gray-300 text-sm font-medium">Total Referrals</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/50 rounded-xl p-6 border border-purple-700/30 backdrop-blur-sm">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-2">
                    {getCurrentLeaderboard().length}
                  </div>
                  <div className="text-gray-300 text-sm font-medium">Active Leaders</div>
                </div>
              </div>
            </div>

            {/* Tab Toggle - matching reference design */}
            <div className="flex justify-center mb-12">
              <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-full p-1 flex">
                <button
                  onClick={() => setSelectedTab("referrals")}
                  className={`px-8 py-3 rounded-full text-sm font-medium transition-all ${
                    selectedTab === "referrals"
                      ? "bg-teal-500 text-black"
                      : "text-gray-300 hover:text-teal-400"
                  }`}
                >
                  👥 Referrals
                </button>
                <button
                  onClick={() => setSelectedTab("xp")}
                  className={`px-8 py-3 rounded-full text-sm font-medium transition-all ${
                    selectedTab === "xp"
                      ? "bg-purple-600 text-white"
                      : "text-gray-300 hover:text-purple-400"
                  }`}
                >
                  ⭐ XP Leaders
                </button>
              </div>
            </div>

            {/* Top 3 Podium - Enhanced */}
            <div className="flex justify-center items-end gap-6 mb-16">
              {/* 2nd Place */}
              {topThreeUsers[1] && (
                <div className="text-center transform hover:scale-105 transition-transform duration-300">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center mb-4 mx-auto border-4 border-yellow-400 shadow-lg shadow-yellow-500/30">
                      <span className="text-2xl font-bold text-black">2</span>
                    </div>
                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full">
                      2ND
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-900/90 to-yellow-800/90 rounded-xl p-5 min-w-[220px] border border-yellow-700/50 backdrop-blur-sm">
                    <div className="mb-3">
                      <p className="text-white font-medium text-sm mb-1">
                        {topThreeUsers[1].walletAddress.slice(0, 8)}...{topThreeUsers[1].walletAddress.slice(-6)}
                      </p>
                      <div className="w-8 h-8 bg-yellow-600/30 rounded-full flex items-center justify-center mx-auto">
                        <span className="text-yellow-400 text-sm font-bold">
                          {topThreeUsers[1].walletAddress.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-yellow-400 font-bold text-lg">
                        {selectedTab === "referrals" ? `${topThreeUsers[1].totalReferrals} Referrals` : `${topThreeUsers[1].totalXP || topThreeUsers[1].score} XP`}
                      </p>
                      <div className="bg-yellow-800/30 rounded-lg p-2">
                        <p className="text-yellow-300 text-sm font-medium">USDC Earned</p>
                        <p className="text-white font-bold text-xl">${topThreeUsers[1].totalEarned.toFixed(2)}</p>
                      </div>
                      <div className="text-xs text-yellow-300/80">
                        Rank #{topThreeUsers[1].rank}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {topThreeUsers[0] && (
                <div className="text-center transform hover:scale-105 transition-transform duration-300">
                  <div className="relative">
                    <Crown className="w-10 h-10 text-yellow-400 absolute -top-8 left-1/2 transform -translate-x-1/2 animate-pulse" />
                    <div className="w-28 h-28 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center mb-4 mx-auto border-4 border-teal-300 shadow-xl shadow-teal-500/40">
                      <span className="text-3xl font-bold text-black">👑</span>
                    </div>
                    <div className="absolute -top-2 -right-2 bg-teal-400 text-black text-xs font-bold px-2 py-1 rounded-full">
                      1ST
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-teal-900/90 to-teal-800/90 rounded-xl p-6 min-w-[250px] border border-teal-700/50 backdrop-blur-sm">
                    <div className="mb-4">
                      <p className="text-white font-medium text-base mb-2">
                        {topThreeUsers[0].walletAddress.slice(0, 8)}...{topThreeUsers[0].walletAddress.slice(-6)}
                      </p>
                      <div className="w-10 h-10 bg-teal-600/30 rounded-full flex items-center justify-center mx-auto">
                        <span className="text-teal-400 text-lg font-bold">
                          {topThreeUsers[0].walletAddress.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-teal-400 font-bold text-2xl">
                        {selectedTab === "referrals" ? `${topThreeUsers[0].totalReferrals} Referrals` : `${topThreeUsers[0].totalXP || topThreeUsers[0].score} XP`}
                      </p>
                      <div className="bg-teal-800/40 rounded-lg p-3">
                        <p className="text-teal-300 text-sm font-medium">USDC Earned</p>
                        <p className="text-white font-bold text-2xl">${topThreeUsers[0].totalEarned.toFixed(2)}</p>
                      </div>
                      <div className="text-sm text-teal-300/80 font-medium">
                        🏆 Champion - Rank #{topThreeUsers[0].rank}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {topThreeUsers[2] && (
                <div className="text-center transform hover:scale-105 transition-transform duration-300">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mb-4 mx-auto border-4 border-orange-400 shadow-lg shadow-orange-500/30">
                      <span className="text-2xl font-bold text-white">3</span>
                    </div>
                    <div className="absolute -top-2 -right-2 bg-orange-400 text-black text-xs font-bold px-2 py-1 rounded-full">
                      3RD
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-900/90 to-orange-800/90 rounded-xl p-5 min-w-[220px] border border-orange-700/50 backdrop-blur-sm">
                    <div className="mb-3">
                      <p className="text-white font-medium text-sm mb-1">
                        {topThreeUsers[2].walletAddress.slice(0, 8)}...{topThreeUsers[2].walletAddress.slice(-6)}
                      </p>
                      <div className="w-8 h-8 bg-orange-600/30 rounded-full flex items-center justify-center mx-auto">
                        <span className="text-orange-400 text-sm font-bold">
                          {topThreeUsers[2].walletAddress.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-orange-400 font-bold text-lg">
                        {selectedTab === "referrals" ? `${topThreeUsers[2].totalReferrals} Referrals` : `${topThreeUsers[2].totalXP || topThreeUsers[2].score} XP`}
                      </p>
                      <div className="bg-orange-800/30 rounded-lg p-2">
                        <p className="text-orange-300 text-sm font-medium">USDC Earned</p>
                        <p className="text-white font-bold text-xl">${topThreeUsers[2].totalEarned.toFixed(2)}</p>
                      </div>
                      <div className="text-xs text-orange-300/80">
                        Rank #{topThreeUsers[2].rank}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Error Display */}
            {getCurrentError() && (
              <Alert className="mb-6 bg-red-900/20 border-red-500/30">
                <AlertDescription className="text-red-400">{getCurrentError()}</AlertDescription>
              </Alert>
            )}

            {/* Enhanced Leaderboard Table */}
            <div className="bg-gray-900/70 backdrop-blur-sm rounded-2xl border border-gray-700/40 overflow-hidden shadow-xl">
              {/* Table Header */}
              <div className="bg-gradient-to-r from-gray-800/80 to-gray-700/80 px-6 py-4 border-b border-gray-600/30">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  🏆 Complete Leaderboard
                  <span className="text-sm text-gray-400 font-normal">
                    (Showing positions 4+)
                  </span>
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700/50 bg-gray-800/60">
                      <th className="text-left text-gray-300 py-4 px-6 font-semibold text-sm uppercase tracking-wide">
                        Rank
                      </th>
                      <th className="text-left text-gray-300 py-4 px-6 font-semibold text-sm uppercase tracking-wide">
                        Player Details
                      </th>
                      <th className="text-center text-gray-300 py-4 px-6 font-semibold text-sm uppercase tracking-wide">
                        {selectedTab === "referrals" ? "Referrals" : "XP Points"}
                      </th>
                      <th className="text-center text-gray-300 py-4 px-6 font-semibold text-sm uppercase tracking-wide">
                        USDC Earned
                      </th>
                      <th className="text-center text-gray-300 py-4 px-6 font-semibold text-sm uppercase tracking-wide">
                        Performance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {getCurrentLoading() ? (
                      // Enhanced Loading skeleton
                      [...Array(10)].map((_, i) => (
                        <tr key={i} className="border-b border-gray-700/20 animate-pulse">
                          <td className="py-5 px-6">
                            <div className="bg-gray-600 h-6 w-10 rounded-lg"></div>
                          </td>
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-4">
                              <div className="bg-gray-600 h-10 w-10 rounded-full"></div>
                              <div className="space-y-2">
                                <div className="bg-gray-600 h-4 w-36 rounded"></div>
                                <div className="bg-gray-600 h-3 w-24 rounded"></div>
                              </div>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <div className="bg-gray-600 h-6 w-16 rounded mx-auto"></div>
                          </td>
                          <td className="py-5 px-6">
                            <div className="bg-gray-600 h-6 w-20 rounded mx-auto"></div>
                          </td>
                          <td className="py-5 px-6">
                            <div className="bg-gray-600 h-4 w-24 rounded mx-auto"></div>
                          </td>
                        </tr>
                      ))
                    ) : getCurrentLeaderboard().length > 0 ? (
                      getCurrentLeaderboard().slice(3).map((user, index) => {
                        const isTopTen = user.rank <= 10
                        const earnedPerReferral = user.totalReferrals > 0 ? user.totalEarned / user.totalReferrals : 0

                        return (
                          <tr
                            key={user.walletAddress}
                            className={`border-b border-gray-700/20 last:border-0 hover:bg-gray-800/30 transition-all duration-200 ${
                              isTopTen ? 'bg-gray-800/10' : ''
                            }`}
                          >
                            <td className="py-5 px-6">
                              <div className="flex items-center gap-2">
                                <span className={`font-bold text-lg ${
                                  isTopTen ? 'text-yellow-400' : 'text-gray-400'
                                }`}>
                                  #{user.rank}
                                </span>
                                {isTopTen && (
                                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full font-medium">
                                    TOP 10
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-5 px-6">
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  isTopTen
                                    ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30'
                                    : 'bg-gray-700'
                                }`}>
                                  <span className={`text-sm font-bold ${
                                    isTopTen ? 'text-yellow-400' : 'text-white'
                                  }`}>
                                    {user.walletAddress.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <div className="text-white font-medium text-base">
                                    {user.walletAddress.slice(0, 8)}...{user.walletAddress.slice(-6)}
                                  </div>
                                  <div className="text-gray-400 text-sm">
                                    Wallet Address
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="text-center py-5 px-6">
                              <div className="space-y-1">
                                <div className="text-white font-bold text-lg">
                                  {selectedTab === "referrals" ? user.totalReferrals : (user.totalXP || user.score)}
                                </div>
                                <div className="text-gray-400 text-xs">
                                  {selectedTab === "referrals" ? "referrals" : "XP points"}
                                </div>
                              </div>
                            </td>
                            <td className="text-center py-5 px-6">
                              <div className="space-y-1">
                                <div className="text-teal-400 font-bold text-lg">
                                  ${user.totalEarned.toFixed(2)}
                                </div>
                                <div className="text-gray-400 text-xs">
                                  total earned
                                </div>
                              </div>
                            </td>
                            <td className="text-center py-5 px-6">
                              <div className="space-y-1">
                                <div className="text-green-400 font-medium">
                                  ${earnedPerReferral.toFixed(2)}
                                </div>
                                <div className="text-gray-400 text-xs">
                                  per referral
                                </div>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-16 text-center">
                          <div className="space-y-4">
                            <div className="text-6xl">🏆</div>
                            <div className="text-gray-400 text-lg">
                              No data available yet. Be the first to join!
                            </div>
                            <div className="text-gray-500 text-sm">
                              Start referring users to appear on the leaderboard
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* View Complete Leaderboard Button */}
            <div className="flex justify-center mt-8">
              <Button
                onClick={handleRefresh}
                disabled={getCurrentRefreshing()}
                className="bg-teal-500 hover:bg-teal-600 text-black font-medium px-8 py-3 rounded-lg transition-all"
              >
                {getCurrentRefreshing() ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  "View Complete Leaderboard"
                )}
              </Button>
            </div>

          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
