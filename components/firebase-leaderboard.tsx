"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { RefreshCw, Trophy, Medal, Award } from "lucide-react"
import { useFirebaseLeaderboard } from "@/hooks/use-firebase-leaderboard"
import { Badge } from "@/components/ui/badge"

interface FirebaseLeaderboardProps {
  type?: "referrals" | "earnings" | "quests" | "overall"
  limit?: number
  showRefresh?: boolean
  className?: string
}

export function FirebaseLeaderboard({ 
  type = "referrals", 
  limit = 10, 
  showRefresh = true,
  className = "" 
}: FirebaseLeaderboardProps) {
  const {
    leaderboard,
    stats,
    userStats,
    loading,
    refreshing,
    refresh,
    error,
  } = useFirebaseLeaderboard(type, limit)

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return <span className="text-white font-bold text-lg">#{rank}</span>
    }
  }

  const getScoreLabel = (type: string) => {
    switch (type) {
      case "referrals":
        return "refs"
      case "earnings":
        return "USDC"
      case "quests":
        return "quests"
      case "overall":
        return "pts"
      default:
        return "pts"
    }
  }

  if (loading) {
    return (
      <div className={`bg-gradient-to-br from-transparent to-indigo-900 text-white border-none rounded-xl p-4 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Leaderboard</h3>
          <Badge variant="secondary">{type}</Badge>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="bg-gray-600 h-10 w-10 rounded-full"></div>
                <div className="bg-gray-600 h-4 w-24 rounded"></div>
              </div>
              <div className="bg-gray-600 h-4 w-16 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-gradient-to-br from-transparent to-indigo-900 text-white border-none rounded-xl p-4 ${className}`}>
        <div className="text-center py-8">
          <p className="text-red-400 mb-4">{error}</p>
          {showRefresh && (
            <Button onClick={refresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-gradient-to-br from-transparent to-indigo-900 text-white border-none rounded-xl p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold">Leaderboard</h3>
          <Badge variant="secondary" className="capitalize">
            {type}
          </Badge>
        </div>
        {showRefresh && (
          <Button 
            onClick={refresh} 
            variant="ghost" 
            size="sm" 
            disabled={refreshing}
            className="text-white hover:bg-white/10"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-lg font-bold">{stats.totalUsers}</div>
            <div className="text-xs text-white/70">Users</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-lg font-bold">{stats.totalReferrals}</div>
            <div className="text-xs text-white/70">Referrals</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-lg font-bold">{(stats.totalReferrals * 4).toFixed(0)}</div>
            <div className="text-xs text-white/70">USDC</div>
          </div>
        </div>
      )}

      {/* User's Position */}
      {userStats && (
        <div className="bg-white/10 rounded-lg p-3 mb-4">
          <div className="text-sm text-white/80 mb-1">Your Position</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getRankIcon(userStats.referralRank)}
              <span className="font-medium">Rank #{userStats.referralRank}</span>
            </div>
            <div className="text-right">
              <div className="font-bold">{userStats.totalReferrals} {getScoreLabel(type)}</div>
              <div className="text-xs text-white/70">{(userStats.totalReferrals * 4).toFixed(2)} USDC earned</div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="space-y-3">
        {leaderboard.length > 0 ? (
          leaderboard.map((entry, index) => (
            <div key={entry.walletAddress} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10">
                  {entry.rank <= 3 ? (
                    getRankIcon(entry.rank)
                  ) : (
                    <Avatar className="bg-gray-600 h-8 w-8">
                      <AvatarFallback className="text-white text-sm">
                        {entry.rank}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
                <div>
                  <div className="text-white font-medium">
                    {entry.displayName}
                  </div>
                  <div className="text-white/60 text-sm">
                    {entry.walletAddress.slice(0, 6)}...{entry.walletAddress.slice(-4)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white font-bold text-lg">
                  {entry.score} {getScoreLabel(type)}
                </div>
                <div className="text-white/70 text-sm">
                  {(entry.totalReferrals * 4).toFixed(2)} USDC
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-white/80 text-lg">No entries yet. Be the first!</p>
          </div>
        )}
      </div>

      {/* Footer */}
      {leaderboard.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="text-center text-white/60 text-sm">
            Showing top {leaderboard.length} of {stats?.totalUsers || 0} users
          </div>
        </div>
      )}
    </div>
  )
}
