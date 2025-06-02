"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useWallet } from "@/contexts/wallet-context"
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { NavigationBar } from "@/components/navigation-bar"
import profileService, { type UserProfile } from "@/services/profile-service"
import { Loader2, Trophy, Gift, Users, Star, ExternalLink } from "lucide-react"

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
      const userProfile = await profileService.getUserProfile(publicKey)
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
    return `https://explorer.solana.com/address/${address}?cluster=devnet`
  }

  if (!connected && !connecting) {
    return (
      <div className="min-h-screen text-white">
        <NavigationBar />
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
        <NavigationBar />
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
        <NavigationBar />
        <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={loadProfile}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col text-white">
      <NavigationBar />

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
            <TabsList className="grid grid-cols-3 md:grid-cols-5 mb-8">
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

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your latest actions and rewards</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profile?.activities.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium">{activity.title}</p>
                          <p className="text-sm text-gray-400">{activity.description}</p>
                          <p className="text-xs text-gray-500">{activity.timestamp}</p>
                        </div>
                        {activity.points && <Badge variant="secondary">+{activity.points} pts</Badge>}
                      </div>
                    ))}
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
                  {profile?.nfts.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {profile.nfts.map((nft) => (
                        <Card key={nft.mint} className="overflow-hidden">
                          <div className="aspect-square relative">
                            <img
                              src={nft.image || "/placeholder.svg"}
                              alt={nft.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-bold mb-2">{nft.name}</h3>
                            <div className="space-y-1">
                              {nft.attributes.map((attr, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                  <span className="text-gray-400">{attr.trait_type}:</span>
                                  <span>{attr.value}</span>
                                </div>
                              ))}
                            </div>
                            <Button variant="outline" size="sm" className="w-full mt-3" asChild>
                              <a href={getExplorerLink(nft.mint)} target="_blank" rel="noopener noreferrer">
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
                      <Button asChild>
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
                  <CardDescription>Complete quests to earn rewards and points</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400">Quest system coming soon...</p>
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
                      <p className="font-mono text-lg">{profile?.referralCode || "Loading..."}</p>
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
                        <p className="text-2xl font-bold">{profile?.referralStats.totalEarned || 0}</p>
                        <p className="text-sm text-gray-400">USDC Earned</p>
                      </div>
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
                    {profile?.activities.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium">{activity.title}</p>
                          <p className="text-sm text-gray-400">{activity.description}</p>
                          <p className="text-xs text-gray-500">{activity.timestamp}</p>
                        </div>
                        {activity.points && <Badge variant="secondary">+{activity.points} pts</Badge>}
                      </div>
                    ))}
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
