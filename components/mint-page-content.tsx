"use client"

import { NewMintInterface } from "@/components/new-mint-interface"

export function MintPageContent() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-5xl font-bold">
              <span className="text-green-400">Mint</span>{" "}
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Your NFT
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Unlock exclusive access to rewards, referrals, quests, and our exciting mini-game.
            </p>
          </div>

          {/* Main Content */}
          <NewMintInterface />
        </div>
      </div>
    </div>
  )
}


