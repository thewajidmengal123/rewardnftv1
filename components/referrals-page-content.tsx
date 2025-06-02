"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check, Copy, Share, MessageSquare, Mail, RefreshCw, Bug } from "lucide-react"
import { SocialShare } from "@/components/social-share"
import { ReferralHistory } from "@/components/referral-history"
import { useWallet } from "@/contexts/wallet-context"
import { ProtectedRoute } from "@/components/protected-route"
import { useFirebaseReferrals, useReferralCodeHandler } from "@/hooks/use-firebase-referrals"
import { FirebaseLeaderboard } from "@/components/firebase-leaderboard"
import { Alert, AlertDescription } from "@/components/ui/alert"
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

                  {/* Error Display */}
                  {error && (
                    <Alert className="mb-4 bg-red-500/10 border-red-500/20">
                      <AlertDescription className="text-red-400">
                        {error}
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleRefresh}
                            disabled={loading}
                            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                          >
                            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                            Retry
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleTest}
                            disabled={testing}
                            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                          >
                            <Bug className={`h-4 w-4 mr-1 ${testing ? 'animate-pulse' : ''}`} />
                            Test Firebase
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Test Results Display */}
                  {testResults && (
                    <Alert className="mb-4 bg-blue-500/10 border-blue-500/20">
                      <AlertDescription className="text-blue-400">
                        <div className="font-semibold mb-2">Firebase Test Results:</div>
                        <pre className="text-xs overflow-auto max-h-32 bg-black/20 p-2 rounded">
                          {JSON.stringify(testResults, null, 2)}
                        </pre>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <p className="text-4xl font-bold text-white">{stats?.totalReferrals || 0}</p>
                      <p className="text-white/80">Total Referrals</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-4xl font-bold text-white">{stats?.totalEarned || 0} USDC</p>
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
                        <Share className="mr-2 h-4 w-4" /> Twitter
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
                        <MessageSquare className="mr-2 h-4 w-4" /> Facebook
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

                  <FirebaseLeaderboard
                    type="referrals"
                    limit={10}
                    showRefresh={true}
                    className="space-y-4"
                  />

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
