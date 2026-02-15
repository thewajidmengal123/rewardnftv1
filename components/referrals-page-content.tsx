"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  Check, 
  Copy, 
  Share, 
  MessageSquare, 
  Mail, 
  RefreshCw, 
  Bug,
  Users,
  Wallet,
  BarChart3,
  Link as LinkIcon,
  Trophy,
  Gift,
  TrendingUp,
  Activity
} from "lucide-react"
import { SocialShare } from "@/components/social-share"
import { ReferralHistory } from "@/components/referral-history"
import { useWallet } from "@/contexts/wallet-context"
import { ProtectedRoute } from "@/components/protected-route"
import { useFirebaseReferrals, useReferralCodeHandler } from "@/hooks/use-firebase-referrals"
import { useUserReferrals } from "@/hooks/use-user-referrals"
import { FirebaseLeaderboard } from "@/components/firebase-leaderboard"

export function ReferralsPageContent() {
  const { connected, publicKey } = useWallet()
  const [copied, setCopied] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  // Use comprehensive user referrals hook
  const {
    data: userReferralData,
    stats,
    history,
    referredUsers,
    loading,
    error,
    refresh,
    getReferralLink,
  } = useUserReferrals(publicKey?.toString() || null)

  // Use Firebase hooks for referral link and code handling
  const {
    referralLink: fallbackReferralLink,
    refreshData,
  } = useFirebaseReferrals()

  // Handle referral codes in URL
  useReferralCodeHandler()

  // Use the referral link from the comprehensive hook or fallback
  const referralLink = userReferralData?.user?.referralCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/mint?ref=${userReferralData.user.referralCode}`
    : fallbackReferralLink

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRefresh = async () => {
    await refresh()
    await refreshData()
  }

  // Add test referral data for debugging
  const handleAddTestReferral = async () => {
    if (!publicKey) return

    try {
      const response = await fetch("/api/test-referrals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create-test-referral",
          walletAddress: publicKey.toString(),
        }),
      })

      const result = await response.json()

      if (result.success) {
        console.log("Test referral added successfully:", result)
        await refreshData()
      } else {
        console.error("Failed to add test referral:", result.error)
      }
    } catch (err) {
      console.error("Error adding test referral:", err)
    }
  }

  // Test Firebase connection
  const handleTestConnection = async () => {
    if (!publicKey) return

    setTesting(true)
    try {
      const response = await fetch(`/api/test-referrals?wallet=${publicKey.toString()}`)
      const result = await response.json()

      console.log("Firebase connection test result:", result)
      setTestResults(result)
    } catch (err) {
      console.error("Error testing connection:", err)
      setTestResults({ error: err instanceof Error ? err.message : "Test failed" })
    } finally {
      setTesting(false)
    }
  }

  // Complete test referral
  const handleCompleteTestReferral = async () => {
    if (!publicKey) return

    try {
      const response = await fetch("/api/test-referrals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "complete-test-referral",
          walletAddress: publicKey.toString(),
        }),
      })

      const result = await response.json()

      if (result.success) {
        console.log("Test referral completed successfully:", result)
        await refreshData()
      } else {
        console.error("Failed to complete test referral:", result.error)
      }
    } catch (err) {
      console.error("Error completing test referral:", err)
    }
  }

  // Debug referrals calculation
  const handleDebugReferrals = async () => {
    if (!publicKey) return

    try {
      const response = await fetch("/api/test-referrals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "debug-referrals",
          walletAddress: publicKey.toString(),
        }),
      })

      const result = await response.json()

      if (result.success) {
        console.log("Debug referrals result:", result.debug)
        setTestResults(result.debug)
      } else {
        console.error("Failed to debug referrals:", result.error)
      }
    } catch (err) {
      console.error("Error debugging referrals:", err)
    }
  }

  // Format recent referrals for the history component using history data directly
  const recentReferrals = history.map((historyEntry) => {
    const userData = referredUsers.find(user => user.walletAddress === historyEntry.referredWallet)

    return {
      address: historyEntry.referredWallet,
      displayName: userData?.displayName || `User ${historyEntry.referredWallet.slice(0, 8)}`,
      date: historyEntry.createdAt?.toDate ? historyEntry.createdAt.toDate().toLocaleDateString() : new Date().toLocaleDateString(),
      status: historyEntry.status === "rewarded" || historyEntry.status === "completed" ? "completed" as const : "pending" as const,
      points: historyEntry.rewardAmount || 4,
      nftsMinted: (userData?.nftsMinted && userData.nftsMinted > 0) ? 1 : 0,
      totalEarned: userData?.totalEarned || 0,
      lastActive: userData?.lastActive,
      referralId: historyEntry.id,
      referralStatus: historyEntry.status,
    }
  })

  console.log("Referral data debug:", {
    connected,
    publicKey: publicKey?.toString(),
    stats,
    historyCount: history.length,
    referredUsersCount: referredUsers.length,
    recentReferralsCount: recentReferrals.length,
    error,
    loading,
    userReferralData,
    rawHistory: history,
    rawReferredUsers: referredUsers,
    formattedReferrals: recentReferrals
  })

  console.log("🔍 Formatted referrals for display:", recentReferrals)

  return (
    <ProtectedRoute requiresNFT={true}>
      <div className="min-h-screen p-4 md:p-6 lg:p-8" style={{
        background: '#0a0a0f',
        backgroundImage: `
          radial-gradient(circle at 20% 50%, rgba(6, 182, 212, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 50%)
        `
      }}>
        <style jsx>{`
          .glass-card {
            background: rgba(255, 255, 255, 0.02);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.06);
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
          }
          .glass-card-hover:hover {
            background: rgba(255, 255, 255, 0.04);
            border-color: rgba(6, 182, 212, 0.3);
            box-shadow: 0 8px 32px 0 rgba(6, 182, 212, 0.1);
            transform: translateY(-2px);
          }
          .gradient-border {
            position: relative;
            background: rgba(255, 255, 255, 0.02);
            border-radius: 16px;
          }
          .gradient-border::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 16px;
            padding: 1px;
            background: linear-gradient(135deg, rgba(6, 182, 212, 0.5), rgba(139, 92, 246, 0.3), transparent);
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            pointer-events: none;
          }
          .stat-value {
            background: linear-gradient(135deg, #fff 0%, #a5f3fc 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .glow-text {
            text-shadow: 0 0 20px rgba(6, 182, 212, 0.5);
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
        `}</style>

        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10 animate-float">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
              <Gift className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400 text-sm font-medium">Earn Rewards</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 glow-text">
              Referral Program
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Invite friends to join the RewardNFT platform. Track your referrals and build your network.
            </p>
          </div>

          {/* Main Content */}
          <main>
            {connected ? (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Column - Referral Stats */}
                <div className="xl:col-span-2 space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-card glass-card-hover rounded-2xl p-6 gradient-border transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                          <Users className="w-6 h-6 text-cyan-400" />
                        </div>
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Total Referrals</span>
                      </div>
                      <div className="stat-value text-4xl font-bold mb-1">
                        {stats?.totalReferrals || 0}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span className="text-green-400">+0%</span>
                        <span>from last month</span>
                      </div>
                    </div>

                    <div className="glass-card glass-card-hover rounded-2xl p-6 gradient-border transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                          <Wallet className="w-6 h-6 text-purple-400" />
                        </div>
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Total Referrals</span>
                      </div>
                      <div className="stat-value text-4xl font-bold mb-1">
                        {stats?.totalReferrals || 0}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Activity className="w-4 h-4 text-purple-400" />
                        <span>5 USDC per referral</span>
                      </div>
                    </div>

                    <div className="glass-card glass-card-hover rounded-2xl p-6 gradient-border transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                          <BarChart3 className="w-6 h-6 text-emerald-400" />
                        </div>
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Analytics</span>
                      </div>
                      <div className="stat-value text-4xl font-bold mb-1">Analytics</div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        <span>Tracking Only</span>
                      </div>
                    </div>
                  </div>

                  {/* Referral Link Card */}
                  <div className="glass-card rounded-2xl p-6 md:p-8 gradient-border">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 rounded-lg bg-cyan-500/10">
                        <LinkIcon className="w-5 h-5 text-cyan-400" />
                      </div>
                      <h2 className="text-xl font-semibold text-white">Your Referral Link</h2>
                      <Button
                        onClick={handleRefresh}
                        size="sm"
                        variant="outline"
                        disabled={loading}
                        className="ml-auto bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50"
                      >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                    
                    <div className="relative mb-6">
                      <input 
                        type="text" 
                        value={referralLink || "Loading..."} 
                        readOnly
                        className="w-full bg-black/30 border border-gray-700 rounded-xl px-4 py-4 pr-32 text-gray-300 font-mono text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                      />
                      <Button
                        onClick={handleCopy}
                        size="sm"
                        className={`absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-lg border text-sm font-medium flex items-center gap-2 transition-all duration-300 ${
                          copied 
                            ? "bg-green-500/20 border-green-500/50 text-green-400" 
                            : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
                        }`}
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        <span>{copied ? "Copied!" : "Copy"}</span>
                      </Button>
                    </div>

                    {/* Share Buttons */}
                    <div className="space-y-3">
                      <p className="text-sm text-gray-500 mb-3">Share via</p>
                      <div className="grid grid-cols-3 gap-3">
                        <Button
                          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white font-medium hover:bg-[#1DA1F2] hover:border-[#1DA1F2] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg h-auto"
                          onClick={() =>
                            window.open(
                              `https://x.com/intent/tweet?text=Join me on RewardNFT and earn rewards! ${encodeURIComponent(referralLink)} @RewardNFT_ #RewardNFT #NFT #Solana`,
                              "_blank",
                            )
                          }
                        >
                          <Share className="h-4 w-4" /> <span className="hidden sm:inline">Twitter</span>
                        </Button>
                        <Button
                          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white font-medium hover:bg-[#4267B2] hover:border-[#4267B2] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg h-auto"
                          onClick={() =>
                            window.open(
                              `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
                              "_blank",
                            )
                          }
                        >
                          <MessageSquare className="h-4 w-4" /> <span className="hidden sm:inline">Facebook</span>
                        </Button>
                        <Button
                          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white font-medium hover:bg-[#EA4335] hover:border-[#EA4335] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg h-auto"
                          onClick={() =>
                            window.open(
                              `mailto:?subject=Join me on RewardNFT&body=Check out this awesome NFT platform: ${encodeURIComponent(referralLink)}`,
                              "_blank",
                            )
                          }
                        >
                          <Mail className="h-4 w-4" /> <span className="hidden sm:inline">Email</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Test Results Display */}
                  {testResults && (
                    <div className="glass-card rounded-2xl p-6 border-blue-500/20 bg-blue-500/5">
                      <div className="text-blue-400">
                        <div className="font-semibold mb-2">🧪 Firebase Test Results</div>
                        <pre className="text-xs overflow-auto max-h-32 bg-gray-900/50 p-3 rounded border border-gray-700 text-gray-300">
                          {JSON.stringify(testResults, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Referral History */}
                  <div className="glass-card rounded-2xl p-6 gradient-border">
                    <ReferralHistory referrals={recentReferrals} />
                  </div>
                </div>

                {/* Right Column - Leaderboard & Quests */}
                <div className="space-y-6">
                  {/* Leaderboard */}
                  <div className="glass-card rounded-2xl p-6 gradient-border lg:sticky lg:top-4">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 rounded-lg bg-yellow-500/10">
                        <Trophy className="w-5 h-5 text-yellow-400" />
                      </div>
                      <h2 className="text-xl font-semibold text-white">Leaderboard</h2>
                    </div>
                    <FirebaseLeaderboard
                      type="referrals"
                      limit={10}
                      showRefresh={true}
                      className="space-y-3"
                    />
                  </div>

                  {/* Quests Section */}
                  <div className="glass-card rounded-2xl p-6 gradient-border">
                    <h2 className="text-2xl font-bold text-white mb-4">🎯 Quests</h2>
                    <p className="text-gray-300 mb-6">Complete quests to earn additional rewards and boost your ranking.</p>
                    <Button asChild className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white h-12 text-lg font-semibold rounded-xl">
                      <Link href="/quests">View All Quests</Link>
                    </Button>
                  </div>

                  {/* Social Share */}
                  <div className="glass-card rounded-2xl p-6 gradient-border">
                    <h2 className="text-xl font-semibold text-white mb-4">📱 Social Share</h2>
                    <SocialShare referralLink={referralLink} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-12 text-center max-w-2xl mx-auto gradient-border">
                <div className="mb-6">
                  <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-cyan-500/30">
                    <svg className="w-10 h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-4">Connect Your Wallet</h2>
                  <p className="text-lg text-gray-300 mb-8">
                    Connect your wallet and mint your exclusive NFT to access the referral program and start earning USDC rewards.
                  </p>
                </div>
                <Button size="lg" className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-8 py-3 text-lg font-semibold rounded-xl">
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
