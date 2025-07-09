"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useWallet } from "@/contexts/wallet-context"
import { Sun, Gift, Calendar } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export function DailyGmPoints() {
  const { connected, publicKey } = useWallet()
  const [lastClaimedDate, setLastClaimedDate] = useState<string | null>(null)
  const [canClaim, setCanClaim] = useState(false)
  const [totalPoints, setTotalPoints] = useState(0)
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(false)

  // Load user data from localStorage
  useEffect(() => {
    if (connected && publicKey) {
      const walletAddress = publicKey.toString()
      const userData = localStorage.getItem(`gm_points_${walletAddress}`)

      if (userData) {
        const parsedData = JSON.parse(userData)
        setLastClaimedDate(parsedData.lastClaimedDate)
        setTotalPoints(parsedData.totalPoints || 0)
        setStreak(parsedData.streak || 0)

        // Check if user can claim today
        const today = new Date().toISOString().split("T")[0]
        setCanClaim(parsedData.lastClaimedDate !== today)
      } else {
        // New user
        setCanClaim(true)
        setTotalPoints(0)
        setStreak(0)
        setLastClaimedDate(null)
      }
    }
  }, [connected, publicKey])

  const handleClaim = () => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to claim GM points",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    // Simulate API call
    setTimeout(() => {
      const walletAddress = publicKey.toString()
      const today = new Date().toISOString().split("T")[0]
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]

      // Calculate points and streak
      let newStreak = streak
      let pointsToAdd = 10 // Base points

      if (lastClaimedDate === yesterday) {
        // Continuing streak
        newStreak += 1

        // Bonus points for streak
        if (newStreak >= 7) {
          pointsToAdd += 20 // Weekly bonus
        } else if (newStreak >= 3) {
          pointsToAdd += 5 // Mini streak bonus
        }
      } else if (lastClaimedDate) {
        // Streak broken
        newStreak = 1
      } else {
        // First time
        newStreak = 1
      }

      const newTotalPoints = totalPoints + pointsToAdd

      // Save to localStorage
      const userData = {
        lastClaimedDate: today,
        totalPoints: newTotalPoints,
        streak: newStreak,
      }

      localStorage.setItem(`gm_points_${walletAddress}`, JSON.stringify(userData))

      // Update state
      setLastClaimedDate(today)
      setTotalPoints(newTotalPoints)
      setStreak(newStreak)
      setCanClaim(false)
      setLoading(false)

      toast({
        title: "GM Points Claimed!",
        description: `You earned ${pointsToAdd} points. Current streak: ${newStreak} days`,
      })
    }, 1500)
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Sun className="h-5 w-5 text-yellow-400" />
          Daily GM Points
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white/60 text-sm">Total Points</p>
              <p className="text-2xl font-bold text-white">{totalPoints}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm">Current Streak</p>
              <p className="text-2xl font-bold text-white flex items-center gap-1">
                {streak} <Calendar className="h-4 w-4 text-white/60" />
              </p>
            </div>
          </div>

          {streak > 0 && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <p className="text-white/60 text-sm">Weekly Streak Progress</p>
                <p className="text-white/60 text-sm">{streak}/7 days</p>
              </div>
              <Progress value={(streak / 7) * 100} className="h-2 bg-white/10" />
              {streak < 7 ? (
                <p className="text-white/60 text-xs mt-1">{7 - streak} more days for weekly bonus (+20 points)</p>
              ) : (
                <p className="text-green-400 text-xs mt-1">Weekly bonus active! (+20 points)</p>
              )}
            </div>
          )}

          <Button onClick={handleClaim} disabled={!connected || !canClaim || loading} className="w-full">
            {loading
              ? "Claiming..."
              : !connected
                ? "Connect Wallet"
                : canClaim
                  ? "Claim Daily GM Points"
                  : "Already Claimed Today"}
          </Button>

          <div className="bg-white/5 rounded-lg p-3 text-sm text-white/70">
            <p className="flex items-center gap-1 mb-1">
              <Gift className="h-4 w-4 text-purple-400" />
              <span className="font-medium text-white">Rewards</span>
            </p>
            <ul className="space-y-1 pl-5 list-disc text-xs">
              <li>Daily check-in: 10 points</li>
              <li>3-day streak: +5 bonus points</li>
              <li>7-day streak: +20 bonus points</li>
              <li>Redeem 100 points for 1 USDC</li>
              <li>Redeem 500 points for exclusive NFT</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
