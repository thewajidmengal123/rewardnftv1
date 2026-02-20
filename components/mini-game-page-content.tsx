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
  Gamepad2,
  Star,
  Award,
  Flame,
  Maximize2,
  Minimize2
} from "lucide-react";
import { useWallet } from "@/contexts/wallet-context";

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
const GROUND_Y = 380;
const RUNNER_WIDTH = 80;
const RUNNER_HEIGHT = 90;
const RUNNER_X = 150;
const GRAVITY = 0.8;
const JUMP_FORCE = -15;
const BASE_SPEED = 5;
const MAX_SPEED = 15;
const SPEED_INCREMENT = 0.002;

export default function MiniGamePageContent() {
  const { publicKey } = useWallet()

  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isGameOver: false,
    score: 0,
    highScore: 0,
    speed: BASE_SPEED,
    distance: 0,
  });

  const [runnerY, setRunnerY] = useState(GROUND_Y - RUNNER_HEIGHT);
  const [runnerVy, setRunnerVy] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [xpEarned, setXpEarned] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [showXpPopup, setShowXpPopup] = useState(false);
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const obstacleIdRef = useRef(0);
  const particleIdRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const touchStartTimeRef = useRef<number>(0);
  const jumpPressedRef = useRef<boolean>(false);

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem('runnerHighScore');
    if (saved) setGameState(prev => ({ ...prev, highScore: parseInt(saved) }));
    const savedXp = localStorage.getItem('runnerTotalXp');
    if (savedXp) setTotalXp(parseInt(savedXp));
  }, []);

  // ============================================
  // FIXED: Optimized jump with immediate response
  // ============================================

  const triggerJump = useCallback(() => {
    if (!isJumping && gameState.isPlaying && !gameState.isGameOver) {
      setRunnerVy(JUMP_FORCE);
      setIsJumping(true);
      createJumpParticles();
    }
  }, [isJumping, gameState.isPlaying, gameState.isGameOver]);

  const handleGameAreaTouch = useCallback((e: TouchEvent) => {
    if (isButtonPressed) return;

    if (gameState.isPlaying && !gameState.isGameOver) {
      e.preventDefault();
      triggerJump();
    }
  }, [gameState.isPlaying, gameState.isGameOver, isButtonPressed, triggerJump]);

  const jump = useCallback(() => {
    if (!gameState.isPlaying || gameState.isGameOver) return;
    triggerJump();
  }, [gameState.isPlaying, gameState.isGameOver, triggerJump]);

  const createJumpParticles = () => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 6; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x: RUNNER_X + RUNNER_WIDTH / 2,
        y: GROUND_Y,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 4 - 1,
        life: 25,
        color: ['#a855f7', '#3b82f6', '#ec4899'][Math.floor(Math.random() * 3)],
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  const createCollisionParticles = (x: number, y: number) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 12; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x, y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        life: 35,
        color: ['#ef4444', '#f97316', '#eab308'][Math.floor(Math.random() * 3)],
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  // ============================================
  // FIXED: Start game with proper state reset
  // ============================================
  const startGame = useCallback(() => {
    // Cancel any existing animation frame
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = undefined;
    }

    // Reset all game state
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
    lastTimeRef.current = performance.now();
    setIsButtonPressed(false);
  }, [gameState.highScore]);

  const spawnObstacle = useCallback(() => {
    const types: Obstacle['type'][] = ['cactus', 'rock', 'spike'];
    const type = types[Math.floor(Math.random() * types.length)];

    let obstacleHeight: number;
    let obstacleWidth: number;

    switch (type) {
      case 'cactus':
        obstacleHeight = 50;
        obstacleWidth = 30;
        break;
      case 'rock':
        obstacleHeight = 35;
        obstacleWidth = 35;
        break;
      case 'spike':
        obstacleHeight = 30;
        obstacleWidth = 25;
        break;
    }

    const obstacleY = GROUND_Y - obstacleHeight;

    const obstacle: Obstacle = {
      id: obstacleIdRef.current++,
      x: GAME_WIDTH + 50 + Math.random() * 150,
      y: obstacleY,
      width: obstacleWidth,
      height: obstacleHeight,
      type,
    };

    setObstacles(prev => [...prev, obstacle]);
  }, []);

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

  const checkCollision = useCallback(() => {
    const runnerHitbox = {
      x: RUNNER_X + 15,
      y: runnerY + 10,
      width: RUNNER_WIDTH - 30,
      height: RUNNER_HEIGHT - 20,
    };

    for (const obstacle of obstacles) {
      const obstacleHitbox = {
        x: obstacle.x + 5,
        y: obstacle.y + 5,
        width: obstacle.width - 10,
        height: obstacle.height - 10,
      };

      if (
        runnerHitbox.x < obstacleHitbox.x + obstacleHitbox.width &&
        runnerHitbox.x + runnerHitbox.width > obstacleHitbox.x &&
        runnerHitbox.y < obstacleHitbox.y + obstacleHitbox.height &&
        runnerHitbox.y + runnerHitbox.height > obstacleHitbox.y
      ) {
        createCollisionParticles(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
        gameOver();
        return true;
      }
    }
    return false;
  }, [obstacles, runnerY, gameOver]);

  // ============================================
  // FIXED: requestAnimationFrame for smooth 60fps
  // ============================================
  useEffect(() => {
    if (!gameState.isPlaying) return;

    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      // Physics update with delta time normalization (assuming 60fps baseline)
      const timeScale = deltaTime / 16.67;

      setRunnerY(prev => {
        let newY = prev + runnerVy * timeScale;
        let newVy = runnerVy + GRAVITY * timeScale;

        if (newY >= GROUND_Y - RUNNER_HEIGHT) {
          newY = GROUND_Y - RUNNER_HEIGHT;
          newVy = 0;
          setIsJumping(false);
        }

        setRunnerVy(newVy);
        return newY;
      });

      setObstacles(prev => {
        const newObstacles = prev
          .map(obs => ({ ...obs, x: obs.x - gameState.speed * timeScale }))
          .filter(obs => obs.x > -100);

        const lastObs = newObstacles[newObstacles.length - 1];
        const minGap = 250 + Math.random() * 200;

        if (!lastObs || lastObs.x < GAME_WIDTH - minGap) {
          if (Math.random() < 0.02 + gameState.speed * 0.001) {
            spawnObstacle();
          }
        }

        return newObstacles;
      });

      setParticles(prev => 
        prev
          .map(p => ({ ...p, x: p.x + p.vx * timeScale, y: p.y + p.vy * timeScale, life: p.life - 1 * timeScale }))
          .filter(p => p.life > 0)
      );

      setGameState(prev => ({
        ...prev,
        score: prev.score + 1,
        distance: prev.distance + prev.speed * timeScale,
        speed: Math.min(MAX_SPEED, prev.speed + SPEED_INCREMENT * timeScale),
      }));

      checkCollision();

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState.isPlaying, gameState.speed, runnerVy, checkCollision, spawnObstacle]);

  // Keyboard controls with debouncing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!jumpPressedRef.current) {
          jumpPressedRef.current = true;
          jump();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        jumpPressedRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [jump]);

  // Touch controls for game area only
  useEffect(() => {
    const gameContainer = gameContainerRef.current;
    if (!gameContainer) return;

    const handleTouchStart = (e: TouchEvent) => {
      handleGameAreaTouch(e);
    };

    gameContainer.addEventListener('touchstart', handleTouchStart, { passive: false });

    return () => {
      gameContainer.removeEventListener('touchstart', handleTouchStart);
    };
  }, [handleGameAreaTouch]);

  // ============================================
  // FIXED: Fullscreen handling with iOS/Phantom fallbacks
  // ============================================

  const toggleFullscreen = useCallback(async () => {
    const container = gameContainerRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        // Try standard fullscreen API
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if ((container as any).webkitRequestFullscreen) {
          await (container as any).webkitRequestFullscreen();
        } else {
          // Fallback: maximize viewport on iOS/Phantom
          container.style.position = 'fixed';
          container.style.top = '0';
          container.style.left = '0';
          container.style.width = '100vw';
          container.style.height = '100vh';
          container.style.zIndex = '9999';
          document.body.style.overflow = 'hidden';
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else {
          // Reset fallback styles
          container.style.position = '';
          container.style.top = '';
          container.style.left = '';
          container.style.width = '';
          container.style.height = '';
          container.style.zIndex = '';
          document.body.style.overflow = '';
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      console.log('Fullscreen not supported, using viewport maximization');
      // Toggle viewport maximization fallback
      if (!isFullscreen) {
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100vw';
        container.style.height = '100vh';
        container.style.zIndex = '9999';
        document.body.style.overflow = 'hidden';
        setIsFullscreen(true);
      } else {
        container.style.position = '';
        container.style.top = '';
        container.style.left = '';
        container.style.width = '';
        container.style.height = '';
        container.style.zIndex = '';
        document.body.style.overflow = '';
        setIsFullscreen(false);
      }
    }
  }, [isFullscreen]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Draw background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, '#0a0a0f');
    gradient.addColorStop(0.5, '#0f0f1a');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 60; i++) {
      const x = ((i * 73 + gameState.distance * 0.05) % (GAME_WIDTH + 100)) - 50;
      const y = (i * 37) % (GAME_HEIGHT * 0.6);
      const size = (i % 3) + 0.5;
      const opacity = 0.2 + (i % 5) * 0.15;
      ctx.globalAlpha = opacity;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    const groundGradient = ctx.createLinearGradient(0, GROUND_Y, 0, GAME_HEIGHT);
    groundGradient.addColorStop(0, '#2d2d44');
    groundGradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);

    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#a855f7';
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(GAME_WIDTH, GROUND_Y);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 15; i++) {
      const x = ((i * 80 - gameState.distance) % (GAME_WIDTH + 160)) - 80;
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y + 15);
      ctx.lineTo(x + 40, GROUND_Y + 15);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }, [gameState.distance]);

  const renderObstacle = (obstacle: Obstacle) => {
    const leftPercent = (obstacle.x / GAME_WIDTH) * 100;
    const topPercent = (obstacle.y / GAME_HEIGHT) * 100;
    const widthPercent = (obstacle.width / GAME_WIDTH) * 100;
    const heightPercent = (obstacle.height / GAME_HEIGHT) * 100;

    switch (obstacle.type) {
      case 'cactus':
        return (
          <div
            key={obstacle.id}
            className="absolute"
            style={{
              left: `${leftPercent}%`,
              top: `${topPercent}%`,
              width: `${widthPercent}%`,
              height: `${heightPercent}%`,
            }}
          >
            <div className="relative w-full h-full">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[40%] h-full bg-gradient-to-t from-green-700 to-green-500 rounded-full shadow-lg shadow-green-500/30" />
              <div className="absolute bottom-[30%] left-0 w-[35%] h-[40%] bg-gradient-to-r from-green-700 to-green-500 rounded-full origin-bottom-right rotate-[-25deg]" />
              <div className="absolute bottom-[40%] right-0 w-[35%] h-[35%] bg-gradient-to-l from-green-700 to-green-500 rounded-full origin-bottom-left rotate-[25deg]" />
            </div>
          </div>
        );
      case 'rock':
        return (
          <div
            key={obstacle.id}
            className="absolute"
            style={{
              left: `${leftPercent}%`,
              top: `${topPercent}%`,
              width: `${widthPercent}%`,
              height: `${heightPercent}%`,
            }}
          >
            <div className="w-full h-full bg-gradient-to-br from-gray-600 via-gray-500 to-gray-700 rounded-lg shadow-lg shadow-gray-500/20 transform rotate-2" />
          </div>
        );
      case 'spike':
        return (
          <div
            key={obstacle.id}
            className="absolute"
            style={{
              left: `${leftPercent}%`,
              top: `${topPercent}%`,
              width: `${widthPercent}%`,
              height: `${heightPercent}%`,
            }}
          >
            <div className="w-full h-full flex items-end justify-center gap-[10%]">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[25px] border-l-transparent border-r-transparent border-b-red-500 drop-shadow-lg"
                  style={{ 
                    borderBottomWidth: `${heightPercent * 0.8}vh`,
                    borderLeftWidth: `${widthPercent * 0.25}vw`,
                    borderRightWidth: `${widthPercent * 0.25}vw`,
                  }}
                />
              ))}
            </div>
          </div>
        );
    }
  };

  // ============================================
  // FIXED: Button handlers with proper touch support
  // ============================================

  const handleStartGame = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsButtonPressed(true);
    startGame();
    setTimeout(() => setIsButtonPressed(false), 100);
  };

  const handlePlayAgain = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsButtonPressed(true);
    startGame();
    setTimeout(() => setIsButtonPressed(false), 100);
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
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-2xl blur opacity-30" />

              <Card className="relative bg-gray-900/80 border-purple-500/30 backdrop-blur-xl overflow-hidden">
                <CardContent className="p-0">
                  <div 
                    ref={gameContainerRef}
                    id="game-container"
                    className="relative w-full select-none bg-black"
                    style={{ 
                      aspectRatio: isFullscreen ? 'auto' : '2/1', 
                      height: isFullscreen ? '100vh' : 'auto',
                      maxHeight: isFullscreen ? '100vh' : '500px'
                    }}
                  >
                    {/* Fullscreen Toggle Button */}
                    <button
                      onClick={toggleFullscreen}
                      className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/70 rounded-lg border border-white/20 transition-all hover:scale-110"
                      title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                    >
                      {isFullscreen ? (
                        <Minimize2 className="w-5 h-5 text-white" />
                      ) : (
                        <Maximize2 className="w-5 h-5 text-white" />
                      )}
                    </button>

                    <canvas
                      ref={canvasRef}
                      width={GAME_WIDTH}
                      height={GAME_HEIGHT}
                      className="absolute inset-0 w-full h-full"
                    />

                    <div className="absolute inset-0 overflow-hidden">
                      {/* Character */}
                      {(gameState.isPlaying || gameState.isGameOver) && (
                        <motion.div
                          className="absolute z-20"
                          style={{
                            left: `${(RUNNER_X / GAME_WIDTH) * 100}%`,
                            top: `${(runnerY / GAME_HEIGHT) * 100}%`,
                            width: `${(RUNNER_WIDTH / GAME_WIDTH) * 100}%`,
                            height: `${(RUNNER_HEIGHT / GAME_HEIGHT) * 100}%`,
                          }}
                          animate={gameState.isPlaying && !isJumping ? { 
                            scaleY: [1, 0.95, 1],
                            y: [0, 2, 0]
                          } : {}}
                          transition={{ repeat: Infinity, duration: 0.15 }}
                        >
                          <img 
                            src="/images/character-jump.png"
                            alt="Runner"
                            className="w-full h-full object-contain"
                            style={{
                              filter: 'drop-shadow(0 0 15px rgba(168, 85, 247, 0.6))',
                            }}
                            draggable={false}
                          />
                        </motion.div>
                      )}

                      {!gameState.isPlaying && !gameState.isGameOver && (
                        <motion.div
                          className="absolute z-20"
                          style={{
                            left: `${(RUNNER_X / GAME_WIDTH) * 100}%`,
                            top: `${((GROUND_Y - RUNNER_HEIGHT) / GAME_HEIGHT) * 100}%`,
                            width: `${(RUNNER_WIDTH / GAME_WIDTH) * 100}%`,
                            height: `${(RUNNER_HEIGHT / GAME_HEIGHT) * 100}%`,
                          }}
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                        >
                          <img 
                            src="/images/character-jump.png"
                            alt="Runner"
                            className="w-full h-full object-contain"
                            style={{
                              filter: 'drop-shadow(0 0 15px rgba(168, 85, 247, 0.6))',
                            }}
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
                          className="absolute rounded-full pointer-events-none z-30"
                          style={{
                            left: `${(particle.x / GAME_WIDTH) * 100}%`,
                            top: `${(particle.y / GAME_HEIGHT) * 100}%`,
                            width: '6px',
                            height: '6px',
                            backgroundColor: particle.color,
                            opacity: particle.life / 40,
                            boxShadow: `0 0 6px ${particle.color}`,
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
                            className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-40"
                          >
                            <motion.div
                              animate={{ scale: [1, 1.05, 1] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                            >
                              <h2 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                                Ready to Run?
                              </h2>
                            </motion.div>
                            <p className="text-gray-400 mb-6 text-sm md:text-base">Jump over obstacles and earn XP!</p>

                            <Button
                              onClick={handleStartGame}
                              onTouchStart={(e) => {
                                e.stopPropagation();
                                setIsButtonPressed(true);
                              }}
                              onTouchEnd={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleStartGame(e);
                              }}
                              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold px-8 py-6 text-lg rounded-full shadow-lg shadow-purple-500/25 transition-all hover:scale-105 active:scale-95 touch-manipulation"
                              style={{ touchAction: 'manipulation' }}
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
                            className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md z-50"
                          >
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: "spring", stiffness: 200 }}
                              className="text-5xl md:text-6xl mb-4"
                            >
                              💥
                            </motion.div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-2 text-red-400">Game Over!</h2>
                            <p className="text-xl md:text-2xl text-white mb-2 font-bold">Score: {gameState.score}</p>
                            {gameState.score > gameState.highScore && (
                              <motion.p 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-yellow-400 mb-4 flex items-center gap-2 font-semibold"
                              >
                                <Trophy className="w-5 h-5" />
                                New High Score!
                              </motion.p>
                            )}

                            <Button
                              onClick={handlePlayAgain}
                              onTouchStart={(e) => {
                                e.stopPropagation();
                                setIsButtonPressed(true);
                              }}
                              onTouchEnd={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handlePlayAgain(e);
                              }}
                              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold px-8 py-6 text-lg rounded-full shadow-lg shadow-cyan-500/25 transition-all hover:scale-105 active:scale-95 touch-manipulation"
                              style={{ touchAction: 'manipulation' }}
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
                        className="absolute top-3 left-3 right-3 flex justify-between items-start pointer-events-none z-30"
                      >
                        <div className="bg-black/70 backdrop-blur-md rounded-xl px-4 py-2 border border-purple-500/40 shadow-lg shadow-purple-500/20">
                          <div className="text-xs text-purple-300 uppercase tracking-wider font-semibold">Score</div>
                          <div className="text-2xl md:text-3xl font-bold text-white">
                            {gameState.score}
                          </div>
                        </div>
                        <div className="bg-black/70 backdrop-blur-md rounded-xl px-4 py-2 border border-cyan-500/40 shadow-lg shadow-cyan-500/20">
                          <div className="text-xs text-cyan-300 uppercase tracking-wider font-semibold">Speed</div>
                          <div className="text-2xl md:text-3xl font-bold text-cyan-400">
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
              <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-500/40 rounded-xl p-3 text-center shadow-lg shadow-purple-500/10">
                <div className="text-purple-300 text-xs mb-1 uppercase tracking-wider font-semibold">Current</div>
                <div className="text-xl md:text-2xl font-bold text-white">{gameState.score}</div>
              </div>
              <div className="bg-gradient-to-br from-pink-900/50 to-pink-800/30 border border-pink-500/40 rounded-xl p-3 text-center shadow-lg shadow-pink-500/10">
                <div className="text-pink-300 text-xs mb-1 uppercase tracking-wider font-semibold">Best</div>
                <div className="text-xl md:text-2xl font-bold text-white">{Math.max(gameState.highScore, gameState.score)}</div>
              </div>
              <div className="bg-gradient-to-br from-cyan-900/50 to-cyan-800/30 border border-cyan-500/40 rounded-xl p-3 text-center shadow-lg shadow-cyan-500/10">
                <div className="text-cyan-300 text-xs mb-1 uppercase tracking-wider font-semibold">XP Earned</div>
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
              <Card className="bg-gray-900/70 border-purple-500/30 backdrop-blur-xl overflow-hidden shadow-xl shadow-purple-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    Your Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all hover:bg-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                        <Flame className="w-4 h-4 text-orange-400" />
                      </div>
                      <span className="text-gray-300 text-sm font-medium">High Score</span>
                    </div>
                    <span className="text-2xl font-bold text-yellow-400">{gameState.highScore}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all hover:bg-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-purple-400" />
                      </div>
                      <span className="text-gray-300 text-sm font-medium">Total XP</span>
                    </div>
                    <span className="text-2xl font-bold text-purple-400">{totalXp}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all hover:bg-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <Gamepad2 className="w-4 h-4 text-cyan-400" />
                      </div>
                      <span className="text-gray-300 text-sm font-medium">Games Played</span>
                    </div>
                    <span className="text-2xl font-bold text-cyan-400">
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
              <Card className="bg-gray-900/70 border-green-500/30 backdrop-blur-xl overflow-hidden shadow-xl shadow-green-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                      <Award className="w-5 h-5 text-white" />
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
                    <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group hover:bg-white/10 transition-all hover:border-green-500/30">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${reward.color} flex items-center justify-center shadow-lg opacity-80 group-hover:opacity-100 transition-all group-hover:scale-110`}>
                          <reward.icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-gray-300 text-sm font-medium">{reward.label}</span>
                      </div>
                      <span className="text-green-400 font-bold text-sm">+{reward.xp} XP</span>
                    </div>
                  ))}

                  <div className="flex justify-between items-center p-3 rounded-xl border border-green-500/30 bg-green-500/10">
                    <span className="text-gray-300 text-sm flex items-center gap-2 font-medium">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      Per 10 points
                    </span>
                    <span className="text-green-400 font-bold text-sm">+1 XP</span>
                  </div>

                  <div className="text-center p-3 bg-white/5 rounded-xl border border-white/5">
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
              <Card className="bg-gray-900/70 border-orange-500/30 backdrop-blur-xl overflow-hidden relative shadow-xl shadow-orange-500/5">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl" />

                <CardHeader className="pb-3 relative">
                  <CardTitle className="flex items-center gap-2 text-lg text-orange-300">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    Quest Target
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-gray-300 text-sm mb-3 font-medium">Score 500+ points in a single run!</p>

                  <div className="relative h-4 bg-black/50 rounded-full overflow-hidden border border-white/10">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (gameState.score / 500) * 100)}%` }}
                      transition={{ type: "spring", stiffness: 100 }}
                    />
                  </div>

                  <div className="flex justify-between mt-2">
                    <span className="text-gray-500 text-xs">Progress</span>
                    <span className="text-orange-400 font-bold text-sm">{Math.min(gameState.score, 500)} / 500</span>
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
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-gray-400 text-sm">Final Score</span>
                <span className="text-white font-bold text-lg">{gameState.score}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-gray-400 text-sm">Total XP</span>
                <span className="text-purple-400 font-bold text-lg">{totalXp}</span>
              </div>
            </div>

            <Button
              onClick={() => setShowXpPopup(false)}
              className="mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold px-8 py-3 rounded-full shadow-lg shadow-purple-500/25"
            >
              Awesome!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
