"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trophy, Play, RotateCcw, Sparkles, Zap, Target } from "lucide-react";
import { useWallet } from "@/contexts/wallet-context";

// ============================================
// RESPONSIVE ENDLESS RUNNER GAME
// Desktop: 1000x500 | Mobile: 800x400
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

export default function MiniGamePageContent() {
  const { publicKey } = useWallet();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Responsive Game Constants
  const GAME_WIDTH = isMobile ? 800 : 1000;
  const GAME_HEIGHT = isMobile ? 400 : 500;
  const GROUND_Y = isMobile ? 320 : 380;
  const GRAVITY = 0.8;
  const JUMP_FORCE = isMobile ? -13 : -15;
  const BASE_SPEED = isMobile ? 4 : 5;
  const MAX_SPEED = isMobile ? 12 : 15;
  const SPEED_INCREMENT = isMobile ? 0.0015 : 0.002;

  // Character properties - Responsive
  const RUNNER_WIDTH = isMobile ? 70 : 90;
  const RUNNER_HEIGHT = isMobile ? 80 : 100;
  const RUNNER_X = isMobile ? 120 : 180;

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
  const [runnerFrame, setRunnerFrame] = useState(0);

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

  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const touchStartY = useRef<number>(0);

  // Check mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update runnerY when GROUND_Y changes (mobile/desktop switch)
  useEffect(() => {
    if (!gameState.isPlaying) {
      setRunnerY(GROUND_Y - RUNNER_HEIGHT);
    }
  }, [GROUND_Y, RUNNER_HEIGHT, gameState.isPlaying]);

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem('runnerHighScore');
    if (saved) setGameState(prev => ({ ...prev, highScore: parseInt(saved) }));
    const savedXp = localStorage.getItem('runnerTotalXp');
    if (savedXp) setTotalXp(parseInt(savedXp));
  }, []);

  // Jump function
  const jump = useCallback(() => {
    if (!gameState.isPlaying || gameState.isGameOver) return;
    if (!isJumping) {
      setRunnerVy(JUMP_FORCE);
      setIsJumping(true);
      createJumpParticles();
    }
  }, [gameState.isPlaying, gameState.isGameOver, isJumping, JUMP_FORCE]);

  // Create particles
  const createJumpParticles = () => {
    const newParticles: Particle[] = [];
    const particleCount = isMobile ? 6 : 8;
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x: RUNNER_X + RUNNER_WIDTH / 2,
        y: GROUND_Y,
        vx: (Math.random() - 0.5) * (isMobile ? 6 : 8),
        vy: -Math.random() * (isMobile ? 4 : 5) - 1,
        life: isMobile ? 25 : 30,
        color: ['#a855f7', '#3b82f6', '#ec4899'][Math.floor(Math.random() * 3)],
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  const createCollisionParticles = (x: number, y: number) => {
    const newParticles: Particle[] = [];
    const particleCount = isMobile ? 12 : 15;
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x,
        y,
        vx: (Math.random() - 0.5) * (isMobile ? 12 : 15),
        vy: (Math.random() - 0.5) * (isMobile ? 12 : 15),
        life: isMobile ? 35 : 40,
        color: ['#ef4444', '#f97316', '#eab308'][Math.floor(Math.random() * 3)],
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  // Start game
  const startGame = () => {
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
    setObstacles([]);
    setParticles([]);
    obstacleIdRef.current = 0;
  };

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
    if (!publicKey) return;
    try {
      const response = await fetch('/api/xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          xpAmount: xp,
          source: 'mini-game',
          details: { score: gameState.score, playedAt: new Date().toISOString() }
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
      x: RUNNER_X + (isMobile ? 8 : 10),
      y: runnerY + (isMobile ? 8 : 10),
      width: RUNNER_WIDTH - (isMobile ? 16 : 20),
      height: RUNNER_HEIGHT - (isMobile ? 16 : 20),
    };

    for (const obstacle of obstacles) {
      const obstacleRect = {
        x: obstacle.x + (isMobile ? 4 : 5),
        y: obstacle.y + (isMobile ? 4 : 5),
        width: obstacle.width - (isMobile ? 8 : 10),
        height: obstacle.height - (isMobile ? 8 : 10),
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
  }, [obstacles, runnerY, gameOver, isMobile, RUNNER_X, RUNNER_WIDTH, RUNNER_HEIGHT]);

  // Game loop
  useEffect(() => {
    if (!gameState.isPlaying) return;

    const gameLoop = () => {
      // Physics
      setRunnerY(prev => {
        let newY = prev + runnerVy;
        let newVy = runnerVy + GRAVITY;
        if (newY >= GROUND_Y - RUNNER_HEIGHT) {
          newY = GROUND_Y - RUNNER_HEIGHT;
          newVy = 0;
          setIsJumping(false);
        }
        setRunnerVy(newVy);
        return newY;
      });

      setRunnerFrame(prev => (prev + 1) % 8);

      // Obstacles
      setObstacles(prev => {
        const newObstacles = prev
          .map(obs => ({ ...obs, x: obs.x - gameState.speed }))
          .filter(obs => obs.x > -100);

        const lastObs = newObstacles[newObstacles.length - 1];
        const minGap = (isMobile ? 200 : 250) + Math.random() * (isMobile ? 150 : 200);
        if (!lastObs || lastObs.x < GAME_WIDTH - minGap) {
          if (Math.random() < (isMobile ? 0.015 : 0.02) + gameState.speed * (isMobile ? 0.0008 : 0.001)) {
            const types: Obstacle['type'][] = ['cactus', 'rock', 'spike'];
            const type = types[Math.floor(Math.random() * types.length)];
            newObstacles.push({
              id: obstacleIdRef.current++,
              x: GAME_WIDTH + (isMobile ? 50 : 100),
              y: type === 'spike' ? GROUND_Y - (isMobile ? 25 : 30) : GROUND_Y - (isMobile ? 45 : 50),
              width: type === 'cactus' ? (isMobile ? 25 : 30) : type === 'rock' ? (isMobile ? 30 : 35) : (isMobile ? 35 : 40),
              height: type === 'cactus' ? (isMobile ? 45 : 50) : type === 'rock' ? (isMobile ? 40 : 50) : (isMobile ? 25 : 30),
              type,
            });
          }
        }
        return newObstacles;
      });

      // Particles
      setParticles(prev => 
        prev
          .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - 1 }))
          .filter(p => p.life > 0)
      );

      // Score & Speed
      setGameState(prev => ({
        ...prev,
        score: prev.score + 1,
        distance: prev.distance + prev.speed,
        speed: Math.min(MAX_SPEED, prev.speed + SPEED_INCREMENT),
      }));

      checkCollision();
    };

    gameLoopRef.current = window.setInterval(gameLoop, 1000 / 60);
    return () => { if (gameLoopRef.current) clearInterval(gameLoopRef.current); };
  }, [gameState.isPlaying, gameState.speed, runnerVy, checkCollision, GROUND_Y, RUNNER_HEIGHT, GAME_WIDTH, MAX_SPEED, SPEED_INCREMENT, isMobile]);

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

  // Touch controls - Fixed for mobile
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      touchStartY.current = e.touches[0].clientY;
      jump();
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // Prevent scrolling
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, [jump]);

  // Draw background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, '#0f0f1a');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Stars
    const starCount = isMobile ? 40 : 50;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < starCount; i++) {
      const x = (i * (isMobile ? 67 : 73) + gameState.distance * 0.1) % GAME_WIDTH;
      const y = (i * (isMobile ? 29 : 37)) % (GAME_HEIGHT / 2);
      const size = (i % 3) + 1;
      ctx.globalAlpha = 0.3 + (i % 5) * 0.1;
      ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;

    // Ground
    const groundGradient = ctx.createLinearGradient(0, GROUND_Y, 0, GAME_HEIGHT);
    groundGradient.addColorStop(0, '#2d2d44');
    groundGradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);

    // Ground line
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(GAME_WIDTH, GROUND_Y);
    ctx.stroke();

    // Moving ground details
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    const groundDetailCount = isMobile ? 8 : 10;
    for (let i = 0; i < groundDetailCount; i++) {
      const x = ((i * 100 - gameState.distance) % (GAME_WIDTH + 100)) - 50;
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y + (isMobile ? 8 : 10));
      ctx.lineTo(x + (isMobile ? 25 : 30), GROUND_Y + (isMobile ? 8 : 10));
      ctx.stroke();
    }
  }, [gameState.distance, GAME_WIDTH, GAME_HEIGHT, GROUND_Y, isMobile]);

  // Render obstacle
  const renderObstacle = (obstacle: Obstacle) => {
    const isSmall = isMobile;
    
    switch (obstacle.type) {
      case 'cactus':
        return (
          <div key={obstacle.id} className="absolute" style={{ left: obstacle.x, top: obstacle.y, width: obstacle.width, height: obstacle.height }}>
            <div className="relative w-full h-full">
              <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 ${isSmall ? 'w-2.5' : 'w-3'} h-full bg-gradient-to-t from-green-600 to-green-400 rounded-full`} />
              <div className={`absolute bottom-3 ${isSmall ? '-left-0.5 w-1.5 h-3' : '-left-1 w-2 h-4'} bg-gradient-to-r from-green-600 to-green-400 rounded-full rotate-[-30deg]`} />
              <div className={`absolute bottom-4 ${isSmall ? '-right-0.5 w-1.5 h-3' : '-right-1 w-2 h-4'} bg-gradient-to-l from-green-600 to-green-400 rounded-full rotate-[30deg]`} />
            </div>
          </div>
        );
      case 'rock':
        return (
          <div key={obstacle.id} className="absolute" style={{ left: obstacle.x, top: obstacle.y, width: obstacle.width, height: obstacle.height }}>
            <div className="w-full h-full bg-gradient-to-br from-gray-500 to-gray-700 rounded-lg transform rotate-3" />
          </div>
        );
      case 'spike':
        return (
          <div key={obstacle.id} className="absolute" style={{ left: obstacle.x, top: obstacle.y, width: obstacle.width, height: obstacle.height }}>
            <div className="w-full h-full relative flex items-end justify-center gap-0.5">
              {[0, 1, 2].map(i => (
                <div key={i} className={`w-0 h-0 border-l-[${isSmall ? '5px' : '6px'}] border-r-[${isSmall ? '5px' : '6px'}] border-b-[${isSmall ? '20px' : '30px'}] border-l-transparent border-r-transparent border-b-red-500`} />
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0f0f1a] to-[#1a1a2e] text-white overflow-x-hidden">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-pink-600/20" />
        <div className="relative max-w-6xl mx-auto px-4 py-8 md:py-12 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 mb-4 md:mb-6">
            <Zap className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">Endless Runner Challenge</span>
          </motion.div>
          
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Neon Runner
            </span>
          </motion.h1>
          
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base px-4">
            Jump over obstacles and survive! Earn XP based on your score.
            <br className="hidden md:block" />
            <span className="text-purple-400">Tap or Press SPACE to jump</span>
          </motion.p>
        </div>
      </div>

      {/* Game Container */}
      <div className="max-w-7xl mx-auto px-4 pb-8 md:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          
          {/* Game Area - Responsive */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900/50 border-gray-800 overflow-hidden">
              <CardContent className="p-0">
                <div 
                  ref={containerRef}
                  id="game-container"
                  className="relative w-full cursor-pointer select-none touch-none"
                  style={{ 
                    aspectRatio: `${GAME_WIDTH}/${GAME_HEIGHT}`,
                    maxHeight: isMobile ? '50vh' : '70vh'
                  }}
                  onClick={jump}
                >
                  {/* Background Canvas */}
                  <canvas
                    ref={canvasRef}
                    width={GAME_WIDTH}
                    height={GAME_HEIGHT}
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  {/* Game Elements */}
                  <div className="absolute inset-0 overflow-hidden">
                    
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
                        }}
                        animate={!isJumping ? { y: [0, isMobile ? -2 : -3, 0] } : {}}
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
                          width: isMobile ? '6px' : '8px',
                          height: isMobile ? '6px' : '8px',
                          backgroundColor: particle.color,
                          opacity: particle.life / (isMobile ? 35 : 40),
                        }}
                      />
                    ))}

                    {/* Start Screen */}
                    {!gameState.isPlaying && !gameState.isGameOver && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                        <div className="text-center p-4">
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-5xl md:text-6xl mb-3">🏃</motion.div>
                          <h2 className="text-2xl md:text-3xl font-bold mb-2">Ready to Run?</h2>
                          <p className="text-gray-400 mb-4 text-sm md:text-base">
                            {isMobile ? 'Tap screen to jump!' : 'Press SPACE or Click to jump!'}
                          </p>
                          <Button onClick={startGame} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 md:px-8 py-4 md:py-6 text-base md:text-lg">
                            <Play className="w-5 h-5 mr-2" />
                            Start Game
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Game Over Screen */}
                    {gameState.isGameOver && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/85 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center p-4">
                          <div className="text-5xl md:text-6xl mb-3">💥</div>
                          <h2 className="text-3xl md:text-4xl font-bold mb-2 text-red-400">Game Over!</h2>
                          <p className="text-xl md:text-2xl text-white mb-1">Score: {gameState.score}</p>
                          {gameState.score > gameState.highScore && (
                            <p className="text-yellow-400 mb-3 text-sm md:text-base">🎉 New High Score!</p>
                          )}
                          <Button onClick={startGame} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 md:px-8 py-4 md:py-6 text-base md:text-lg mt-2">
                            <RotateCcw className="w-5 h-5 mr-2" />
                            Play Again
                          </Button>
                        </motion.div>
                      </div>
                    )}
                  </div>

                  {/* Score Overlay */}
                  {gameState.isPlaying && (
                    <div className="absolute top-2 md:top-4 left-2 md:left-4 right-2 md:right-4 flex justify-between items-start pointer-events-none">
                      <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 md:px-4 md:py-2">
                        <div className="text-xs md:text-sm text-gray-400">Score</div>
                        <div className="text-xl md:text-2xl font-bold text-white">{gameState.score}</div>
                      </div>
                      <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 md:px-4 md:py-2">
                        <div className="text-xs md:text-sm text-gray-400">Speed</div>
                        <div className="text-xl md:text-2xl font-bold text-purple-400">{gameState.speed.toFixed(1)}x</div>
                      </div>
                    </div>
                  )}

                  {/* Mobile Jump Hint */}
                  {gameState.isPlaying && isMobile && (
                    <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                      <span className="text-white/50 text-xs bg-black/40 px-3 py-1 rounded-full">Tap to jump</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Controls Hint - Desktop */}
            <div className="mt-4 hidden md:flex justify-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-lg">
                <span className="px-2 py-1 bg-gray-700 rounded text-sm">SPACE</span>
                <span className="text-gray-400">or</span>
                <span className="px-2 py-1 bg-gray-700 rounded text-sm">CLICK</span>
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
                  <span className="text-gray-400 text-sm md:text-base">Total XP</span>
                  <span className="text-xl md:text-2xl font-bold text-purple-400">{totalXp}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 md:p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400 text-sm md:text-base">Games Played</span>
                  <span className="text-xl md:text-2xl font-bold text-blue-400">{Math.floor(totalXp / 125)}</span>
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
                  <div className="flex justify-between"><span className="text-gray-400">Score 100+</span><span className="text-green-400">+50 XP</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Score 500+</span><span className="text-green-400">+100 XP</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Score 1000+</span><span className="text-green-400">+200 XP</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Max per game</span><span className="text-purple-400">250 XP</span></div>
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
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (gameState.score / 500) * 100)}%` }} />
                </div>
                <p className="text-right text-xs md:text-sm text-gray-400 mt-1">{gameState.score} / 500</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* XP Popup */}
      <Dialog open={showXpPopup} onOpenChange={setShowXpPopup}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="text-center text-xl md:text-2xl">🎉 Game Complete!</DialogTitle>
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
            <Button onClick={() => setShowXpPopup(false)} className="mt-4 md:mt-6 bg-gradient-to-r from-purple-600 to-pink-600 w-full">
              Awesome!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
