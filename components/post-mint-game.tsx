"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

interface GameCharacter {
  x: number
  y: number
  width: number
  height: number
  jumping: boolean
  jumpHeight: number
  velocity: number
}

interface GameObstacle {
  x: number
  y: number
  width: number
  height: number
  speed: number
}

export function PostMintGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)

  // Game state refs to avoid closure issues in animation loop
  const gameStartedRef = useRef(false)
  const gameOverRef = useRef(false)
  const scoreRef = useRef(0)
  const characterRef = useRef<GameCharacter>({
    x: 50,
    y: 0,
    width: 30,
    height: 30,
    jumping: false,
    jumpHeight: 10,
    velocity: 0,
  })
  const obstaclesRef = useRef<GameObstacle[]>([])
  const animationFrameRef = useRef<number>(0)

  // Update refs when state changes
  useEffect(() => {
    gameStartedRef.current = gameStarted
    gameOverRef.current = gameOver
    scoreRef.current = score
  }, [gameStarted, gameOver, score])

  // Initialize game
  useEffect(() => {
    // Load high score from localStorage
    const savedHighScore = localStorage.getItem("post_mint_game_high_score")
    if (savedHighScore) {
      setHighScore(Number.parseInt(savedHighScore))
    }

    // Set up keyboard event listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        if (!gameStartedRef.current) {
          startGame()
        } else if (!gameOverRef.current && !characterRef.current.jumping) {
          jump()
        } else if (gameOverRef.current) {
          restartGame()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  const startGame = () => {
    if (gameStarted) return

    setGameStarted(true)
    setGameOver(false)
    setScore(0)
    scoreRef.current = 0
    gameStartedRef.current = true
    gameOverRef.current = false

    // Reset character position
    characterRef.current = {
      x: 50,
      y: 0,
      width: 30,
      height: 30,
      jumping: false,
      jumpHeight: 10,
      velocity: 0,
    }

    // Clear obstacles
    obstaclesRef.current = []

    // Start game loop
    gameLoop()
  }

  const restartGame = () => {
    setGameOver(false)
    setScore(0)
    scoreRef.current = 0
    gameOverRef.current = false

    // Reset character position
    characterRef.current = {
      x: 50,
      y: 0,
      width: 30,
      height: 30,
      jumping: false,
      jumpHeight: 10,
      velocity: 0,
    }

    // Clear obstacles
    obstaclesRef.current = []

    // Start game loop
    gameLoop()
  }

  const jump = () => {
    if (characterRef.current.jumping) return
    characterRef.current.jumping = true
    characterRef.current.velocity = -characterRef.current.jumpHeight
  }

  const gameLoop = () => {
    if (!gameStartedRef.current || gameOverRef.current) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Update character position
    const character = characterRef.current
    const groundY = canvas.height - character.height

    // Apply gravity
    if (character.jumping) {
      character.y += character.velocity
      character.velocity += 0.5 // Gravity

      // Check if character has landed
      if (character.y >= groundY) {
        character.y = groundY
        character.jumping = false
        character.velocity = 0
      }
    } else {
      character.y = groundY
    }

    // Generate obstacles
    if (Math.random() < 0.02) {
      obstaclesRef.current.push({
        x: canvas.width,
        y: groundY,
        width: 20,
        height: 40,
        speed: 5 + Math.floor(scoreRef.current / 500),
      })
    }

    // Update and draw obstacles
    const obstacles = obstaclesRef.current
    for (let i = 0; i < obstacles.length; i++) {
      const obstacle = obstacles[i]
      obstacle.x -= obstacle.speed

      // Check collision
      if (
        character.x < obstacle.x + obstacle.width &&
        character.x + character.width > obstacle.x &&
        character.y < obstacle.y + obstacle.height &&
        character.y + character.height > obstacle.y
      ) {
        endGame()
        return
      }

      // Remove obstacles that are off screen
      if (obstacle.x + obstacle.width < 0) {
        obstacles.splice(i, 1)
        i--
        // Increment score
        scoreRef.current += 10
        setScore(scoreRef.current)
      }

      // Draw obstacle
      ctx.fillStyle = "#FF5555"
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height)
    }

    // Draw character
    ctx.fillStyle = "#00FFE0"
    ctx.fillRect(character.x, character.y, character.width, character.height)

    // Draw ground
    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, canvas.height - 1, canvas.width, 1)

    // Draw score
    ctx.fillStyle = "#FFFFFF"
    ctx.font = "16px Arial"
    ctx.fillText(`Score: ${scoreRef.current}`, 10, 20)

    // Continue game loop
    animationFrameRef.current = requestAnimationFrame(gameLoop)
  }

  const endGame = () => {
    gameOverRef.current = true
    setGameOver(true)

    // Update high score if needed
    if (scoreRef.current > highScore) {
      setHighScore(scoreRef.current)
      localStorage.setItem("post_mint_game_high_score", scoreRef.current.toString())

      // Show toast for new high score
      toast({
        title: "New High Score!",
        description: `You've set a new record: ${scoreRef.current} points!`,
      })
    }

    cancelAnimationFrame(animationFrameRef.current)
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-white">Post-Mint Runner Game</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative bg-black/30 rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              width={600}
              height={200}
              className="w-full h-[200px]"
              onClick={() => {
                if (!gameStarted) {
                  startGame()
                } else if (gameOver) {
                  restartGame()
                } else {
                  jump()
                }
              }}
            />

            {!gameStarted && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                <p className="text-white text-xl font-bold mb-4">Post-Mint Runner</p>
                <Button onClick={startGame}>Start Game</Button>
                <p className="text-white/60 text-sm mt-2">Press Space or click to jump</p>
              </div>
            )}

            {gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                <p className="text-white text-xl font-bold mb-2">Game Over</p>
                <p className="text-white text-lg mb-4">Score: {score}</p>
                <Button onClick={restartGame}>Play Again</Button>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            <div>
              <p className="text-white/60 text-sm">Current Score</p>
              <p className="text-2xl font-bold text-white">{score}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm">High Score</p>
              <p className="text-2xl font-bold text-white">{highScore}</p>
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-3 text-sm text-white/70">
            <p className="font-medium text-white mb-1">How to Play</p>
            <ul className="space-y-1 pl-5 list-disc text-xs">
              <li>Press Space, Up Arrow, or click/tap to jump</li>
              <li>Avoid the obstacles to earn points</li>
              <li>Each obstacle passed gives you 10 points</li>
              <li>Game gets faster as your score increases</li>
              <li>Your high score is saved automatically</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
