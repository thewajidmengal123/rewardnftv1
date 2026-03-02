"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useWallet } from "@/contexts/wallet-context"
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { Loader2, Trophy, Gift, Users, Star, ExternalLink, Copy, Edit2, Check, X, Twitter, Globe, MessageCircle, Github, ImageIcon } from "lucide-react"
import { getExplorerUrl } from "@/config/solana"
import { toast } from "@/components/ui/use-toast"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface SocialLinks {
  twitter?: string
  discord?: string
  github?: string
  website?: string
}

interface UserProfileData {
  name?: string
  bio?: string
  avatar?: string
  socials?: SocialLinks
  updatedAt?: any
}

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
  profileData?: UserProfileData
}

export function ProfilePageContent() {
  const { connected, publicKey, connecting } = useWallet()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [error, setError] = useState("")
  
  // Edit states
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [editBio, setEditBio] = useState("")
  const [editAvatar, setEditAvatar] = useState("")
  const [editTwitter, setEditTwitter] = useState("")
  const [editDiscord, setEditDiscord] = useState("")
  const [editGithub, setEditGithub] = useState("")
  const [editWebsite, setEditWebsite] = useState("")

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

      // Fetch user profile data from Firestore
      const userDocRef = doc(db, "users", walletAddress)
      const userDoc = await getDoc(userDocRef)
      const userProfileData: UserProfileData = userDoc.exists() ? userDoc.data() as UserProfileData : {}

      // Fetch other data (NFTs, quests, referrals)
      const [referralResponse, questXPResponse, questProgressResponse, nftStatsResponse] = await Promise.all([
        fetch(`/api/users/referrals?wallet=${walletAddress}`),
        fetch(`/api/quests?action=get-user-xp&wallet=${walletAddress}`),
        fetch(`/api/quests?action=get-user-progress&wallet=${walletAddress}`),
        fetch(`/api/nfts/stats?detailed=true&wallet=${walletAddress}`)
      ])

      const referralData = referralResponse.ok ? await referralResponse.json() : null
      const questXPData = questXPResponse.ok ? await questXPResponse.json() : null
      const questProgressData = questProgressResponse.ok ? await questProgressResponse.json() : null
      const nftStatsData = nftStatsResponse.ok ? await nftStatsResponse.json() : null

      const user = referralData?.success ? referralData.data.user : null
      const referralStats = referralData?.success ? referralData.data.stats : null
      const referralHistory = referralData?.success ? referralData.data.history : []

      let userNftCount = 0
      if (referralHistory?.length > 0) {
        const userAsReferred = referralHistory.find((ref: any) => ref.referredUser?.walletAddress === walletAddress)
        if (userAsReferred?.referredUser?.nftsMinted && userAsReferred.referredUser.nftsMinted > 0) {
          userNftCount = 1
        }
      }
      if (user?.nftsMinted) userNftCount = Math.max(userNftCount, user.nftsMinted)

      const xpData = questXPData?.success ? questXPData.data : null
      const progressData = questProgressData?.success ? questProgressData.data : []
      const nftData = nftStatsData?.success ? nftStatsData.nfts : []

      // Build activities
      const activities = []
      if (nftData?.length > 0) {
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

      if (referralHistory?.length > 0) {
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

      if (progressData?.length > 0) {
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

      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      const nfts = nftData?.filter((nft: any) => nft.ownerWallet === walletAddress).slice(0, 10).map((nft: any) => ({
        mint: nft.mintAddress,
        name: nft.name || 'RewardNFT',
        image: nft.image || '/nft-placeholder.png',
        attributes: nft.attributes || [
          { trait_type: 'Platform', value: 'RewardNFT' },
          { trait_type: 'Utility', value: 'Referral Rewards' }
        ]
      })) || []

      if (nfts.length > 0) userNftCount = 1

      // Set edit states with loaded data
      setEditName(userProfileData.name || "")
      setEditBio(userProfileData.bio || "")
      setEditAvatar(userProfileData.avatar || "")
      setEditTwitter(userProfileData.socials?.twitter || "")
      setEditDiscord(userProfileData.socials?.discord || "")
      setEditGithub(userProfileData.socials?.github || "")
      setEditWebsite(userProfileData.socials?.website || "")

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
        activities: activities.slice(0, 20),
        referralCode: user?.referralCode || `REF${walletAddress.slice(0, 8).toUpperCase()}`,
        referralStats: {
          totalReferrals: referralStats?.totalReferrals || user?.totalReferrals || 0,
          activeReferrals: referralStats?.activeReferrals || 0,
          totalEarned: referralStats?.totalEarned || (user?.totalReferrals || 0) * 4,
        },
        profileData: userProfileData
      }

      setProfile(userProfile)
    } catch (err: any) {
      setError(err.message || "Failed to load profile")
      console.error("Profile loading error:", err)
    } finally {
      setLoading(false)
    }
  }

  // Save profile changes
  const handleSaveProfile = async () => {
    if (!publicKey) return

    try {
      const walletAddress = publicKey.toString()
      const userDocRef = doc(db, "users", walletAddress)

      const profileData: UserProfileData = {
        name: editName.trim(),
        bio: editBio.trim(),
        avatar: editAvatar.trim() || undefined,
        socials: {
          twitter: editTwitter.trim(),
          discord: editDiscord.trim(),
          github: editGithub.trim(),
          website: editWebsite.trim(),
        },
        updatedAt: serverTimestamp(),
      }

      await setDoc(userDocRef, profileData, { merge: true })

      setProfile(prev => prev ? {
        ...prev,
        profileData: profileData
      } : null)

      setIsEditing(false)
      toast({
        title: "✅ Profile Updated",
        description: "Your profile has been saved successfully!",
      })
    } catch (err) {
      console.error("Error saving profile:", err)
      toast({
        title: "❌ Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      })
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
      toast({
        title: "✅ Copied!",
        description: "Copied to clipboard",
      })
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  // Get social link URL
  const getSocialUrl = (platform: string, username: string) => {
    if (!username) return null
    switch (platform) {
      case 'twitter': return `https://twitter.com/${username.replace('@', '')}`
      case 'github': return `https://github.com/${username}`
      case 'website': return username.startsWith('http') ? username : `https://${username}`
      default: return null
    }
  }

  if (!connected && !connecting) {
    return (
      <div className="min-h-screen text-white bg-[#0a0a0f]">
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
      <div className="min-h-screen text-white bg-[#0a0a0f]">
        <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-purple-500" />
          <p className="text-gray-400">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen text-white bg-[#0a0a0f]">
        <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={loadProfile} className="bg-purple-600 hover:bg-purple-700">Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col text-white bg-[#0a0a0f]">
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header - Professional Design */}
          <div className="relative mb-8">
            {/* Cover Background */}
            <div className="h-48 rounded-2xl bg-gradient-to-r from-purple-900/50 via-pink-900/50 to-purple-900/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            </div>
            
            {/* Profile Info Card */}
            <div className="relative -mt-20 mx-4 md:mx-8">
              <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar className="w-32 h-32 border-4 border-gray-900 ring-2 ring-purple-500/50">
                      <AvatarImage src={profile?.profileData?.avatar || profile?.nfts[0]?.image || "/placeholder.svg"} />
                      <AvatarFallback className="bg-purple-600 text-2xl">
                        {(profile?.profileData?.name || formatAddress(publicKey?.toString() || "")).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* User Info */}
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-3">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Your Name"
                          className="bg-gray-800 border-gray-700 text-white text-xl font-bold max-w-xs"
                        />
                        <Input
                          value={editBio}
                          onChange={(e) => setEditBio(e.target.value)}
                          placeholder="Short bio about yourself..."
                          className="bg-gray-800 border-gray-700 text-gray-300 max-w-md"
                        />
                        {/* Avatar URL Input */}
                        <div className="flex items-center gap-2 max-w-md">
                          <ImageIcon className="w-5 h-5 text-purple-400" />
                          <Input
                            value={editAvatar}
                            onChange={(e) => setEditAvatar(e.target.value)}
                            placeholder="Profile photo URL (Imgur, etc.)"
                            className="bg-gray-800 border-gray-700 text-gray-300"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <h1 className="text-3xl font-bold text-white">
                          {profile?.profileData?.name || "Anonymous User"}
                        </h1>
                        <p className="text-gray-400 mt-1">
                          {profile?.profileData?.bio || "No bio yet"}
                        </p>
                      </>
                    )}
                    
                    <div className="flex items-center gap-3 mt-3">
                      <Badge variant="outline" className="bg-purple-900/30 text-purple-300 border-purple-500/30">
                        Rank #{profile?.stats.rank || "N/A"}
                      </Badge>
                      <span className="text-gray-500 font-mono text-sm">
                        {formatAddress(publicKey?.toString() || "")}
                      </span>
                      <button
                        onClick={() => copyToClipboard(publicKey?.toString() || "")}
                        className="text-gray-500 hover:text-white transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Social Links */}
                    <div className="flex items-center gap-3 mt-4">
                      {isEditing ? (
                        <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                          <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                            <Twitter className="w-4 h-4 text-blue-400" />
                            <Input
                              value={editTwitter}
                              onChange={(e) => setEditTwitter(e.target.value)}
                              placeholder="@username"
                              className="bg-transparent border-0 p-0 text-sm focus-visible:ring-0"
                            />
                          </div>
                          <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                            <MessageCircle className="w-4 h-4 text-indigo-400" />
                            <Input
                              value={editDiscord}
                              onChange={(e) => setEditDiscord(e.target.value)}
                              placeholder="username#0000"
                              className="bg-transparent border-0 p-0 text-sm focus-visible:ring-0"
                            />
                          </div>
                          <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                            <Github className="w-4 h-4 text-gray-400" />
                            <Input
                              value={editGithub}
                              onChange={(e) => setEditGithub(e.target.value)}
                              placeholder="username"
                              className="bg-transparent border-0 p-0 text-sm focus-visible:ring-0"
                            />
                          </div>
                          <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                            <Globe className="w-4 h-4 text-green-400" />
                            <Input
                              value={editWebsite}
                              onChange={(e) => setEditWebsite(e.target.value)}
                              placeholder="website.com"
                              className="bg-transparent border-0 p-0 text-sm focus-visible:ring-0"
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          {profile?.profileData?.socials?.twitter && (
                            <a
                              href={getSocialUrl('twitter', profile.profileData.socials.twitter) || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-10 h-10 bg-gray-800 hover:bg-blue-600/20 rounded-full flex items-center justify-center border border-gray-700 hover:border-blue-500/50 transition-all"
                            >
                              <Twitter className="w-5 h-5 text-blue-400" />
                            </a>
                          )}
                          {profile?.profileData?.socials?.discord && (
                            <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700" title={profile.profileData.socials.discord}>
                              <MessageCircle className="w-5 h-5 text-indigo-400" />
                            </div>
                          )}
                          {profile?.profileData?.socials?.github && (
                            <a
                              href={getSocialUrl('github', profile.profileData.socials.github) || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center border border-gray-700 hover:border-gray-500 transition-all"
                            >
                              <Github className="w-5 h-5 text-gray-400" />
                            </a>
                          )}
                          {profile?.profileData?.socials?.website && (
                            <a
                              href={getSocialUrl('website', profile.profileData.socials.website) || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-10 h-10 bg-gray-800 hover:bg-green-600/20 rounded-full flex items-center justify-center border border-gray-700 hover:border-green-500/50 transition-all"
                            >
                              <Globe className="w-5 h-5 text-green-400" />
                            </a>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button
                          onClick={handleSaveProfile}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button
                          onClick={() => setIsEditing(false)}
                          variant="outline"
                          className="border-gray-600"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={() => setIsEditing(true)}
                          variant="outline"
                          className="border-purple-500/50 text-purple-300 hover:bg-purple-600/20"
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit Profile
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={loadProfile}
                          className="border-gray-600"
                        >
                          <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          asChild
                          className="border-gray-600"
                        >
                          <a href={getExplorerLink(publicKey?.toString() || "")} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid grid-cols-4 md:grid-cols-5 mb-8 bg-gray-900/50 border border-gray-700/50">
              <TabsTrigger value="overview" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">Overview</TabsTrigger>
              <TabsTrigger value="nfts" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">My NFTs</TabsTrigger>
              <TabsTrigger value="quests" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">Quests</TabsTrigger>
              <TabsTrigger value="referrals" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">Referrals</TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">Activity</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="bg-gray-900/50 border-gray-700/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center text-white">
                      <Gift className="w-5 h-5 mr-2 text-purple-400" />
                      Total NFTs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-white">{profile?.stats.totalNFTs || 0}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-900/50 border-gray-700/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center text-white">
                      <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
                      Quests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-white">{profile?.stats.questsCompleted || 0}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-900/50 border-gray-700/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center text-white">
                      <Users className="w-5 h-5 mr-2 text-blue-400" />
                      Referrals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-white">{profile?.stats.referrals || 0}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-900/50 border-gray-700/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center text-white">
                      <Star className="w-5 h-5 mr-2 text-pink-400" />
                      Points
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-white">{profile?.stats.points || 0}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="bg-gray-900/50 border-gray-700/50 mb-8">
                <CardHeader>
                  <CardTitle className="text-white">Quick Actions</CardTitle>
                  <CardDescription className="text-gray-400">Jump to your favorite activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button asChild variant="outline" className="h-16 flex-col gap-2 bg-gray-800/50 border-gray-700 hover:bg-purple-600/20 hover:border-purple-500/50">
                      <a href="/mint">
                        <Gift className="w-5 h-5 text-purple-400" />
                        <span className="text-sm text-gray-300">Mint NFT</span>
                      </a>
                    </Button>
                    <Button asChild variant="outline" className="h-16 flex-col gap-2 bg-gray-800/50 border-gray-700 hover:bg-blue-600/20 hover:border-blue-500/50">
                      <a href="/referrals">
                        <Users className="w-5 h-5 text-blue-400" />
                        <span className="text-sm text-gray-300">Referrals</span>
                      </a>
                    </Button>
                    <Button asChild variant="outline" className="h-16 flex-col gap-2 bg-gray-800/50 border-gray-700 hover:bg-yellow-600/20 hover:border-yellow-500/50">
                      <a href="/quests">
                        <Trophy className="w-5 h-5 text-yellow-400" />
                        <span className="text-sm text-gray-300">Quests</span>
                      </a>
                    </Button>
                    <Button asChild variant="outline" className="h-16 flex-col gap-2 bg-gray-800/50 border-gray-700 hover:bg-pink-600/20 hover:border-pink-500/50">
                      <a href="/mini-game">
                        <Star className="w-5 h-5 text-pink-400" />
                        <span className="text-sm text-gray-300">Mini-Game</span>
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-gray-900/50 border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Recent Activity</CardTitle>
                  <CardDescription className="text-gray-400">Your latest actions and rewards</CardDescription>
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

            {/* Other tabs... */}
            <TabsContent value="nfts">
              <Card className="bg-gray-900/50 border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white">My NFT Collection</CardTitle>
                  <CardDescription className="text-gray-400">All your minted and collected NFTs</CardDescription>
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
                      <Button asChild className="bg-purple-600 hover:bg-purple-700">
                        <a href="/mint">Mint Your First NFT</a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quests">
              <Card className="bg-gray-900/50 border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Quest Progress</CardTitle>
                  <CardDescription className="text-gray-400">Complete quests to earn XP and rewards</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                      <p className="text-2xl font-bold text-yellow-400">{profile?.stats.points || 0}</p>
                      <p className="text-sm text-gray-400">Total XP</p>
                    </div>
                    <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                      <p className="text-2xl font-bold text-green-400">{profile?.stats.questsCompleted || 0}</p>
                      <p className="text-sm text-gray-400">Quests Completed</p>
                    </div>
                    <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                      <p className="text-2xl font-bold text-blue-400">Level {Math.floor((profile?.stats.points || 0) / 500) + 1}</p>
                      <p className="text-sm text-gray-400">Current Level</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <Button asChild className="bg-purple-600 hover:bg-purple-700">
                      <a href="/quests">View All Quests</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="referrals">
              <Card className="bg-gray-900/50 border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Referral Program</CardTitle>
                  <CardDescription className="text-gray-400">Invite friends and earn rewards</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 mb-4">
                    <p className="text-sm text-gray-400 mb-2">Your Referral Code</p>
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-lg flex-1 bg-gray-900 px-3 py-2 rounded-lg text-purple-300">
                        {profile?.referralCode || "Loading..."}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(profile?.referralCode || "")}
                        className="border-gray-600 hover:bg-gray-700"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                      <p className="text-2xl font-bold text-white">{profile?.referralStats.totalReferrals || 0}</p>
                      <p className="text-sm text-gray-400">Total Referrals</p>
                    </div>
                    <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                      <p className="text-2xl font-bold text-white">{profile?.referralStats.activeReferrals || 0}</p>
                      <p className="text-sm text-gray-400">Active</p>
                    </div>
                    <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                      <p className="text-2xl font-bold text-green-400">{((profile?.referralStats.totalReferrals || 0) * 4).toFixed(2)}</p>
                      <p className="text-sm text-gray-400">USDC Earned</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <Card className="bg-gray-900/50 border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Activity History</CardTitle>
                  <CardDescription className="text-gray-400">Complete history of your actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profile?.activities && profile.activities.length > 0 ? (
                      profile.activities.map((activity) => (
                        <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                          <div>
                            <p className="font-medium text-white">{activity.title}</p>
                            <p className="text-sm text-gray-400">{activity.description}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(activity.timestamp).toLocaleDateString()} {new Date(activity.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                          {activity.points && <Badge variant="secondary" className="bg-purple-900/50 text-purple-300">+{activity.points} pts</Badge>}
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
