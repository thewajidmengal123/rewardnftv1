"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check, Copy, Twitter, Facebook, Mail } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { SocialShare } from "@/components/social-share"
import { ReferralHistory } from "@/components/referral-history"
import { useWallet } from "@/contexts/wallet-context"
import {
  getReferralData,
  getReferralLink,
  initializeReferral,
  getTopReferrers,
  type ReferralData,
} from "@/utils/referral"
import { WalletAddress } from "@/components/wallet-address"
import { ProtectedRoute } from "@/components/protected-route"

export function ReferralsPageContent() {
  const { connected, publicKey } = useWallet()
  const [copied, setCopied] = useState(false)
  const [referralData, setReferralData] = useState<ReferralData | null>(null)
  const [referralLink, setReferralLink] = useState("")
  const [topReferrers, setTopReferrers] = useState<
    Array<{
      walletAddress: string
      totalReferrals: number
      totalEarned: number
    }>
  >([])

  // Initialize referral data when wallet is connected
  useEffect(() => {
    if (connected && publicKey) {
      const walletAddress = publicKey.toString()

      // Initialize referral data if it doesn't exist
      const data = getReferralData(walletAddress) || initializeReferral(walletAddress)
      setReferralData(data)

      // Get referral link
      const link = getReferralLink(walletAddress)
      setReferralLink(link)

      // Get top referrers
      const topRefs = getTopReferrers(5)
      setTopReferrers(topRefs)
    } else {
      setReferralData(null)
      setReferralLink("")
    }
  }, [connected, publicKey])

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Format recent referrals for the history component
  const recentReferrals =
    referralData?.referrals.map((ref) => ({
      address: ref.wallet,
      date: new Date(ref.timestamp).toLocaleDateString(),
      status: ref.paid ? ("completed" as const) : ("pending" as const),
      points: 10,
    })) || []

  return (
    <ProtectedRoute requireNft={true}>
      <div className="min-h-screen bg-gradient-to-br from-transparent to-indigo-900/20 p-6">
        <div className="max-w-7xl mx-auto bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 overflow-hidden">
          {/* Main Content */}
          <main className="p-6 md:p-10">
            {connected ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Referrals */}
                <div className="space-y-8">
                  <h1 className="text-5xl md:text-6xl font-bold text-white">Referrals</h1>

                  {/* Referral Link */}
                  <div className="space-y-2">
                    <h2 className="text-xl text-white">Your referral link</h2>
                    <div className="flex items-center">
                      <div className="bg-white/10 backdrop-blur-sm rounded-l-lg border border-white/20 py-3 px-4 flex-1 text-white overflow-hidden text-ellipsis">
                        {referralLink}
                      </div>
                      <button
                        onClick={handleCopy}
                        className="bg-white/10 backdrop-blur-sm rounded-r-lg border-t border-r border-b border-white/20 py-3 px-4 text-white hover:bg-white/20 transition-colors"
                      >
                        {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <p className="text-4xl font-bold text-white">{referralData?.totalReferrals || 0}</p>
                      <p className="text-white/80">Total Referrals</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-4xl font-bold text-white">{referralData?.totalEarned || 0} USDC</p>
                      <p className="text-white/80">Total Earned</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-4xl font-bold text-white">4 USDC</p>
                      <p className="text-white/80">per referral</p>
                    </div>
                  </div>

                  {/* Share Buttons */}
                  <div className="space-y-2">
                    <h2 className="text-xl text-white">Share your link</h2>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        className="bg-[#1DA1F2] hover:bg-[#1DA1F2]/90 text-white"
                        onClick={() =>
                          window.open(
                            `https://twitter.com/intent/tweet?text=Join me on RewardNFT and earn rewards! ${encodeURIComponent(referralLink)}`,
                            "_blank",
                          )
                        }
                      >
                        <Twitter className="mr-2 h-4 w-4" /> Twitter
                      </Button>
                      <Button
                        className="bg-[#4267B2] hover:bg-[#4267B2]/90 text-white"
                        onClick={() =>
                          window.open(
                            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
                            "_blank",
                          )
                        }
                      >
                        <Facebook className="mr-2 h-4 w-4" /> Facebook
                      </Button>
                      <Button
                        className="bg-[#EA4335] hover:bg-[#EA4335]/90 text-white"
                        onClick={() =>
                          window.open(
                            `mailto:?subject=Join me on RewardNFT&body=Check out this awesome NFT platform: ${encodeURIComponent(referralLink)}`,
                            "_blank",
                          )
                        }
                      >
                        <Mail className="mr-2 h-4 w-4" /> Email
                      </Button>
                    </div>
                  </div>

                  {/* Referral History */}
                  <ReferralHistory referrals={recentReferrals} />

                  {/* Quests Section */}
                  <div className="space-y-4 pt-4">
                    <h2 className="text-5xl font-bold text-white">Quests</h2>
                    <p className="text-white/80 text-lg">Complete quests to earn more rewards</p>
                    <Button asChild className="w-full bg-blue-500 hover:bg-blue-600 text-white text-lg py-6 rounded-lg">
                      <Link href="/quests">View Quests</Link>
                    </Button>
                  </div>
                </div>

                {/* Right Column - Leaderboard */}
                <div className="space-y-6">
                  <h2 className="text-5xl md:text-6xl font-bold text-white">Leaderboard</h2>

                  <div className="bg-gradient-to-br from-transparent to-indigo-900 text-white border-none rounded-xl p-4 space-y-4">
                    {topReferrers.length > 0 ? (
                      topReferrers.map((referrer, index) => (
                        <div key={index} className="flex items-center justify-between py-2">
                          <div className="flex items-center gap-3">
                            <Avatar
                              className={`bg-${["cyan", "green", "blue", "yellow", "orange"][index % 5]}-500 h-10 w-10`}
                            >
                              <AvatarFallback className="text-white">{index + 1}</AvatarFallback>
                            </Avatar>
                            <WalletAddress address={referrer.walletAddress} />
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-white font-bold text-xl">{referrer.totalReferrals} refs</span>
                            <span className="text-white/70 text-sm">{referrer.totalEarned} USDC</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-white/80 text-lg">No referrals yet. Be the first!</p>
                      </div>
                    )}
                  </div>

                  {/* Social Share */}
                  <SocialShare referralLink={referralLink} />
                </div>
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 p-12 text-center">
                <h2 className="text-3xl font-bold text-white mb-4">Connect Your Wallet to Access Referrals</h2>
                <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                  Mint your exclusive NFT and connect your wallet to access the referral program and start earning USDC
                  rewards.
                </p>
                <Button size="lg" className="bg-white hover:bg-white/90 text-black">
                  Connect Wallet
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
