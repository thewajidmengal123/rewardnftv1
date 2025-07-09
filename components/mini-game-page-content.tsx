"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useWallet } from "@/contexts/wallet-context"
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { ProtectedRoute } from "@/components/protected-route"
import { Gamepad2, Trophy, Star, Zap, Play, Clock, Timer, RotateCcw } from "lucide-react"
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
  const [gameEnded, setGameEnded] = useState(false)
  const [xpSaved, setXpSaved] = useState(false)
  const gameSessionRef = useRef<string | null>(null)
  const lastXPSaveTime = useRef<number>(0)
  const xpSaveInProgress = useRef(false)


  // Check for pending quest on component mount
  useEffect(() => {
    const pendingQuestId = localStorage.getItem('pendingQuestId')
    if (pendingQuestId) {
      toast({
        title: "Quest Active!",
        description: "Score 1500+ points in 20 seconds to complete the mini-game quest!",
      })
    }
  }, [connected, publicKey])

  // Cleanup interval on unmount and reset flags
  useEffect(() => {
    return () => {
      if (gameInterval) {
        clearInterval(gameInterval)
      }
      setGameEnded(false)
      setXpSaved(false)
      xpSaveInProgress.current = false
      gameSessionRef.current = null
    }
  }, [gameInterval])

  const startGame = async () => {
    // Clear any existing intervals first
    if (gameInterval) {
      clearInterval(gameInterval)
      setGameInterval(null)
    }

    // Generate unique session ID
    const sessionId = `game-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    gameSessionRef.current = sessionId

    console.log(`🎮 Starting new game session: ${sessionId}`)

    setGameState('playing')
    setScore(0)
    setClicks(0)
    setTimeLeft(20) // 20 seconds game duration
    setQuestCompleted(false)
    setXpEarned(0) // Reset XP for new game
    setGameEnded(false) // Reset game ended flag
    setXpSaved(false) // Reset XP saved flag
    xpSaveInProgress.current = false // Reset XP save progress
    lastXPSaveTime.current = 0 // Reset last save time

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Only end game if this is still the active session
          if (gameSessionRef.current === sessionId) {
            console.log(`🎮 Timer ended for session: ${sessionId}`)
            clearInterval(interval)
            setGameInterval(null)
            setTimeout(() => endGame(), 100) // Small delay to ensure state updates
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    setGameInterval(interval)
  }



  const endGame = useCallback(() => {
    const currentSession = gameSessionRef.current

    // Prevent multiple calls to endGame
    if (gameEnded) {
      console.log(`🎮 Game already ended, skipping duplicate call`)
      return
    }

    console.log(`🎮 Ending game session: ${currentSession}`)
    setGameEnded(true)
    setGameState('gameOver')

    // Clear the session
    gameSessionRef.current = null

    if (gameInterval) {
      clearInterval(gameInterval)
      setGameInterval(null)
    }

    // Calculate final XP based on current game state
    // Use the actual XP earned from clicks, with a minimum of 10 XP for playing
    const finalXP = Math.max(xpEarned, 10)
    console.log(`🎮 Game ended - Final XP: ${finalXP} (from ${xpEarned} earned, minimum 10)`)
    console.log(`🎮 Game stats - Score: ${score}, Clicks: ${clicks}, XP Earned: ${xpEarned}`)

    // CRITICAL: Always save XP to backend when game ends, regardless of amount
    if (publicKey && !xpSaved && !xpSaveInProgress.current) {
      console.log(`🎮 Game ended - Saving ${finalXP} XP to backend for ${publicKey.toString()}`)
      saveXPToBackend(finalXP)
    } else if (!publicKey) {
      console.error('❌ Cannot save XP - wallet not connected')
    } else {
      console.log('💎 XP already saved or save in progress, skipping duplicate save in endGame')
    }

    // Check if quest should be completed (target: 1500 points)
    if (score >= 1500 && !questCompleted) {
      console.log(`🎮 Score ${score} meets quest requirement (1500+), checking for mini-game quest...`)
      checkAndCompleteMinigameQuest(score)
    }
  }, [gameInterval, score, questCompleted, xpEarned, publicKey, gameEnded, xpSaved])

  const saveXPToBackend = async (xpAmount: number) => {
    if (!publicKey) {
      console.error('❌ Cannot save XP - wallet not connected')
      return
    }

    const now = Date.now()
    const timeSinceLastSave = now - lastXPSaveTime.current
    const MIN_SAVE_INTERVAL = 5000 // 5 seconds minimum between saves

    // Prevent duplicate XP saves using multiple checks
    if (xpSaved || xpSaveInProgress.current) {
      console.log('💎 XP already saved or save in progress, skipping duplicate save')
      return
    }

    // Time-based protection against rapid saves
    if (timeSinceLastSave < MIN_SAVE_INTERVAL) {
      console.log(`💎 XP save blocked - only ${timeSinceLastSave}ms since last save (minimum: ${MIN_SAVE_INTERVAL}ms)`)
      return
    }

    // Ensure minimum XP reward (at least 10 XP for playing)
    const finalXPAmount = Math.max(xpAmount, 10)

    console.log(`💎 Saving ${finalXPAmount} XP to backend for wallet: ${publicKey.toString()}`)
    setXpSaved(true)
    xpSaveInProgress.current = true
    lastXPSaveTime.current = now

    try {
      // Save XP to backend
      const xpResponse = await fetch('/api/xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          xpAmount: finalXPAmount,
          source: 'mini-game',
          details: {
            gameScore: score,
            clicks: clicks,
            timeSpent: 20 - timeLeft,
            completedAt: Date.now(),
            originalXP: xpAmount,
            adjustedXP: finalXPAmount
          }
        })
      })

      const result = await xpResponse.json()
      console.log('🎮 XP API Response:', result)

      if (result.success) {
        // Session completion is not required for XP awarding
        // The XP has been successfully saved to the backend

        setTotalXpEarned(prev => prev + finalXPAmount)

        toast({
          title: "🎮 XP Rewarded!",
          description: `You earned ${finalXPAmount} XP from the mini-game! XP has been added to your account.`,
        })

        console.log(`✅ Successfully awarded ${finalXPAmount} XP to ${publicKey.toString()}`)
      } else {
        throw new Error(result.error || 'Failed to save XP')
      }
    } catch (error) {
      console.error('❌ XP save error:', error)
      setXpSaved(false) // Reset flag on error so user can try again
      xpSaveInProgress.current = false // Reset ref on error
      toast({
        title: "Error",
        description: `Failed to save XP: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      })
    } finally {
      xpSaveInProgress.current = false // Always reset ref when done
    }
  }

  const checkAndCompleteMinigameQuest = async (finalScore: number) => {
    if (!publicKey) return

    try {
      console.log(`🎮 Checking for mini-game quest completion with score: ${finalScore}`)

      // Get all active quests to find mini-game quest
      const questsResponse = await fetch(`/api/quests?action=get-quests`)
      const questsResult = await questsResponse.json()

      if (!questsResult.success) {
        console.error('Failed to fetch quests:', questsResult.error)
        return
      }

      // Find mini-game quest
      const minigameQuest = questsResult.data.find((quest: any) =>
        quest.requirements?.type === 'play_minigame'
      )

      if (!minigameQuest) {
        console.log('🎮 No mini-game quest found')
        return
      }

      console.log('🎮 Found mini-game quest:', minigameQuest)

      // Check current quest progress
      const progressResponse = await fetch(`/api/quests?wallet=${publicKey.toString()}&action=get-user-progress`)
      const progressResult = await progressResponse.json()

      let currentProgress = null
      if (progressResult.success) {
        currentProgress = progressResult.data.find((progress: any) =>
          progress.questId === minigameQuest.id
        )

        if (currentProgress && (currentProgress.status === 'completed' || currentProgress.status === 'claimed')) {
          console.log('🎮 Mini-game quest already completed')
          return
        }
      }

      // Always update quest progress to track the latest game attempt
      const targetScore = minigameQuest.requirements?.count || 1500
      const progressIncrement = finalScore >= targetScore ? 1 : 0

      console.log(`🎮 Updating quest progress: score=${finalScore}, target=${targetScore}, increment=${progressIncrement}`)

      // Update quest progress
      const response = await fetch('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          questId: minigameQuest.id,
          action: 'update-progress',
          progressIncrement: progressIncrement,
          verificationData: {
            gameScore: finalScore,
            targetScore: targetScore,
            completedAt: Date.now(),
            verified: true,
            bestScore: Math.max(finalScore, currentProgress?.verificationData?.bestScore || 0)
          }
        })
      })

      const result = await response.json()
      console.log('🎮 Quest progress update response:', result)

      if (result.success) {
        if (progressIncrement > 0) {
          setQuestCompleted(true)
          toast({
            title: "🎉 Quest Completed!",
            description: `Mini-game quest completed with ${finalScore} points! You earned ${minigameQuest.reward?.xp || 200} XP!`,
          })

          // Clear the pending quest ID since it's completed
          localStorage.removeItem('pendingQuestId')
        } else {
          toast({
            title: "🎮 Game Complete!",
            description: `Score: ${finalScore}/${targetScore}. Keep trying to reach the target score!`,
          })
        }
      } else {
        console.error('Quest progress update failed:', result.error)
      }
    } catch (error) {
      console.error('Quest completion error:', error)
    }
  }

  const handleClick = () => {
    if (gameState !== 'playing') return
    if (xpEarned >= 250) return // Prevent clicking when XP limit reached

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

      // End game immediately when XP reaches 250
      if (newXP >= 250) {
        console.log(`🎮 XP limit reached (${newXP}/250) - ending game immediately`)
        setTimeout(() => endGame(), 100) // Small delay to ensure state updates
      }
    }
  }





  if (!connected) {
    return (
      <ProtectedRoute requiresNFT={true}>
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
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiresNFT={true}>
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
              <p className="text-yellow-300 text-sm">🎮 Play as many times as you want!</p>
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
                      <Button
                        onClick={startGame}
                        size="lg"
                        className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold"
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Start Game
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {gameState === 'playing' && (
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardContent className="p-8 text-center">
                      <Button
                        onClick={handleClick}
                        size="lg"
                        disabled={xpEarned >= 250}
                        className={`w-48 h-48 rounded-full font-bold text-2xl transform transition-transform ${
                          xpEarned >= 250
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white cursor-not-allowed'
                            : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white hover:scale-105'
                        }`}
                      >
                        {xpEarned >= 250 ? 'MAX XP!' : 'CLICK ME!'}
                      </Button>
                      <p className="text-gray-300 mt-4">
                        {xpEarned >= 250 ? 'Maximum XP reached! Game ending...' : 'Keep clicking to score points and earn XP!'}
                      </p>
                      <p className={`text-sm ${xpEarned >= 250 ? 'text-yellow-400' : 'text-cyan-400'}`}>
                        XP: {xpEarned}/250
                      </p>

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
                          🌟 XP Rewarded: {Math.max(xpEarned, 10)}
                        </div>
                        <div className="text-cyan-300 text-sm">
                          XP has been automatically added to your account!
                        </div>
                        <div className="text-cyan-400 text-xs mt-2">
                          Max XP: 250 per game • Play unlimited times!
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



                      {/* Navigation buttons */}
                      <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                        <Button
                          onClick={() => {
                            // Reset game state for restart
                            setGameState('menu')
                            setScore(0)
                            setClicks(0)
                            setXpEarned(0)
                            setQuestCompleted(false)
                            setTimeLeft(20)
                            setGameEnded(false)
                            setXpSaved(false)
                            // Clear any existing intervals
                            if (gameInterval) {
                              clearInterval(gameInterval)
                              setGameInterval(null)
                            }
                            // Generate new game session
                            gameSessionRef.current = `game_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
                          }}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Restart Game
                        </Button>
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
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {gameState === 'gameOver' && (
                  <Button
                    onClick={() => {
                      // Reset game state for restart
                      setGameState('menu')
                      setScore(0)
                      setClicks(0)
                      setXpEarned(0)
                      setQuestCompleted(false)
                      setTimeLeft(20)
                      setGameEnded(false)
                      setXpSaved(false)
                      // Clear any existing intervals
                      if (gameInterval) {
                        clearInterval(gameInterval)
                        setGameInterval(null)
                      }
                      // Generate new game session
                      gameSessionRef.current = `game_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
                    }}
                    variant="outline"
                    className="border-purple-600 text-purple-400 hover:bg-purple-700 hover:text-white"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Restart Game
                  </Button>
                )}
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
      </div>
    </ProtectedRoute>
  )
}
