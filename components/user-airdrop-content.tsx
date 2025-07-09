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
    <div className="min-h-screen flex flex-col bg-black relative overflow-hidden">
      {/* Animated background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900/50 to-black" />
      <div className="absolute inset-0 bg-gradient-to-tr from-teal-900/10 via-transparent to-cyan-900/10" />
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-teal-900/20 via-transparent to-transparent" />
      <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />

      {/* Header */}

      {/* Main Content */}
      <main className="flex-1 py-12 px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white via-teal-100 to-cyan-100 bg-clip-text text-transparent">
                Airdrops
              </span>
            </h1>
            <div className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent mb-6">
              Coming Soon!
            </div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Exciting airdrop campaigns are being prepared for our community.
              Stay tuned for exclusive token drops and special NFT rewards!
            </p>
          </div>

          {/* Coming Soon Card */}
          <div className="bg-black/40 backdrop-blur-xl rounded-3xl border border-gray-800/50 p-12 text-center relative overflow-hidden">
            {/* Card background effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-teal-900/10 via-transparent to-cyan-900/10" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-500/5 via-transparent to-transparent" />

            <div className="mb-8 relative z-10">
              <div className="w-24 h-24 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-teal-500/30">
                <Gift className="w-12 h-12 text-teal-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Airdrop Program in Development</h2>
              <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
                We're working on an amazing airdrop system that will reward our most active community members.
                Get ready for token rewards, exclusive NFTs, and special perks!
              </p>
            </div>

            {/* Features Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 relative z-10">
              <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50 hover:border-teal-500/30 transition-all duration-300">
                <div className="w-12 h-12 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-teal-500/30">
                  <Gift className="w-6 h-6 text-teal-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Token Rewards</h3>
                <p className="text-gray-300 text-sm">
                  Earn USDC tokens through special airdrop events and community activities.
                </p>
              </div>

              <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50 hover:border-cyan-500/30 transition-all duration-300">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-cyan-500/30">
                  <Gift className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Exclusive NFTs</h3>
                <p className="text-gray-300 text-sm">
                  Receive limited edition NFTs available only through airdrop campaigns.
                </p>
              </div>

              <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50 hover:border-teal-500/30 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-teal-500/30">
                  <Gift className="w-6 h-6 text-teal-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Community Perks</h3>
                <p className="text-gray-300 text-sm">
                  Get special privileges and early access to new features and events.
                </p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="bg-gradient-to-r from-teal-900/20 to-cyan-900/20 border border-teal-500/30 rounded-2xl p-6 mb-8 relative z-10 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-white mb-3">Get Ready for Airdrops!</h3>
              <p className="text-gray-300 mb-4">
                Make sure you're eligible for future airdrops by staying active in our ecosystem.
              </p>

              {connected ? (
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button asChild size="lg" className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-black font-bold border-0">
                    <Link href="/mint">Mint NFT</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-teal-500/30 text-teal-400 hover:bg-teal-500/10 hover:border-teal-400">
                    <Link href="/referrals">Start Referring</Link>
                  </Button>
                </div>
              ) : (
                <Button size="lg" className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-black font-bold border-0">
                  Connect Wallet
                </Button>
              )}
            </div>

            {/* Navigation */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
              <Button asChild variant="outline" size="lg" className="border-gray-600 text-gray-300 hover:bg-gray-800/50 hover:border-gray-500">
                <Link href="/">Back to Home</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-gray-600 text-gray-300 hover:bg-gray-800/50 hover:border-gray-500">
                <Link href="/quests">View Quests</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
