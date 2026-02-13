"use client"

import { useState, useEffect, useCallback, useRef, Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWallet } from "@/contexts/wallet-context"
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { ProtectedRoute } from "@/components/protected-route"
import { Trophy, Star, Play, RotateCcw, Run, MousePointer, Clock } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import dynamic from "next/dynamic"

// Dynamic imports to avoid SSR issues
const motion = dynamic(() => import("framer-motion").then(mod => mod.motion), { ssr: false })
const AnimatePresence = dynamic(() => import("framer-motion").then(mod => mod.AnimatePresence), { ssr: false })

// ============================================
// MERGED REWARD NFT GAME - CLICK + RUNNER
// ============================================

type GameType = 'click' | 'runner' | null;

// ============================================
// RUNNER GAME CONSTANTS & TYPES
// ============================================
const GAME_WIDTH = 800
const GAME_HEIGHT = 400
const GROUND_Y = 320
const GRAVITY = 0.8
const JUMP_FORCE = -15
const BASE_SPEED = 5
const MAX_SPEED = 15

interface RunnerObstacle {
  id: number
  x: number
  y: number
  width: number
  height: number
  type: 'cactus' | 'rock' | 'spike' | 'bird'
}

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}

interface RunnerGameState {
  isPlaying: boolean
  isGameOver: boolean
  score: number
  speed: number
  distance: number
  level: number
  timeOfDay: 'day' | 'evening' | 'night'
  timeCycle: number
}

// ============================================
// MAIN COMPONENT
// ============================================
export function MiniGamePageContent() {
  const { connected, publicKey } = useWallet()
  
  // Game Selection State
  const [selectedGame, setSelectedGame] = useState<GameType>(null)
  const [mounted, setMounted] = useState(false)
  
  // ============================================
  // CLICK GAME STATE (EXISTING - UNCHANGED)
  // ============================================
  const [clickGameState, setClickGameState] = useState<'menu' | 'playing' | 'gameOver'>('menu')
  const [clickScore, setClickScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(20)
  const [clicks, setClicks] = useState(0)
  const [clickGameInterval, setClickGameInterval] = useState<NodeJS.Timeout | null>(null)
  const [questCompleted, setQuestCompleted] = useState(false)
  const [xpEarned, setXpEarned] = useState(0)
  const [totalXpEarned, setTotalXpEarned] = useState(0)
  const [gameEnded, setGameEnded] = useState(false)
  const [xpSaved, setXpSaved] = useState(false)
  const [pendingQuestId, setPendingQuestId] = useState<string | null>(null)
  
  const clickGameSessionRef = useRef<string | null>(null)
  const lastXPSaveTime = useRef<number>(0)
  const xpSaveInProgress = useRef(false)

  // ============================================
  // RUNNER GAME STATE (NEW)
  // ============================================
  const [runnerGameState, setRunnerGameState] = useState<RunnerGameState>({
    isPlaying: false,
    isGameOver: false,
    score: 0,
    speed: BASE_SPEED,
    distance: 0,
    level: 1,
    timeOfDay: 'day',
    timeCycle: 0,
  })
  
  const [runnerY, setRunnerY] = useState(GROUND_Y - 60)
  const [runnerVy, setRunnerVy] = useState(0)
  const [isJumping, setIsJumping] = useState(false)
  const [runnerFrame, setRunnerFrame] = useState(0)
  const [obstacles, setObstacles] = useState<RunnerObstacle[]>([])
  const [particles, setParticles] = useState<Particle[]>([])
  
  const obstacleIdRef = useRef(0)
  const particleIdRef = useRef(0)
  const runnerCanvasRef = useRef<HTMLCanvasElement>(null)
  const runnerGameLoopRef = useRef<number>()
  const characterImageRef = useRef<HTMLImageElement | null>(null)

  // ============================================
  // MOUNT EFFECT
  // ============================================
  useEffect(() => {
    setMounted(true)
    
    // Load character image
    if (typeof window !== 'undefined') {
      const img = new Image()
      img.src = '/images/character.png'
      img.onload = () => {
        characterImageRef.current = img
      }
      img.onerror = () => {
        console.warn('Character image failed to load, using fallback')
      }
      
      // Check localStorage safely
      try {
        const pending = localStorage.getItem('pendingQuestId')
        if (pending) {
          setPendingQuestId(pending)
          toast({
            title: "Quest Active!",
            description: "Score 1500+ points to complete the mini-game quest!",
          })
        }
        
        const savedXp = localStorage.getItem('runnerTotalXp')
        if (savedXp) setTotalXpEarned(parseInt(savedXp))
      } catch (e) {
        console.error('localStorage access error:', e)
      }
    }
    
    return () => {
      if (clickGameInterval) clearInterval(clickGameInterval)
      if (runnerGameLoopRef.current) clearInterval(runnerGameLoopRef.current)
    }
  }, [])

  // ============================================
  // CLICK GAME LOGIC (EXISTING - UNCHANGED)
  // ============================================
  const startClickGame = useCallback(() => {
    if (clickGameInterval) clearInterval(clickGameInterval)

    const sessionId = `click-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    clickGameSessionRef.current = sessionId

    setClickGameState('playing')
    setClickScore(0)
    setClicks(0)
    setTimeLeft(20)
    setQuestCompleted(false)
    setXpEarned(0)
    setGameEnded(false)
    setXpSaved(false)
    xpSaveInProgress.current = false
    lastXPSaveTime.current = 0

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (clickGameSessionRef.current === sessionId) {
            clearInterval(interval)
            setClickGameInterval(null)
            setTimeout(() => endClickGame(), 100)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    setClickGameInterval(interval)
  }, [clickGameInterval])

  const endClickGame = useCallback(() => {
    if (gameEnded) return
    
    setGameEnded(true)
    setClickGameState('gameOver')
    clickGameSessionRef.current = null

    if (clickGameInterval) {
      clearInterval(clickGameInterval)
      setClickGameInterval(null)
    }

    const finalXP = Math.max(xpEarned, 10)
    
    if (publicKey && !xpSaved && !xpSaveInProgress.current) {
      saveXPToBackend(finalXP, 'click-game', clickScore, clicks)
    }

    if (clickScore >= 1500 && !questCompleted) {
      checkAndCompleteMinigameQuest(clickScore)
    }
  }, [clickGameInterval, clickScore, questCompleted, xpEarned, publicKey, gameEnded, xpSaved, clicks])

  const saveXPToBackend = async (xpAmount: number, source: string, score: number, clicks: number) => {
    if (!publicKey) return

    const now = Date.now()
    const timeSinceLastSave = now - lastXPSaveTime.current
    const MIN_SAVE_INTERVAL = 5000

    if (xpSaved || xpSaveInProgress.current) return
    if (timeSinceLastSave < MIN_SAVE_INTERVAL) return

    const finalXPAmount = Math.max(xpAmount, 10)

    setXpSaved(true)
    xpSaveInProgress.current = true
    lastXPSaveTime.current = now

    try {
      const xpResponse = await fetch('/api/xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          xpAmount: finalXPAmount,
          source: source,
          details: {
            gameScore: score,
            clicks: clicks,
            completedAt: Date.now(),
            originalXP: xpAmount,
            adjustedXP: finalXPAmount
          }
        })
      })

      const result = await xpResponse.json()

      if (result.success) {
        setTotalXpEarned(prev => {
          const newTotal = prev + finalXPAmount
          try {
            localStorage.setItem('runnerTotalXp', newTotal.toString())
          } catch (e) {}
          return newTotal
        })
        
        toast({
          title: "🎮 XP Rewarded!",
          description: `You earned ${finalXPAmount} XP!`,
        })
      } else {
        throw new Error(result.error || 'Failed to save XP')
      }
    } catch (error) {
      console.error('XP save error:', error)
      setXpSaved(false)
      xpSaveInProgress.current = false
      toast({
        title: "Error",
        description: `Failed to save XP`,
        variant: "destructive"
      })
    } finally {
      xpSaveInProgress.current = false
    }
  }

  const checkAndCompleteMinigameQuest = async (finalScore: number) => {
    if (!publicKey) return

    try {
      const questsResponse = await fetch(`/api/quests?action=get-quests`)
      const questsResult = await questsResponse.json()

      if (!questsResult.success) return

      const minigameQuest = questsResult.data.find((quest: any) =>
        quest.requirements?.type === 'play_minigame'
      )

      if (!minigameQuest) return

      const progressResponse = await fetch(`/api/quests?wallet=${publicKey.toString()}&action=get-user-progress`)
      const progressResult = await progressResponse.json()

      let currentProgress = null
      if (progressResult.success) {
        currentProgress = progressResult.data.find((progress: any) =>
          progress.questId === minigameQuest.id
        )

        if (currentProgress && (currentProgress.status === 'completed' || currentProgress.status === 'claimed')) {
          return
        }
      }

      const targetScore = minigameQuest.requirements?.count || 1500
      const progressIncrement = finalScore >= targetScore ? 1 : 0

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

      if (result.success && progressIncrement > 0) {
        setQuestCompleted(true)
        toast({
          title: "🎉 Quest Completed!",
          description: `Mini-game quest completed with ${finalScore} points!`,
        })
        try {
          localStorage.removeItem('pendingQuestId')
        } catch (e) {}
      }
    } catch (error) {
      console.error('Quest completion error:', error)
    }
  }

  const handleClickGameClick = () => {
    if (clickGameState !== 'playing') return
    if (xpEarned >= 250) return

    const basePoints = Math.floor(Math.random() * 21) + 5
    const timeMultiplier = timeLeft > 15 ? 1.5 : timeLeft > 10 ? 1.2 : 1.0
    
    const now = Date.now()
    let lastClickTime = 0
    try {
      lastClickTime = parseInt(localStorage.getItem('lastClickTime') || '0')
    } catch (e) {}
    
    let speedBonus = 1.0
    if (lastClickTime && now - lastClickTime < 500) {
      speedBonus = 1.3
    }

    try {
      localStorage.setItem('lastClickTime', now.toString())
    } catch (e) {}

    const finalPoints = Math.floor(basePoints * timeMultiplier * speedBonus)
    setClickScore(prev => prev + finalPoints)
    setClicks(prev => {
      const newClicks = prev + 1
      
      // Calculate XP based on clicks
      setXpEarned(currentXP => {
        if (currentXP >= 250) return currentXP
        
        let xpToAward = 0
        if (newClicks < 50) xpToAward = 3
        else if (newClicks < 100) xpToAward = 2
        else xpToAward = 1

        const newXP = Math.min(currentXP + xpToAward, 250)
        
        if (newXP >= 250) {
          setTimeout(() => endClickGame(), 100)
        }
        
        return newXP
      })
      
      return newClicks
    })
  }

  // ============================================
  // RUNNER GAME LOGIC (NEW)
  // ============================================
  
  useEffect(() => {
    if (!runnerGameState.isPlaying) return
    
    const cycleInterval = setInterval(() => {
      setRunnerGameState(prev => {
        const newCycle = (prev.timeCycle + 0.5) % 100
        let newTimeOfDay: 'day' | 'evening' | 'night' = 'day'
        
        if (newCycle < 40) newTimeOfDay = 'day'
        else if (newCycle < 70) newTimeOfDay = 'evening'
        else newTimeOfDay = 'night'
        
        return {
          ...prev,
          timeCycle: newCycle,
          timeOfDay: newTimeOfDay
        }
      })
    }, 1000)
    
    return () => clearInterval(cycleInterval)
  }, [runnerGameState.isPlaying])

  const getTimeOfDayColors = () => {
    switch (runnerGameState.timeOfDay) {
      case 'day':
        return {
          skyTop: '#87CEEB',
          skyBottom: '#E0F6FF',
          ground: '#2d2d44',
          sun: '#FFD700',
          obstacle: '#4ade80'
        }
      case 'evening':
        return {
          skyTop: '#FF6B35',
          skyBottom: '#F7931E',
          ground: '#3d2d44',
          sun: '#FF4500',
          obstacle: '#fb923c'
        }
      case 'night':
        return {
          skyTop: '#0f0f1a',
          skyBottom: '#1a1a2e',
          ground: '#1a1a2e',
          sun: '#F0E68C',
          obstacle: '#a855f7'
        }
    }
  }

  const runnerJump = useCallback(() => {
    if (!runnerGameState.isPlaying || runnerGameState.isGameOver) return
    if (!isJumping) {
      setRunnerVy(JUMP_FORCE)
      setIsJumping(true)
      createJumpParticles()
    }
  }, [runnerGameState.isPlaying, runnerGameState.isGameOver, isJumping])

  const createJumpParticles = () => {
    const newParticles: Particle[] = []
    for (let i = 0; i < 8; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x: 100 + 25,
        y: GROUND_Y,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 5 - 2,
        life: 30,
        color: ['#a855f7', '#3b82f6', '#ec4899'][Math.floor(Math.random() * 3)],
      })
    }
    setParticles(prev => [...prev, ...newParticles])
  }

  const createCollisionParticles = (x: number, y: number) => {
    const newParticles: Particle[] = []
    for (let i = 0; i < 15; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x,
        y,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        life: 40,
        color: ['#ef4444', '#f97316', '#eab308'][Math.floor(Math.random() * 3)],
      })
    }
    setParticles(prev => [...prev, ...newParticles])
  }

  const startRunnerGame = () => {
    setRunnerGameState({
      isPlaying: true,
      isGameOver: false,
      score: 0,
      speed: BASE_SPEED,
      distance: 0,
      level: 1,
      timeOfDay: 'day',
      timeCycle: 0,
    })
    setRunnerY(GROUND_Y - 60)
    setRunnerVy(0)
    setIsJumping(false)
    setObstacles([])
    setParticles([])
    obstacleIdRef.current = 0
    setXpEarned(0)
    setGameEnded(false)
    setXpSaved(false)
  }

  const endRunnerGame = useCallback(() => {
    if (gameEnded) return
    
    setGameEnded(true)
    setRunnerGameState(prev => ({ ...prev, isPlaying: false, isGameOver: true }))
    
    const earnedXp = Math.min(runnerGameState.score, 250)
    setXpEarned(earnedXp)
    
    if (publicKey && !xpSaved && !xpSaveInProgress.current) {
      saveXPToBackend(earnedXp, 'runner-game', runnerGameState.score, 0)
    }

    if (runnerGameState.score >= 1500 && !questCompleted) {
      checkAndCompleteMinigameQuest(runnerGameState.score)
    }

    // Simple confetti without canvas-confetti
    if (runnerGameState.score >= 500 && typeof window !== 'undefined') {
      createSimpleConfetti()
    }
  }, [runnerGameState.score, questCompleted, publicKey, gameEnded, xpSaved])

  const createSimpleConfetti = () => {
    const colors = ['#a855f7', '#3b82f6', '#ec4899', '#10b981', '#f59e0b']
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        const div = document.createElement('div')
        div.style.position = 'fixed'
        div.style.left = Math.random() * 100 + 'vw'
        div.style.top = '-10px'
        div.style.width = '10px'
        div.style.height = '10px'
        div.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
        div.style.borderRadius = '50%'
        div.style.pointerEvents = 'none'
        div.style.zIndex = '9999'
        div.style.transition = 'all 3s ease-out'
        document.body.appendChild(div)
        
        setTimeout(() => {
          div.style.transform = `translateY(${window.innerHeight}px) rotate(${Math.random() * 360}deg)`
          div.style.opacity = '0'
        }, 10)
        
        setTimeout(() => div.remove(), 3000)
      }, i * 20)
    }
  }

  const checkRunnerCollision = useCallback(() => {
    const runnerRect = {
      x: 100 + 10,
      y: runnerY + 10,
      width: 50 - 20,
      height: 60 - 20,
    }

    for (const obstacle of obstacles) {
      const obstacleRect = {
        x: obstacle.x + 5,
        y: obstacle.y + 5,
        width: obstacle.width - 10,
        height: obstacle.height - 10,
      }

      if (
        runnerRect.x < obstacleRect.x + obstacleRect.width &&
        runnerRect.x + runnerRect.width > obstacleRect.x &&
        runnerRect.y < obstacleRect.y + obstacleRect.height &&
        runnerRect.y + runnerRect.height > obstacleRect.y
      ) {
        createCollisionParticles(obstacle.x + obstacle.width / 2, obstacle.y)
        endRunnerGame()
        return true
      }
    }
    return false
  }, [obstacles, runnerY, endRunnerGame])

  useEffect(() => {
    if (!runnerGameState.isPlaying) return

    const gameLoop = () => {
      // Update runner physics
      setRunnerY(prev => {
        let newY = prev + runnerVy
        let newVy = runnerVy + GRAVITY
        
        if (newY >= GROUND_Y - 60) {
          newY = GROUND_Y - 60
          newVy = 0
          setIsJumping(false)
        }
        
        setRunnerVy(newVy)
        return newY
      })

      setRunnerFrame(prev => (prev + 1) % 8)

      // Update obstacles
      setObstacles(prev => {
        const newObstacles = prev
          .map(obs => ({ ...obs, x: obs.x - runnerGameState.speed }))
          .filter(obs => obs.x > -100)
        
        const lastObs = newObstacles[newObstacles.length - 1]
        const minGap = 250 + Math.random() * 200
        
        if (!lastObs || lastObs.x < GAME_WIDTH - minGap) {
          if (Math.random() < 0.02 + runnerGameState.speed * 0.001) {
            const types: RunnerObstacle['type'][] = ['cactus', 'rock', 'spike', 'bird']
            const type = types[Math.floor(Math.random() * types.length)]
            const isBird = type === 'bird'
            
            newObstacles.push({
              id: obstacleIdRef.current++,
              x: GAME_WIDTH + Math.random() * 100,
              y: isBird ? GROUND_Y - 100 - Math.random() * 50 : GROUND_Y - 40,
              width: isBird ? 40 : type === 'cactus' ? 30 : type === 'rock' ? 35 : 40,
              height: isBird ? 30 : type === 'cactus' ? 50 : type === 'rock' ? 40 : 30,
              type,
            })
          }
        }
        
        return newObstacles
      })

      // Update particles
      setParticles(prev => 
        prev
          .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - 1 }))
          .filter(p => p.life > 0)
      )

      // Update score, speed and level
      setRunnerGameState(prev => {
        const newDistance = prev.distance + prev.speed
        const newLevel = Math.floor(newDistance / 1000) + 1
        const newSpeed = Math.min(MAX_SPEED, BASE_SPEED + (newLevel - 1) * 0.5)
        
        return {
          ...prev,
          score: prev.score + 1,
          distance: newDistance,
          speed: newSpeed,
          level: newLevel
        }
      })

      checkRunnerCollision()
    }

    runnerGameLoopRef.current = window.setInterval(gameLoop, 1000 / 60)
    return () => {
      if (runnerGameLoopRef.current) clearInterval(runnerGameLoopRef.current)
    }
  }, [runnerGameState.isPlaying, runnerGameState.speed, runnerVy, checkRunnerCollision])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault()
        if (selectedGame === 'runner') runnerJump()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [runnerJump, selectedGame])

  // Draw runner background
  useEffect(() => {
    const canvas = runnerCanvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const colors = getTimeOfDayColors()

    // Draw sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT)
    gradient.addColorStop(0, colors.skyTop)
    gradient.addColorStop(1, colors.skyBottom)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    // Draw sun/moon
    const sunX = 700
    const sunY = runnerGameState.timeOfDay === 'night' ? 80 : 60
    ctx.fillStyle = colors.sun
    ctx.beginPath()
    ctx.arc(sunX, sunY, 30, 0, Math.PI * 2)
    ctx.fill()

    // Draw stars at night
    if (runnerGameState.timeOfDay === 'night') {
      ctx.fillStyle = '#ffffff'
      for (let i = 0; i < 50; i++) {
        const x = (i * 73 + runnerGameState.distance * 0.1) % GAME_WIDTH
        const y = (i * 37) % (GAME_HEIGHT / 2)
        const size = (i % 3) + 1
        ctx.globalAlpha = 0.3 + (i % 5) * 0.1
        ctx.fillRect(x, y, size, size)
      }
      ctx.globalAlpha = 1
    }

    // Draw ground
    const groundGradient = ctx.createLinearGradient(0, GROUND_Y, 0, GAME_HEIGHT)
    groundGradient.addColorStop(0, colors.ground)
    groundGradient.addColorStop(1, '#0f0f1a')
    ctx.fillStyle = groundGradient
    ctx.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y)

    // Draw ground line
    ctx.strokeStyle = runnerGameState.timeOfDay === 'day' ? '#4ade80' : '#a855f7'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, GROUND_Y)
    ctx.lineTo(GAME_WIDTH, GROUND_Y)
    ctx.stroke()

    // Draw moving ground details
    ctx.strokeStyle = runnerGameState.timeOfDay === 'day' ? '#22c55e' : '#3b82f6'
    ctx.lineWidth = 1
    for (let i = 0; i < 10; i++) {
      const x = ((i * 100 - runnerGameState.distance) % (GAME_WIDTH + 100)) - 50
      ctx.beginPath()
      ctx.moveTo(x, GROUND_Y + 10)
      ctx.lineTo(x + 30, GROUND_Y + 10)
      ctx.stroke()
    }
  }, [runnerGameState.distance, runnerGameState.timeOfDay])

  const renderRunnerObstacle = (obstacle: RunnerObstacle) => {
    const colors = getTimeOfDayColors()
    
    switch (obstacle.type) {
      case 'cactus':
        return (
          <div
            key={obstacle.id}
            className="absolute"
            style={{
              left: obstacle.x,
              top: obstacle.y,
              width: obstacle.width,
              height: obstacle.height,
            }}
          >
            <div className="relative w-full h-full">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-full bg-gradient-to-t from-green-600 to-green-400 rounded-full" />
              <div className="absolute bottom-4 -left-1 w-2 h-4 bg-gradient-to-r from-green-600 to-green-400 rounded-full rotate-[-30deg]" />
              <div className="absolute bottom-6 -right-1 w-2 h-4 bg-gradient-to-l from-green-600 to-green-400 rounded-full rotate-[30deg]" />
            </div>
          </div>
        )
      case 'rock':
        return (
          <div
            key={obstacle.id}
            className="absolute"
            style={{
              left: obstacle.x,
              top: obstacle.y,
              width: obstacle.width,
              height: obstacle.height,
            }}
          >
            <div className="w-full h-full bg-gradient-to-br from-gray-500 to-gray-700 rounded-lg transform rotate-3" />
          </div>
        )
      case 'spike':
        return (
          <div
            key={obstacle.id}
            className="absolute"
            style={{
              left: obstacle.x,
              top: obstacle.y,
              width: obstacle.width,
              height: obstacle.height,
            }}
          >
            <div className="w-full h-full relative">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="absolute bottom-0 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[30px] border-l-transparent border-r-transparent border-b-red-500"
                  style={{ left: i * 12 + 4 }}
                />
              ))}
            </div>
          </div>
        )
      case 'bird':
        return (
          <div
            key={obstacle.id}
            className="absolute"
            style={{
              left: obstacle.x,
              top: obstacle.y,
              width: obstacle.width,
              height: obstacle.height,
            }}
          >
            <div className="w-full h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full animate-pulse" />
          </div>
        )
    }
  }

  // ============================================
  // RENDER
  // ==========================================
  
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

  // Game Selection Screen
  if (!selectedGame) {
    return (
      <ProtectedRoute requiresNFT={true}>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 z-0" />
          
          <div className="relative z-10 container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-6xl font-bold mb-4">
                  <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 bg-clip-text text-transparent">
                    Choose Your Game
                  </span>
                </h1>
                <p className="text-gray-400 text-lg">Select a game mode to start earning XP!</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                <div
                  onClick={() => setSelectedGame('click')}
                  className="group cursor-pointer bg-gray-800/50 border-2 border-gray-700 hover:border-purple-500/50 rounded-2xl p-6 md:p-8 transition-all duration-300 hover:scale-105"
                >
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
                    <MousePointer className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2 text-center">Click Challenge</h2>
                  <p className="text-gray-400 mb-4 text-center">Click as fast as you can in 20 seconds!</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">Max 250 XP</span>
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">Target: 1500 pts</span>
                  </div>
                </div>

                <div
                  onClick={() => setSelectedGame('runner')}
                  className="group cursor-pointer bg-gray-800/50 border-2 border-gray-700 hover:border-green-500/50 rounded-2xl p-6 md:p-8 transition-all duration-300 hover:scale-105"
                >
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center">
                    <Run className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2 text-center">Endless Runner</h2>
                  <p className="text-gray-400 mb-4 text-center">Jump over obstacles & survive!</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">Max 250 XP</span>
                    <span className="px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-sm">Day/Night Cycle</span>
                  </div>
                </div>
              </div>

              <div className="text-center mt-12">
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
      </ProtectedRoute>
    )
  }

  // CLICK GAME RENDER
  if (selectedGame === 'click') {
    return (
      <ProtectedRoute requiresNFT={true}>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 z-0" />
          
          <div className="relative z-10 container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              
              <div className="text-center mb-8">
                <button onClick={() => setSelectedGame(null)} className="mb-4 text-gray-400 hover:text-white flex items-center gap-2 mx-auto">
                  ← Back to Games
                </button>
                <h1 className="text-4xl font-bold mb-4">
                  <span className="text-purple-400">Click</span>
                  <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent"> Challenge</span>
                </h1>
                <p className="text-gray-300">Click fast to score! Get 1500+ points for quest completion!</p>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-400" />
                        Game Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                        <span className="text-gray-400">Score</span>
                        <span className="text-2xl font-bold text-yellow-400">{clickScore}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                        <span className="text-gray-400">Time Left</span>
                        <span className="text-xl font-bold text-blue-400">{timeLeft}s</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                        <span className="text-gray-400">Clicks</span>
                        <span className="text-lg font-bold text-green-400">{clicks}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                        <span className="text-gray-400">XP Earned</span>
                        <span className="text-lg font-bold text-cyan-400">{xpEarned}/250</span>
                      </div>
                    </CardContent>
                  </Card>

                  {pendingQuestId && (
                    <Card className="bg-purple-900/30 border-purple-700">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-purple-300">
                          <Star className="w-5 h-5" />
                          <span>Quest Active: Score 1500+ points in 20 seconds!</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="space-y-4">
                  {clickGameState === 'menu' && (
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white text-center">Ready to Play?</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center space-y-4">
                        <p className="text-gray-300">Click the button as many times as you can in 20 seconds!</p>
                        <Button
                          onClick={startClickGame}
                          size="lg"
                          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold"
                        >
                          <Play className="w-5 h-5 mr-2" />
                          Start Game
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {clickGameState === 'playing' && (
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardContent className="p-8 text-center">
                        <button
                          onClick={handleClickGameClick}
                          disabled={xpEarned >= 250}
                          className={`w-48 h-48 rounded-full font-bold text-2xl transform transition-transform ${
                            xpEarned >= 250
                              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white cursor-not-allowed'
                              : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white hover:scale-105 active:scale-95'
                          }`}
                        >
                          {xpEarned >= 250 ? 'MAX XP!' : 'CLICK!'}
                        </button>
                        <p className="text-gray-300 mt-6">
                          {xpEarned >= 250 ? 'Maximum XP reached! Game ending...' : 'Keep clicking to score points and earn XP!'}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {clickGameState === 'gameOver' && (
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white text-center">🎮 Game Complete!</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center space-y-6">
                        <div className="text-3xl font-bold text-yellow-400">Final Score: {clickScore}</div>
                        
                        <div className="bg-cyan-900/30 border border-cyan-700 rounded-lg p-6">
                          <div className="text-2xl font-bold text-cyan-400 mb-2">
                            🌟 XP Rewarded: {Math.max(xpEarned, 10)}
                          </div>
                          <div className="text-cyan-300 text-sm">XP added to your account!</div>
                        </div>

                        {clickScore >= 1500 && (
                          <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                            <div className="text-green-400 font-bold">🎉 Quest Target Reached!</div>
                            {questCompleted && (
                              <div className="text-green-300 text-sm mt-2">✅ Quest completed! Bonus XP awarded!</div>
                            )}
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <Button
                            onClick={() => {
                              setClickGameState('menu')
                              setClickScore(0)
                              setClicks(0)
                              setXpEarned(0)
                              setQuestCompleted(false)
                              setTimeLeft(20)
                              setGameEnded(false)
                              setXpSaved(false)
                              if (clickGameInterval) {
                                clearInterval(clickGameInterval)
                                setClickGameInterval(null)
                              }
                            }}
                            className="bg-gradient-to-r from-purple-500 to-pink-500"
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Restart
                          </Button>
                          <Button
                            onClick={() => setSelectedGame(null)}
                            variant="outline"
                            className="border-gray-600"
                          >
                            Back to Games
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  // RUNNER GAME RENDER
  if (selectedGame === 'runner') {
    const colors = getTimeOfDayColors()
    
    return (
      <ProtectedRoute requiresNFT={true}>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-black to-teal-900/20 z-0" />
          
          <div className="relative z-10 container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
              
              <div className="text-center mb-8">
                <button onClick={() => setSelectedGame(null)} className="mb-4 text-gray-400 hover:text-white flex items-center gap-2 mx-auto">
                  ← Back to Games
                </button>
                <h1 className="text-4xl font-bold mb-4">
                  <span className="text-green-400">Endless</span>
                  <span className="bg-gradient-to-r from-green-400 via-teal-500 to-blue-500 bg-clip-text text-transparent"> Runner</span>
                </h1>
                <p className="text-gray-300">Jump over obstacles! Press SPACE or TAP to jump</p>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card className="bg-gray-800/50 border-gray-800 overflow-hidden">
                    <CardContent className="p-0">
                      <div 
                        className="relative mx-auto touch-none"
                        style={{ 
                          width: '100%', 
                          maxWidth: GAME_WIDTH,
                          aspectRatio: `${GAME_WIDTH}/${GAME_HEIGHT}`
                        }}
                        onClick={runnerJump}
                        onTouchStart={(e) => {
                          e.preventDefault()
                          runnerJump()
                        }}
                      >
                        <canvas
                          ref={runnerCanvasRef}
                          width={GAME_WIDTH}
                          height={GAME_HEIGHT}
                          className="absolute inset-0 w-full h-full"
                        />

                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                          {runnerGameState.isPlaying && !runnerGameState.isGameOver && (
                            <div
                              className="absolute"
                              style={{
                                left: 100,
                                top: runnerY,
                                width: 50,
                                height: 60,
                              }}
                            >
                              {characterImageRef.current ? (
                                <img 
                                  src="/images/character.png" 
                                  alt="Runner"
                                  className="w-full h-full object-contain"
                                  style={{
                                    filter: runnerGameState.timeOfDay === 'night' 
                                      ? 'brightness(0.7)' 
                                      : 'brightness(1)'
                                  }}
                                />
                              ) : (
                                <div className="relative w-full h-full animate-bounce">
                                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 bg-gradient-to-br from-green-400 to-teal-500 rounded-full" />
                                  <div className="absolute top-5 left-1/2 -translate-x-1/2 w-5 h-7 bg-gradient-to-b from-blue-500 to-green-600 rounded-lg" />
                                  <div className="absolute bottom-0 left-1 w-2 h-5 bg-gradient-to-b from-green-500 to-teal-500 rounded-full" />
                                  <div className="absolute bottom-0 right-1 w-2 h-5 bg-gradient-to-b from-green-500 to-teal-500 rounded-full" />
                                </div>
                              )}
                            </div>
                          )}

                          {obstacles.map(renderRunnerObstacle)}

                          {particles.map(particle => (
                            <div
                              key={particle.id}
                              className="absolute w-2 h-2 rounded-full pointer-events-none"
                              style={{
                                left: particle.x,
                                top: particle.y,
                                backgroundColor: particle.color,
                                opacity: particle.life / 40,
                              }}
                            />
                          ))}

                          {!runnerGameState.isPlaying && !runnerGameState.isGameOver && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-auto">
                              <div className="text-center">
                                <div className="text-6xl mb-4 animate-bounce">🏃</div>
                                <h2 className="text-3xl font-bold mb-2">Ready to Run?</h2>
                                <p className="text-gray-400 mb-6">Jump over obstacles and earn XP!</p>
                                <Button
                                  onClick={startRunnerGame}
                                  className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-8 py-6 text-lg"
                                >
                                  <Play className="w-5 h-5 mr-2" />
                                  Start Running
                                </Button>
                              </div>
                            </div>
                          )}

                          {runnerGameState.isGameOver && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/80 pointer-events-auto">
                              <div className="text-center">
                                <div className="text-6xl mb-4">💥</div>
                                <h2 className="text-4xl font-bold mb-2 text-red-400">Game Over!</h2>
                                <p className="text-2xl text-white mb-2">Score: {runnerGameState.score}</p>
                                <p className="text-lg text-green-400 mb-4">Level {runnerGameState.level}</p>
                                
                                <div className="bg-cyan-900/30 border border-cyan-700 rounded-lg p-4 mb-6">
                                  <div className="text-xl font-bold text-cyan-400">🌟 XP: {Math.min(runnerGameState.score, 250)}</div>
                                </div>

                                <div className="flex gap-3 justify-center">
                                  <Button
                                    onClick={startRunnerGame}
                                    className="bg-gradient-to-r from-green-600 to-teal-600"
                                  >
                                    <RotateCcw className="w-5 h-5 mr-2" />
                                    Play Again
                                  </Button>
                                  <Button
                                    onClick={() => setSelectedGame(null)}
                                    variant="outline"
                                    className="border-gray-600"
                                  >
                                    Back
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {runnerGameState.isPlaying && (
                          <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                            <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2">
                              <div className="text-sm text-gray-400">Score</div>
                              <div className="text-2xl font-bold text-white">{runnerGameState.score}</div>
                            </div>
                            
                            <div className="flex gap-2">
                              <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2">
                                <div className="text-sm text-gray-400">Level</div>
                                <div className="text-xl font-bold text-yellow-400">{runnerGameState.level}</div>
                              </div>
                              <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2">
                                <div className="text-sm text-gray-400">Time</div>
                                <div className={`text-xl font-bold capitalize ${
                                  runnerGameState.timeOfDay === 'day' ? 'text-yellow-400' :
                                  runnerGameState.timeOfDay === 'evening' ? 'text-orange-400' : 'text-blue-400'
                                }`}>
                                  {runnerGameState.timeOfDay}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="mt-4 text-center md:hidden">
                    <p className="text-gray-400 text-sm">Tap anywhere to jump</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Card className="bg-gray-800/50 border-gray-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-400" />
                        Runner Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                        <span className="text-gray-400">Current Score</span>
                        <span className="text-2xl font-bold text-yellow-400">{runnerGameState.score}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                        <span className="text-gray-400">Level</span>
                        <span className="text-2xl font-bold text-green-400">{runnerGameState.level}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                        <span className="text-gray-400">Speed</span>
                        <span className="text-2xl font-bold text-blue-400">
                          {runnerGameState.speed.toFixed(1)}x
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                        <span className="text-gray-400">XP Available</span>
                        <span className="text-2xl font-bold text-cyan-400">
                          {Math.min(runnerGameState.score, 250)}/250
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800/50 border-gray-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-400" />
                        Time Cycle
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="absolute h-full transition-all duration-1000"
                          style={{
                            width: `${runnerGameState.timeCycle}%`,
                            background: runnerGameState.timeOfDay === 'day' 
                              ? 'linear-gradient(to right, #FFD700, #FFA500)'
                              : runnerGameState.timeOfDay === 'evening'
                              ? 'linear-gradient(to right, #FF6B35, #F7931E)'
                              : 'linear-gradient(to right, #4B0082, #000080)'
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-2 text-sm text-gray-400">
                        <span>Day</span>
                        <span>Evening</span>
                        <span>Night</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-900/30 to-teal-900/30 border-green-500/30">
                    <CardHeader>
                      <CardTitle className="text-green-300">How to Play</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-gray-300">
                      <p>• Press SPACE or TAP to jump</p>
                      <p>• Avoid obstacles (cactus, rocks, spikes, birds)</p>
                      <p>• Speed increases with level</p>
                      <p>• Day/Night cycle affects visibility</p>
                      <p>• Earn 1 XP per point (max 250)</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return null
}

// Export with dynamic import to avoid SSR issues
export default dynamic(() => Promise.resolve(MiniGamePageContent), {
  ssr: false
})
