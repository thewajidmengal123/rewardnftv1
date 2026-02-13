"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trophy, Play, RotateCcw, Sparkles, Zap, Target, TrendingUp, Clock } from "lucide-react";


// ============================================
// ENDLESS RUNNER GAME - REWARDNFT PLATFORM
// ============================================
// Same XP system, same leaderboard integration
// Just replace your existing mini-game-page-content.tsx with this file
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
const GAME_WIDTH = 800;
const GAME_HEIGHT = 400;
const GROUND_Y = 320;
const GRAVITY = 0.8;
const JUMP_FORCE = -15;
const BASE_SPEED = 5;
const MAX_SPEED = 15;
const SPEED_INCREMENT = 0.001;

// Character (Runner) properties
const RUNNER_WIDTH = 50;
const RUNNER_HEIGHT = 60;
const RUNNER_X = 100;

export default function MiniGamePageContent() {
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

  // XP System (Same as your existing system)
  const [xpEarned, setXpEarned] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [showXpPopup, setShowXpPopup] = useState(false);

  // Timer for quest
  const [gameTime, setGameTime] = useState(0);

  // Canvas ref for background
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();

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
    if (!gameState.isPlaying || gameState.isGameOver) return;
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
    
    const obstacle: Obstacle = {
      id: obstacleIdRef.current++,
      x: GAME_WIDTH + Math.random() * 200,
      y: type === 'spike' ? GROUND_Y - 30 : GROUND_Y - 40,
      width: type === 'cactus' ? 30 : type === 'rock' ? 35 : 40,
      height: type === 'cactus' ? 50 : type === 'rock' ? 40 : 30,
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
    
    // Calculate XP (1 point = 1 XP, max 250 XP per game)
    const earnedXp = Math.min(gameState.score, 250);
    setXpEarned(earnedXp);
    
    const newTotalXp = totalXp + earnedXp;
    setTotalXp(newTotalXp);
    localStorage.setItem('runnerTotalXp', newTotalXp.toString());
    
    // Update high score
    if (gameState.score > gameState.highScore) {
      setGameState(prev => ({ ...prev, highScore: gameState.score }));
      localStorage.setItem('runnerHighScore', gameState.score.toString());
    }

    // Show XP popup
    setShowXpPopup(true);



    // Send XP to server (same API as your existing game)
    sendXpToServer(earnedXp);
  }, [gameState.score, gameState.highScore, totalXp]);

// Send XP to server (integrates with your existing system)
const sendXpToServer = async (xp: number) => {
  try {
    // Get wallet from localStorage or your auth system
    const walletAddress = localStorage.getItem('walletAddress') || 'guest'
    
    // Use XP API for direct leaderboard update
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
    } else {
      console.error('❌ Failed to award XP:', data.error);
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
      // Update runner physics
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

      // Update runner animation frame
      setRunnerFrame(prev => (prev + 1) % 8);

      // Update obstacles
      setObstacles(prev => {
        const newObstacles = prev
          .map(obs => ({ ...obs, x: obs.x - gameState.speed }))
          .filter(obs => obs.x > -100);
        
        // Spawn new obstacle
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

      // Update particles
      setParticles(prev => 
        prev
          .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - 1 }))
          .filter(p => p.life > 0)
      );

      // Update score and speed
      setGameState(prev => ({
        ...prev,
        score: prev.score + 1,
        distance: prev.distance + prev.speed,
        speed: Math.min(MAX_SPEED, prev.speed + SPEED_INCREMENT),
      }));

      // Update game time
      setGameTime(prev => prev + 1/60);

      // Check collision
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

  // Draw background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, '#0f0f1a');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
      const x = (i * 73 + gameState.distance * 0.1) % GAME_WIDTH;
      const y = (i * 37) % (GAME_HEIGHT / 2);
      const size = (i % 3) + 1;
      ctx.globalAlpha = 0.3 + (i % 5) * 0.1;
      ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;

    // Draw ground
    const groundGradient = ctx.createLinearGradient(0, GROUND_Y, 0, GAME_HEIGHT);
    groundGradient.addColorStop(0, '#2d2d44');
    groundGradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);

    // Draw ground line
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(GAME_WIDTH, GROUND_Y);
    ctx.stroke();

    // Draw moving ground details
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

  // Render obstacle based on type
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
            {/* Cactus shape */}
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
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0f0f1a] to-[#1a1a2e] text-white">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-pink-600/20" />
        <div className="relative max-w-6xl mx-auto px-4 py-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 mb-6"
          >
            <Zap className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">Endless Runner Challenge</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold mb-4"
          >
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Neon Runner
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 max-w-2xl mx-auto"
          >
            Jump over obstacles and survive as long as possible! Earn XP based on your score.
            <br />
            <span className="text-purple-400">Press SPACE or CLICK to jump</span>
          </motion.p>
        </div>
      </div>

      {/* Game Container */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Game Area */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900/50 border-gray-800 overflow-hidden">
              <CardContent className="p-0">
                {/* Game Canvas Container */}
                <div 
                  className="relative mx-auto"
                  style={{ 
                    width: '100%', 
                    maxWidth: GAME_WIDTH,
                    aspectRatio: `${GAME_WIDTH}/${GAME_HEIGHT}`
                  }}
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
                  <div className="absolute inset-0">
                    {/* Runner Character */}
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
    animate={!isJumping ? { y: [0, -3, 0] } : {}}
    transition={{ repeat: Infinity, duration: 0.3 }}
  >
    {/* Your Custom Character Image */}
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
                        className="absolute w-2 h-2 rounded-full"
                        style={{
                          left: particle.x,
                          top: particle.y,
                          backgroundColor: particle.color,
                          opacity: particle.life / 40,
                        }}
                      />
                    ))}

                    {/* Start Screen */}
                    {!gameState.isPlaying && !gameState.isGameOver && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <div className="text-center">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-6xl mb-4"
                          >
                            🏃
                          </motion.div>
                          <h2 className="text-3xl font-bold mb-2">Ready to Run?</h2>
                          <p className="text-gray-400 mb-6">Jump over obstacles and earn XP!</p>
                          <Button
                            onClick={startGame}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 text-lg"
                          >
                            <Play className="w-5 h-5 mr-2" />
                            Start Game
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Game Over Screen */}
                    {gameState.isGameOver && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-center"
                        >
                          <div className="text-6xl mb-4">💥</div>
                          <h2 className="text-4xl font-bold mb-2 text-red-400">Game Over!</h2>
                          <p className="text-2xl text-white mb-2">Score: {gameState.score}</p>
                          {gameState.score > gameState.highScore && (
                            <p className="text-yellow-400 mb-4">🎉 New High Score!</p>
                          )}
                          <Button
                            onClick={startGame}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 text-lg"
                          >
                            <RotateCcw className="w-5 h-5 mr-2" />
                            Play Again
                          </Button>
                        </motion.div>
                      </div>
                    )}
                  </div>

                  {/* Score Overlay */}
                  {gameState.isPlaying && (
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                      <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2">
                        <div className="text-sm text-gray-400">Score</div>
                        <div className="text-2xl font-bold text-white">{gameState.score}</div>
                      </div>
                      <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2">
                        <div className="text-sm text-gray-400">Speed</div>
                        <div className="text-2xl font-bold text-purple-400">
                          {gameState.speed.toFixed(1)}x
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Controls Hint */}
            <div className="mt-4 flex justify-center gap-4">
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
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  Your Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">High Score</span>
                  <span className="text-2xl font-bold text-yellow-400">{gameState.highScore}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">Total XP Earned</span>
                  <span className="text-2xl font-bold text-purple-400">{totalXp}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">Games Played</span>
                  <span className="text-2xl font-bold text-blue-400">
                    {Math.floor(totalXp / 125)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* XP Info */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  XP Rewards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
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
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-300">
                  <Target className="w-5 h-5" />
                  Quest Target
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-3">Score 500+ points in a single run!</p>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (gameState.score / 500) * 100)}%` }}
                  />
                </div>
                <p className="text-right text-sm text-gray-400 mt-1">
                  {gameState.score} / 500
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* XP Popup */}
      <Dialog open={showXpPopup} onOpenChange={setShowXpPopup}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              🎉 Game Complete!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <div className="text-5xl font-bold text-purple-400 mb-2">+{xpEarned} XP</div>
            <p className="text-gray-400">Earned from your run!</p>
            <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
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
              className="mt-6 bg-gradient-to-r from-purple-600 to-pink-600"
            >
              Awesome!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
