"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Download, Users, Coins, Disc, TrendingUp } from "lucide-react"
import { useWallet } from "@/contexts/wallet-context"
import { WalletConnectButton } from "@/components/wallet-connect-button"

// Mock data for demonstration
const mintData = [
  { id: 1, wallet: "0x123...abc", date: "2023-05-01", amount: 10, txHash: "0xabc...123" },
  { id: 2, wallet: "0x456...def", date: "2023-05-02", amount: 10, txHash: "0xdef...456" },
  { id: 3, wallet: "0x789...ghi", date: "2023-05-03", amount: 10, txHash: "0xghi...789" },
  { id: 4, wallet: "0xabc...123", date: "2023-05-04", amount: 10, txHash: "0x123...abc" },
  { id: 5, wallet: "0xdef...456", date: "2023-05-05", amount: 10, txHash: "0x456...def" },
]

const referralData = [
  { id: 1, referrer: "0x123...abc", referred: "0xabc...123", date: "2023-05-02", amount: 4, txHash: "0xabc...123" },
  { id: 2, referrer: "0x123...abc", referred: "0xdef...456", date: "2023-05-03", amount: 4, txHash: "0xdef...456" },
  { id: 3, referrer: "0x456...def", referred: "0xghi...789", date: "2023-05-04", amount: 4, txHash: "0xghi...789" },
  { id: 4, referrer: "0x789...ghi", referred: "0x123...abc", date: "2023-05-05", amount: 4, txHash: "0x123...abc" },
]

export function AdminDashboardContent() {
  const { connected } = useWallet()
  const [searchTerm, setSearchTerm] = useState("")

  // Filter data based on search term
  const filteredMintData = mintData.filter(
    (item) =>
      item.wallet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.txHash.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredReferralData = referralData.filter(
    (item) =>
      item.referrer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.referred.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.txHash.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Calculate statistics
  const totalMints = mintData.length
  const totalReferrals = referralData.length
  const totalUsdcCollected = mintData.reduce((sum, item) => sum + item.amount, 0)
  const totalUsdcPaid = referralData.reduce((sum, item) => sum + item.amount, 0)
  const netRevenue = totalUsdcCollected - totalUsdcPaid

  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-white">Admin Dashboard</h1>
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <h2 className="text-xl font-bold text-white">Connect Your Wallet</h2>
            <p className="text-white/60 text-center mb-4">Connect your admin wallet to access the dashboard</p>
            <WalletConnectButton />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-white">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total Mints</p>
                <p className="text-3xl font-bold text-white">{totalMints}</p>
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
              </div>
              <div className="bg-white/10 p-3 rounded-full">
                <Users className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">USDC Collected</p>
                <p className="text-3xl font-bold text-white">{totalUsdcCollected}</p>
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
                <p className="text-3xl font-bold text-white">{netRevenue}</p>
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
        <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Tabs for Mint and Referral Data */}
      <Tabs defaultValue="mints" className="w-full">
        <TabsList className="w-full bg-white/10 mb-6">
          <TabsTrigger value="mints" className="flex-1 data-[state=active]:bg-white/20 text-white">
            Mint Transactions
          </TabsTrigger>
          <TabsTrigger value="referrals" className="flex-1 data-[state=active]:bg-white/20 text-white">
            Referral Payouts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mints" className="mt-0">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Mint Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-white/60 py-3 px-4">ID</th>
                      <th className="text-left text-white/60 py-3 px-4">Wallet</th>
                      <th className="text-left text-white/60 py-3 px-4">Date</th>
                      <th className="text-right text-white/60 py-3 px-4">Amount (USDC)</th>
                      <th className="text-left text-white/60 py-3 px-4">Transaction Hash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMintData.map((item) => (
                      <tr key={item.id} className="border-b border-white/10 last:border-0">
                        <td className="py-3 px-4 text-white">{item.id}</td>
                        <td className="py-3 px-4 text-white">{item.wallet}</td>
                        <td className="py-3 px-4 text-white">{item.date}</td>
                        <td className="py-3 px-4 text-white text-right">{item.amount}</td>
                        <td className="py-3 px-4 text-white">
                          <a
                            href={`https://explorer.solana.com/tx/${item.txHash}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline"
                          >
                            {item.txHash}
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

        <TabsContent value="referrals" className="mt-0">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Referral Payouts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-white/60 py-3 px-4">ID</th>
                      <th className="text-left text-white/60 py-3 px-4">Referrer</th>
                      <th className="text-left text-white/60 py-3 px-4">Referred</th>
                      <th className="text-left text-white/60 py-3 px-4">Date</th>
                      <th className="text-right text-white/60 py-3 px-4">Amount (USDC)</th>
                      <th className="text-left text-white/60 py-3 px-4">Transaction Hash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReferralData.map((item) => (
                      <tr key={item.id} className="border-b border-white/10 last:border-0">
                        <td className="py-3 px-4 text-white">{item.id}</td>
                        <td className="py-3 px-4 text-white">{item.referrer}</td>
                        <td className="py-3 px-4 text-white">{item.referred}</td>
                        <td className="py-3 px-4 text-white">{item.date}</td>
                        <td className="py-3 px-4 text-white text-right">{item.amount}</td>
                        <td className="py-3 px-4 text-white">
                          <a
                            href={`https://explorer.solana.com/tx/${item.txHash}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline"
                          >
                            {item.txHash}
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
      </Tabs>
    </div>
  )
}
