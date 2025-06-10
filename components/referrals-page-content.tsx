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
    await refreshData() // Also refresh the fallback data
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
        await refreshData() // Refresh to show new data
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
        await refreshData() // Refresh to show new data
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
    // Find corresponding user data if available
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

  // Debug logging
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
                          {(stats?.totalReferrals * 4 || 0).toFixed(2)} USDC
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
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-white">Your Referral Link</h2>
                      <Button
                        onClick={handleRefresh}
                        size="sm"
                        variant="outline"
                        disabled={loading}
                        className="bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50"
                      >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
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
                  {/* {error && (
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
                          onClick={handleTestConnection}
                          disabled={testing}
                          className="bg-blue-600/20 border-blue-500/30 text-blue-400 hover:bg-blue-600/30"
                        >
                          <Bug className={`h-4 w-4 mr-2 ${testing ? 'animate-pulse' : ''}`} />
                          Test Connection
                        </Button>
                        {process.env.NODE_ENV === 'development' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleAddTestReferral}
                              className="bg-green-600/20 border-green-500/30 text-green-400 hover:bg-green-600/30"
                            >
                              Add Test Referral
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCompleteTestReferral}
                              className="bg-orange-600/20 border-orange-500/30 text-orange-400 hover:bg-orange-600/30"
                            >
                              Complete Test Referral
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleDebugReferrals}
                              className="bg-purple-600/20 border-purple-500/30 text-purple-400 hover:bg-purple-600/30"
                            >
                              Debug Calculation
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                if (publicKey) {
                                  try {
                                    const response = await fetch('/api/admin/data-maintenance', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        action: 'sync-single-user',
                                        walletAddress: publicKey.toString()
                                      })
                                    })
                                    const result = await response.json()
                                    console.log('Sync result:', result)
                                    await handleRefresh()
                                  } catch (err) {
                                    console.error('Sync error:', err)
                                  }
                                }
                              }}
                              className="bg-cyan-600/20 border-cyan-500/30 text-cyan-400 hover:bg-cyan-600/30"
                            >
                              Sync User Data
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                if (publicKey) {
                                  try {
                                    const response = await fetch(`/api/debug/referral-status?wallet=${encodeURIComponent(publicKey.toString())}`)
                                    const result = await response.json()
                                    console.log('🔍 Referral Debug Result:', result)
                                    setTestResults(result.debug)
                                  } catch (err) {
                                    console.error('Debug error:', err)
                                  }
                                }
                              }}
                              className="bg-pink-600/20 border-pink-500/30 text-pink-400 hover:bg-pink-600/30"
                            >
                              Debug Referral Status
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                if (publicKey) {
                                  try {
                                    const response = await fetch('/api/debug/referral-status', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        action: 'fix-user-profile',
                                        walletAddress: publicKey.toString()
                                      })
                                    })
                                    const result = await response.json()
                                    console.log('🔧 Fix Result:', result)
                                    if (result.success) {
                                      await handleRefresh()
                                    }
                                  } catch (err) {
                                    console.error('Fix error:', err)
                                  }
                                }
                              }}
                              className="bg-yellow-600/20 border-yellow-500/30 text-yellow-400 hover:bg-yellow-600/30"
                            >
                              Fix Referral Link
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                if (publicKey && userReferralData?.user?.referralCode) {
                                  const testWallet = "TestWallet" + Date.now()
                                  try {
                                    const response = await fetch('/api/debug/referral-status', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        action: 'track-referral',
                                        walletAddress: testWallet,
                                        referralCode: userReferralData.user.referralCode
                                      })
                                    })
                                    const result = await response.json()
                                    console.log('🧪 Test Track Result:', result)
                                    if (result.success) {
                                      await handleRefresh()
                                    }
                                  } catch (err) {
                                    console.error('Test track error:', err)
                                  }
                                }
                              }}
                              className="bg-indigo-600/20 border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/30"
                            >
                              Test Track Referral
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )} */}

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
                            `https://x.com/intent/tweet?text=Join me on RewardNFT and earn rewards! ${encodeURIComponent(referralLink)} @RewardNFT_ #RewardNFT #NFT #Solana`,
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
                    <ReferralHistory referrals={recentReferrals} />

                    {/* Debug info for development */}
               
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
