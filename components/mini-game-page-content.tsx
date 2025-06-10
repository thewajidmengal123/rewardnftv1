"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWallet } from "@/contexts/wallet-context"
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { Gamepad2, Trophy, Star, Zap, Play } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export function MiniGamePageContent() {
  const { connected, publicKey } = useWallet()
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameOver'>('menu')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(20)
  const [clicks, setClicks] = useState(0)
  const [gameInterval, setGameInterval] = useState<NodeJS.Timeout | null>(null)
  const [questCompleted, setQuestCompleted] = useState(false)
  const [xpEarned, setXpEarned] = useState(0)
  const [totalXpEarned, setTotalXpEarned] = useState(0)
  const [hasPlayedToday, setHasPlayedToday] = useState(false)
  const [lastPlayDate, setLastPlayDate] = useState<string | null>(null)
  const [checkingPlayStatus, setCheckingPlayStatus] = useState(true)
  const [timeUntilReset, setTimeUntilReset] = useState<string>('')
  const [sessionStatus, setSessionStatus] = useState<string | null>(null)

  // Check daily play status and pending quest on component mount
  useEffect(() => {
    if (connected && publicKey) {
      checkDailyPlayStatus()
    }

    const pendingQuestId = localStorage.getItem('pendingQuestId')
    if (pendingQuestId) {
      toast({
        title: "Quest Active!",
        description: "Score 1500+ points in 20 seconds to complete the mini-game quest!",
      })
    }
  }, [connected, publicKey])

  // Update countdown timer every minute when user has played today
  useEffect(() => {
    if (!hasPlayedToday) return

    const updateCountdown = () => {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0) // Set to midnight

      const timeDiff = tomorrow.getTime() - now.getTime()
      const hours = Math.floor(timeDiff / (1000 * 60 * 60))
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))

      setTimeUntilReset(`${hours}h ${minutes}m`)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [hasPlayedToday])

  const checkDailyPlayStatus = async () => {
    if (!publicKey) return

    try {
      setCheckingPlayStatus(true)
      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

      const response = await fetch(`/api/mini-game/play-status?walletAddress=${publicKey.toString()}&date=${today}`)
      const result = await response.json()

      if (result.success) {
        setHasPlayedToday(result.hasPlayedToday)
        setLastPlayDate(result.lastPlayDate)
        setSessionStatus(result.sessionStatus)

        console.log('🎮 Mini-game play status:', {
          hasPlayedToday: result.hasPlayedToday,
          sessionStatus: result.sessionStatus,
          lastPlayDate: result.lastPlayDate
        })

        // If user has a session today (started or completed), they cannot play again
        if (result.hasPlayedToday && (result.sessionStatus === 'started' || result.sessionStatus === 'completed')) {
          setHasPlayedToday(true)
        }
      }
    } catch (error) {
      console.error('Error checking daily play status:', error)
      // On error, allow play (fail open)
      setHasPlayedToday(false)
    } finally {
      setCheckingPlayStatus(false)
    }
  }

  const startGame = async () => {
    // Double-check play status before starting
    await checkDailyPlayStatus()

    // Check if user has already played today
    if (hasPlayedToday || sessionStatus === 'completed') {
      toast({
        title: "Daily Limit Reached",
        description: "You can only play the mini-game once per day. Come back tomorrow!",
        variant: "destructive"
      })
      return
    }

    // Record the play session start
    const sessionRecorded = await recordPlaySession()

    // If session recording failed, don't start the game
    if (!sessionRecorded) {
      toast({
        title: "Error",
        description: "Failed to start game session. Please try again.",
        variant: "destructive"
      })
      return
    }

    setGameState('playing')
    setScore(0)
    setClicks(0)
    setTimeLeft(20) // Reduced from 30 to 20 seconds
    setQuestCompleted(false)
    setXpEarned(0) // Reset XP for new game

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    setGameInterval(interval)
  }

  const recordPlaySession = async (): Promise<boolean> => {
    if (!publicKey) return false

    try {
      const today = new Date().toISOString().split('T')[0]

      const response = await fetch('/api/mini-game/record-play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          playDate: today,
          startedAt: Date.now()
        })
      })

      const result = await response.json()
      if (result.success) {
        setHasPlayedToday(true)
        setLastPlayDate(today)
        return true
      } else {
        console.error('Failed to record play session:', result.error)
        return false
      }
    } catch (error) {
      console.error('Error recording play session:', error)
      return false
    }
  }

  const endGame = useCallback(() => {
    setGameState('gameOver')
    if (gameInterval) {
      clearInterval(gameInterval)
      setGameInterval(null)
    }

    // Save XP earned to backend immediately when game ends
    if (xpEarned > 0 && publicKey) {
      saveXPToBackend(xpEarned)
    }

    // Check if quest should be completed (increased target to 1500)
    const pendingQuestId = localStorage.getItem('pendingQuestId')
    if (pendingQuestId && score >= 1500 && !questCompleted) {
      completeQuest(pendingQuestId, score)
    }

    // Ensure user cannot play again today
    setHasPlayedToday(true)
    setSessionStatus('completed')
  }, [gameInterval, score, questCompleted, xpEarned, publicKey])

  const saveXPToBackend = async (xpAmount: number) => {
    if (!publicKey) return

    try {
      // Save XP
      const xpResponse = await fetch('/api/xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          xpAmount,
          source: 'mini-game',
          details: {
            gameScore: score,
            clicks: clicks,
            timeSpent: 20 - timeLeft,
            completedAt: Date.now()
          }
        })
      })

      // Update session as completed
      const today = new Date().toISOString().split('T')[0]
      await fetch('/api/mini-game/complete-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          playDate: today,
          gameScore: score,
          clicks: clicks,
          xpEarned: xpAmount,
          completedAt: Date.now()
        })
      })

      const result = await xpResponse.json()
      if (result.success) {
        setTotalXpEarned(prev => prev + xpAmount)

        // Ensure user cannot play again today
        setHasPlayedToday(true)
        setLastPlayDate(today)

        toast({
          title: "🎮 XP Rewarded!",
          description: `You earned ${xpAmount} XP from the mini-game! XP has been added to your account.`,
        })
      }
    } catch (error) {
      console.error('XP save error:', error)
      toast({
        title: "Error",
        description: "Failed to save XP. Please try again.",
        variant: "destructive"
      })
    }
  }

  const completeQuest = async (questId: string, finalScore: number) => {
    if (!publicKey) return

    try {
      const response = await fetch('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          questId,
          action: 'update-progress',
          progressIncrement: 1,
          verificationData: {
            gameScore: finalScore,
            completedAt: Date.now()
          }
        })
      })

      const result = await response.json()
      if (result.success) {
        setQuestCompleted(true)
        localStorage.removeItem('pendingQuestId')
        toast({
          title: "Quest Completed!",
          description: `Mini-game quest completed with ${finalScore} points! You earned 200 XP!`,
        })
      }
    } catch (error) {
      console.error('Quest completion error:', error)
    }
  }

  const handleClick = () => {
    if (gameState !== 'playing') return

    // More challenging scoring system
    // Base points: 5-25 (reduced from 10-60)
    // Bonus for consecutive clicks within 1 second
    const basePoints = Math.floor(Math.random() * 21) + 5 // 5-25 points per click

    // Time-based multiplier (more points early in the game)
    const timeMultiplier = timeLeft > 15 ? 1.5 : timeLeft > 10 ? 1.2 : 1.0

    // Click speed bonus (if clicking fast)
    const now = Date.now()
    const lastClickTime = localStorage.getItem('lastClickTime')
    let speedBonus = 1.0

    if (lastClickTime && now - parseInt(lastClickTime) < 500) {
      speedBonus = 1.3 // 30% bonus for fast clicking
    }

    localStorage.setItem('lastClickTime', now.toString())

    const finalPoints = Math.floor(basePoints * timeMultiplier * speedBonus)
    setScore(prev => prev + finalPoints)
    setClicks(prev => prev + 1)

    // Award XP based on clicks (max 250 XP total)
    // XP formula: 1-3 XP per click, with diminishing returns after 100 clicks
    const currentXP = xpEarned
    if (currentXP < 250) {
      let xpToAward = 0

      if (clicks < 50) {
        // Early clicks: 3 XP each (up to 150 XP)
        xpToAward = 3
      } else if (clicks < 100) {
        // Mid clicks: 2 XP each (up to 100 more XP = 250 total)
        xpToAward = 2
      } else {
        // Late clicks: 1 XP each (diminishing returns)
        xpToAward = 1
      }

      // Ensure we don't exceed 250 XP total
      const newXP = Math.min(currentXP + xpToAward, 250)
      setXpEarned(newXP)
    }
  }



  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto bg-gray-800/50 border-gray-700">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white">Connect Wallet</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-300">Connect your wallet to play the mini-game!</p>
            <WalletConnectButton className="w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white relative overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 z-0" />

      {/* Content */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">

            {/* Game Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4">
                <span className="text-purple-400">Click</span>{" "}
                <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Challenge
                </span>
              </h1>
              <p className="text-gray-300">Click as fast as you can to score points and earn XP! Get 1500+ points in 20 seconds to complete the quest!</p>
              <p className="text-cyan-300 text-sm">💡 Earn up to 250 XP based on your clicks - more clicks = more XP!</p>
              <p className="text-yellow-300 text-sm">⏰ You can play once per day - make it count!</p>
            </div>

            {/* Game Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Game Stats */}
              <div className="space-y-4">
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-400" />
                      Game Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Score:</span>
                      <span className="text-2xl font-bold text-yellow-400">{score}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Time Left:</span>
                      <span className="text-xl font-bold text-blue-400">{timeLeft}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Clicks:</span>
                      <span className="text-lg font-bold text-green-400">{clicks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Quest Target:</span>
                      <span className="text-lg font-bold text-purple-400">1500+</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">XP Earned:</span>
                      <span className="text-lg font-bold text-cyan-400">{xpEarned}/250</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Daily Play Status */}
                <Card className={`${hasPlayedToday || sessionStatus === 'completed' ? 'bg-red-900/30 border-red-700' : 'bg-green-900/30 border-green-700'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Star className={`w-5 h-5 ${hasPlayedToday || sessionStatus === 'completed' ? 'text-red-400' : 'text-green-400'}`} />
                      <span className={hasPlayedToday || sessionStatus === 'completed' ? 'text-red-300' : 'text-green-300'}>
                        {hasPlayedToday || sessionStatus === 'completed'
                          ? `Already played today (${lastPlayDate}). Next play in: ${timeUntilReset}`
                          : 'Ready to play! You can play once per day.'
                        }
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Quest Status */}
                {localStorage.getItem('pendingQuestId') && (
                  <Card className="bg-purple-900/30 border-purple-700">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-purple-400" />
                        <span className="text-purple-300">Quest Active: Score 1500+ points in 20 seconds!</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Game Play Area */}
              <div className="space-y-4">
                {gameState === 'menu' && (
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white text-center">Ready to Play?</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                      <p className="text-gray-300">Click the button as many times as you can in 20 seconds!</p>
                      <p className="text-cyan-300 text-sm">Earn XP with every click - up to 250 XP total!</p>
                      {checkingPlayStatus ? (
                        <Button
                          disabled
                          size="lg"
                          className="bg-gray-600 text-gray-300"
                        >
                          Checking Status...
                        </Button>
                      ) : (
                        <Button
                          onClick={startGame}
                          disabled={hasPlayedToday || sessionStatus === 'completed'}
                          size="lg"
                          className={`${
                            hasPlayedToday || sessionStatus === 'completed'
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold'
                          }`}
                        >
                          <Play className="w-5 h-5 mr-2" />
                          {hasPlayedToday || sessionStatus === 'completed' ? 'Played Today' : 'Start Game'}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}

                {gameState === 'playing' && (
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardContent className="p-8 text-center">
                      <Button
                        onClick={handleClick}
                        size="lg"
                        className="w-48 h-48 rounded-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold text-2xl transform hover:scale-105 transition-transform"
                      >
                        CLICK ME!
                      </Button>
                      <p className="text-gray-300 mt-4">Keep clicking to score points and earn XP!</p>
                      <p className="text-cyan-400 text-sm">XP: {xpEarned}/250</p>
                    </CardContent>
                  </Card>
                )}

                {gameState === 'gameOver' && (
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white text-center">🎮 Game Complete!</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-6">
                      <div className="space-y-2">
                        <div className="text-3xl font-bold text-yellow-400">Final Score: {score}</div>
                        <div className="text-lg text-gray-300">Total Clicks: {clicks}</div>
                      </div>

                      {/* XP Reward Section */}
                      <div className="bg-cyan-900/30 border border-cyan-700 rounded-lg p-6">
                        <div className="text-2xl font-bold text-cyan-400 mb-2">
                          🌟 XP Rewarded: {xpEarned}
                        </div>
                        <div className="text-cyan-300 text-sm">
                          XP has been added to your account!
                        </div>
                      </div>

                      {/* Quest Status */}
                      {score >= 1500 ? (
                        <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                          <div className="text-green-400 font-bold text-lg">🎉 Quest Target Reached!</div>
                          <div className="text-green-300 text-sm mt-1">Excellent performance!</div>
                          {questCompleted && (
                            <div className="text-green-300 text-sm mt-2 font-semibold">
                              ✅ Quest completed! Bonus 200 XP awarded!
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-orange-900/30 border border-orange-700 rounded-lg p-4">
                          <div className="text-orange-400">Quest target: 1500 points</div>
                          <div className="text-orange-300 text-sm mt-1">You scored {score} points - try again tomorrow!</div>
                        </div>
                      )}

                      {/* Daily Completion Status */}
                      <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-4">
                        <div className="text-purple-400 font-semibold">🎯 Daily Game Complete!</div>
                        <div className="text-purple-300 text-sm mt-1">Come back tomorrow to play again</div>
                        <div className="text-purple-200 text-sm mt-2">Next play available in: {timeUntilReset}</div>
                      </div>

                      {/* Navigation back to quests */}
                      <div className="pt-4">
                        <Button
                          asChild
                          className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold"
                        >
                          <Link href="/quests">
                            <Trophy className="w-4 h-4 mr-2" />
                            Back to Quests
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="text-center mt-8">
              <Button
                asChild
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <Link href="/quests">Back to Quests</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
