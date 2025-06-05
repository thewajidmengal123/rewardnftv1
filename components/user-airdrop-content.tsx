"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Gift, Check, AlertCircle, Clock } from "lucide-react"
import { MobileNav } from "@/components/mobile-nav"
import { useWallet } from "@/contexts/wallet-context"
import { getAirdropsForRecipient, type Airdrop } from "@/utils/airdrop"
import { useToast } from "@/components/ui/use-toast"

export function UserAirdropContent() {
  const { connected, publicKey } = useWallet()
  const [airdrops, setAirdrops] = useState<
    Array<{
      airdrop: Airdrop
      recipient: {
        wallet: string
        amount: number
        transactionId?: string
        status: "pending" | "success" | "failed"
      }
    }>
  >([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Load airdrops when wallet is connected
  useEffect(() => {
    if (connected && publicKey) {
      loadAirdrops()
    }
  }, [connected, publicKey])

  // Load airdrops
  const loadAirdrops = async () => {
    if (!connected || !publicKey) return

    setLoading(true)

    try {
      const walletAddress = publicKey.toString()

      // Get airdrops for this recipient
      const userAirdrops = getAirdropsForRecipient(walletAddress)
      setAirdrops(userAirdrops)
    } catch (error) {
      console.error("Error loading airdrops:", error)
      toast({
        title: "Error",
        description: "Failed to load airdrops. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-400" />
      case "success":
        return <Check className="h-5 w-5 text-green-400" />
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-400" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#FFA500] via-[#FF5555] to-[#00C2FF]">
      {/* Header */}
     
      {/* Main Content */}
      <main className="flex-1 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold text-white mb-4">Airdrops</h1>
            <div className="text-3xl font-bold text-white mb-6">Coming Soon!</div>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Exciting airdrop campaigns are being prepared for our community.
              Stay tuned for exclusive token drops and special NFT rewards!
            </p>
          </div>

          {/* Coming Soon Card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 p-12 text-center">
            <div className="mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Gift className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Airdrop Program in Development</h2>
              <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                We're working on an amazing airdrop system that will reward our most active community members.
                Get ready for token rewards, exclusive NFTs, and special perks!
              </p>
            </div>

            {/* Features Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/5 rounded-xl p-6">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Token Rewards</h3>
                <p className="text-white/70 text-sm">
                  Earn USDC tokens through special airdrop events and community activities.
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-6">
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Exclusive NFTs</h3>
                <p className="text-white/70 text-sm">
                  Receive limited edition NFTs available only through airdrop campaigns.
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-6">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Community Perks</h3>
                <p className="text-white/70 text-sm">
                  Get special privileges and early access to new features and events.
                </p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="bg-gradient-to-r from-orange-900/30 to-pink-900/30 border border-orange-700/50 rounded-2xl p-6 mb-8">
              <h3 className="text-xl font-bold text-white mb-3">Get Ready for Airdrops!</h3>
              <p className="text-white/80 mb-4">
                Make sure you're eligible for future airdrops by staying active in our ecosystem.
              </p>

              {connected ? (
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button asChild size="lg" className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-black font-bold">
                    <Link href="/mint">Mint NFT</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                    <Link href="/referrals">Start Referring</Link>
                  </Button>
                </div>
              ) : (
                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold">
                  Connect Wallet
                </Button>
              )}
            </div>

            {/* Navigation */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                <Link href="/">Back to Home</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                <Link href="/quests">View Quests</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
