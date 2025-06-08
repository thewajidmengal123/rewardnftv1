"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useWallet } from "@/contexts/wallet-context"
import { WalletConnectButton } from "@/components/wallet-connect-button"

// Remove profile service import - we'll fetch directly from APIs
import { Loader2, Trophy, Gift, Users, Star, ExternalLink, Copy } from "lucide-react"
import { getExplorerUrl } from "@/config/solana"

// Define profile interface for direct API usage
interface UserProfile {
  address: string
  nfts: Array<{
    mint: string
    name: string
    image: string
    attributes: Array<{ trait_type: string; value: string }>
  }>
  stats: {
    totalNFTs: number
    questsCompleted: number
    referrals: number
    points: number
    rank: number
  }
  activities: Array<{
    id: string
    type: "mint" | "quest" | "referral" | "reward"
    title: string
    description: string
    timestamp: string
    points?: number
  }>
  referralCode: string
  referralStats: {
    totalReferrals: number
    activeReferrals: number
    totalEarned: number
  }
}

export function ProfilePageContent() {
  const { connected, publicKey, connecting } = useWallet()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [error, setError] = useState("")

  useEffect(() => {
    if (connected && publicKey) {
      loadProfile()
    }
  }, [connected, publicKey])

  const loadProfile = async () => {
    if (!publicKey) return

    setLoading(true)
    setError("")

    try {
      const walletAddress = publicKey.toString()

      // Fetch data from multiple APIs in parallel
      const [referralResponse, questXPResponse, questProgressResponse, nftStatsResponse] = await Promise.all([
        fetch(`/api/users/referrals?wallet=${walletAddress}`),
        fetch(`/api/quests?action=get-user-xp&wallet=${walletAddress}`),
        fetch(`/api/quests?action=get-user-progress&wallet=${walletAddress}`),
        fetch(`/api/nfts/stats?detailed=true&wallet=${walletAddress}`)
      ])

      // Parse responses
      const referralData = referralResponse.ok ? await referralResponse.json() : null
      const questXPData = questXPResponse.ok ? await questXPResponse.json() : null
      const questProgressData = questProgressResponse.ok ? await questProgressResponse.json() : null
      const nftStatsData = nftStatsResponse.ok ? await nftStatsResponse.json() : null

      console.log('🔍 Profile API responses:', {
        referral: referralData?.success,
        questXP: questXPData?.success,
        questProgress: questProgressData?.success,
        nftStats: nftStatsData?.success
      })

      console.log('🔍 Profile Raw Data:', {
        user: referralData?.success ? referralData.data.user : null,
        userNftsMinted: referralData?.success ? referralData.data.user?.nftsMinted : null,
        nftStatsData: nftStatsData?.success ? nftStatsData : null,
        referralHistory: referralData?.success ? referralData.data.history : null
      })

      // Extract user data from referral API
      const user = referralData?.success ? referralData.data.user : null
      const referralStats = referralData?.success ? referralData.data.stats : null
      const referralHistory = referralData?.success ? referralData.data.history : []

      // Get user's NFT count from Firebase user data in referral history
      let userNftCount = 0
      if (referralHistory && referralHistory.length > 0) {
        // Check if this user appears as a referred user (they have minted NFTs)
        const userAsReferred = referralHistory.find((ref: any) => ref.referredUser?.walletAddress === walletAddress)
        if (userAsReferred?.referredUser?.nftsMinted) {
          userNftCount = userAsReferred.referredUser.nftsMinted
        }
      }

      // Also check if user data directly contains NFT count
      if (user?.nftsMinted) {
        userNftCount = Math.max(userNftCount, user.nftsMinted)
      }

      console.log('🔍 Profile NFT Count Extraction:', {
        userNftCount,
        userDirectNfts: user?.nftsMinted,
        referralHistoryLength: referralHistory?.length,
        walletAddress
      })

      // Extract quest data
      const xpData = questXPData?.success ? questXPData.data : null
      const progressData = questProgressData?.success ? questProgressData.data : []

      // Extract NFT data
      const nftData = nftStatsData?.success ? nftStatsData.nfts : []
      const nftStats = nftStatsData?.success ? nftStatsData.stats : null

      // Build activities from real data
      const activities = []

      // Add NFT minting activities
      if (nftData && nftData.length > 0) {
        nftData.slice(0, 5).forEach((nft: any, index: number) => {
          if (nft.ownerWallet === walletAddress) {
            activities.push({
              id: `nft-${nft.mintAddress || index}`,
              type: "mint" as const,
              title: "NFT Minted",
              description: `Minted ${nft.name || 'RewardNFT'} for ${nft.mintCost || 10} USDC`,
              timestamp: nft.mintedAt || new Date().toISOString(),
              points: 100,
            })
          }
        })
      }

      // Add referral activities
      if (referralHistory && referralHistory.length > 0) {
        referralHistory.slice(0, 5).forEach((referral: any, index: number) => {
          activities.push({
            id: `referral-${index}`,
            type: "referral" as const,
            title: "Friend Referred",
            description: `Successfully referred ${referral.referredWallet?.slice(0, 8)}... and earned 4 USDC`,
            timestamp: referral.completedAt || new Date().toISOString(),
            points: 200,
          })
        })
      }

      // Add quest activities
      if (progressData && Array.isArray(progressData) && progressData.length > 0) {
        progressData.filter((quest: any) => quest.status === 'completed').slice(0, 5).forEach((quest: any, index: number) => {
          activities.push({
            id: `quest-${quest.id || index}`,
            type: "quest" as const,
            title: "Quest Completed",
            description: `Completed quest: ${quest.questId || 'Unknown Quest'}`,
            timestamp: quest.completedAt || new Date().toISOString(),
            points: quest.rewardXP || 50,
          })
        })
      }

      // Add welcome message if no activities
      if (activities.length === 0) {
        activities.push({
          id: 'welcome',
          type: 'reward' as const,
          title: 'Welcome to RewardNFT!',
          description: 'Your profile has been created. Start minting NFTs and referring friends to earn rewards!',
          timestamp: new Date().toISOString(),
          points: 0,
        })
      }

      // Sort activities by timestamp (most recent first)
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      // Build NFT data from API response
      const nfts = nftData ? nftData.filter((nft: any) => nft.ownerWallet === walletAddress).slice(0, 10).map((nft: any) => ({
        mint: nft.mintAddress,
        name: nft.name || 'RewardNFT',
        image: nft.image || '/nft-placeholder.png',
        attributes: nft.attributes || [
          { trait_type: 'Platform', value: 'RewardNFT' },
          { trait_type: 'Utility', value: 'Referral Rewards' }
        ]
      })) : []

      // Build comprehensive profile
      const userProfile: UserProfile = {
        address: walletAddress,
        nfts: nfts,
        stats: {
          totalNFTs: userNftCount || nfts.length || 0,
          questsCompleted: progressData?.filter((q: any) => q.status === 'completed').length || user?.questsCompleted || 0,
          referrals: referralStats?.totalReferrals || user?.totalReferrals || 0,
          points: xpData?.totalXP || 0,
          rank: xpData?.rank || 0,
        },
        activities: activities.slice(0, 20), // Limit to 20 most recent activities
        referralCode: user?.referralCode || `REF${walletAddress.slice(0, 8).toUpperCase()}`,
        referralStats: {
          totalReferrals: referralStats?.totalReferrals || user?.totalReferrals || 0,
          activeReferrals: referralStats?.activeReferrals || 0,
          totalEarned: referralStats?.totalEarned || (user?.totalReferrals || 0) * 4, // $4 per referral
        },
      }

      console.log('✅ Profile compiled:', {
        nfts: userProfile.nfts.length,
        referrals: userProfile.stats.referrals,
        points: userProfile.stats.points,
        questsCompleted: userProfile.stats.questsCompleted,
        totalNFTs: userProfile.stats.totalNFTs,
        totalEarned: userProfile.referralStats.totalEarned,
        activitiesCount: userProfile.activities.length,
        referralCode: userProfile.referralCode,
      })

      setProfile(userProfile)
    } catch (err: any) {
      setError(err.message || "Failed to load profile")
      console.error("Profile loading error:", err)
    } finally {
      setLoading(false)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  const getExplorerLink = (address: string) => {
    return getExplorerUrl(address, "address")
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  if (!connected && !connecting) {
    return (
      <div className="min-h-screen text-white">
        <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold mb-6">Connect Your Wallet</h1>
          <p className="text-gray-400 mb-8 text-center max-w-md">
            Connect your wallet to view your profile, NFTs, and track your rewards.
          </p>
          <WalletConnectButton size="lg" />
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen text-white">
        <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p className="text-gray-400">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen text-white">
        <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={loadProfile}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col text-white">
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={profile?.nfts[0]?.image || "/placeholder.svg"} />
                <AvatarFallback>{formatAddress(publicKey?.toString() || "")}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold">My Profile</h1>
                <p className="text-gray-400">{formatAddress(publicKey?.toString() || "")}</p>
                <Badge variant="outline" className="mt-2">
                  Rank #{profile?.stats.rank || "N/A"}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadProfile}>
                Refresh
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={getExplorerLink(publicKey?.toString() || "")} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Explorer
                </a>
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid grid-cols-4 md:grid-cols-5 mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="nfts">My NFTs</TabsTrigger>
              <TabsTrigger value="quests">Quests</TabsTrigger>
              <TabsTrigger value="referrals">Referrals</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Gift className="w-5 h-5 mr-2" />
                      Total NFTs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{profile?.stats.totalNFTs || 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Trophy className="w-5 h-5 mr-2" />
                      Quests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{profile?.stats.questsCompleted || 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      Referrals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{profile?.stats.referrals || 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Star className="w-5 h-5 mr-2" />
                      Points
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{profile?.stats.points || 0}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Jump to your favorite activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button asChild variant="outline" className="h-16 flex-col gap-2">
                      <a href="/mint">
                        <Gift className="w-5 h-5" />
                        <span className="text-sm">Mint NFT</span>
                      </a>
                    </Button>
                    <Button asChild variant="outline" className="h-16 flex-col gap-2">
                      <a href="/referrals">
                        <Users className="w-5 h-5" />
                        <span className="text-sm">Referrals</span>
                      </a>
                    </Button>
                    <Button asChild variant="outline" className="h-16 flex-col gap-2">
                      <a href="/quests">
                        <Trophy className="w-5 h-5" />
                        <span className="text-sm">Quests</span>
                      </a>
                    </Button>
                    <Button asChild variant="outline" className="h-16 flex-col gap-2">
                      <a href="/mini-game">
                        <Star className="w-5 h-5" />
                        <span className="text-sm">Mini-Game</span>
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your latest actions and rewards</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profile?.activities && profile.activities.length > 0 ? (
                      profile.activities.slice(0, 8).map((activity) => {
                        const getActivityIcon = (type: string) => {
                          switch (type) {
                            case 'mint': return <Gift className="w-4 h-4 text-green-400" />
                            case 'referral': return <Users className="w-4 h-4 text-blue-400" />
                            case 'quest': return <Trophy className="w-4 h-4 text-yellow-400" />
                            case 'reward': return <Star className="w-4 h-4 text-purple-400" />
                            default: return <Star className="w-4 h-4 text-gray-400" />
                          }
                        }

                        return (
                          <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                            <div className="flex items-center gap-3">
                              {getActivityIcon(activity.type)}
                              <div>
                                <p className="font-medium text-white">{activity.title}</p>
                                <p className="text-sm text-gray-400">{activity.description}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(activity.timestamp).toLocaleDateString()} at {new Date(activity.timestamp).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                            {activity.points && activity.points > 0 && (
                              <Badge variant="secondary" className="bg-teal-900/50 text-teal-300 border-teal-700/50">
                                +{activity.points} XP
                              </Badge>
                            )}
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-8">
                        <Star className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-400 mb-2">No recent activity</p>
                        <p className="text-gray-500 text-sm">Start minting NFTs, referring friends, or completing quests to see your activity here!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="nfts">
              <Card>
                <CardHeader>
                  <CardTitle>My NFT Collection</CardTitle>
                  <CardDescription>All your minted and collected NFTs</CardDescription>
                </CardHeader>
                <CardContent>
                  {profile?.nfts && profile.nfts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {profile.nfts.map((nft) => (
                        <Card key={nft.mint} className="overflow-hidden bg-gray-800/50 border-gray-700">
                          <div className="aspect-square relative">
                            <img
                              src={nft.image || "/nft-placeholder.png"}
                              alt={nft.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = "/nft-placeholder.png"
                              }}
                            />
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-bold mb-2 text-white">{nft.name}</h3>
                            <div className="space-y-1">
                              {nft.attributes.map((attr, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                  <span className="text-gray-400">{attr.trait_type}:</span>
                                  <span className="text-gray-200">{attr.value}</span>
                                </div>
                              ))}
                            </div>
                            <Button variant="outline" size="sm" className="w-full mt-3 border-gray-600 text-gray-300 hover:bg-gray-700" asChild>
                              <a href={getExplorerLink(nft.mint)} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View on Explorer
                              </a>
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Gift className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-400 mb-4">No NFTs found</p>
                      <p className="text-gray-500 text-sm mb-6">Start minting NFTs to build your collection and earn referral rewards!</p>
                      <Button asChild className="bg-teal-600 hover:bg-teal-700">
                        <a href="/mint">Mint Your First NFT</a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quests">
              <Card>
                <CardHeader>
                  <CardTitle>Quest Progress</CardTitle>
                  <CardDescription>Complete quests to earn XP and rewards</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-gray-800 rounded-lg">
                        <p className="text-2xl font-bold text-yellow-400">{profile?.stats.points || 0}</p>
                        <p className="text-sm text-gray-400">Total XP</p>
                      </div>
                      <div className="text-center p-4 bg-gray-800 rounded-lg">
                        <p className="text-2xl font-bold text-green-400">{profile?.stats.questsCompleted || 0}</p>
                        <p className="text-sm text-gray-400">Quests Completed</p>
                      </div>
                      <div className="text-center p-4 bg-gray-800 rounded-lg">
                        <p className="text-2xl font-bold text-blue-400">Level {Math.floor((profile?.stats.points || 0) / 500) + 1}</p>
                        <p className="text-sm text-gray-400">Current Level</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="text-center py-4">
                        <p className="text-gray-400 mb-4">Visit the Quests page to start earning XP and complete challenges!</p>
                        <div className="flex gap-4 justify-center">
                          <Button asChild className="bg-teal-600 hover:bg-teal-700">
                            <a href="/quests">View All Quests</a>
                          </Button>
                          <Button asChild variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                            <a href="/mini-game">Play Mini-Game</a>
                          </Button>
                        </div>
                      </div>

                      {/* XP Progress Bar */}
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-400">Progress to Next Level</span>
                          <span className="text-sm text-gray-400">
                            Level {Math.floor((profile?.stats.points || 0) / 500) + 1}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${((profile?.stats.points || 0) % 500) / 500 * 100}%`
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>{(profile?.stats.points || 0) % 500} XP</span>
                          <span>500 XP</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="referrals">
              <Card>
                <CardHeader>
                  <CardTitle>Referral Program</CardTitle>
                  <CardDescription>Invite friends and earn rewards</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-400 mb-2">Your Referral Code</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-lg flex-1">{profile?.referralCode || "Loading..."}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(profile?.referralCode || "")}
                          disabled={!profile?.referralCode}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{profile?.referralStats.totalReferrals || 0}</p>
                        <p className="text-sm text-gray-400">Total Referrals</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{profile?.referralStats.activeReferrals || 0}</p>
                        <p className="text-sm text-gray-400">Active</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{((profile?.referralStats.totalReferrals || 0) * 4).toFixed(2)}</p>
                        <p className="text-sm text-gray-400">USDC Earned ($4 per referral)</p>
                      </div>
                    </div>
                    <div className="text-center pt-4">
                      <Button asChild>
                        <a href="/referrals">View Referral Details</a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Activity History</CardTitle>
                  <CardDescription>Complete history of your actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profile?.activities && profile.activities.length > 0 ? (
                      profile.activities.map((activity) => (
                        <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                          <div>
                            <p className="font-medium">{activity.title}</p>
                            <p className="text-sm text-gray-400">{activity.description}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(activity.timestamp).toLocaleDateString()} {new Date(activity.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                          {activity.points && <Badge variant="secondary">+{activity.points} pts</Badge>}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-400">No activity history available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
