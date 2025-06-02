"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { WalletTestPanel } from "@/components/wallet-test-panel"
import {
  generateMockReferralData,
  generateMockQuestData,
  generateMockAirdropData,
  generateMockNftData,
  generateMockTransactionData,
} from "@/utils/test-data-generator"
import { FadeIn, SlideUp } from "@/components/ui/animations"

export function TestPageContent() {
  const [referralData, setReferralData] = useState<any[]>([])
  const [questData, setQuestData] = useState<any[]>([])
  const [airdropData, setAirdropData] = useState<any[]>([])
  const [nftData, setNftData] = useState<any[]>([])
  const [transactionData, setTransactionData] = useState<any[]>([])

  // Generate test data
  const generateTestData = () => {
    setReferralData(generateMockReferralData(5))
    setQuestData(generateMockQuestData(5))
    setAirdropData(generateMockAirdropData(3))
    setNftData(generateMockNftData(3))
    setTransactionData(generateMockTransactionData(5))
  }

  // Clear test data
  const clearTestData = () => {
    setReferralData([])
    setQuestData([])
    setAirdropData([])
    setNftData([])
    setTransactionData([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#2d1b4e] p-6">
      <div className="max-w-7xl mx-auto">
        <FadeIn>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white">Test Page</h1>
              <p className="text-white/60">Testing utilities for the Reward NFT Platform</p>
            </div>

            <div className="flex items-center gap-4">
              <Button onClick={generateTestData}>Generate Test Data</Button>
              <Button
                onClick={clearTestData}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Clear Data
              </Button>
            </div>
          </div>
        </FadeIn>

        <SlideUp delay={0.2}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <WalletTestPanel />

            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Test Data Generator</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80 mb-4">
                  Generate mock data for testing the platform. Click the buttons above to generate or clear test data.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-white font-medium">Referral Data</p>
                    <p className="text-white/60 text-sm">{referralData.length} items generated</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-white font-medium">Quest Data</p>
                    <p className="text-white/60 text-sm">{questData.length} items generated</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-white font-medium">Airdrop Data</p>
                    <p className="text-white/60 text-sm">{airdropData.length} items generated</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-white font-medium">NFT Data</p>
                    <p className="text-white/60 text-sm">{nftData.length} items generated</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </SlideUp>

        <SlideUp delay={0.3}>
          <Tabs defaultValue="referrals" className="w-full">
            <TabsList className="bg-white/10 border border-white/20 mb-8">
              <TabsTrigger value="referrals" className="data-[state=active]:bg-white/20 text-white">
                Referrals
              </TabsTrigger>
              <TabsTrigger value="quests" className="data-[state=active]:bg-white/20 text-white">
                Quests
              </TabsTrigger>
              <TabsTrigger value="airdrops" className="data-[state=active]:bg-white/20 text-white">
                Airdrops
              </TabsTrigger>
              <TabsTrigger value="nfts" className="data-[state=active]:bg-white/20 text-white">
                NFTs
              </TabsTrigger>
              <TabsTrigger value="transactions" className="data-[state=active]:bg-white/20 text-white">
                Transactions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="referrals" className="mt-0">
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Referral Test Data</CardTitle>
                </CardHeader>
                <CardContent>
                  {referralData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left text-white/60 py-3 px-4">Referrer</th>
                            <th className="text-left text-white/60 py-3 px-4">Referred</th>
                            <th className="text-left text-white/60 py-3 px-4">Date</th>
                            <th className="text-right text-white/60 py-3 px-4">Amount</th>
                            <th className="text-left text-white/60 py-3 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {referralData.map((item, index) => (
                            <tr key={index} className="border-b border-white/10 last:border-0">
                              <td className="py-3 px-4 text-white">
                                {item.referrerWallet.substring(0, 6)}...
                                {item.referrerWallet.substring(item.referrerWallet.length - 4)}
                              </td>
                              <td className="py-3 px-4 text-white">
                                {item.referredWallet.substring(0, 6)}...
                                {item.referredWallet.substring(item.referredWallet.length - 4)}
                              </td>
                              <td className="py-3 px-4 text-white">{new Date(item.timestamp).toLocaleDateString()}</td>
                              <td className="py-3 px-4 text-white text-right">{item.amount} USDC</td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    item.status === "completed"
                                      ? "bg-green-500/20 text-green-400"
                                      : "bg-yellow-500/20 text-yellow-400"
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-white/60">No referral test data generated yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quests" className="mt-0">
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Quest Test Data</CardTitle>
                </CardHeader>
                <CardContent>
                  {questData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left text-white/60 py-3 px-4">Wallet</th>
                            <th className="text-left text-white/60 py-3 px-4">Quest ID</th>
                            <th className="text-left text-white/60 py-3 px-4">Type</th>
                            <th className="text-left text-white/60 py-3 px-4">Difficulty</th>
                            <th className="text-left text-white/60 py-3 px-4">Completed</th>
                            <th className="text-right text-white/60 py-3 px-4">Amount</th>
                            <th className="text-left text-white/60 py-3 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {questData.map((item, index) => (
                            <tr key={index} className="border-b border-white/10 last:border-0">
                              <td className="py-3 px-4 text-white">
                                {item.walletAddress.substring(0, 6)}...
                                {item.walletAddress.substring(item.walletAddress.length - 4)}
                              </td>
                              <td className="py-3 px-4 text-white">{item.questId}</td>
                              <td className="py-3 px-4 text-white">{item.questType}</td>
                              <td className="py-3 px-4 text-white">{item.difficulty}</td>
                              <td className="py-3 px-4 text-white">
                                {new Date(item.completedAt).toLocaleDateString()}
                              </td>
                              <td className="py-3 px-4 text-white text-right">{item.amount} USDC</td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    item.status === "claimed"
                                      ? "bg-green-500/20 text-green-400"
                                      : "bg-yellow-500/20 text-yellow-400"
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-white/60">No quest test data generated yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="airdrops" className="mt-0">
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Airdrop Test Data</CardTitle>
                </CardHeader>
                <CardContent>
                  {airdropData.length > 0 ? (
                    <div className="space-y-6">
                      {airdropData.map((airdrop, index) => (
                        <div key={index} className="bg-white/10 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-white font-bold">{airdrop.name}</h3>
                              <p className="text-white/60">{airdrop.description}</p>
                            </div>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                airdrop.status === "completed"
                                  ? "bg-green-500/20 text-green-400"
                                  : airdrop.status === "scheduled"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : airdrop.status === "in_progress"
                                      ? "bg-yellow-500/20 text-yellow-400"
                                      : "bg-red-500/20 text-red-400"
                              }`}
                            >
                              {airdrop.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-white/60 text-sm">Type</p>
                              <p className="text-white">{airdrop.type}</p>
                            </div>
                            <div>
                              <p className="text-white/60 text-sm">Amount</p>
                              <p className="text-white">
                                {airdrop.amount} {airdrop.type === "token" ? "USDC" : "NFT"}
                              </p>
                            </div>
                            <div>
                              <p className="text-white/60 text-sm">Scheduled</p>
                              <p className="text-white">{new Date(airdrop.scheduledAt).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-white/60 text-sm">Recipients</p>
                              <p className="text-white">{airdrop.recipients.length}</p>
                            </div>
                          </div>

                          <div>
                            <p className="text-white/60 text-sm mb-2">Recipients Sample</p>
                            <div className="bg-white/5 rounded-lg p-2 max-h-32 overflow-y-auto">
                              {airdrop.recipients.slice(0, 3).map((recipient, idx) => (
                                <div
                                  key={idx}
                                  className="flex justify-between items-center py-1 border-b border-white/10 last:border-0"
                                >
                                  <span className="text-white text-sm">
                                    {recipient.wallet.substring(0, 6)}...
                                    {recipient.wallet.substring(recipient.wallet.length - 4)}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-xs ${
                                      recipient.status === "success"
                                        ? "bg-green-500/20 text-green-400"
                                        : recipient.status === "pending"
                                          ? "bg-yellow-500/20 text-yellow-400"
                                          : "bg-red-500/20 text-red-400"
                                    }`}
                                  >
                                    {recipient.status}
                                  </span>
                                </div>
                              ))}
                              {airdrop.recipients.length > 3 && (
                                <div className="text-center text-white/60 text-xs mt-1">
                                  +{airdrop.recipients.length - 3} more recipients
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-white/60">No airdrop test data generated yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="nfts" className="mt-0">
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">NFT Test Data</CardTitle>
                </CardHeader>
                <CardContent>
                  {nftData.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {nftData.map((nft, index) => (
                        <div key={index} className="bg-white/10 rounded-lg p-4">
                          <div className="aspect-square bg-white/5 rounded-lg mb-4 flex items-center justify-center">
                            <div className="text-white/40 text-center p-4">
                              [NFT Image Placeholder]
                              <p className="mt-2 text-sm">{nft.image}</p>
                            </div>
                          </div>

                          <h3 className="text-white font-bold">{nft.name}</h3>
                          <p className="text-white/60 text-sm mb-4">{nft.description}</p>

                          <div className="space-y-2">
                            <div>
                              <p className="text-white/60 text-xs">Mint Address</p>
                              <p className="text-white text-sm truncate">{nft.mintAddress}</p>
                            </div>
                            <div>
                              <p className="text-white/60 text-xs">Owner</p>
                              <p className="text-white text-sm truncate">{nft.owner}</p>
                            </div>
                            <div>
                              <p className="text-white/60 text-xs">Minted</p>
                              <p className="text-white text-sm">{new Date(nft.mintedAt).toLocaleDateString()}</p>
                            </div>
                          </div>

                          <div className="mt-4">
                            <p className="text-white/60 text-xs mb-2">Attributes</p>
                            <div className="flex flex-wrap gap-2">
                              {nft.attributes.map((attr, idx) => (
                                <div key={idx} className="bg-white/5 rounded-lg px-2 py-1">
                                  <p className="text-white/60 text-xs">{attr.trait_type}</p>
                                  <p className="text-white text-sm">{attr.value}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-white/60">No NFT test data generated yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transactions" className="mt-0">
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Transaction Test Data</CardTitle>
                </CardHeader>
                <CardContent>
                  {transactionData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left text-white/60 py-3 px-4">Signature</th>
                            <th className="text-left text-white/60 py-3 px-4">Type</th>
                            <th className="text-left text-white/60 py-3 px-4">From</th>
                            <th className="text-left text-white/60 py-3 px-4">To</th>
                            <th className="text-right text-white/60 py-3 px-4">Amount</th>
                            <th className="text-left text-white/60 py-3 px-4">Date</th>
                            <th className="text-left text-white/60 py-3 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactionData.map((item, index) => (
                            <tr key={index} className="border-b border-white/10 last:border-0">
                              <td className="py-3 px-4 text-white">
                                {item.signature.substring(0, 8)}...{item.signature.substring(item.signature.length - 8)}
                              </td>
                              <td className="py-3 px-4 text-white">{item.type}</td>
                              <td className="py-3 px-4 text-white">
                                {item.fromWallet.substring(0, 6)}...
                                {item.fromWallet.substring(item.fromWallet.length - 4)}
                              </td>
                              <td className="py-3 px-4 text-white">
                                {item.toWallet.substring(0, 6)}...{item.toWallet.substring(item.toWallet.length - 4)}
                              </td>
                              <td className="py-3 px-4 text-white text-right">{item.amount} USDC</td>
                              <td className="py-3 px-4 text-white">{new Date(item.timestamp).toLocaleDateString()}</td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    item.status === "confirmed"
                                      ? "bg-green-500/20 text-green-400"
                                      : "bg-red-500/20 text-red-400"
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-white/60">No transaction test data generated yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </SlideUp>
      </div>
    </div>
  )
}
