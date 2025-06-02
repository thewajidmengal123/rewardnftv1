"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Coins, TrendingUp, Gift, Award, Share2, Calendar, Download } from "lucide-react"
import { useWallet } from "@/contexts/wallet-context"
import {
  getPlatformMetrics,
  getUserActivityData,
  getTopPerformingUsers,
  getAirdropStatistics,
  getQuestCompletionStats,
  getReferralConversionStats,
} from "@/utils/analytics"
import { WalletAddress } from "@/components/wallet-address"
import { FadeIn, SlideUp, StaggerContainer, StaggerItem } from "@/components/ui/animations"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Line,
  LineChart as RechartsLineChart,
  Bar,
  BarChart as RechartsBarChart,
  Pie,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { RealTimeAnalyticsDashboard } from "@/components/real-time-analytics-dashboard"

export function AnalyticsDashboardContent() {
  const { connected } = useWallet()
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("7d")
  const [metrics, setMetrics] = useState<any>(null)
  const [activityData, setActivityData] = useState<any[]>([])
  const [topUsers, setTopUsers] = useState<any[]>([])
  const [airdropStats, setAirdropStats] = useState<any>(null)
  const [questStats, setQuestStats] = useState<any>(null)
  const [referralStats, setReferralStats] = useState<any>(null)

  // Load data when component mounts
  useEffect(() => {
    if (connected) {
      loadData()
    }
  }, [connected, timeRange])

  // Simulate loading data
  const loadData = async () => {
    setLoading(true)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Get data based on time range
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 14

    // Load data from utilities
    const platformMetrics = getPlatformMetrics()
    const userActivity = getUserActivityData(days)
    const topPerformers = getTopPerformingUsers(5)
    const airdropStatistics = getAirdropStatistics()
    const questCompletionStats = getQuestCompletionStats()
    const referralConversionStats = getReferralConversionStats()

    setMetrics(platformMetrics)
    setActivityData(userActivity)
    setTopUsers(topPerformers)
    setAirdropStats(airdropStatistics)
    setQuestStats(questCompletionStats)
    setReferralStats(referralConversionStats)
    setLoading(false)
  }

  // Colors for charts
  const COLORS = ["#00FFE0", "#FF5555", "#FFC93C", "#FF2E63", "#00C2FF"]

  // Render loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#2d1b4e] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>

          <Skeleton className="h-96 w-full mb-8" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#2d1b4e] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center h-[80vh]">
            <Card className="w-full max-w-md bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-center">Analytics Dashboard</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <p className="text-white/80 text-center">Connect your wallet to access the analytics dashboard.</p>
                <Button>Connect Wallet</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#2d1b4e] p-6">
      <div className="max-w-7xl mx-auto">
        <FadeIn>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white">Analytics Dashboard</h1>
              <p className="text-white/60">Track platform metrics and performance</p>
            </div>

            <div className="flex items-center gap-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="14d">Last 14 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </FadeIn>

        {/* Key Metrics */}
        <StaggerContainer>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StaggerItem>
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-white/20 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/60 text-sm">Total Users</p>
                      <p className="text-3xl font-bold text-white">{metrics.totalUsers}</p>
                      <p className="text-[#00FFE0] text-sm mt-1">+{Math.floor(metrics.totalUsers * 0.05)} this week</p>
                    </div>
                    <div className="bg-white/10 p-3 rounded-full">
                      <Users className="h-6 w-6 text-[#00FFE0]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-white/20 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/60 text-sm">Total Mints</p>
                      <p className="text-3xl font-bold text-white">{metrics.totalMints}</p>
                      <p className="text-[#FF5555] text-sm mt-1">+{Math.floor(metrics.totalMints * 0.03)} this week</p>
                    </div>
                    <div className="bg-white/10 p-3 rounded-full">
                      <Award className="h-6 w-6 text-[#FF5555]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-white/20 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/60 text-sm">Total USDC Earned</p>
                      <p className="text-3xl font-bold text-white">{metrics.totalUsdcEarned}</p>
                      <p className="text-[#FFC93C] text-sm mt-1">
                        +{Math.floor(metrics.totalUsdcEarned * 0.04)} this week
                      </p>
                    </div>
                    <div className="bg-white/10 p-3 rounded-full">
                      <Coins className="h-6 w-6 text-[#FFC93C]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-white/20 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/60 text-sm">Conversion Rate</p>
                      <p className="text-3xl font-bold text-white">{(metrics.conversionRate * 100).toFixed(1)}%</p>
                      <p className="text-[#00C2FF] text-sm mt-1">+2.5% this week</p>
                    </div>
                    <div className="bg-white/10 p-3 rounded-full">
                      <TrendingUp className="h-6 w-6 text-[#00C2FF]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          </div>
        </StaggerContainer>

        <div className="mb-8">
          <RealTimeAnalyticsDashboard />
        </div>

        {/* Activity Chart */}
        <SlideUp delay={0.3}>
          <Card className="bg-white/5 backdrop-blur-sm border-white/10 mb-8">
            <CardHeader>
              <CardTitle className="text-white">User Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart
                    data={activityData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis
                      dataKey="date"
                      stroke="rgba(255, 255, 255, 0.5)"
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                      }
                    />
                    <YAxis stroke="rgba(255, 255, 255, 0.5)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "8px",
                        color: "white",
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="mints" stroke="#FF5555" activeDot={{ r: 8 }} strokeWidth={2} />
                    <Line type="monotone" dataKey="referrals" stroke="#00FFE0" activeDot={{ r: 8 }} strokeWidth={2} />
                    <Line
                      type="monotone"
                      dataKey="questsCompleted"
                      stroke="#FFC93C"
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                    <Line type="monotone" dataKey="activeUsers" stroke="#00C2FF" activeDot={{ r: 8 }} strokeWidth={2} />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </SlideUp>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Referral Stats */}
          <SlideUp delay={0.4}>
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Referral Conversions</CardTitle>
                <Share2 className="h-5 w-5 text-white/60" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-white/60 text-sm">Total Referrals</p>
                    <p className="text-2xl font-bold text-white">{referralStats.totalReferrals}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Conversion Rate</p>
                    <p className="text-2xl font-bold text-white">{(referralStats.conversionRate * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Successful Referrals</p>
                    <p className="text-2xl font-bold text-[#00FFE0]">{referralStats.successfulReferrals}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Pending Referrals</p>
                    <p className="text-2xl font-bold text-[#FFC93C]">{referralStats.pendingReferrals}</p>
                  </div>
                </div>

                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={[
                          { name: "Successful", value: referralStats.successfulReferrals },
                          { name: "Pending", value: referralStats.pendingReferrals },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {[
                          { name: "Successful", value: referralStats.successfulReferrals },
                          { name: "Pending", value: referralStats.pendingReferrals },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(0, 0, 0, 0.8)",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          borderRadius: "8px",
                          color: "white",
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </SlideUp>

          {/* Quest Stats */}
          <SlideUp delay={0.5}>
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Quest Completions</CardTitle>
                <Calendar className="h-5 w-5 text-white/60" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-white/60 text-sm">Total Quests</p>
                    <p className="text-2xl font-bold text-white">{questStats.totalQuests}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Completion Rate</p>
                    <p className="text-2xl font-bold text-white">{(questStats.completionRate * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Daily Completed</p>
                    <p className="text-2xl font-bold text-[#FF5555]">{questStats.dailyCompleted}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Weekly Completed</p>
                    <p className="text-2xl font-bold text-[#00C2FF]">{questStats.weeklyCompleted}</p>
                  </div>
                </div>

                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={[
                        { name: "Daily", value: questStats.dailyCompleted },
                        { name: "Weekly", value: questStats.weeklyCompleted },
                        { name: "Special", value: questStats.specialCompleted },
                      ]}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                      <XAxis dataKey="name" stroke="rgba(255, 255, 255, 0.5)" />
                      <YAxis stroke="rgba(255, 255, 255, 0.5)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(0, 0, 0, 0.8)",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          borderRadius: "8px",
                          color: "white",
                        }}
                      />
                      <Bar dataKey="value" fill="#00FFE0" radius={[4, 4, 0, 0]}>
                        {[
                          { name: "Daily", value: questStats.dailyCompleted },
                          { name: "Weekly", value: questStats.weeklyCompleted },
                          { name: "Special", value: questStats.specialCompleted },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </SlideUp>
        </div>

        {/* Top Users and Airdrop Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Users */}
          <SlideUp delay={0.6}>
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Top Performing Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topUsers.map((user, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold bg-${
                            ["cyan", "pink", "yellow", "green", "blue"][index % 5]
                          }-500`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <WalletAddress address={user.walletAddress} />
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-white/60 text-xs flex items-center">
                              <Users className="h-3 w-3 mr-1" /> {user.totalReferrals} refs
                            </span>
                            <span className="text-white/60 text-xs flex items-center">
                              <Calendar className="h-3 w-3 mr-1" /> {user.questsCompleted} quests
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">{user.totalEarned} USDC</p>
                        <p className="text-white/60 text-xs">earned</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </SlideUp>

          {/* Airdrop Stats */}
          <SlideUp delay={0.7}>
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Airdrop Statistics</CardTitle>
                <Gift className="h-5 w-5 text-white/60" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-white/60 text-sm">Total Airdrops</p>
                    <p className="text-2xl font-bold text-white">{airdropStats.totalAirdrops}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Total Recipients</p>
                    <p className="text-2xl font-bold text-white">{airdropStats.totalRecipients}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Completed Airdrops</p>
                    <p className="text-2xl font-bold text-[#00FFE0]">{airdropStats.completedAirdrops}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Pending Airdrops</p>
                    <p className="text-2xl font-bold text-[#FFC93C]">{airdropStats.pendingAirdrops}</p>
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white font-medium">Total Amount Airdropped</p>
                    <p className="text-2xl font-bold text-white">{airdropStats.totalAmountAirdropped} USDC</p>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#00FFE0] to-[#00C2FF] h-full rounded-full"
                      style={{ width: `${(airdropStats.completedAirdrops / airdropStats.totalAirdrops) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1">
                    <p className="text-white/60 text-xs">
                      {((airdropStats.completedAirdrops / airdropStats.totalAirdrops) * 100).toFixed(1)}% complete
                    </p>
                    <p className="text-white/60 text-xs">
                      {airdropStats.completedAirdrops} of {airdropStats.totalAirdrops} airdrops
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </SlideUp>
        </div>
      </div>
    </div>
  )
}
