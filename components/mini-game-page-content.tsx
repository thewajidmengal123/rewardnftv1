"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWallet } from "@/contexts/wallet-context"
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { Gamepad2, Trophy, Star, Zap, Play, RotateCcw } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export function MiniGamePageContent() {
  const { connected, publicKey } = useWallet()
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameOver'>('menu')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(20)
  const [clicks, setClicks] = useState(0)
  const [gameInterval, setGameInterval] = useState<NodeJS.Timeout | null>(null)
  const [questCompleted, setQuestCompleted] = useState(false)

  // Check for pending quest on component mount
  useEffect(() => {
    const pendingQuestId = localStorage.getItem('pendingQuestId')
    if (pendingQuestId) {
      toast({
        title: "Quest Active!",
        description: "Score 1500+ points in 20 seconds to complete the mini-game quest!",
      })
    }
  }, [])

  const startGame = () => {
    setGameState('playing')
    setScore(0)
    setClicks(0)
    setTimeLeft(20) // Reduced from 30 to 20 seconds
    setQuestCompleted(false)

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

  const endGame = useCallback(() => {
    setGameState('gameOver')
    if (gameInterval) {
      clearInterval(gameInterval)
      setGameInterval(null)
    }

    // Check if quest should be completed (increased target to 1500)
    const pendingQuestId = localStorage.getItem('pendingQuestId')
    if (pendingQuestId && score >= 1500 && !questCompleted) {
      completeQuest(pendingQuestId, score)
    }
  }, [gameInterval, score, questCompleted])

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
          description: `Mini-game quest completed with ${finalScore} points! You earned 150 XP!`,
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
  }

  const resetGame = () => {
    setGameState('menu')
    setScore(0)
    setClicks(0)
    setTimeLeft(20) // Updated to match new game time
    setQuestCompleted(false)
    if (gameInterval) {
      clearInterval(gameInterval)
      setGameInterval(null)
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
              <p className="text-gray-300">Click as fast as you can to score points! Get 1500+ points in 20 seconds to complete the quest!</p>
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
                        className="w-48 h-48 rounded-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold text-2xl transform hover:scale-105 transition-transform"
                      >
                        CLICK ME!
                      </Button>
                      <p className="text-gray-300 mt-4">Keep clicking to score points!</p>
                    </CardContent>
                  </Card>
                )}

                {gameState === 'gameOver' && (
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white text-center">Game Over!</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                      <div className="text-3xl font-bold text-yellow-400">Final Score: {score}</div>
                      <div className="text-lg text-gray-300">Clicks: {clicks}</div>

                      {score >= 1500 ? (
                        <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                          <div className="text-green-400 font-bold">🎉 Excellent! Quest Target Reached!</div>
                          {questCompleted && (
                            <div className="text-green-300 text-sm mt-2">Quest completed! You earned 150 XP!</div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-orange-900/30 border border-orange-700 rounded-lg p-4">
                          <div className="text-orange-400">Need {1500 - score} more points for quest completion</div>
                        </div>
                      )}

                      <div className="flex gap-4 justify-center">
                        <Button
                          onClick={startGame}
                          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Play Again
                        </Button>
                        <Button
                          onClick={resetGame}
                          variant="outline"
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Back to Menu
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
