"use client"

import { NewMintInterface } from "@/components/new-mint-interface"

export function MintPageContent() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background gradient overlay - matching reference design */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900/50 to-black z-0" />

      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
        backgroundSize: '20px 20px'
      }} />

      {/* Floating NFT Images with better positioning */}
      <div className="absolute top-20 right-10 w-32 h-32 opacity-10 animate-pulse">
        <img
          src="https://images.unsplash.com/photo-1634926878768-2a5b3c42f139?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3"
          alt="NFT"
          className="w-full h-full object-cover rounded-2xl border border-teal-500/20"
        />
      </div>
      <div className="absolute top-40 left-10 w-24 h-24 opacity-8 animate-pulse delay-1000">
        <img
          src="https://images.unsplash.com/photo-1617791160536-598cf32026fb?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3"
          alt="NFT"
          className="w-full h-full object-cover rounded-2xl border border-teal-500/20"
        />
      </div>
      <div className="absolute bottom-32 right-20 w-28 h-28 opacity-6 animate-pulse delay-2000">
        <img
          src="https://images.unsplash.com/photo-1578632292335-df3abbb0d586?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3"
          alt="NFT"
          className="w-full h-full object-cover rounded-2xl border border-teal-500/20"
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header - matching reference design */}
            <div className="text-center space-y-6 mb-16">
              <h1 className="text-6xl font-bold leading-tight">
                <span className="text-white">Mint Your</span>{" "}
                <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  NFT
                </span>
              </h1>
              <div className="text-2xl font-bold text-gray-300 mb-4">
                Unlock Exclusive Rewards
              </div>
              <p className="text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">
                Join the RewardNFT ecosystem and experience exclusive rewards, referrals, quests, and our exciting mini-game.
              </p>
            </div>

            {/* Stats Section - matching reference design colors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="text-center bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-xl p-6">
                <div className="text-4xl font-bold text-teal-400 mb-2">500+</div>
                <div className="text-gray-400 text-lg">NFTs MINTED</div>
              </div>
              <div className="text-center bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-xl p-6">
                <div className="text-4xl font-bold text-cyan-400 mb-2">50K+</div>
                <div className="text-gray-400 text-lg">USDC EARNED</div>
              </div>
              <div className="text-center bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-xl p-6">
                <div className="text-4xl font-bold text-teal-300 mb-2">1000+</div>
                <div className="text-gray-400 text-lg">ACTIVE USERS</div>
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


