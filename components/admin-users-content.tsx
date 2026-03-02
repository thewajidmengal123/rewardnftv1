"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useWallet } from "@/contexts/wallet-context"
import { Loader2, Search, ExternalLink, Twitter, MessageCircle, Github, Globe, Copy } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getExplorerUrl } from "@/config/solana"

interface UserData {
  id: string
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

const ADMIN_WALLET = "6nHPbBNxh31qpKfLrs3WzzDGkDjmQYQGuVsh9qB7VLBQ"

export function AdminUsersContent() {
  const { publicKey } = useWallet()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)

  const isAdmin = publicKey?.toString() === ADMIN_WALLET

  useEffect(() => {
    if (isAdmin) {
      loadUsers()
    }
  }, [isAdmin])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const usersSnapshot = await getDocs(collection(db, "users"))
      const usersList: UserData[] = []

      usersSnapshot.forEach((doc) => {
        const data = doc.data()
        usersList.push({
          id: doc.id,
          walletAddress: doc.id,
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
      })

      // Sort by last active
      usersList.sort((a, b) => {
        const aTime = a.lastActive?.toMillis?.() || 0
        const bTime = b.lastActive?.toMillis?.() || 0
        return bTime - aTime
      })

      setUsers(usersList)
    } catch (error) {
      console.error("Error loading users:", error)
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => 
    user.walletAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.socials?.twitter?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Users Management</h1>
            <p className="text-gray-400 mt-1">View all users and their social profiles</p>
          </div>
          <Button onClick={loadUsers} variant="outline" className="border-gray-700">
            Refresh
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by wallet, name, or Twitter..."
            className="pl-10 bg-gray-900 border-gray-700 text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <Card 
              key={user.id} 
              className="bg-gray-900/50 border-gray-700/50 hover:border-purple-500/50 transition-all cursor-pointer"
              onClick={() => setSelectedUser(user)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16 border-2 border-purple-500/30">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="bg-purple-600">
                      {(user.name || user.walletAddress).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate">
                      {user.name || "Anonymous"}
                    </h3>
                    <p className="text-sm text-gray-400 font-mono truncate">
                      {user.walletAddress.slice(0, 8)}...{user.walletAddress.slice(-8)}
                    </p>
                    
                    {/* Social Links */}
                    <div className="flex gap-2 mt-3">
                      {user.socials?.twitter && (
                        <a
                          href={getSocialUrl('twitter', user.socials.twitter) || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center border border-blue-500/30 hover:bg-blue-600/30 transition-colors"
                        >
                          <Twitter className="w-4 h-4 text-blue-400" />
                        </a>
                      )}
                      {user.socials?.discord && (
                        <div 
                          className="w-8 h-8 bg-indigo-600/20 rounded-full flex items-center justify-center border border-indigo-500/30"
                          title={user.socials.discord}
                        >
                          <MessageCircle className="w-4 h-4 text-indigo-400" />
                        </div>
                      )}
                      {user.socials?.github && (
                        <a
                          href={getSocialUrl('github', user.socials.github) || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center border border-gray-600 hover:bg-gray-600 transition-colors"
                        >
                          <Github className="w-4 h-4 text-gray-400" />
                        </a>
                      )}
                      {user.socials?.website && (
                        <a
                          href={getSocialUrl('website', user.socials.website) || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-8 h-8 bg-green-600/20 rounded-full flex items-center justify-center border border-green-500/30 hover:bg-green-600/30 transition-colors"
                        >
                          <Globe className="w-4 h-4 text-green-400" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-700/50">
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{user.nftsMinted || 0}</p>
                    <p className="text-xs text-gray-400">NFTs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{user.totalReferrals || 0}</p>
                    <p className="text-xs text-gray-400">Referrals</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-400">{user.totalEarned || 0}</p>
                    <p className="text-xs text-gray-400">Earned</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* User Detail Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="bg-gray-900 border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>User Details</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                  ✕
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Header */}
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20 border-2 border-purple-500">
                    <AvatarImage src={selectedUser.avatar} />
                    <AvatarFallback className="bg-purple-600 text-xl">
                      {(selectedUser.name || selectedUser.walletAddress).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedUser.name || "Anonymous"}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm text-gray-400 bg-gray-800 px-2 py-1 rounded">
                        {selectedUser.walletAddress}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyToClipboard(selectedUser.walletAddress)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {selectedUser.bio && (
                  <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
                    <p className="text-gray-300">{selectedUser.bio}</p>
                  </div>
                )}

                {/* Social Links Detail */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-white">Social Links</h3>
                  
                  {selectedUser.socials?.twitter && (
                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Twitter className="w-5 h-5 text-blue-400" />
                        <span className="text-gray-300">Twitter</span>
                      </div>
                      <a
                        href={getSocialUrl('twitter', selectedUser.socials.twitter) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline flex items-center gap-1"
                      >
                        {selectedUser.socials.twitter}
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )}

                  {selectedUser.socials?.discord && (
                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <MessageCircle className="w-5 h-5 text-indigo-400" />
                        <span className="text-gray-300">Discord</span>
                      </div>
                      <span className="text-indigo-400">{selectedUser.socials.discord}</span>
                    </div>
                  )}

                  {selectedUser.socials?.github && (
                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Github className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-300">GitHub</span>
                      </div>
                      <a
                        href={getSocialUrl('github', selectedUser.socials.github) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:underline flex items-center gap-1"
                      >
                        {selectedUser.socials.github}
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )}

                  {selectedUser.socials?.website && (
                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-green-400" />
                        <span className="text-gray-300">Website</span>
                      </div>
                      <a
                        href={getSocialUrl('website', selectedUser.socials.website) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:underline flex items-center gap-1"
                      >
                        {selectedUser.socials.website}
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )}

                  {!selectedUser.socials?.twitter && !selectedUser.socials?.discord && 
                   !selectedUser.socials?.github && !selectedUser.socials?.website && (
                    <p className="text-gray-500 text-center py-4">No social links added</p>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-700">
                  <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                    <p className="text-2xl font-bold text-white">{selectedUser.nftsMinted || 0}</p>
                    <p className="text-sm text-gray-400">NFTs Minted</p>
                  </div>
                  <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                    <p className="text-2xl font-bold text-white">{selectedUser.totalReferrals || 0}</p>
                    <p className="text-sm text-gray-400">Total Referrals</p>
                  </div>
                  <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                    <p className="text-2xl font-bold text-green-400">{selectedUser.totalEarned || 0}</p>
                    <p className="text-sm text-gray-400">USDC Earned</p>
                  </div>
                </div>

                {/* Explorer Link */}
                <Button asChild className="w-full bg-purple-600 hover:bg-purple-700">
                  <a 
                    href={getExplorerUrl(selectedUser.walletAddress, "address")} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on Solana Explorer
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
