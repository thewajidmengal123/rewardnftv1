"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRealTimeAnalytics } from "@/hooks/use-real-time-analytics"
import { Users, Activity, Clock, AlertCircle } from "lucide-react"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { FadeIn, SlideUp } from "@/components/ui/animations"

export function RealTimeAnalyticsDashboard() {
  const { connected, metrics } = useRealTimeAnalytics()
  const [historicalData, setHistoricalData] = useState<
    Array<{
      time: string
      activeUsers: number
      mintingInProgress: number
      questsInProgress: number
    }>
  >([])

  // Update historical data when metrics change
  useEffect(() => {
    const now = new Date()
    const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

    setHistoricalData((prev) => {
      const newData = [
        ...prev,
        {
          time: timeString,
          activeUsers: metrics.activeUsers,
          mintingInProgress: metrics.mintingInProgress,
          questsInProgress: metrics.questsInProgress,
        },
      ]

      // Keep only the last 20 data points
      if (newData.length > 20) {
        return newData.slice(newData.length - 20)
      }
      return newData
    })
  }, [metrics])

  if (!connected) {
    return (
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Real-time Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <div className="flex flex-col items-center">
              <AlertCircle className="h-8 w-8 text-yellow-500 mb-2" />
              <p className="text-white/70">Connecting to real-time data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <FadeIn>
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-white flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Real-time Analytics
          </CardTitle>
          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">
            Live
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <SlideUp delay={0.1}>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Active Users</p>
                    <p className="text-2xl font-bold text-white">{metrics.activeUsers}</p>
                  </div>
                  <div className="bg-white/10 p-2 rounded-full">
                    <Users className="h-5 w-5 text-[#00FFE0]" />
                  </div>
                </div>
              </div>
            </SlideUp>

            <SlideUp delay={0.2}>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Minting In Progress</p>
                    <p className="text-2xl font-bold text-white">{metrics.mintingInProgress}</p>
                  </div>
                  <div className="bg-white/10 p-2 rounded-full">
                    <Activity className="h-5 w-5 text-[#FF5555]" />
                  </div>
                </div>
              </div>
            </SlideUp>

            <SlideUp delay={0.3}>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Quests In Progress</p>
                    <p className="text-2xl font-bold text-white">{metrics.questsInProgress}</p>
                  </div>
                  <div className="bg-white/10 p-2 rounded-full">
                    <Clock className="h-5 w-5 text-[#FFC93C]" />
                  </div>
                </div>
              </div>
            </SlideUp>
          </div>

          <div className="h-60 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData}>
                <XAxis dataKey="time" stroke="rgba(255, 255, 255, 0.3)" tick={{ fill: "rgba(255, 255, 255, 0.5)" }} />
                <YAxis stroke="rgba(255, 255, 255, 0.3)" tick={{ fill: "rgba(255, 255, 255, 0.5)" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "8px",
                    color: "white",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="activeUsers"
                  stroke="#00FFE0"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="mintingInProgress"
                  stroke="#FF5555"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="questsInProgress"
                  stroke="#FFC93C"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2">
            <p className="text-white/80 text-sm font-medium mb-2">Recent Transactions</p>
            {metrics.recentTransactions.length === 0 ? (
              <p className="text-white/50 text-sm">No recent transactions</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {metrics.recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-white/5 rounded-lg p-3 flex items-center justify-between border border-white/10"
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-2 h-2 rounded-full mr-2 ${
                          tx.status === "completed"
                            ? "bg-green-500"
                            : tx.status === "pending"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                      ></div>
                      <div>
                        <p className="text-white text-sm font-medium capitalize">{tx.type}</p>
                        <p className="text-white/50 text-xs">
                          {new Date(tx.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-sm font-medium">{tx.amount} USDC</p>
                      <p
                        className={`text-xs capitalize ${
                          tx.status === "completed"
                            ? "text-green-400"
                            : tx.status === "pending"
                              ? "text-yellow-400"
                              : "text-red-400"
                        }`}
                      >
                        {tx.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </FadeIn>
  )
}
