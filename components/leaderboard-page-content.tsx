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
  const [selectedTab, setSelectedTab] = useState<"referrals" | "mini-game">("referrals")
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

  // For mini-game, we'll use quests data for now
  const {
    leaderboard: miniGameLeaderboard,
    loading: miniGameLoading,
    refreshing: miniGameRefreshing,
    refresh: refreshMiniGame,
    error: miniGameError,
  } = useFirebaseLeaderboard("quests", 50)

  // Filter leaderboard based on search term
  const filteredReferralLeaderboard = useMemo(() => {
    if (!searchTerm) return referralLeaderboard
    return referralLeaderboard.filter(
      (user) =>
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.walletAddress.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [referralLeaderboard, searchTerm])

  const filteredMiniGameLeaderboard = useMemo(() => {
    if (!searchTerm) return miniGameLeaderboard
    return miniGameLeaderboard.filter(
      (user) =>
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.walletAddress.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [miniGameLeaderboard, searchTerm])

  // Get current leaderboard data based on selected tab
  const getCurrentLeaderboard = () => {
    switch (selectedTab) {
      case "referrals":
        return filteredReferralLeaderboard
      case "mini-game":
        return filteredMiniGameLeaderboard
      default:
        return filteredReferralLeaderboard
    }
  }

  const getCurrentLoading = () => {
    switch (selectedTab) {
      case "referrals":
        return referralLoading
      case "mini-game":
        return miniGameLoading
      default:
        return referralLoading
    }
  }

  const getCurrentRefreshing = () => {
    switch (selectedTab) {
      case "referrals":
        return referralRefreshing
      case "mini-game":
        return miniGameRefreshing
      default:
        return referralRefreshing
    }
  }

  const getCurrentError = () => {
    switch (selectedTab) {
      case "referrals":
        return referralError
      case "mini-game":
        return miniGameError
      default:
        return referralError
    }
  }

  const handleRefresh = () => {
    switch (selectedTab) {
      case "referrals":
        refreshReferrals()
        break
      case "mini-game":
        refreshMiniGame()
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
                See who's leading the pack in referrals and mini-game points.
              </p>
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
                  onClick={() => setSelectedTab("mini-game")}
                  className={`px-8 py-3 rounded-full text-sm font-medium transition-all ${
                    selectedTab === "mini-game"
                      ? "bg-gray-600 text-white"
                      : "text-gray-300 hover:text-gray-100"
                  }`}
                >
                  🎮 Mini-Game
                </button>
              </div>
            </div>

            {/* Top 3 Podium */}
            <div className="flex justify-center items-end gap-8 mb-16">
              {/* 2nd Place */}
              {topThreeUsers[1] && (
                <div className="text-center">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center mb-4 mx-auto border-4 border-yellow-400">
                      <span className="text-2xl font-bold text-black">2</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-900/80 to-yellow-800/80 rounded-xl p-4 min-w-[200px] border border-yellow-700/30">
                    <p className="text-white font-medium text-sm mb-1">
                      {topThreeUsers[1].walletAddress.slice(0, 6)}...{topThreeUsers[1].walletAddress.slice(-4)}
                    </p>
                    <p className="text-yellow-400 font-bold text-lg">
                      {selectedTab === "referrals" ? `${topThreeUsers[1].totalReferrals} Referrals` : `${topThreeUsers[1].score} Points`}
                    </p>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {topThreeUsers[0] && (
                <div className="text-center">
                  <div className="relative">
                    <Crown className="w-8 h-8 text-yellow-400 absolute -top-6 left-1/2 transform -translate-x-1/2" />
                    <div className="w-24 h-24 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center mb-4 mx-auto border-4 border-teal-300">
                      <span className="text-2xl font-bold text-black">👑</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-teal-900/80 to-teal-800/80 rounded-xl p-4 min-w-[220px] border border-teal-700/30">
                    <p className="text-white font-medium text-sm mb-1">
                      {topThreeUsers[0].walletAddress.slice(0, 6)}...{topThreeUsers[0].walletAddress.slice(-4)}
                    </p>
                    <p className="text-teal-400 font-bold text-xl">
                      {selectedTab === "referrals" ? `${topThreeUsers[0].totalReferrals} Referrals` : `${topThreeUsers[0].score} Points`}
                    </p>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {topThreeUsers[2] && (
                <div className="text-center">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mb-4 mx-auto border-4 border-red-400">
                      <span className="text-2xl font-bold text-white">3</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-red-900/80 to-red-800/80 rounded-xl p-4 min-w-[200px] border border-red-700/30">
                    <p className="text-white font-medium text-sm mb-1">
                      {topThreeUsers[2].walletAddress.slice(0, 6)}...{topThreeUsers[2].walletAddress.slice(-4)}
                    </p>
                    <p className="text-red-400 font-bold text-lg">
                      {selectedTab === "referrals" ? `${topThreeUsers[2].totalReferrals} Referrals` : `${topThreeUsers[2].score} Points`}
                    </p>
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

            {/* Leaderboard Table - matching reference design */}
            <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-700/30 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700/50 bg-gray-800/50">
                      <th className="text-left text-gray-400 py-4 px-6 font-medium text-sm">Rank</th>
                      <th className="text-left text-gray-400 py-4 px-6 font-medium text-sm">Player</th>
                      <th className="text-right text-gray-400 py-4 px-6 font-medium text-sm">
                        {selectedTab === "referrals" ? "Referrals" : "Points"}
                      </th>
                      <th className="text-right text-gray-400 py-4 px-6 font-medium text-sm">USDC Earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getCurrentLoading() ? (
                      // Loading skeleton
                      [...Array(7)].map((_, i) => (
                        <tr key={i} className="border-b border-gray-700/30 animate-pulse">
                          <td className="py-4 px-6">
                            <div className="bg-gray-600 h-6 w-8 rounded"></div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="bg-gray-600 h-8 w-8 rounded-full"></div>
                              <div className="bg-gray-600 h-4 w-32 rounded"></div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="bg-gray-600 h-4 w-12 rounded ml-auto"></div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="bg-gray-600 h-4 w-16 rounded ml-auto"></div>
                          </td>
                        </tr>
                      ))
                    ) : getCurrentLeaderboard().length > 0 ? (
                      getCurrentLeaderboard().slice(3).map((user, index) => (
                        <tr
                          key={user.walletAddress}
                          className="border-b border-gray-700/20 last:border-0 hover:bg-gray-800/20 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <span className="text-gray-400 font-medium">#{user.rank}</span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                  {user.walletAddress.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-white font-medium">
                                {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                              </span>
                            </div>
                          </td>
                          <td className="text-right text-white font-medium py-4 px-6">
                            {selectedTab === "referrals" ? user.totalReferrals : user.score}
                          </td>
                          <td className="text-right text-teal-400 font-medium py-4 px-6">
                            ${user.totalEarned.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-gray-400">
                          No data available yet. Be the first to join!
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
