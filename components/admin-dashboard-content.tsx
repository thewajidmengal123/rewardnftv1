"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Download, Users, Coins, Disc, TrendingUp, Shield, Database, Activity, AlertTriangle, RefreshCw } from "lucide-react"
import { useWallet } from "@/contexts/wallet-context"
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { isAdminWallet } from "@/config/admin"
import { toast } from "@/components/ui/use-toast"
import { getExplorerUrl } from "@/config/solana"



export function AdminDashboardContent() {
  const { connected, publicKey } = useWallet()
  const [searchTerm, setSearchTerm] = useState("")
  const [adminData, setAdminData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [realTimeStats, setRealTimeStats] = useState<any>(null)
  const [questCount, setQuestCount] = useState<number | null>(null)

  // Check if current wallet is admin
  const isAdmin = isAdminWallet(publicKey?.toString())

  // Load admin data when admin wallet connects
  useEffect(() => {
    if (connected && isAdmin) {
      loadAdminData()
      checkQuestCount()
      // Set up real-time updates
      const interval = setInterval(loadRealTimeStats, 30000) // Update every 30 seconds
      return () => clearInterval(interval)
    }
  }, [connected, isAdmin])

  const loadAdminData = async () => {
    if (!publicKey) return

    setLoading(true)
    try {
      // Load comprehensive admin data using the new admin API
      const response = await fetch(`/api/admin/dashboard?wallet=${publicKey.toString()}&action=get-dashboard-data`)
      const result = await response.json()

      if (result.success) {
        setAdminData(result.data)
        setRealTimeStats(result.data.stats)

        toast({
          title: "Admin Data Loaded",
          description: "Successfully loaded all admin dashboard data",
        })
      } else {
        throw new Error(result.error || 'Failed to load admin data')
      }
    } catch (error) {
      console.error('Error loading admin data:', error)
      toast({
        title: "Error Loading Data",
        description: error instanceof Error ? error.message : "Failed to load admin dashboard data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadRealTimeStats = async () => {
    if (!publicKey) return

    try {
      const response = await fetch(`/api/admin/dashboard?wallet=${publicKey.toString()}&action=get-real-time-stats`)
      const result = await response.json()
      if (result.success) {
        setRealTimeStats(result.data)
      }
    } catch (error) {
      console.error('Error loading real-time stats:', error)
    }
  }

  const checkQuestCount = async () => {
    try {
      const response = await fetch(`/api/admin/init-unique-quests?wallet=${publicKey?.toString()}`)
      const result = await response.json()
      if (result.success) {
        setQuestCount(result.questCount)
      }
    } catch (error) {
      console.error("Error checking quest count:", error)
    }
  }

  const initializeQuests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/init-unique-quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: publicKey?.toString() })
      })
      const result = await response.json()
      if (result.success) {
        toast({
          title: "Success",
          description: `${result.message}. Created ${result.quests?.length || 0} unique quests.`
        })
        setQuestCount(result.quests?.length || 0)
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to initialize quests", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleResetWeeklyQuests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/reset-weekly-quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: publicKey?.toString() })
      })
      const result = await response.json()
      if (result.success) {
        toast({
          title: "Weekly Quests Reset",
          description: `${result.message}. Reset ${result.resetCount} progress records for ${result.affectedUsers} users.`
        })
        await loadAdminData() // Refresh data
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to reset weekly quests", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleResetLeaderboard = async (resetType: string = "all") => {
    try {
      // First, get preview of what will be reset
      setLoading(true)
      const previewResponse = await fetch(`/api/admin/reset-leaderboard?wallet=${publicKey?.toString()}&type=${resetType}`)
      const previewResult = await previewResponse.json()

      if (!previewResult.success) {
        toast({
          title: "Preview Failed",
          description: previewResult.error,
          variant: "destructive"
        })
        return
      }

      // Show detailed confirmation dialog with preview data
      const previewText = previewResult.affectedCollections.join('\n• ')
      const confirmed = window.confirm(
        `⚠️ WARNING: This will permanently reset ${resetType === "all" ? "ALL leaderboard data" : resetType + " data"}!\n\n` +
        `Records to be reset:\n• ${previewText}\n\n` +
        `Total records affected: ${previewResult.totalToReset}\n\n` +
        "This includes:\n" +
        (resetType === "all" || resetType === "xp" ? "• All user XP and levels will be reset to 0\n" : "") +
        (resetType === "all" || resetType === "referrals" ? "• All referral counts and earnings will be reset to 0\n" : "") +
        (resetType === "all" || resetType === "quests" ? "• All quest progress will be reset to not_started\n" : "") +
        "\n⚠️ THIS ACTION CANNOT BE UNDONE! ⚠️\n\n" +
        "Are you absolutely sure you want to continue?"
      )

      if (!confirmed) return

      // Perform the actual reset
      const response = await fetch('/api/admin/reset-leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey?.toString(),
          resetType
        })
      })
      const result = await response.json()

      if (result.success) {
        toast({
          title: "✅ Leaderboard Reset Complete",
          description: `Successfully reset ${result.totalReset} records. Details: ${Object.entries(result.resetCounts).filter(([_, count]) => (count as number) > 0).map(([type, count]) => `${type}: ${count}`).join(', ')}`,
        })

        // Log the successful reset
        console.log("🔍 Admin Reset Completed:", {
          resetType: result.resetType,
          resetCounts: result.resetCounts,
          totalReset: result.totalReset,
          resetBy: result.resetBy,
          resetAt: result.resetAt
        })

        await loadAdminData() // Refresh data
      } else {
        toast({
          title: "Reset Failed",
          description: result.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Reset leaderboard error:", error)
      toast({
        title: "Error",
        description: "Failed to reset leaderboard data. Check console for details.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMonitorReferralQuests = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/monitor-referral-quests?wallet=${publicKey?.toString()}&action=monitor`)
      const result = await response.json()
      if (result.success) {
        const stats = result.statistics
        toast({
          title: "Referral Quest Monitoring",
          description: `${stats.eligibleUsers} users eligible, ${stats.questCompleted} completed, ${stats.questPending} pending auto-completion.`
        })

        // Optionally trigger auto-completion for pending users
        if (stats.questPending > 0) {
          const autoCompleteResponse = await fetch(`/api/admin/monitor-referral-quests?wallet=${publicKey?.toString()}&action=auto-complete`)
          const autoResult = await autoCompleteResponse.json()
          if (autoResult.success) {
            toast({
              title: "Auto-Completion Complete",
              description: `${autoResult.summary.successful} quests auto-completed, ${autoResult.summary.failed} failed.`
            })
          }
        }

        await loadAdminData() // Refresh data
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to monitor referral quests", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Calculate stats from real data
  const totalUsers = adminData?.users?.length || 0
  const totalMints = adminData?.nfts?.length || 0
  const totalReferrals = adminData?.referrals?.length || 0
  const totalUsdcCollected = adminData?.nfts?.reduce((sum: number, nft: any) => sum + (nft.mintCost || 10), 0) || 0

  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-white">Admin Dashboard</h1>
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <Shield className="w-16 h-16 text-yellow-400 mb-4" />
            <h2 className="text-xl font-bold text-white">Admin Access Required</h2>
            <p className="text-white/60 text-center mb-4">Connect your admin wallet to access the dashboard</p>
            <WalletConnectButton />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (connected && !isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-white">Admin Dashboard</h1>
        <Card className="bg-red-900/20 backdrop-blur-sm border-red-500/30">
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <AlertTriangle className="w-16 h-16 text-red-400 mb-4" />
            <h2 className="text-xl font-bold text-white">Access Denied</h2>
            <p className="text-white/60 text-center mb-4">
              This wallet ({publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}) does not have admin privileges.
            </p>
            <p className="text-red-400 text-sm text-center">
              Only the authorized admin wallet can access this dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="bg-green-900/50 text-green-300 border-green-700">
              <Shield className="w-3 h-3 mr-1" />
              Admin Access
            </Badge>
            {questCount !== null && (
              <Badge variant={questCount === 0 ? "destructive" : "default"} className="text-sm">
                {questCount === 0 ? "No Quests" : `${questCount} Quests`}
              </Badge>
            )}
            <span className="text-sm text-gray-400">
              {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadAdminData} disabled={loading} variant="outline">
            {loading ? "Loading..." : "Refresh Data"}
          </Button>

          {/* Show Initialize Quests button only if no quests exist */}
          {questCount === 0 && (
            <Button
              onClick={initializeQuests}
              disabled={loading}
              variant="default"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Activity className="w-4 h-4 mr-2" />
              {loading ? "Initializing..." : "Initialize Unique Quests"}
            </Button>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => window.open(`/api/admin/dashboard?wallet=${publicKey?.toString()}&action=export-data`, '_blank')}
              variant="outline"
              className="bg-blue-600/20 border-blue-500 text-blue-300 hover:bg-blue-600/30"
            >
              <Download className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
            <Button
              onClick={() => window.open(`/api/admin/dashboard?wallet=${publicKey?.toString()}&action=export-csv`, '_blank')}
              variant="outline"
              className="bg-green-600/20 border-green-500 text-green-300 hover:bg-green-600/30"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Real-time Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total Users</p>
                <p className="text-3xl font-bold text-white">{totalUsers}</p>
                <p className="text-xs text-green-400">
                  {realTimeStats?.newUsersToday || 0} new today
                </p>
              </div>
              <div className="bg-white/10 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total NFT Mints</p>
                <p className="text-3xl font-bold text-white">{totalMints}</p>
                <p className="text-xs text-green-400">
                  {realTimeStats?.mintsToday || 0} minted today
                </p>
              </div>
              <div className="bg-white/10 p-3 rounded-full">
                <Disc className="h-6 w-6 text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total Referrals</p>
                <p className="text-3xl font-bold text-white">{totalReferrals}</p>
                <p className="text-xs text-green-400">
                  {realTimeStats?.referralsToday || 0} new today
                </p>
              </div>
              <div className="bg-white/10 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">USDC Revenue</p>
                <p className="text-3xl font-bold text-white">{realTimeStats?.totalRevenue || totalUsdcCollected}</p>
                <p className="text-xs text-green-400">
                  {realTimeStats?.revenueToday || 0} USDC today
                </p>
                <p className="text-xs text-white/40">
                  Net: {realTimeStats?.netRevenue || 0} USDC
                </p>
              </div>
              <div className="bg-white/10 p-3 rounded-full">
                <Coins className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Net Revenue</p>
                <p className="text-3xl font-bold text-white">{totalUsdcCollected - (totalReferrals * 4)}</p>
              </div>
              <div className="bg-white/10 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Export */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
          <Input
            type="text"
            placeholder="Search by wallet or transaction hash"
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => window.open(`/api/admin/dashboard?wallet=${publicKey?.toString()}&action=export-data`, '_blank')}
            variant="outline"
            className="border-blue-500/50 text-blue-300 hover:bg-blue-600/20"
          >
            <Download className="h-4 w-4 mr-2" />
            JSON
          </Button>
          <Button
            onClick={() => window.open(`/api/admin/dashboard?wallet=${publicKey?.toString()}&action=export-csv`, '_blank')}
            variant="outline"
            className="border-green-500/50 text-green-300 hover:bg-green-600/20"
          >
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>

          {/* Reset Leaderboard Buttons */}
          <Button
            onClick={() => handleResetLeaderboard("referrals")}
            variant="outline"
            className="border-red-500/50 text-red-300 hover:bg-red-600/20"
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset Referrals
          </Button>
          <Button
            onClick={() => handleResetLeaderboard("xp")}
            variant="outline"
            className="border-orange-500/50 text-orange-300 hover:bg-orange-600/20"
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset XP
          </Button>
          <Button
            onClick={() => handleResetLeaderboard("all")}
            variant="outline"
            className="border-red-600/50 text-red-400 hover:bg-red-700/20"
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset All Data
          </Button>
        </div>
      </div>

      {/* Comprehensive Admin Data Tabs */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="w-full bg-white/10 mb-6 grid grid-cols-6">
          <TabsTrigger value="users" className="data-[state=active]:bg-white/20 text-white">
            <Users className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="mints" className="data-[state=active]:bg-white/20 text-white">
            <Disc className="w-4 h-4 mr-2" />
            NFT Mints
          </TabsTrigger>
          <TabsTrigger value="referrals" className="data-[state=active]:bg-white/20 text-white">
            <TrendingUp className="w-4 h-4 mr-2" />
            Referrals
          </TabsTrigger>
          <TabsTrigger value="quests" className="data-[state=active]:bg-white/20 text-white">
            <Activity className="w-4 h-4 mr-2" />
            Quests & XP
          </TabsTrigger>
          <TabsTrigger value="transactions" className="data-[state=active]:bg-white/20 text-white">
            <Coins className="w-4 h-4 mr-2" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-white/20 text-white">
            <Database className="w-4 h-4 mr-2" />
            Bonus
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-0">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">All Users ({totalUsers})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-white/60 py-3 px-4">Wallet Address</th>
                      <th className="text-left text-white/60 py-3 px-4">Display Name</th>
                      <th className="text-center text-white/60 py-3 px-4">NFTs Minted</th>
                      <th className="text-center text-white/60 py-3 px-4">Referrals</th>
                      <th className="text-right text-white/60 py-3 px-4">Total Earned</th>
                      <th className="text-left text-white/60 py-3 px-4">Last Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminData?.users?.filter((user: any) =>
                      user.walletAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map((user: any) => (
                      <tr key={user.walletAddress} className="border-b border-white/10 last:border-0">
                        <td className="py-3 px-4 text-white font-mono text-sm">
                          {user.walletAddress?.slice(0, 8)}...{user.walletAddress?.slice(-8)}
                        </td>
                        <td className="py-3 px-4 text-white">{user.displayName || 'Anonymous'}</td>
                        <td className="py-3 px-4 text-white text-center">{(user.nftsMinted && user.nftsMinted > 0) ? 1 : 0}</td>
                        <td className="py-3 px-4 text-white text-center">{user.totalReferrals || 0}</td>
                        <td className="py-3 px-4 text-white text-right">{user.totalEarned || 0} USDC</td>
                        <td className="py-3 px-4 text-white text-sm">
                          {user.lastActive ? new Date(user.lastActive.seconds * 1000).toLocaleDateString() : 'Never'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NFT Mints Tab */}
        <TabsContent value="mints" className="mt-0">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">NFT Mint Transactions ({totalMints})</CardTitle>
            </CardHeader>
            <CardContent>
              {/* NFT Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-cyan-400">{totalMints}</p>
                      <p className="text-sm text-white/60">Total NFTs Minted</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-400">{realTimeStats?.totalRevenue || totalUsdcCollected}</p>
                      <p className="text-sm text-white/60">Total Revenue (USDC)</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-400">{realTimeStats?.uniqueMinters || 0}</p>
                      <p className="text-sm text-white/60">Unique Minters</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-400">{realTimeStats?.averageRevenuePerMint || 10}</p>
                      <p className="text-sm text-white/60">Avg Revenue/Mint</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-white/60 py-3 px-4">Mint Address</th>
                      <th className="text-left text-white/60 py-3 px-4">Owner Wallet</th>
                      <th className="text-left text-white/60 py-3 px-4">NFT Name</th>
                      <th className="text-center text-white/60 py-3 px-4">Cost (USDC)</th>
                      <th className="text-left text-white/60 py-3 px-4">Minted At</th>
                      <th className="text-left text-white/60 py-3 px-4">Transaction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminData?.nfts?.filter((nft: any) =>
                      nft.mintAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      nft.ownerWallet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      nft.transactionSignature?.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map((nft: any) => (
                      <tr key={nft.mintAddress} className="border-b border-white/10 last:border-0">
                        <td className="py-3 px-4 text-white font-mono text-sm">
                          {nft.mintAddress?.slice(0, 8)}...{nft.mintAddress?.slice(-8)}
                        </td>
                        <td className="py-3 px-4 text-white font-mono text-sm">
                          {nft.ownerWallet?.slice(0, 8)}...{nft.ownerWallet?.slice(-8)}
                        </td>
                        <td className="py-3 px-4 text-white">{nft.name || 'RewardNFT'}</td>
                        <td className="py-3 px-4 text-white text-center">{nft.mintCost || 10}</td>
                        <td className="py-3 px-4 text-white text-sm">
                          {nft.mintedAt ? new Date(nft.mintedAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
                        </td>
                        <td className="py-3 px-4 text-white">
                          <a
                            href={getExplorerUrl(nft.transactionSignature!, "tx")}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline text-sm"
                          >
                            {nft.transactionSignature?.slice(0, 8)}...
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Referrals Tab */}
        <TabsContent value="referrals" className="mt-0">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Referral System ({totalReferrals})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-white/60 py-3 px-4">Referrer</th>
                      <th className="text-left text-white/60 py-3 px-4">Referred User</th>
                      <th className="text-left text-white/60 py-3 px-4">Referral Code</th>
                      <th className="text-center text-white/60 py-3 px-4">Status</th>
                      <th className="text-right text-white/60 py-3 px-4">Reward (USDC)</th>
                      <th className="text-left text-white/60 py-3 px-4">Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminData?.referrals?.filter((referral: any) =>
                      referral.referrerWallet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      referral.referredWallet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      referral.referralCode?.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map((referral: any) => (
                      <tr key={referral.id} className="border-b border-white/10 last:border-0">
                        <td className="py-3 px-4 text-white font-mono text-sm">
                          {referral.referrerWallet?.slice(0, 8)}...{referral.referrerWallet?.slice(-8)}
                        </td>
                        <td className="py-3 px-4 text-white font-mono text-sm">
                          {referral.referredWallet?.slice(0, 8)}...{referral.referredWallet?.slice(-8)}
                        </td>
                        <td className="py-3 px-4 text-white">{referral.referralCode}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={referral.isCompleted ? "default" : "secondary"}>
                            {referral.isCompleted ? "Completed" : "Pending"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-white text-right">{referral.rewardAmount || 4}</td>
                        <td className="py-3 px-4 text-white text-sm">
                          {referral.createdAt ? new Date(referral.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quests & XP Tab */}
        <TabsContent value="quests" className="mt-0">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Quest System & XP Tracking</CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={() => window.open(`/api/admin/dashboard?wallet=${publicKey?.toString()}&action=export-quest-data`, '_blank')}
                    variant="outline"
                    className="bg-purple-600/20 border-purple-500 text-purple-300 hover:bg-purple-600/30"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Quest JSON
                  </Button>
                  <Button
                    onClick={handleResetWeeklyQuests}
                    variant="outline"
                    className="bg-orange-600/20 border-orange-500 text-orange-300 hover:bg-orange-600/30"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset Weekly Quests
                  </Button>
                  <Button
                    onClick={handleMonitorReferralQuests}
                    variant="outline"
                    className="bg-green-600/20 border-green-500 text-green-300 hover:bg-green-600/30"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Monitor Referrals
                  </Button>
                  <Button
                    onClick={() => window.open(`/api/admin/dashboard?wallet=${publicKey?.toString()}&action=export-quest-csv`, '_blank')}
                    variant="outline"
                    className="bg-indigo-600/20 border-indigo-500 text-indigo-300 hover:bg-indigo-600/30"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Quest CSV
                  </Button>

                  {/* Leaderboard Reset Buttons */}
                  <Button
                    onClick={() => handleResetLeaderboard("quests")}
                    variant="outline"
                    className="bg-red-600/20 border-red-500 text-red-300 hover:bg-red-600/30"
                    disabled={loading}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset Quest Data
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* XP Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-400">{realTimeStats?.totalXPAwarded || 0}</p>
                        <p className="text-sm text-white/60">Total XP Awarded</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-400">{realTimeStats?.activeQuests || 0}</p>
                        <p className="text-sm text-white/60">Active Quests</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-400">{Math.round(realTimeStats?.averageXPPerUser || 0)}</p>
                        <p className="text-sm text-white/60">Avg XP per User</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-yellow-400">{adminData?.userXPData?.length || 0}</p>
                        <p className="text-sm text-white/60">XP Leaders</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Top XP Users */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Top XP Leaders</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/20">
                          <th className="text-left text-white/60 py-3 px-4">Rank</th>
                          <th className="text-left text-white/60 py-3 px-4">Wallet Address</th>
                          <th className="text-center text-white/60 py-3 px-4">Level</th>
                          <th className="text-center text-white/60 py-3 px-4">Total XP</th>
                          <th className="text-center text-white/60 py-3 px-4">Quests Completed</th>
                          <th className="text-left text-white/60 py-3 px-4">Last Active</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminData?.userXPData?.map((user: any, index: number) => (
                          <tr key={user.id} className="border-b border-white/10 last:border-0">
                            <td className="py-3 px-4 text-white font-bold">#{index + 1}</td>
                            <td className="py-3 px-4 text-white font-mono text-sm">
                              {user.walletAddress?.slice(0, 8)}...{user.walletAddress?.slice(-8)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge variant="outline" className="text-purple-400 border-purple-400">
                                Level {user.level || 1}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-white text-center font-bold">{user.totalXP || 0}</td>
                            <td className="py-3 px-4 text-white text-center">{user.questsCompleted || 0}</td>
                            <td className="py-3 px-4 text-white text-sm">
                              {user.lastActive ? new Date(user.lastActive.seconds * 1000).toLocaleDateString() : 'Unknown'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Quest Progress */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Recent Quest Activity</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/20">
                          <th className="text-left text-white/60 py-3 px-4">User</th>
                          <th className="text-left text-white/60 py-3 px-4">Quest ID</th>
                          <th className="text-center text-white/60 py-3 px-4">Status</th>
                          <th className="text-center text-white/60 py-3 px-4">Progress</th>
                          <th className="text-center text-white/60 py-3 px-4">XP Reward</th>
                          <th className="text-left text-white/60 py-3 px-4">Started At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminData?.quests?.slice(0, 10).map((quest: any) => (
                          <tr key={quest.id} className="border-b border-white/10 last:border-0">
                            <td className="py-3 px-4 text-white font-mono text-sm">
                              {quest.userId?.slice(0, 8)}...{quest.userId?.slice(-8)}
                            </td>
                            <td className="py-3 px-4 text-white">{quest.questId}</td>
                            <td className="py-3 px-4 text-center">
                              <Badge variant={
                                quest.status === "completed" ? "default" :
                                quest.status === "claimed" ? "secondary" :
                                "outline"
                              }>
                                {quest.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-white text-center">
                              {quest.progress}/{quest.maxProgress}
                            </td>
                            <td className="py-3 px-4 text-white text-center">{quest.rewardXP || 0}</td>
                            <td className="py-3 px-4 text-white text-sm">
                              {quest.startedAt ? new Date(quest.startedAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="mt-0">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">All Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-400">{totalUsdcCollected}</p>
                        <p className="text-sm text-white/60">Total USDC Collected</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-400">{totalMints}</p>
                        <p className="text-sm text-white/60">Total Transactions</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-400">{totalReferrals * 4}</p>
                        <p className="text-sm text-white/60">Referral Rewards Paid</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="text-center text-white/60">
                  <p>Detailed transaction monitoring coming soon...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-0">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Platform Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">User Growth</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-white/60">Total Users:</span>
                        <span className="text-white">{totalUsers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">NFT Holders:</span>
                        <span className="text-white">{adminData?.users?.filter((u: any) => u.nftsMinted > 0).length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Active Referrers:</span>
                        <span className="text-white">{adminData?.users?.filter((u: any) => u.totalReferrals > 0).length || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Revenue Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-white/60">Mint Revenue:</span>
                        <span className="text-white">{totalUsdcCollected} USDC</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Referral Costs:</span>
                        <span className="text-red-400">-{totalReferrals * 4} USDC</span>
                      </div>
                      <div className="flex justify-between border-t border-white/10 pt-2">
                        <span className="text-white/60">Net Revenue:</span>
                        <span className="text-green-400">{totalUsdcCollected - (totalReferrals * 4)} USDC</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
