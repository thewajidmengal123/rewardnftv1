"use client"

import { NewMintInterface } from "@/components/new-mint-interface"
import { usePlatformStats } from "@/hooks/use-platform-stats"

export function MintPageContent() {
  const { stats, loading: statsLoading } = usePlatformStats()
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated background orbs - matching reference design */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Cyan orb - top left */}
        <div className="absolute top-1/4 -left-20 w-64 h-64 rounded-full bg-brand-cyan/20 filter blur-3xl animate-pulse" />

        {/* Pink orb - bottom right */}
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 rounded-full bg-brand-pink/20 filter blur-3xl animate-pulse" />

        {/* Yellow orb - center */}
        <div className="absolute top-2/3 left-1/3 w-60 h-60 rounded-full bg-brand-yellow/20 filter blur-3xl animate-pulse" />

        {/* Additional teal orb for more depth */}
        <div className="absolute top-1/2 right-1/3 w-48 h-48 rounded-full bg-teal-400/15 filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-gray-900/60 to-black/80 z-0" />

      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
        backgroundSize: '20px 20px'
      }} />

      {/* Content */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header - matching reference design */}
            <div className="text-center space-y-6 mb-16">
              <h1 className="text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-white via-cyan-100 to-teal-100 bg-clip-text text-transparent">Mint Your</span>{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 bg-clip-text text-transparent">
                  NFT
                </span>
                <br />
                <span className="bg-gradient-to-r from-teal-300 via-cyan-300 to-white bg-clip-text text-transparent">
                  Unlock the Future
                </span>
              </h1>
              <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent mb-4">
                Exclusive Rewards Await
              </div>
              <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Join the RewardNFT ecosystem and experience exclusive rewards, referrals, quests, and our exciting mini-game.
              </p>
            </div>

            {/* Stats Section - Real data from backend */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="text-center bg-black/40 backdrop-blur-xl border border-gray-800/50 hover:border-cyan-500/30 rounded-xl p-6 transition-all duration-300">
                <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent mb-2">
                  {statsLoading ? "..." : `${stats?.nftsMinted || 0}+`}
                </div>
                <div className="text-gray-300 text-lg font-medium">NFTs MINTED</div>
              </div>
              <div className="text-center bg-black/40 backdrop-blur-xl border border-gray-800/50 hover:border-teal-500/30 rounded-xl p-6 transition-all duration-300">
                <div className="text-4xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                  {statsLoading ? "..." : `${Math.floor((stats?.usdcEarned || 0) / 1000)}K+`}
                </div>
                <div className="text-gray-300 text-lg font-medium">USDC EARNED</div>
              </div>
              <div className="text-center bg-black/40 backdrop-blur-xl border border-gray-800/50 hover:border-cyan-500/30 rounded-xl p-6 transition-all duration-300">
                <div className="text-4xl font-bold bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent mb-2">
                  {statsLoading ? "..." : `${stats?.activeUsers || 0}+`}
                </div>
                <div className="text-gray-300 text-lg font-medium">ACTIVE USERS</div>
              </div>
            </div>

            {/* Main Content */}
            <NewMintInterface />
          </div>
        </div>
      </div>
    </div>
  )
}
