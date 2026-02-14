"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trophy, Play, RotateCcw, Sparkles, Zap, Target } from "lucide-react";
import { useWallet } from "@/contexts/wallet-context";

// ============================================
// ENDLESS RUNNER GAME - REWARDNFT PLATFORM
// ============================================

interface GameState {
  isPlaying: boolean;
  isGameOver: boolean;
  score: number;
  highScore: number;
  speed: number;
  distance: number;
}

interface Obstacle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'cactus' | 'rock' | 'spike';
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

// Game Dimensions
const DESKTOP_WIDTH = 1000;
const DESKTOP_HEIGHT = 500;

// Game Constants
const GRAVITY = 0.8;
const JUMP_FORCE = -15;
const BASE_SPEED = 5;
const MAX_SPEED = 15;
const SPEED_INCREMENT = 0.002;

export default function MiniGamePageContent() {
  const { publicKey } = useWallet();
  const containerRef = useRef<HTMLDivElement>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [gameWidth, setGameWidth] = useState(DESKTOP_WIDTH);
  const [gameHeight, setGameHeight] = useState(DESKTOP_HEIGHT);

  // Calculate game dimensions
  useEffect(() => {
    const updateDimensions = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      if (mobile) {
        const containerWidth = Math.min(window.innerWidth - 32, 600);
        setGameWidth(containerWidth);
        setGameHeight((containerWidth / DESKTOP_WIDTH) * DESKTOP_HEIGHT);
      } else {
        setGameWidth(DESKTOP_WIDTH);
        setGameHeight(DESKTOP_HEIGHT);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    const timer = setTimeout(updateDimensions, 100);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
      clearTimeout(timer);
    };
  }, []);

  // Scale factor
  const scale = gameWidth / DESKTOP_WIDTH;
  const GROUND_Y = isMobile ? 320 * scale : 380;
  const RUNNER_WIDTH = 90 * scale;
  const RUNNER_HEIGHT = 100 * scale;
  const RUNNER_X = 180 * scale;

  // Game State
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isGameOver: false,
    score: 0,
    highScore: 0,
    speed: BASE_SPEED,
    distance: 0,
  });

  // Runner physics
  const [runnerY, setRunnerY] = useState(GROUND_Y - RUNNER_HEIGHT);
  const [runnerVy, setRunnerVy] = useState(0);
  const [isJumping, setIsJumping] = useState(false);

  // Obstacles
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const obstacleIdRef = useRef(0);

  // Particles
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleIdRef = useRef(0);

  // XP System
  const [xpEarned, setXpEarned] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [showXpPopup, setShowXpPopup] = useState(false);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const isJumpingRef = useRef(false);

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem('runnerHighScore');
    if (saved) setGameState(prev => ({ ...prev, highScore: parseInt(saved) }));
    const savedXp = localStorage.getItem('runnerTotalXp');
    if (savedXp) setTotalXp(parseInt(savedXp));
  }, []);

  // Update runner position
  useEffect(() => {
    if (!gameState.isPlaying) {
      setRunnerY(GROUND_Y - RUNNER_HEIGHT);
    }
  }, [GROUND_Y, RUNNER_HEIGHT, gameState.isPlaying]);

  // Sync isJumping ref
  useEffect(() => {
    isJumpingRef.current = isJumping;
  }, [isJumping]);

  // Jump function
  const jump = useCallback(() => {
    if (!gameState.isPlaying || gameState.isGameOver) return;
    if (!isJumpingRef.current) {
      setRunnerVy(JUMP_FORCE);
      setIsJumping(true);
      createJumpParticles();
    }
  }, [gameState.isPlaying, gameState.isGameOver]);

  // Create particles
  const createJumpParticles = () => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 8; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x: RUNNER_X + RUNNER_WIDTH / 2,
        y: GROUND_Y,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 5 - 2,
        life: 30,
        color: ['#a855f7', '#3b82f6', '#ec4899'][Math.floor(Math.random() * 3)],
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  const createCollisionParticles = (x: number, y: number) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 15; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x,
        y,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        life: 40,
        color: ['#ef4444', '#f97316', '#eab308'][Math.floor(Math.random() * 3)],
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  // Start game
  const startGame = useCallback(() => {
    setGameState({
      isPlaying: true,
      isGameOver: false,
      score: 0,
      highScore: gameState.highScore,
      speed: BASE_SPEED,
      distance: 0,
    });
    setRunnerY(GROUND_Y - RUNNER_HEIGHT);
    setRunnerVy(0);
    setIsJumping(false);
    isJumpingRef.current = false;
    setObstacles([]);
    setParticles([]);
    obstacleIdRef.current = 0;
  }, [gameState.highScore, GROUND_Y, RUNNER_HEIGHT]);

  // Game over
  const gameOver = useCallback(() => {
    setGameState(prev => ({ ...prev, isPlaying: false, isGameOver: true }));
    
    const earnedXp = Math.min(gameState.score, 250);
    setXpEarned(earnedXp);
    
    const newTotalXp = totalXp + earnedXp;
    setTotalXp(newTotalXp);
    localStorage.setItem('runnerTotalXp', newTotalXp.toString());
    
    if (gameState.score > gameState.highScore) {
      setGameState(prev => ({ ...prev, highScore: gameState.score }));
      localStorage.setItem('runnerHighScore', gameState.score.toString());
    }

    setShowXpPopup(true);
    sendXpToServer(earnedXp);
  }, [gameState.score, gameState.highScore, totalXp, publicKey]);

  // Send XP
  const sendXpToServer = async (xp: number) => {
    try {
      if (!publicKey) return;
      const walletAddress = publicKey.toString();
      
      const response = await fetch('/api/xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          xpAmount: xp,
          source: 'mini-game',
          details: {
            score: gameState.score,
            playedAt: new Date().toISOString()
          }
        }),
      });
      
      const data = await response.json();
      if (data.success) console.log('✅ XP awarded:', data.data);
    } catch (error) {
      console.error('Failed to send XP:', error);
    }
  };

  // Collision detection
  const checkCollision = useCallback(() => {
    const runnerRect = {
      x: RUNNER_X + 10 * scale,
      y: runnerY + 10 * scale,
      width: RUNNER_WIDTH - 20 * scale,
      height: RUNNER_HEIGHT - 20 * scale,
    };

    for (const obstacle of obstacles) {
      const obstacleRect = {
        x: obstacle.x + 5 * scale,
        y: obstacle.y + 5 * scale,
        width: obstacle.width - 10 * scale,
        height: obstacle.height - 10 * scale,
      };

      if (
        runnerRect.x < obstacleRect.x + obstacleRect.width &&
        runnerRect.x + runnerRect.width > obstacleRect.x &&
        runnerRect.y < obstacleRect.y + obstacleRect.height &&
        runnerRect.y + runnerRect.height > obstacleRect.y
      ) {
        createCollisionParticles(obstacle.x + obstacle.width / 2, obstacle.y);
        gameOver();
        return true;
      }
    }
    return false;
  }, [obstacles, runnerY, gameOver, RUNNER_X, RUNNER_WIDTH, RUNNER_HEIGHT, scale]);

  // Game loop
  useEffect(() => {
    if (!gameState.isPlaying) return;

    const gameLoop = () => {
      setRunnerY(prev => {
        let newY = prev + runnerVy;
        let newVy = runnerVy + GRAVITY;
        
        if (newY >= GROUND_Y - RUNNER_HEIGHT) {
          newY = GROUND_Y - RUNNER_HEIGHT;
          newVy = 0;
          setIsJumping(false);
          isJumpingRef.current = false;
        }
        
        setRunnerVy(newVy);
        return newY;
      });

      setObstacles(prev => {
        const newObstacles = prev
          .map(obs => ({ ...obs, x: obs.x - gameState.speed }))
          .filter(obs => obs.x > -100);
        
        const lastObs = newObstacles[newObstacles.length - 1];
        const minGap = (250 + Math.random() * 200) * scale;
        if (!lastObs || lastObs.x < gameWidth - minGap) {
          if (Math.random() < 0.02 + gameState.speed * 0.001) {
            const types: Obstacle['type'][] = ['cactus', 'rock', 'spike'];
            const type = types[Math.floor(Math.random() * types.length)];
            newObstacles.push({
              id: obstacleIdRef.current++,
              x: gameWidth + Math.random() * 100 * scale,
              y: type === 'spike' ? GROUND_Y - 35 * scale : GROUND_Y - 50 * scale,
              width: (type === 'cactus' ? 35 : type === 'rock' ? 40 : 45) * scale,
              height: (type === 'cactus' ? 60 : type === 'rock' ? 50 : 35) * scale,
              type,
            });
          }
        }
        
        return newObstacles;
      });

      setParticles(prev => 
        prev
          .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - 1 }))
          .filter(p => p.life > 0)
      );

      setGameState(prev => ({
        ...prev,
        score: prev.score + 1,
        distance: prev.distance + prev.speed,
        speed: Math.min(MAX_SPEED, prev.speed + SPEED_INCREMENT),
      }));

      checkCollision();
    };

    gameLoopRef.current = window.setInterval(gameLoop, 1000 / 60);
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameState.isPlaying, gameState.speed, runnerVy, checkCollision, GROUND_Y, RUNNER_HEIGHT, gameWidth, scale, MAX_SPEED, SPEED_INCREMENT]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump]);

  // Touch controls - FIXED
  useEffect(() => {
    const gameArea = gameAreaRef.current;
    if (!gameArea) return;

    let touchStartY = 0;
    let touchStartTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndTime = Date.now();
      const touchDuration = touchEndTime - touchStartTime;
      
      // Only handle quick taps, not swipes
      if (touchDuration < 300 && Math.abs(touchEndY - touchStartY) < 50) {
        if (!gameState.isPlaying && !gameState.isGameOver) {
          startGame();
        } else if (gameState.isPlaying && !gameState.isGameOver) {
          jump();
        }
      }
    };

    // Prevent default touch behaviors
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
    };

    gameArea.addEventListener('touchstart', handleTouchStart, { passive: true });
    gameArea.addEventListener('touchend', handleTouchEnd, { passive: false });
    gameArea.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      gameArea.removeEventListener('touchstart', handleTouchStart);
      gameArea.removeEventListener('touchend', handleTouchEnd);
      gameArea.removeEventListener('touchmove', handleTouchMove);
    };
  }, [jump, startGame, gameState.isPlaying, gameState.isGameOver]);

  // Draw background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, gameWidth, gameHeight);

    const gradient = ctx.createLinearGradient(0, 0, 0, gameHeight);
    gradient.addColorStop(0, '#0f0f1a');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, gameWidth, gameHeight);

    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
      const x = (i * 73 + gameState.distance * 0.1) % gameWidth;
      const y = (i * 37) % (gameHeight / 2);
      const size = Math.max(1, (i % 3) + 1 * scale);
      ctx.globalAlpha = 0.3 + (i % 5) * 0.1;
      ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;

    const groundGradient = ctx.createLinearGradient(0, GROUND_Y, 0, gameHeight);
    groundGradient.addColorStop(0, '#2d2d44');
    groundGradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, GROUND_Y, gameWidth, gameHeight - GROUND_Y);

    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(gameWidth, GROUND_Y);
    ctx.stroke();

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      const x = ((i * 100 - gameState.distance) % (gameWidth + 100)) - 50;
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y + 10 * scale);
      ctx.lineTo(x + 30 * scale, GROUND_Y + 10 * scale);
      ctx.stroke();
    }
  }, [gameState.distance, gameWidth, gameHeight, GROUND_Y, scale]);

  // Render obstacle
  const renderObstacle = (obstacle: Obstacle) => {
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
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-full bg-gradient-to-t from-green-600 to-green-400 rounded-full" style={{ width: 12 * scale }} />
              <div className="absolute bottom-4 bg-gradient-to-r from-green-600 to-green-400 rounded-full rotate-[-30deg]" style={{ left: -4 * scale, width: 8 * scale, height: 16 * scale }} />
              <div className="absolute bottom-6 bg-gradient-to-l from-green-600 to-green-400 rounded-full rotate-[30deg]" style={{ right: -4 * scale, width: 8 * scale, height: 16 * scale }} />
            </div>
          </div>
        );
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
        );
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
            <div className="w-full h-full relative flex items-end justify-center gap-0.5">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-0 h-0 border-l-transparent border-r-transparent border-b-red-500"
                  style={{ 
                    borderLeftWidth: 6 * scale,
                    borderRightWidth: 6 * scale,
                    borderBottomWidth: 30 * scale,
                  }}
                />
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0f0f1a] to-[#1a1a2e] text-white">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-pink-600/20" />
        <div className="relative max-w-6xl mx-auto px-4 py-8 md:py-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 mb-4 md:mb-6"
          >
            <Zap className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">Endless Runner Challenge</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4"
          >
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Neon Runner
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base px-4"
          >
            Jump over obstacles and survive as long as possible! Earn XP based on your score.
            <br className="hidden md:block" />
            <span className="text-purple-400">Press SPACE or TAP to jump</span>
          </motion.p>
        </div>
      </div>

      {/* Game Container */}
      <div className="max-w-7xl mx-auto px-4 pb-8 md:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          
          {/* Game Area */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900/50 border-gray-800 overflow-hidden">
              <CardContent className="p-0">
                {/* Game Area - FIXED TOUCH HANDLING */}
                <div 
                  ref={gameAreaRef}
                  id="game-container"
                  className="relative w-full bg-black/40 overflow-hidden"
                  style={{ 
                    height: isMobile ? gameHeight : DESKTOP_HEIGHT,
                    minHeight: isMobile ? 200 : 500,
                    touchAction: 'none', // Prevent browser touch actions
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                  }}
                >
                  {/* Game Canvas Wrapper */}
                  <div 
                    className="absolute left-0 top-0"
                    style={{
                      width: gameWidth,
                      height: gameHeight,
                    }}
                  >
                    {/* Background Canvas */}
                    <canvas
                      ref={canvasRef}
                      width={gameWidth}
                      height={gameHeight}
                      className="block"
                    />

                    {/* Game Elements */}
                    <div className="absolute inset-0">
                      
                      {/* Runner */}
                      {gameState.isPlaying && !gameState.isGameOver && (
                        <motion.div
                          className="absolute"
                          style={{
                            left: RUNNER_X,
                            top: runnerY,
                            width: RUNNER_WIDTH,
                            height: RUNNER_HEIGHT,
                            zIndex: 10,
                            pointerEvents: 'none',
                          }}
                          animate={!isJumping ? { y: [0, -3 * scale, 0] } : {}}
                          transition={{ repeat: Infinity, duration: 0.3 }}
                        >
                          <img 
                            src="/images/character-jump.png"
                            alt="Runner"
                            className="w-full h-full object-contain"
                            style={{ filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.5))' }}
                            draggable={false}
                          />
                        </motion.div>
                      )}
                        
                      {/* Obstacles */}
                      {obstacles.map(renderObstacle)}

                      {/* Particles */}
                      {particles.map(particle => (
                        <div
                          key={particle.id}
                          className="absolute rounded-full pointer-events-none"
                          style={{
                            left: particle.x,
                            top: particle.y,
                            width: 8 * scale,
                            height: 8 * scale,
                            backgroundColor: particle.color,
                            opacity: particle.life / 40,
                          }}
                        />
                      ))}

                      {/* Start Screen */}
                      {!gameState.isPlaying && !gameState.isGameOver && (
                        <div 
                          className="absolute inset-0 flex items-center justify-center bg-black/60"
                          style={{ pointerEvents: 'none' }}
                        >
                          <div className="text-center pointer-events-auto">
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="text-5xl md:text-6xl mb-4"
                            >
                              🏃
                            </motion.div>
                            <h2 className="text-2xl md:text-3xl font-bold mb-2">Ready to Run?</h2>
                            <p className="text-gray-400 mb-6 text-sm md:text-base">Tap to start!</p>
                            <Button
                              onClick={startGame}
                              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 md:px-8 py-4 md:py-6 text-base md:text-lg"
                              style={{ touchAction: 'manipulation' }}
                            >
                              <Play className="w-5 h-5 mr-2" />
                              Start Game
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Game Over Screen */}
                      {gameState.isGameOver && (
                        <div 
                          className="absolute inset-0 flex items-center justify-center bg-black/80"
                          style={{ pointerEvents: 'none' }}
                        >
                          <div className="text-center pointer-events-auto">
                            <div className="text-5xl md:text-6xl mb-4">💥</div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-2 text-red-400">Game Over!</h2>
                            <p className="text-xl md:text-2xl text-white mb-2">Score: {gameState.score}</p>
                            {gameState.score > gameState.highScore && (
                              <p className="text-yellow-400 mb-4">🎉 New High Score!</p>
                            )}
                            <Button
                              onClick={startGame}
                              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 md:px-8 py-4 md:py-6 text-base md:text-lg"
                              style={{ touchAction: 'manipulation' }}
                            >
                              <RotateCcw className="w-5 h-5 mr-2" />
                              Play Again
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Score Overlay */}
                    {gameState.isPlaying && (
                      <div className="absolute top-2 md:top-4 left-2 md:left-4 right-2 md:right-4 flex justify-between items-start pointer-events-none">
                        <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5 md:px-4 md:py-2">
                          <div className="text-xs md:text-sm text-gray-400">Score</div>
                          <div className="text-lg md:text-2xl font-bold text-white">{gameState.score}</div>
                        </div>
                        <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5 md:px-4 md:py-2">
                          <div className="text-xs md:text-sm text-gray-400">Speed</div>
                          <div className="text-lg md:text-2xl font-bold text-purple-400">
                            {gameState.speed.toFixed(1)}x
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Mobile Jump Hint */}
                    {gameState.isPlaying && isMobile && (
                      <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                        <span className="text-white/50 text-xs bg-black/40 px-3 py-1 rounded-full">
                          Tap anywhere to jump
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Controls Hint */}
            <div className="mt-4 flex justify-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-lg text-sm md:text-base">
                <span className="px-2 py-1 bg-gray-700 rounded text-xs md:text-sm">SPACE</span>
                <span className="text-gray-400">or</span>
                <span className="px-2 py-1 bg-gray-700 rounded text-xs md:text-sm">TAP</span>
                <span className="text-gray-400">to Jump</span>
              </div>
            </div>
          </div>

          {/* Stats Panel */}
          <div className="space-y-4">
            {/* Game Stats */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Trophy className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
                  Your Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-2.5 md:p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400 text-sm md:text-base">High Score</span>
                  <span className="text-xl md:text-2xl font-bold text-yellow-400">{gameState.highScore}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 md:p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400 text-sm md:text-base">Total XP Earned</span>
                  <span className="text-xl md:text-2xl font-bold text-purple-400">{totalXp}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 md:p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400 text-sm md:text-base">Games Played</span>
                  <span className="text-xl md:text-2xl font-bold text-blue-400">
                    {Math.floor(totalXp / 125)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* XP Info */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
                  XP Rewards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs md:text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Score 100+</span>
                    <span className="text-green-400">+50 XP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Score 500+</span>
                    <span className="text-green-400">+100 XP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Score 1000+</span>
                    <span className="text-green-400">+200 XP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Max per game</span>
                    <span className="text-purple-400">250 XP</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quest Target */}
            <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-purple-300 text-base md:text-lg">
                  <Target className="w-4 h-4 md:w-5 md:h-5" />
                  Quest Target
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-3 text-sm md:text-base">Score 500+ points in a single run!</p>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (gameState.score / 500) * 100)}%` }}
                  />
                </div>
                <p className="text-right text-xs md:text-sm text-gray-400 mt-1">
                  {gameState.score} / 500
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* XP Popup */}
      <Dialog open={showXpPopup} onOpenChange={setShowXpPopup}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="text-center text-xl md:text-2xl">
              🎉 Game Complete!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4 md:py-6">
            <div className="text-4xl md:text-5xl font-bold text-purple-400 mb-2">+{xpEarned} XP</div>
            <p className="text-gray-400 text-sm md:text-base">Earned from your run!</p>
            <div className="mt-4 md:mt-6 p-3 md:p-4 bg-gray-800/50 rounded-lg">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Final Score</span>
                <span className="text-white font-bold">{gameState.score}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total XP</span>
                <span className="text-purple-400 font-bold">{totalXp}</span>
              </div>
            </div>
            <Button
              onClick={() => setShowXpPopup(false)}
              className="mt-4 md:mt-6 bg-gradient-to-r from-purple-600 to-pink-600 w-full"
            >
              Awesome!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
