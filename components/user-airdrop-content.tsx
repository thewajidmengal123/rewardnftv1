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
      <header className="w-full py-4 px-6 bg-black/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-12 w-12 bg-[#00FFE0] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">R</span>
            </div>
            <span className="text-white font-bold text-2xl">Reward NFT</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/mint" className="text-white hover:text-white/80 transition-colors">
              Mint
            </Link>
            <Link href="/referrals" className="text-white hover:text-white/80 transition-colors">
              Referrals
            </Link>
            <Link href="/quests" className="text-white hover:text-white/80 transition-colors">
              Quests
            </Link>
            <Link href="/airdrops" className="text-white/80 font-medium border-b-2 border-white">
              Airdrops
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Button asChild variant="outline" className="hidden sm:flex border-white/30 text-white hover:bg-white/10">
              <Link href="/profile">My Profile</Link>
            </Button>
            <Button className={connected ? "bg-white/10 text-white border border-white/30" : "bg-white text-black"}>
              {connected ? "Disconnect" : "Connect Wallet"}
            </Button>
            <MobileNav />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-5xl font-bold text-white mb-2">Airdrops</h1>
              <p className="text-xl text-white/80">View your airdrops and rewards</p>
            </div>
          </div>

          {connected ? (
            <div className="space-y-6">
              {airdrops.length > 0 ? (
                airdrops.map(({ airdrop, recipient }) => (
                  <div
                    key={airdrop.id}
                    className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 hover:border-white/40 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="bg-white/10 rounded-full p-3">
                        <Gift className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className="text-xl font-bold text-white">{airdrop.name}</h3>
                          <div className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded-full">
                            {getStatusIcon(recipient.status)}
                            <span className="text-white text-sm capitalize">{recipient.status}</span>
                          </div>
                        </div>
                        <p className="text-white/80 mt-1 mb-4">{airdrop.description}</p>

                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-white/60 text-sm">Amount</p>
                              <p className="text-white font-medium">
                                {recipient.amount} {airdrop.type === "token" ? "USDC" : "NFT"}
                              </p>
                            </div>
                            <div>
                              <p className="text-white/60 text-sm">Date</p>
                              <p className="text-white font-medium">
                                {new Date(airdrop.completedAt || airdrop.scheduledAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          {recipient.transactionId && (
                            <div>
                              <p className="text-white/60 text-sm">Transaction ID</p>
                              <p className="text-white font-medium truncate">{recipient.transactionId}</p>
                            </div>
                          )}

                          {recipient.status === "success" ? (
                            <div className="bg-green-500/20 text-green-400 rounded-full px-3 py-1 text-sm flex items-center w-fit">
                              <Check className="h-4 w-4 mr-1" /> Received
                            </div>
                          ) : recipient.status === "pending" ? (
                            <div className="bg-yellow-500/20 text-yellow-400 rounded-full px-3 py-1 text-sm flex items-center w-fit">
                              <Clock className="h-4 w-4 mr-1" /> Processing
                            </div>
                          ) : (
                            <div className="bg-red-500/20 text-red-400 rounded-full px-3 py-1 text-sm flex items-center w-fit">
                              <AlertCircle className="h-4 w-4 mr-1" /> Failed
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 p-12 text-center">
                  <h2 className="text-3xl font-bold text-white mb-4">No Airdrops Yet</h2>
                  <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                    You haven't received any airdrops yet. Complete quests and refer friends to become eligible for
                    airdrops.
                  </p>
                  <div className="flex flex-wrap gap-4 justify-center">
                    <Button asChild size="lg" className="bg-white hover:bg-white/90 text-black">
                      <Link href="/quests">Complete Quests</Link>
                    </Button>
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/10"
                    >
                      <Link href="/referrals">Refer Friends</Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 p-12 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Connect Your Wallet to View Airdrops</h2>
              <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                Connect your wallet to view your airdrops and rewards.
              </p>
              <Button size="lg" className="bg-white hover:bg-white/90 text-black">
                Connect Wallet
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
