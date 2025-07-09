"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useWallet } from "@/contexts/wallet-context"
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { isAdminWallet } from "@/config/admin"
import { Activity, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export default function InitQuestsPage() {
  const { connected, publicKey } = useWallet()
  const [loading, setLoading] = useState(false)
  const [questCount, setQuestCount] = useState<number | null>(null)
  const [quests, setQuests] = useState<any[]>([])
  const [initialized, setInitialized] = useState(false)

  const isAdmin = connected && publicKey && isAdminWallet(publicKey.toString())

  const checkQuestStatus = async () => {
    if (!publicKey) return

    try {
      setLoading(true)
      const response = await fetch(`/api/admin/init-unique-quests?wallet=${publicKey.toString()}`)
      const result = await response.json()
      
      if (result.success) {
        setQuestCount(result.questCount)
        setQuests(result.quests || [])
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to check quest status", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const initializeQuests = async () => {
    if (!publicKey) return

    try {
      setLoading(true)
      const response = await fetch('/api/admin/init-unique-quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: publicKey.toString() })
      })
      const result = await response.json()
      
      if (result.success) {
        toast({ 
          title: "Success!", 
          description: result.message 
        })
        setQuestCount(result.quests?.length || 0)
        setQuests(result.quests || [])
        setInitialized(true)
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to initialize quests", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto bg-gray-800/50 border-gray-700">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white">Connect Wallet</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-300">Connect your admin wallet to initialize quests!</p>
            <WalletConnectButton className="w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto bg-gray-800/50 border-gray-700">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
            <p className="text-gray-300">Only admin wallet can initialize quests.</p>
            <p className="text-sm text-gray-500">Current wallet: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Initialize <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">Unique Quests</span>
            </h1>
            <p className="text-gray-400">Set up the one-time quest system for your platform</p>
          </div>

          <Card className="bg-gray-800/50 border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Quest System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Admin Wallet:</span>
                <Badge variant="outline" className="text-green-400 border-green-400">
                  Connected
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Current Quests:</span>
                <Badge variant={questCount === 0 ? "destructive" : "default"}>
                  {questCount === null ? "Unknown" : `${questCount} Quests`}
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={checkQuestStatus} 
                  disabled={loading}
                  variant="outline"
                  className="flex-1"
                >
                  {loading ? "Checking..." : "Check Status"}
                </Button>
                
                {questCount === 0 && (
                  <Button 
                    onClick={initializeQuests} 
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? "Initializing..." : "Initialize Quests"}
                  </Button>
                )}
              </div>

              {initialized && (
                <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">Quests Initialized Successfully!</span>
                  </div>
                  <p className="text-green-300 text-sm mt-1">
                    Created {quests.length} unique one-time quests
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {quests.length > 0 && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Created Quests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quests.map((quest, index) => (
                    <div key={quest.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <div>
                        <div className="text-white font-medium">{quest.title}</div>
                        <div className="text-gray-400 text-sm">{quest.type} • {quest.reward.xp} XP</div>
                      </div>
                      <Badge variant="outline" className="text-purple-400 border-purple-400">
                        {quest.requirements.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">
              After initialization, users can access quests at <span className="text-blue-400">/quests</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
