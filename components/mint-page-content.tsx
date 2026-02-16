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

            {/* Main Mint Interface - Two Column Layout */}
            <div className="grid lg:grid-cols-2 gap-8 mb-16">
              
              {/* Left Column - NFT Preview Card */}
              <div className="relative group">
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 overflow-hidden">
                  {/* RARE EDITION Badge */}
                  <div className="absolute -top-0 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 text-black px-6 py-2 rounded-b-xl font-bold text-sm uppercase tracking-wider flex items-center space-x-2 shadow-lg">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                      <span>RARE EDITION</span>
                    </div>
                  </div>

                  {/* NFT Image Container */}
                  <div className="mt-8 relative">
                    <div className="aspect-square rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center relative overflow-hidden">
                      {/* Placeholder for NFT Image */}
                      <div className="text-center">
                        <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center shadow-2xl">
                          <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <p className="text-gray-500 text-sm">Your NFT Character</p>
                      </div>
                      
                      {/* Overlay Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                      
                      {/* Collection Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h3 className="font-bold text-xl mb-1">RewardNFT Collection</h3>
                        <p className="text-gray-400 text-sm">Exclusive Rare Reward NFT #468</p>
                      </div>
                    </div>
                  </div>

                  {/* Collection Stats */}
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-sm">Collection</div>
                        <div className="text-xs text-gray-500">RewardNFT Genesis</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-semibold">Verified</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Mint Details */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold">Mint Details</h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-400 bg-white/5 px-3 py-1 rounded-full">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Limited Time</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                  <div className="flex justify-between text-sm mb-3">
                    <span className="text-gray-400">Mint Progress</span>
                    <span className="text-cyan-400 font-semibold">468 / 1000</span>
                  </div>
                  <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-full" style={{width: '46.8%'}}></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>46.8% Minted</span>
                    <span>532 Remaining</span>
                  </div>
                </div>

                {/* Details List */}
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center py-3 border-b border-white/5">
                    <span className="text-gray-400">Price per NFT</span>
                    <span className="text-xl font-bold">5 USDC</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/5">
                    <span className="text-gray-400">Mint Limit</span>
                    <span className="font-semibold">1 NFT per wallet</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/5">
                    <span className="text-gray-400">Network</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                      <span className="font-semibold">Solana</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-gray-400">Total Cost</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">5 USDC</span>
                  </div>
                </div>

                {/* Quantity Selector */}
                <div className="mb-6">
                  <label className="text-sm text-gray-400 mb-3 block">Quantity</label>
                  <div className="flex items-center space-x-4">
                    <button className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <input type="number" value="1" readOnly className="w-20 h-12 text-center bg-transparent text-2xl font-bold border-none focus:outline-none" />
                    <button className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Mint Button */}
                <button className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 py-4 rounded-xl font-bold text-lg flex items-center justify-center space-x-2 transition-all hover:shadow-[0_10px_40px_rgba(8,145,178,0.4)]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Connect Wallet to Mint</span>
                </button>

                <p className="text-center text-xs text-gray-500 mt-4">
                  By minting, you agree to our <a href="#" className="text-cyan-400 hover:underline">Terms of Service</a> and <a href="#" className="text-cyan-400 hover:underline">Privacy Policy</a>
                </p>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-colors">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-2">Secure Minting</h3>
                <p className="text-gray-400 text-sm">Smart contract audited and verified by leading security firms.</p>
              </div>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-colors">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-2">Exclusive Rewards</h3>
                <p className="text-gray-400 text-sm">Access to airdrops, quests, and special community events.</p>
              </div>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-colors">
                <div className="w-12 h-12 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-2">Mini-Game Access</h3>
                <p className="text-gray-400 text-sm">Play exclusive mini-games and earn additional rewards.</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
