"use client"

import { NewMintInterface } from "@/components/new-mint-interface"
import { usePlatformStats } from "@/hooks/use-platform-stats"
import { useEffect, useRef, useState } from "react"

export function MintPageContent() {
  const { stats, loading: statsLoading } = usePlatformStats()
  const nftRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Mouse follow effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!nftRef.current) return
      const rect = nftRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left - rect.width / 2) / 20
      const y = (e.clientY - rect.top - rect.height / 2) / 20
      setMousePosition({ x, y })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-cyan-500/20 filter blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-purple-500/20 filter blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-2/3 left-1/3 w-80 h-80 rounded-full bg-pink-500/15 filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full bg-teal-400/15 filter blur-[100px] animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-gray-900/80 to-black/90 z-0" />

      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
        backgroundSize: '30px 30px'
      }} />

      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            
            {/* Live Badge */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm text-gray-300 font-medium">Public Mint is Live</span>
              </div>
            </div>

            {/* Header */}
            <div className="text-center space-y-6 mb-16">
              <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">Mint Your NFT</span>
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
                  Unlock the Future
                </span>
              </h1>
              <div className="text-2xl font-bold bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-400 bg-clip-text text-transparent mb-4">
                Exclusive Rewards Await
              </div>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
                Join the RewardNFT ecosystem and experience exclusive rewards, referrals, quests, and our exciting mini-game.
              </p>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-4xl mx-auto">
              <div className="text-center bg-white/5 backdrop-blur-xl border border-white/10 hover:border-cyan-500/30 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(34,211,238,0.1)]">
                <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
                  {statsLoading ? "..." : `${stats?.nftsMinted || 0}+`}
                </div>
                <div className="text-gray-500 text-sm uppercase tracking-wider font-semibold">NFTs Minted</div>
              </div>
              <div className="text-center bg-white/5 backdrop-blur-xl border border-white/10 hover:border-purple-500/30 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(168,85,247,0.1)]">
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                  {statsLoading ? "..." : `${Math.floor((stats?.usdcEarned || 0) / 1000)}K+`}
                </div>
                <div className="text-gray-500 text-sm uppercase tracking-wider font-semibold">USDC Earned</div>
              </div>
              <div className="text-center bg-white/5 backdrop-blur-xl border border-white/10 hover:border-pink-500/30 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(236,72,153,0.1)]">
                <div className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent mb-2">
                  {statsLoading ? "..." : `${stats?.activeUsers || 0}+`}
                </div>
                <div className="text-gray-500 text-sm uppercase tracking-wider font-semibold">Active Users</div>
              </div>
            </div>

            {/* Main Content - NewMintInterface with Animation Wrapper */}
            <div className="grid lg:grid-cols-2 gap-8 items-start">
              
              {/* Left Side - Animated NFT Card */}
              <div 
                ref={nftRef}
                className="relative group perspective-1000"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              >
                {/* Dynamic Glow Effect */}
                <div 
                  className="absolute -inset-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-30 group-hover:opacity-60 transition-all duration-500"
                  style={{
                    transform: `translate(${mousePosition.x * 2}px, ${mousePosition.y * 2}px)`
                  }}
                />
                
                {/* 3D Card Container */}
                <div 
                  className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 overflow-hidden transition-transform duration-200 ease-out"
                  style={{
                    transform: isHovering 
                      ? `rotateY(${mousePosition.x}deg) rotateX(${-mousePosition.y}deg) scale(1.02)`
                      : 'rotateY(0deg) rotateX(0deg) scale(1)',
                    transformStyle: 'preserve-3d'
                  }}
                >
                  {/* RARE Badge */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                    <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 text-black px-6 py-2 rounded-full font-bold text-sm uppercase tracking-wider flex items-center space-x-2 shadow-lg animate-bounce">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                      <span>RARE</span>
                    </div>
                  </div>

                  {/* NFT Image with Fallback */}
                  <div className="mt-12 relative" style={{ transform: 'translateZ(50px)' }}>
                    <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 relative">
                      {!imageError ? (
                        <img 
                          src="/nft-character.png" 
                          alt="RewardNFT Character"
                          className="w-full h-full object-cover animate-float"
                          onError={() => setImageError(true)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="animate-float">
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center shadow-2xl">
                              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Shine Effect */}
                      <div 
                        className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{
                          transform: `translateX(${mousePosition.x * 10}px) translateY(${mousePosition.y * 10}px)`
                        }}
                      />
                    </div>
                  </div>

                  {/* Collection Info */}
                  <div className="mt-6" style={{ transform: 'translateZ(30px)' }}>
                    <h3 className="font-bold text-2xl mb-1">RewardNFT Collection</h3>
                    <p className="text-gray-400 text-sm">Exclusive Rare Reward NFT</p>
                  </div>
                </div>
              </div>

              {/* Right Side - Original NewMintInterface (Wallet + Mint Functionality) */}
              <div className="relative">
                <NewMintInterface />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(2deg);
          }
        }
        .perspective-1000 {
          perspective: 1000px;
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
