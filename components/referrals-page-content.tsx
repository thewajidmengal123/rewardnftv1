"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check, Copy, Share, MessageSquare, Mail, RefreshCw, Bug } from "lucide-react"
import { SocialShare } from "@/components/social-share"
import { ReferralHistory } from "@/components/referral-history"
import { useWallet } from "@/contexts/wallet-context"
import { ProtectedRoute } from "@/components/protected-route"
import { useFirebaseReferrals, useReferralCodeHandler } from "@/hooks/use-firebase-referrals"
import { FirebaseLeaderboard } from "@/components/firebase-leaderboard"

import { runAllFirebaseTests } from "@/utils/firebase-test"

export function ReferralsPageContent() {
  const { connected, publicKey } = useWallet()
  const [copied, setCopied] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)

  // Use Firebase hooks
  const {
    referralLink,
    stats,
    history,
    error,
    refreshData,
    loading,
  } = useFirebaseReferrals()

  // Handle referral codes in URL
  useReferralCodeHandler()

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRefresh = async () => {
    await refreshData()
  }

  const handleTest = async () => {
    if (!publicKey) return

    setTesting(true)
    try {
      const results = await runAllFirebaseTests(publicKey.toString())
      setTestResults(results)
      console.log("Firebase test results:", results)
    } catch (err) {
      console.error("Test failed:", err)
      setTestResults({ error: err instanceof Error ? err.message : "Test failed" })
    } finally {
      setTesting(false)
    }
  }

  // Format recent referrals for the history component
  const recentReferrals = history.map((ref) => ({
    address: ref.referredWallet,
    date: ref.createdAt.toDate().toLocaleDateString(),
    status: ref.status === "rewarded" ? ("completed" as const) : ("pending" as const),
    points: ref.rewardAmount,
  }))

  return (
    <ProtectedRoute requiresNFT={true}>
      <div className="min-h-screen p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold gradient-text mb-4">
              Referral Program
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Invite friends and earn 4 USDC for every successful referral. Build your network and maximize your rewards.
            </p>
          </div>

          {/* Main Content */}
          <main>
            {connected ? (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left Column - Referral Stats */}
                <div className="xl:col-span-2 space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="glass-card glass-card-hover p-6">
                      <div className="text-center">
                        <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                          {stats?.totalReferrals || 0}
                        </div>
                        <div className="text-sm text-gray-400 uppercase tracking-wide">Total Referrals</div>
                      </div>
                    </div>
                    <div className="glass-card glass-card-hover p-6">
                      <div className="text-center">
                        <div className="text-3xl md:text-4xl font-bold text-teal-400 mb-2">
                          {stats?.totalEarned || 0} USDC
                        </div>
                        <div className="text-sm text-gray-400 uppercase tracking-wide">Total Earned</div>
                      </div>
                    </div>
                    <div className="glass-card glass-card-hover p-6">
                      <div className="text-center">
                        <div className="text-3xl md:text-4xl font-bold text-cyan-400 mb-2">4 USDC</div>
                        <div className="text-sm text-gray-400 uppercase tracking-wide">Per Referral</div>
                      </div>
                    </div>
                  </div>

                  {/* Referral Link Card */}
                  <div className="glass-card p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Your Referral Link</h2>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-800/50 rounded-lg border border-gray-700 px-4 py-3 text-gray-300 text-sm font-mono overflow-hidden">
                        {referralLink || "Loading..."}
                      </div>
                      <Button
                        onClick={handleCopy}
                        size="sm"
                        className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-3"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Error Display */}
                  {error && (
                    <div className="glass-card p-6 border-red-500/20 bg-red-500/5">
                      <div className="text-red-400 mb-3">
                        <div className="font-semibold mb-2">⚠️ Connection Error</div>
                        <div className="text-sm">{error}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleRefresh}
                          disabled={loading}
                          className="bg-red-600/20 border-red-500/30 text-red-400 hover:bg-red-600/30"
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                          Retry
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleTest}
                          disabled={testing}
                          className="bg-blue-600/20 border-blue-500/30 text-blue-400 hover:bg-blue-600/30"
                        >
                          <Bug className={`h-4 w-4 mr-2 ${testing ? 'animate-pulse' : ''}`} />
                          Test Firebase
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Test Results Display */}
                  {testResults && (
                    <div className="glass-card p-6 border-blue-500/20 bg-blue-500/5">
                      <div className="text-blue-400">
                        <div className="font-semibold mb-2">🧪 Firebase Test Results</div>
                        <pre className="text-xs overflow-auto max-h-32 bg-gray-900/50 p-3 rounded border border-gray-700 text-gray-300">
                          {JSON.stringify(testResults, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Share Buttons */}
                  <div className="glass-card p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Share Your Link</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Button
                        className="bg-[#1DA1F2] hover:bg-[#1DA1F2]/90 text-white border-0 h-12"
                        onClick={() =>
                          window.open(
                            `https://twitter.com/intent/tweet?text=Join me on RewardNFT and earn rewards! ${encodeURIComponent(referralLink)}`,
                            "_blank",
                          )
                        }
                      >
                        <Share className="mr-2 h-4 w-4" /> Twitter
                      </Button>
                      <Button
                        className="bg-[#4267B2] hover:bg-[#4267B2]/90 text-white border-0 h-12"
                        onClick={() =>
                          window.open(
                            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
                            "_blank",
                          )
                        }
                      >
                        <MessageSquare className="mr-2 h-4 w-4" /> Facebook
                      </Button>
                      <Button
                        className="bg-[#EA4335] hover:bg-[#EA4335]/90 text-white border-0 h-12"
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
                  <div className="glass-card p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Recent Referrals</h2>
                    <ReferralHistory referrals={recentReferrals} />
                  </div>

                </div>

                {/* Right Column - Leaderboard & Quests */}
                <div className="space-y-6">
                  {/* Leaderboard */}
                  <div className="glass-card p-6">
                    <h2 className="text-2xl font-bold text-white mb-6">🏆 Leaderboard</h2>
                    <FirebaseLeaderboard
                      type="referrals"
                      limit={10}
                      showRefresh={true}
                      className="space-y-3"
                    />
                  </div>

                  {/* Quests Section */}
                  <div className="glass-card p-6">
                    <h2 className="text-2xl font-bold text-white mb-4">🎯 Quests</h2>
                    <p className="text-gray-300 mb-6">Complete quests to earn additional rewards and boost your ranking.</p>
                    <Button asChild className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white h-12 text-lg font-semibold">
                      <Link href="/quests">View All Quests</Link>
                    </Button>
                  </div>

                  {/* Social Share */}
                  <div className="glass-card p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">📱 Social Share</h2>
                    <SocialShare referralLink={referralLink} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-card p-12 text-center max-w-2xl mx-auto">
                <div className="mb-6">
                  <div className="w-20 h-20 bg-teal-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-4">Connect Your Wallet</h2>
                  <p className="text-lg text-gray-300 mb-8">
                    Connect your wallet and mint your exclusive NFT to access the referral program and start earning USDC rewards.
                  </p>
                </div>
                <Button size="lg" className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-8 py-3 text-lg font-semibold">
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
