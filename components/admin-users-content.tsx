"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useWallet } from "@/contexts/wallet-context"
import { Loader2, ArrowLeft, ExternalLink, Twitter, MessageCircle, Github, Globe, Copy, Trophy, Gift, Users, Star } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getExplorerUrl } from "@/config/solana"
import Link from "next/link"

interface UserData {
  walletAddress: string
  name?: string
  bio?: string
  avatar?: string
  socials?: {
    twitter?: string
    discord?: string
    github?: string
    website?: string
  }
  nftsMinted?: number
  totalReferrals?: number
  totalEarned?: number
  lastActive?: any
  createdAt?: any
}

const ADMIN_WALLETS = [
  "6nHPbBNxh31qpKfLrs3WzzDGkDjmQYQGuVsh9qB7VLBQ", // Original admin
]

export function AdminUserProfileContent({ walletAddress }: { walletAddress: string }) {
  const { publicKey } = useWallet()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  const isAdmin = ADMIN_WALLETS.includes(publicKey?.toString() || "")

  useEffect(() => {
    if (isAdmin && walletAddress) {
      loadUser()
    }
  }, [isAdmin, walletAddress])

  const loadUser = async () => {
    try {
      setLoading(true)
      const userDocRef = doc(db, "users", walletAddress)
      const userDoc = await getDoc(userDocRef)
      
      if (userDoc.exists()) {
        const data = userDoc.data()
        setUser({
          walletAddress: walletAddress,
          name: data.name,
          bio: data.bio,
          avatar: data.avatar,
          socials: data.socials,
          nftsMinted: data.nftsMinted || 0,
          totalReferrals: data.totalReferrals || 0,
          totalEarned: data.totalEarned || 0,
          lastActive: data.lastActive,
          createdAt: data.createdAt,
        })
      } else {
        toast({
          title: "User not found",
          description: "This user has no profile data",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading user:", error)
      toast({
        title: "Error",
        description: "Failed to load user profile",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({ title: "✅ Copied!", description: "Copied to clipboard" })
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const getSocialUrl = (platform: string, username: string) => {
    if (!username) return null
    switch (platform) {
      case 'twitter': return `https://twitter.com/${username.replace('@', '')}`
      case 'github': return `https://github.com/${username}`
      case 'website': return username.startsWith('http') ? username : `https://${username}`
      default: return null
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400">Access Denied</h1>
          <p className="text-gray-400 mt-2">Admin only</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-400">User Not Found</h1>
          <Link href="/admin/users">
            <Button className="mt-4 bg-purple-600 hover:bg-purple-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Users
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/users">
            <Button variant="outline" className="border-gray-700 hover:bg-gray-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">User Profile</h1>
            <p className="text-gray-400">Admin view</p>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="bg-gray-900/50 border-gray-700/50 mb-6">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Avatar */}
              <Avatar className="w-24 h-24 border-4 border-purple-500/30">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-purple-600 text-2xl">
                  {(user.name || user.walletAddress).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">{user.name || "Anonymous User"}</h2>
                {user.bio && <p className="text-gray-400 mt-2">{user.bio}</p>}
                
                <div className="flex items-center gap-2 mt-3">
                  <code className="text-sm text-gray-400 bg-gray-800 px-3 py-1 rounded">
                    {user.walletAddress}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyToClipboard(user.walletAddress)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a 
                      href={getExplorerUrl(user.walletAddress, "address")} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>

                {/* Social Links */}
                <div className="flex gap-3 mt-4">
                  {user.socials?.twitter && (
                    <a
                      href={getSocialUrl('twitter', user.socials.twitter) || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 rounded-lg border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 transition-colors"
                    >
                      <Twitter className="w-5 h-5" />
                      <span>{user.socials.twitter}</span>
                    </a>
                  )}
                  {user.socials?.discord && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 rounded-lg border border-indigo-500/30 text-indigo-400">
                      <MessageCircle className="w-5 h-5" />
                      <span>{user.socials.discord}</span>
                    </div>
                  )}
                  {user.socials?.github && (
                    <a
                      href={getSocialUrl('github', user.socials.github) || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-lg border border-gray-600 text-gray-400 hover:bg-gray-600 transition-colors"
                    >
                      <Github className="w-5 h-5" />
                      <span>{user.socials.github}</span>
                    </a>
                  )}
                  {user.socials?.website && (
                    <a
                      href={getSocialUrl('website', user.socials.website) || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-green-600/20 rounded-lg border border-green-500/30 text-green-400 hover:bg-green-600/30 transition-colors"
                    >
                      <Globe className="w-5 h-5" />
                      <span>Website</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gray-900/50 border-gray-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center text-white">
                <Gift className="w-5 h-5 mr-2 text-purple-400" />
                NFTs Minted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{user.nftsMinted || 0}</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center text-white">
                <Users className="w-5 h-5 mr-2 text-blue-400" />
                Total Referrals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{user.totalReferrals || 0}</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center text-white">
                <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
                USDC Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-400">{user.totalEarned || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        <Card className="bg-gray-900/50 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white">Account Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between py-2 border-b border-gray-700/50">
              <span className="text-gray-400">Wallet Address</span>
              <span className="text-white font-mono">{user.walletAddress}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-700/50">
              <span className="text-gray-400">Account Created</span>
              <span className="text-white">{formatDate(user.createdAt)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-700/50">
              <span className="text-gray-400">Last Active</span>
              <span className="text-white">{formatDate(user.lastActive)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-400">Profile Status</span>
              <Badge className={user.name ? "bg-green-600" : "bg-yellow-600"}>
                {user.name ? "Complete" : "Incomplete"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
