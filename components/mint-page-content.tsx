"use client"

import { NewMintInterface } from "@/components/new-mint-interface"

export function MintPageContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white relative overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-900/20 via-black to-cyan-900/20 z-0" />

      {/* Floating NFT Images */}
      <div className="absolute top-20 right-10 w-32 h-32 opacity-20 animate-pulse">
        <img
          src="https://images.unsplash.com/photo-1634926878768-2a5b3c42f139?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3"
          alt="NFT"
          className="w-full h-full object-cover rounded-2xl"
        />
      </div>
      <div className="absolute top-40 left-10 w-24 h-24 opacity-15 animate-pulse delay-1000">
        <img
          src="https://images.unsplash.com/photo-1617791160536-598cf32026fb?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3"
          alt="NFT"
          className="w-full h-full object-cover rounded-2xl"
        />
      </div>
      <div className="absolute bottom-32 right-20 w-28 h-28 opacity-10 animate-pulse delay-2000">
        <img
          src="https://images.unsplash.com/photo-1578632292335-df3abbb0d586?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3"
          alt="NFT"
          className="w-full h-full object-cover rounded-2xl"
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center space-y-6 mb-16">
              <h1 className="text-6xl font-bold leading-tight">
                <span className="text-green-400">Mint Your</span>{" "}
                <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                  NFT
                </span>
              </h1>
              <div className="text-2xl font-bold text-white mb-4">
                Unlock the Future
              </div>
              <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Join the RewardNFT ecosystem and experience exclusive rewards, referrals, quests, and our exciting mini-game.
              </p>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">500+</div>
                <div className="text-gray-300 text-lg">NFTs MINTED</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-yellow-400 mb-2">50K+</div>
                <div className="text-gray-300 text-lg">USDC EARNED</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-red-400 mb-2">1000+</div>
                <div className="text-gray-300 text-lg">ACTIVE USERS</div>
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


