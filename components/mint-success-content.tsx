"use client"

import { NewMintInterface } from "@/components/new-mint-interface"
import { usePlatformStats } from "@/hooks/use-platform-stats"
import { useEffect, useRef, useState } from "react"

export function MintPageContent() {
  const { stats, loading: statsLoading } = usePlatformStats()
  const nftRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  // Mouse follow effect for 3D tilt
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!nftRef.current) return
      const rect = nftRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left - rect.width / 2) / 25
      const y = (e.clientY - rect.top - rect.height / 2) / 25
      setMousePosition({ x, y })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated background orbs - SAME AS ORIGINAL */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-64 h-64 rounded-full bg-brand-cyan/20 filter blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 rounded-full bg-brand-pink/20 filter blur-3xl animate-pulse" />
        <div className="absolute top-2/3 left-1/3 w-60 h-60 rounded-full bg-brand-yellow/20 filter blur-3xl animate-pulse" />
        <div className="absolute top-1/2 right-1/3 w-48 h-48 rounded-full bg-teal-400/15 filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Background gradient overlay - SAME */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-gray-900/60 to-black/80 z-0" />

      {/* Subtle grid pattern overlay - SAME */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
        backgroundSize: '20px 20px'
      }} />

      {/* Content */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            
            {/* Header - SCREENSHOT DESIGN */}
            <div className="text-center space-y-4 mb-12">
              {/* Live Badge */}
              <div className="flex justify-center mb-6">
                <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-sm text-gray-300 font-medium">Public Mint is Live</span>
                </div>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">Mint Your NFT</span>
                <br />
                <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent">
                  Unlock the Future
                </span>
              </h1>
              
              <div className="text-xl md:text-2xl font-bold text-yellow-400 mb-4">
                Exclusive Rewards Await
              </div>
              
              <p className="text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
                Join the RewardNFT ecosystem and experience exclusive rewards, referrals, quests, and our exciting mini-game.
              </p>
            </div>

            {/* Stats Section - SCREENSHOT DESIGN */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-4xl mx-auto">
              <div className="text-center bg-black/40 backdrop-blur-xl border border-gray-800/50 hover:border-cyan-500/30 rounded-xl p-6 transition-all duration-300">
                <div className="text-4xl font-bold text-cyan-400 mb-2">
                  {statsLoading ? "..." : `${stats?.nftsMinted || 0}+`}
                </div>
                <div className="text-gray-500 text-sm uppercase tracking-wider">NFTs MINTED</div>
              </div>
              <div className="text-center bg-black/40 backdrop-blur-xl border border-gray-800/50 hover:border-purple-500/30 rounded-xl p-6 transition-all duration-300">
                <div className="text-4xl font-bold text-purple-400 mb-2">
                  {statsLoading ? "..." : `${Math.floor((stats?.usdcEarned || 0) / 1000)}K+`}
                </div>
                <div className="text-gray-500 text-sm uppercase tracking-wider">USDC EARNED</div>
              </div>
              <div className="text-center bg-black/40 backdrop-blur-xl border border-gray-800/50 hover:border-pink-500/30 rounded-xl p-6 transition-all duration-300">
                <div className="text-4xl font-bold text-pink-400 mb-2">
                  {statsLoading ? "..." : `${stats?.activeUsers || 0}+`}
                </div>
                <div className="text-gray-500 text-sm uppercase tracking-wider">ACTIVE USERS</div>
              </div>
            </div>

            {/* NFT 3D Animation Wrapper */}
            <div 
              ref={nftRef}
              className="relative group"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              style={{ perspective: '1000px' }}
            >
              {/* Dynamic Glow Effect */}
              <div 
                className="absolute -inset-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition-all duration-500"
                style={{
                  transform: `translate(${mousePosition.x * 2}px, ${mousePosition.y * 2}px)`
                }}
              />
              
              {/* 3D Tilt Container */}
              <div 
                className="relative transition-transform duration-200 ease-out"
                style={{
                  transform: isHovering 
                    ? `rotateY(${mousePosition.x}deg) rotateX(${-mousePosition.y}deg)`
                    : 'rotateY(0deg) rotateX(0deg)',
                  transformStyle: 'preserve-3d'
                }}
              >
                {/* ORIGINAL NewMintInterface - NO CHANGES */}
                <NewMintInterface />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
