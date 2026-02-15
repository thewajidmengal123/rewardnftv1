"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Trophy, 
  Play, 
  RotateCcw, 
  Sparkles, 
  Zap, 
  Target, 
  TrendingUp, 
  Clock,
  Gamepad2,
  Star,
  Award,
  Flame
} from "lucide-react";
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

// Game Constants
const GAME_WIDTH = 1000;
const GAME_HEIGHT = 500;
const GROUND_Y = 370;
const GRAVITY = 0.8;
const JUMP_FORCE = -15;
const BASE_SPEED = 5;
const MAX_SPEED = 15;
const SPEED_INCREMENT = 0.002;

// Character (Runner) properties
const RUNNER_WIDTH = 90;
const RUNNER_HEIGHT = 100;
const RUNNER_X = 180;

export default function MiniGamePageContent() {
  const { publicKey } = useWallet()
  
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
  const lastObstacleXRef = useRef(GAME_WIDTH);

  // Particles
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleIdRef = useRef(0);

  // XP System
  const [xpEarned, setXpEarned] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [showXpPopup, setShowXpPopup] = useState(false);
  const [gameTime, setGameTime] = useState(0);

  // Canvas ref for background
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const gameContainerRef = useRef<HTMLDivElement>(null);

  // Load high score from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('runnerHighScore');
    if (saved) {
      setGameState(prev => ({ ...prev, highScore: parseInt(saved) }));
    }
    const savedXp = localStorage.getItem('runnerTotalXp');
    if (savedXp) {
      setTotalXp(parseInt(savedXp));
    }
  }, []);

  // Jump function
  const jump = useCallback(() => {
    if (!gameState.isPlaying || gameState.isGameOver) {
      if (!gameState.isPlaying && !gameState.isGameOver) {
        startGame();
      }
      return;
    }
    if (!isJumping) {
      setRunnerVy(JUMP_FORCE);
      setIsJumping(true);
      createJumpParticles();
    }
  }, [gameState.isPlaying, gameState.isGameOver, isJumping]);

  // Create jump particles
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

  // Create collision particles
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

  // Spawn obstacle
  const spawnObstacle = useCallback(() => {
    const types: Obstacle['type'][] = ['cactus', 'rock', 'spike'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const obstacleY = type === 'spike' 
      ? GROUND_Y - 35
      : type === 'cactus' 
        ? GROUND_Y - 50
        : GROUND_Y - 40;
    
    const obstacle: Obstacle = {
      id: obstacleIdRef.current++,
      x: GAME_WIDTH + Math.random() * 200,
      y: obstacleY,
      width: type === 'cactus' ? 35 : type === 'rock' ? 40 : 45,
      height: type === 'cactus' ? 60 : type === 'rock' ? 50 : 35,
      type,
    };
    
    setObstacles(prev => [...prev, obstacle]);
  }, []);

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
    setGameTime(0);
    obstacleIdRef.current = 0;
    lastObstacleXRef.current = GAME_WIDTH;
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
  }, [gameState.score, gameState.highScore, totalXp]);

  // Send XP to server
  const sendXpToServer = async (xp: number) => {
    try {
      if (!publicKey) {
        console.error('Wallet not connected')
        return
      }
      const walletAddress = publicKey.toString()
      
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
      if (data.success) {
        console.log('✅ XP awarded:', data.data);
      }
    } catch (error) {
      console.error('Failed to send XP:', error);
    }
  };

  // Collision detection
  const checkCollision = useCallback(() => {
    const runnerRect = {
      x: RUNNER_X + 10,
      y: runnerY + 10,
      width: RUNNER_WIDTH - 20,
      height: RUNNER_HEIGHT - 20,
    };

    for (const obstacle of obstacles) {
      const obstacleRect = {
        x: obstacle.x + 5,
        y: obstacle.y + 5,
        width: obstacle.width - 10,
        height: obstacle.height - 10,
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
  }, [obstacles, runnerY, gameOver]);

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
        }
        
        setRunnerVy(newVy);
        return newY;
      });

      setRunnerFrame(prev => (prev + 1) % 8);

      setObstacles(prev => {
        const newObstacles = prev
          .map(obs => ({ ...obs, x: obs.x - gameState.speed }))
          .filter(obs => obs.x > -100);
        
        const lastObs = newObstacles[newObstacles.length - 1];
        const minGap = 250 + Math.random() * 200;
        if (!lastObs || lastObs.x < GAME_WIDTH - minGap) {
          if (Math.random() < 0.02 + gameState.speed * 0.001) {
            const types: Obstacle['type'][] = ['cactus', 'rock', 'spike'];
            const type = types[Math.floor(Math.random() * types.length)];
            newObstacles.push({
              id: obstacleIdRef.current++,
              x: GAME_WIDTH + Math.random() * 100,
              y: type === 'spike' ? GROUND_Y - 30 : GROUND_Y - 40,
              width: type === 'cactus' ? 30 : type === 'rock' ? 35 : 40,
              height: type === 'cactus' ? 50 : type === 'rock' ? 40 : 30,
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

      setGameTime(prev => prev + 1/60);
      checkCollision();
    };

    gameLoopRef.current = window.setInterval(gameLoop, 1000 / 60);
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameState.isPlaying, gameState.speed, runnerVy, checkCollision]);

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

  // Touch controls for mobile
  useEffect(() => {
    const gameContainer = gameContainerRef.current;
    if (!gameContainer) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      jump();
    };

    gameContainer.addEventListener('touchstart', handleTouchStart, { passive: false });

    return () => {
      gameContainer.removeEventListener('touchstart', handleTouchStart);
    };
  }, [jump]);

  // Draw background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, '#0f0f1a');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
      const x = (i * 73 + gameState.distance * 0.1) % GAME_WIDTH;
      const y = (i * 37) % (GAME_HEIGHT / 2);
      const size = (i % 3) + 1;
      ctx.globalAlpha = 0.3 + (i % 5) * 0.1;
      ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;

    const groundGradient = ctx.createLinearGradient(0, GROUND_Y, 0, GAME_HEIGHT);
    groundGradient.addColorStop(0, '#2d2d44');
    groundGradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);

    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(GAME_WIDTH, GROUND_Y);
    ctx.stroke();

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      const x = ((i * 100 - gameState.distance) % (GAME_WIDTH + 100)) - 50;
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y + 10);
      ctx.lineTo(x + 30, GROUND_Y + 10);
      ctx.stroke();
    }
  }, [gameState.distance]);

  // Render obstacle
  const renderObstacle = (obstacle: Obstacle) => {
    const baseClasses = "absolute transition-none";
    
    switch (obstacle.type) {
      case 'cactus':
        return (
          <div
            key={obstacle.id}
            className={`${baseClasses}`}
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
        );
      case 'rock':
        return (
          <div
            key={obstacle.id}
            className={`${baseClasses}`}
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
            className={`${baseClasses}`}
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
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6 max-w-7xl">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30 mb-4">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Endless Runner Challenge
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-3">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              Neon Runner
            </span>
          </h1>
          
          <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
            Jump over obstacles and survive as long as possible! 
            <span className="text-purple-400 font-semibold"> Earn XP</span> based on your score.
          </p>
          
          <div className="mt-4 inline-flex items-center gap-2 text-sm text-gray-500 bg-white/5 px-4 py-2 rounded-full border border-white/10">
            <span className="px-2 py-1 bg-white/10 rounded text-xs font-mono border border-white/10">SPACE</span>
            <span>or</span>
            <span className="px-2 py-1 bg-white/10 rounded text-xs font-mono border border-white/10">TAP</span>
            <span>to jump</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Game Area */}
          <div className="lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="relative"
            >
              {/* Neon Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-2xl blur opacity-30" />
              
              <Card className="relative bg-gray-900/80 border-purple-500/30 backdrop-blur-xl overflow-hidden">
                <CardContent className="p-0">
                  {/* Game Container */}
                  <div 
                    ref={gameContainerRef}
                    id="game-container"
                    className="relative w-full cursor-pointer touch-none"
                    style={{ aspectRatio: '2/1', maxHeight: '500px' }}
                    onClick={jump}
                  >
                    {/* Background Canvas */}
                    <canvas
                      ref={canvasRef}
                      width={GAME_WIDTH}
                      height={GAME_HEIGHT}
                      className="absolute inset-0 w-full h-full"
                    />

                    {/* Game Elements */}
                    <div className="absolute inset-0 overflow-hidden">
                      {/* Runner Character */}
                      {gameState.isPlaying && !gameState.isGameOver && (
                        <motion.div
                          className="absolute"
                          style={{
                            left: `${(RUNNER_X / GAME_WIDTH) * 100}%`,
                            top: `${(runnerY / GAME_HEIGHT) * 100}%`,
                            width: `${(RUNNER_WIDTH / GAME_WIDTH) * 100}%`,
                            height: `${(RUNNER_HEIGHT / GAME_HEIGHT) * 100}%`,
                            zIndex: 10,
                          }}
                          animate={!isJumping ? { y: [0, -5, 0] } : {}}
                          transition={{ repeat: Infinity, duration: 0.3 }}
                        >
                          <img 
                            src="/images/character-jump.png"
                            alt="Runner"
                            className="w-full h-full object-contain"
                            style={{
                              filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.5))',
                            }}
                          />
                        </motion.div>
                      )}
                      
                      {/* Obstacles */}
                      {obstacles.map(renderObstacle)}

                      {/* Particles */}
                      {particles.map(particle => (
                        <div
                          key={particle.id}
                          className="absolute w-2 h-2 rounded-full pointer-events-none"
                          style={{
                            left: `${(particle.x / GAME_WIDTH) * 100}%`,
                            top: `${(particle.y / GAME_HEIGHT) * 100}%`,
                            backgroundColor: particle.color,
                            opacity: particle.life / 40,
                          }}
                        />
                      ))}

                      {/* Start Screen */}
                      <AnimatePresence>
                        {!gameState.isPlaying && !gameState.isGameOver && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm"
                          >
                            <motion.div
                              animate={{ y: [0, -10, 0] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                              className="text-6xl md:text-7xl mb-4"
                            >
                              🏃
                            </motion.div>
                            <h2 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                              Ready to Run?
                            </h2>
                            <p className="text-gray-400 mb-6 text-sm md:text-base">Jump over obstacles and earn XP!</p>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                startGame();
                              }}
                              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold px-6 md:px-8 py-4 md:py-6 text-base md:text-lg rounded-full shadow-lg shadow-purple-500/25 transition-all hover:scale-105"
                            >
                              <Play className="w-5 h-5 mr-2" />
                              Start Game
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Game Over Screen */}
                      <AnimatePresence>
                        {gameState.isGameOver && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md"
                          >
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 200 }}
                              className="text-5xl md:text-6xl mb-4"
                            >
                              💥
                            </motion.div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-2 text-red-400">Game Over!</h2>
                            <p className="text-xl md:text-2xl text-white mb-2">Score: {gameState.score}</p>
                            {gameState.score > gameState.highScore && (
                              <motion.p 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-yellow-400 mb-4 flex items-center gap-2"
                              >
                                <Trophy className="w-5 h-5" />
                                New High Score!
                              </motion.p>
                            )}
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                startGame();
                              }}
                              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold px-6 md:px-8 py-4 md:py-6 text-base md:text-lg rounded-full shadow-lg shadow-cyan-500/25 transition-all hover:scale-105"
                            >
                              <RotateCcw className="w-5 h-5 mr-2" />
                              Play Again
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Score Overlay */}
                    {gameState.isPlaying && (
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute top-3 left-3 right-3 flex justify-between items-start pointer-events-none"
                      >
                        <div className="bg-black/60 backdrop-blur-md rounded-xl px-3 py-2 border border-purple-500/30">
                          <div className="text-xs text-gray-400 uppercase tracking-wider">Score</div>
                          <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            {gameState.score}
                          </div>
                        </div>
                        <div className="bg-black/60 backdrop-blur-md rounded-xl px-3 py-2 border border-cyan-500/30">
                          <div className="text-xs text-gray-400 uppercase tracking-wider">Speed</div>
                          <div className="text-xl md:text-2xl font-bold text-cyan-400">
                            {gameState.speed.toFixed(1)}x
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Stats Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4 grid grid-cols-3 gap-3"
            >
              <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-500/30 rounded-xl p-3 text-center">
                <div className="text-purple-400 text-xs mb-1 uppercase tracking-wider">Current</div>
                <div className="text-xl md:text-2xl font-bold text-white">{gameState.score}</div>
              </div>
              <div className="bg-gradient-to-br from-pink-900/40 to-pink-800/20 border border-pink-500/30 rounded-xl p-3 text-center">
                <div className="text-pink-400 text-xs mb-1 uppercase tracking-wider">Best</div>
                <div className="text-xl md:text-2xl font-bold text-white">{Math.max(gameState.highScore, gameState.score)}</div>
              </div>
              <div className="bg-gradient-to-br from-cyan-900/40 to-cyan-800/20 border border-cyan-500/30 rounded-xl p-3 text-center">
                <div className="text-cyan-400 text-xs mb-1 uppercase tracking-wider">XP Earned</div>
                <div className="text-xl md:text-2xl font-bold text-white">+{Math.min(gameState.score, 250)}</div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            {/* Your Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-gray-900/60 border-purple-500/20 backdrop-blur-xl overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-white" />
                    </div>
                    Your Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5 hover:border-purple-500/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-400" />
                      <span className="text-gray-400 text-sm">High Score</span>
                    </div>
                    <span className="text-xl font-bold text-yellow-400">{gameState.highScore}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5 hover:border-purple-500/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-purple-400" />
                      <span className="text-gray-400 text-sm">Total XP</span>
                    </div>
                    <span className="text-xl font-bold text-purple-400">{totalXp}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5 hover:border-purple-500/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <Gamepad2 className="w-4 h-4 text-cyan-400" />
                      <span className="text-gray-400 text-sm">Games Played</span>
                    </div>
                    <span className="text-xl font-bold text-cyan-400">
                      {Math.floor(totalXp / 125) || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* XP Rewards */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-gray-900/60 border-green-500/20 backdrop-blur-xl overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
                      <Award className="w-4 h-4 text-white" />
                    </div>
                    XP Rewards
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { score: 100, xp: 50, color: "from-gray-600 to-gray-500", icon: Star, label: "Score 100+" },
                    { score: 500, xp: 100, color: "from-yellow-600 to-orange-500", icon: Trophy, label: "Score 500+" },
                    { score: 1000, xp: 200, color: "from-purple-600 to-pink-500", icon: Award, label: "Score 1000+" },
                  ].map((reward, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-white/5 rounded-lg border border-white/5 group hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${reward.color} flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity`}>
                          <reward.icon className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-gray-300 text-sm">{reward.label}</span>
                      </div>
                      <span className="text-green-400 font-bold text-sm">+{reward.xp} XP</span>
                    </div>
                  ))}
                  
                  <div className="flex justify-between items-center p-2.5 rounded-lg border border-green-500/30 bg-green-500/10">
                    <span className="text-gray-300 text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      Per 10 points
                    </span>
                    <span className="text-green-400 font-bold text-sm">+1 XP</span>
                  </div>
                  
                  <div className="text-center p-2 bg-white/5 rounded-lg border border-white/5">
                    <span className="text-xs text-gray-500">Max per game: </span>
                    <span className="text-xs text-purple-400 font-bold">250 XP</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quest Target */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-gray-900/60 border-orange-500/20 backdrop-blur-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl" />
                
                <CardHeader className="pb-3 relative">
                  <CardTitle className="flex items-center gap-2 text-lg text-orange-300">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    Quest Target
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-gray-300 text-sm mb-3">Score 500+ points in a single run!</p>
                  
                  <div className="relative h-3 bg-black/50 rounded-full overflow-hidden border border-white/10">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (gameState.score / 500) * 100)}%` }}
                      transition={{ type: "spring", stiffness: 100 }}
                    />
                  </div>
                  
                  <div className="flex justify-between mt-2 text-xs">
                    <span className="text-gray-500">Progress</span>
                    <span className="text-orange-400 font-bold">{Math.min(gameState.score, 500)} / 500</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* XP Popup */}
      <Dialog open={showXpPopup} onOpenChange={setShowXpPopup}>
        <DialogContent className="bg-gray-900/95 border-purple-500/30 backdrop-blur-xl text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-400" />
              Game Complete!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2"
            >
              +{xpEarned} XP
            </motion.div>
            <p className="text-gray-400 text-sm">Earned from your run!</p>
            
            <div className="mt-6 space-y-2">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
                <span className="text-gray-400 text-sm">Final Score</span>
                <span className="text-white font-bold">{gameState.score}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
                <span className="text-gray-400 text-sm">Total XP</span>
                <span className="text-purple-400 font-bold">{totalXp}</span>
              </div>
            </div>
            
            <Button
              onClick={() => setShowXpPopup(false)}
              className="mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold px-8 py-3 rounded-full"
            >
              Awesome!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
