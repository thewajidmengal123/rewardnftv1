"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/contexts/wallet-context"
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { Gamepad2, Trophy, Star, Zap } from "lucide-react"

export function MiniGamePageContent() {
  const { connected } = useWallet()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white relative overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 z-0" />
      
      {/* Floating game elements */}
      <div className="absolute top-20 right-10 w-16 h-16 opacity-20 animate-bounce">
        <Gamepad2 className="w-full h-full text-purple-400" />
      </div>
      <div className="absolute top-40 left-10 w-12 h-12 opacity-15 animate-pulse delay-1000">
        <Trophy className="w-full h-full text-yellow-400" />
      </div>
      <div className="absolute bottom-32 right-20 w-14 h-14 opacity-10 animate-pulse delay-2000">
        <Star className="w-full h-full text-cyan-400" />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            {/* Header */}
            <div className="space-y-6 mb-16">
              <div className="flex justify-center mb-8">
                <div className="w-32 h-32 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                  <Gamepad2 className="w-16 h-16 text-white" />
                </div>
              </div>
              
              <h1 className="text-6xl font-bold leading-tight">
                <span className="text-purple-400">Mini</span>{" "}
                <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Games
                </span>
              </h1>
              
              <div className="text-3xl font-bold text-white mb-4">
                Coming Soon!
              </div>
              
              <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Get ready for exciting mini-games where you can compete with other players, 
                earn rewards, and climb the leaderboards. Epic gaming experiences are on the way!
              </p>
            </div>

            {/* Features Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
                <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Compete & Win</h3>
                <p className="text-gray-300">
                  Battle other players in skill-based mini-games and earn USDC rewards for your victories.
                </p>
              </div>
              
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
                <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Daily Challenges</h3>
                <p className="text-gray-300">
                  Complete daily challenges and special events to earn bonus rewards and exclusive NFTs.
                </p>
              </div>
              
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
                <div className="w-16 h-16 bg-cyan-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Power-Ups</h3>
                <p className="text-gray-300">
                  Use your NFTs to unlock special power-ups and abilities that give you an edge in games.
                </p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-700/50 rounded-2xl p-8 mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">Stay Tuned!</h2>
              <p className="text-lg text-gray-300 mb-6">
                Mini-games are currently in development. Make sure you have minted your NFT to get early access when they launch!
              </p>
              
              {connected ? (
                <div className="space-y-4">
                  <Button 
                    asChild
                    size="lg" 
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold h-12 text-lg px-8"
                  >
                    <Link href="/mint">Mint Your NFT</Link>
                  </Button>
                  <div className="text-sm text-gray-400">
                    NFT holders will get exclusive early access to mini-games!
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <WalletConnectButton 
                    size="lg" 
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold h-12 text-lg px-8"
                  />
                  <div className="text-sm text-gray-400">
                    Connect your wallet to get ready for mini-games!
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild
                variant="outline" 
                size="lg"
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <Link href="/">Back to Home</Link>
              </Button>
              <Button 
                asChild
                variant="outline" 
                size="lg"
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <Link href="/post-mint-game">Play Post-Mint Game</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
