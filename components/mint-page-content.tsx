"use client"

import { NewMintInterface } from "@/components/new-mint-interface"
import { usePlatformStats } from "@/hooks/use-platform-stats"

export function MintPageContent() {
  const { stats, loading: statsLoading } = usePlatformStats()
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

            {/* AAPKA ORIGINAL MINT INTERFACE - NO CHANGE */}
            <NewMintInterface />

          </div>
        </div>
      </div>
    </div>
  )
}
