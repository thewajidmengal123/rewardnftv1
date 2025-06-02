"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, Clock, AlertCircle, Users, Gift, Trash2 } from "lucide-react"
import { useWallet } from "@/contexts/wallet-context"
import {
  createAirdrop,
  getAirdropsByStatus,
  processAirdrop,
  cancelAirdrop,
  getEligibleRecipients,
  type Airdrop,
  type AirdropType,
  type AirdropEligibility,
} from "@/utils/airdrop"
import { useToast } from "@/components/ui/use-toast"
import { PLATFORM_WALLET_ADDRESS } from "@/config/solana"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { WalletAddress } from "@/components/wallet-address"

export function AdminAirdropContent() {
  const { connected, publicKey, connection } = useWallet()
  const [airdrops, setAirdrops] = useState<{
    scheduled: Airdrop[]
    inProgress: Airdrop[]
    completed: Airdrop[]
    failed: Airdrop[]
  }>({
    scheduled: [],
    inProgress: [],
    completed: [],
    failed: [],
  })
  const [loading, setLoading] = useState(false)
  const [newAirdrop, setNewAirdrop] = useState({
    name: "",
    description: "",
    type: "token" as AirdropType,
    amount: 5,
    eligibility: "top_referrers" as AirdropEligibility,
    minRank: 1,
    maxRank: 10,
    minCompletions: 5,
    minReferrals: 3,
    scheduledAt: new Date().toISOString().split("T")[0],
    manualWallets: "",
  })
  const [selectedAirdrop, setSelectedAirdrop] = useState<Airdrop | null>(null)
  const [eligibleWallets, setEligibleWallets] = useState<string[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  // Load airdrops when wallet is connected
  useEffect(() => {
    if (connected && publicKey) {
      loadAirdrops()
    }
  }, [connected, publicKey])

  // Load airdrops
  const loadAirdrops = async () => {
    if (!connected || !publicKey) return

    setLoading(true)

    try {
      // Get airdrops by status
      const scheduled = getAirdropsByStatus("scheduled")
      const inProgress = getAirdropsByStatus("in_progress")
      const completed = getAirdropsByStatus("completed")
      const failed = getAirdropsByStatus("failed")

      setAirdrops({
        scheduled,
        inProgress,
        completed,
        failed,
      })
    } catch (error) {
      console.error("Error loading airdrops:", error)
      toast({
        title: "Error",
        description: "Failed to load airdrops. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle create airdrop
  const handleCreateAirdrop = async () => {
    if (!connected || !publicKey) return

    setLoading(true)

    try {
      const walletAddress = publicKey.toString()

      // Create eligibility params based on selected eligibility
      let eligibilityParams: any = {}

      switch (newAirdrop.eligibility) {
        case "top_referrers":
          eligibilityParams = {
            minRank: Number.parseInt(newAirdrop.minRank.toString()),
            maxRank: Number.parseInt(newAirdrop.maxRank.toString()),
          }
          break
        case "quest_completions":
          eligibilityParams = {
            minCompletions: Number.parseInt(newAirdrop.minCompletions.toString()),
          }
          break
        case "nft_holders":
          // No additional params needed
          break
        case "active_users":
          // No additional params needed
          break
        case "manual_selection":
          eligibilityParams = {
            manualWallets: newAirdrop.manualWallets.split(",").map((w) => w.trim()),
          }
          break
      }

      // Create the airdrop
      const scheduledAt = new Date(newAirdrop.scheduledAt).getTime()

      const airdrop = createAirdrop(
        newAirdrop.name,
        newAirdrop.description,
        newAirdrop.type,
        Number.parseFloat(newAirdrop.amount.toString()),
        newAirdrop.eligibility,
        eligibilityParams,
        scheduledAt,
        walletAddress,
      )

      toast({
        title: "Airdrop Created",
        description: `Airdrop "${airdrop.name}" has been scheduled.`,
      })

      // Reset form
      setNewAirdrop({
        name: "",
        description: "",
        type: "token",
        amount: 5,
        eligibility: "top_referrers",
        minRank: 1,
        maxRank: 10,
        minCompletions: 5,
        minReferrals: 3,
        scheduledAt: new Date().toISOString().split("T")[0],
        manualWallets: "",
      })

      // Reload airdrops
      await loadAirdrops()
    } catch (error) {
      console.error("Error creating airdrop:", error)
      toast({
        title: "Error",
        description: "Failed to create airdrop. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle process airdrop
  const handleProcessAirdrop = async (airdropId: string) => {
    if (!connected || !publicKey) return

    setLoading(true)

    try {
      // Process the airdrop
      const result = await processAirdrop(connection, PLATFORM_WALLET_ADDRESS, airdropId)

      if (result) {
        toast({
          title: "Airdrop Processed",
          description: "The airdrop has been processed successfully.",
        })

        // Reload airdrops
        await loadAirdrops()
      } else {
        toast({
          title: "Error",
          description: "Failed to process airdrop. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error processing airdrop:", error)
      toast({
        title: "Error",
        description: "Failed to process airdrop. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle cancel airdrop
  const handleCancelAirdrop = async (airdropId: string) => {
    if (!connected || !publicKey) return

    setLoading(true)

    try {
      // Cancel the airdrop
      const result = cancelAirdrop(airdropId)

      if (result) {
        toast({
          title: "Airdrop Cancelled",
          description: "The airdrop has been cancelled.",
        })

        // Reload airdrops
        await loadAirdrops()
      } else {
        toast({
          title: "Error",
          description: "Failed to cancel airdrop. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error cancelling airdrop:", error)
      toast({
        title: "Error",
        description: "Failed to cancel airdrop. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle view eligible recipients
  const handleViewEligibleRecipients = async (airdrop: Airdrop) => {
    setSelectedAirdrop(airdrop)
    setLoading(true)

    try {
      // Get eligible recipients
      const recipients = await getEligibleRecipients(airdrop)
      setEligibleWallets(recipients)
      setIsDialogOpen(true)
    } catch (error) {
      console.error("Error getting eligible recipients:", error)
      toast({
        title: "Error",
        description: "Failed to get eligible recipients. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Clock className="h-5 w-5 text-blue-400" />
      case "in_progress":
        return <Clock className="h-5 w-5 text-yellow-400" />
      case "completed":
        return <Check className="h-5 w-5 text-green-400" />
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-400" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
  }

  // Get eligibility icon
  const getEligibilityIcon = (eligibility: string) => {
    switch (eligibility) {
      case "top_referrers":
        return <Users className="h-5 w-5" />
      case "quest_completions":
        return <Check className="h-5 w-5" />
      case "nft_holders":
        return <Gift className="h-5 w-5" />
      case "active_users":
        return <Users className="h-5 w-5" />
      case "manual_selection":
        return <Users className="h-5 w-5" />
      default:
        return <AlertCircle className="h-5 w-5" />
    }
  }

  // Get eligibility text
  const getEligibilityText = (airdrop: Airdrop) => {
    switch (airdrop.eligibility) {
      case "top_referrers":
        return `Top Referrers (Rank ${airdrop.eligibilityParams.minRank || 1} - ${airdrop.eligibilityParams.maxRank || 10})`
      case "quest_completions":
        return `Quest Completions (Min: ${airdrop.eligibilityParams.minCompletions || 1})`
      case "nft_holders":
        return "NFT Holders"
      case "active_users":
        return "Active Users"
      case "manual_selection":
        return "Manual Selection"
      default:
        return "Unknown"
    }
  }

  // Render airdrop card
  const renderAirdropCard = (airdrop: Airdrop) => {
    return (
      <div
        key={airdrop.id}
        className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 hover:border-white/40 transition-colors"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="bg-white/10 rounded-full p-3">
              {airdrop.type === "token" ? (
                <Gift className="h-6 w-6 text-white" />
              ) : (
                <Gift className="h-6 w-6 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{airdrop.name}</h3>
              <p className="text-white/80 mt-1">{airdrop.description}</p>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-white/60">Type:</span>
                  <span className="text-white">{airdrop.type === "token" ? "Token" : "NFT"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/60">Amount:</span>
                  <span className="text-white">
                    {airdrop.amount} {airdrop.type === "token" ? "USDC" : "NFT"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/60">Eligibility:</span>
                  <span className="text-white flex items-center gap-1">
                    {getEligibilityIcon(airdrop.eligibility)}
                    {getEligibilityText(airdrop)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/60">Scheduled:</span>
                  <span className="text-white">{new Date(airdrop.scheduledAt).toLocaleDateString()}</span>
                </div>
                {airdrop.completedAt && (
                  <div className="flex items-center gap-2">
                    <span className="text-white/60">Completed:</span>
                    <span className="text-white">{new Date(airdrop.completedAt).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-white/60">Status:</span>
                  <span className="text-white flex items-center gap-1">
                    {getStatusIcon(airdrop.status)}
                    {airdrop.status.charAt(0).toUpperCase() + airdrop.status.slice(1)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/60">Recipients:</span>
                  <span className="text-white">
                    {airdrop.recipients.length > 0 ? `${airdrop.recipients.length} wallets` : "Not processed yet"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {airdrop.status === "scheduled" && (
              <>
                <Button size="sm" onClick={() => handleProcessAirdrop(airdrop.id)} disabled={loading}>
                  Process Airdrop
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10"
                  onClick={() => handleViewEligibleRecipients(airdrop)}
                  disabled={loading}
                >
                  View Recipients
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleCancelAirdrop(airdrop.id)}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}

            {(airdrop.status === "completed" || airdrop.status === "failed") && (
              <Button
                size="sm"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
                onClick={() => handleViewEligibleRecipients(airdrop)}
                disabled={loading}
              >
                View Recipients
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#FFA500] via-[#FF5555] to-[#00C2FF]">
      {/* Header */}
      <header className="w-full py-4 px-6 bg-black/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-12 w-12 bg-[#00FFE0] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">R</span>
            </div>
            <span className="text-white font-bold text-2xl">Reward NFT</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/admin/dashboard" className="text-white hover:text-white/80 transition-colors">
              Dashboard
            </Link>
            <Link href="/admin/airdrops" className="text-white/80 font-medium border-b-2 border-white">
              Airdrops
            </Link>
            <Link href="/admin/verification" className="text-white hover:text-white/80 transition-colors">
              Verification
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Button className={connected ? "bg-white/10 text-white border border-white/30" : "bg-white text-black"}>
              {connected ? "Disconnect" : "Connect Wallet"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-5xl font-bold text-white mb-2">Airdrops</h1>
              <p className="text-xl text-white/80">Manage token and NFT airdrops</p>
            </div>
          </div>

          {connected ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Create Airdrop */}
              <div className="lg:col-span-1">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Create Airdrop</h2>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-white">
                        Name
                      </Label>
                      <Input
                        id="name"
                        value={newAirdrop.name}
                        onChange={(e) => setNewAirdrop({ ...newAirdrop, name: e.target.value })}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-white">
                        Description
                      </Label>
                      <Input
                        id="description"
                        value={newAirdrop.description}
                        onChange={(e) => setNewAirdrop({ ...newAirdrop, description: e.target.value })}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>

                    <div>
                      <Label htmlFor="type" className="text-white">
                        Type
                      </Label>
                      <Select
                        value={newAirdrop.type}
                        onValueChange={(value) => setNewAirdrop({ ...newAirdrop, type: value as AirdropType })}
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="token">Token</SelectItem>
                          <SelectItem value="nft">NFT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="amount" className="text-white">
                        Amount
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        value={newAirdrop.amount}
                        onChange={(e) => setNewAirdrop({ ...newAirdrop, amount: Number.parseFloat(e.target.value) })}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>

                    <div>
                      <Label htmlFor="eligibility" className="text-white">
                        Eligibility
                      </Label>
                      <Select
                        value={newAirdrop.eligibility}
                        onValueChange={(value) =>
                          setNewAirdrop({ ...newAirdrop, eligibility: value as AirdropEligibility })
                        }
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Select eligibility" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top_referrers">Top Referrers</SelectItem>
                          <SelectItem value="quest_completions">Quest Completions</SelectItem>
                          <SelectItem value="nft_holders">NFT Holders</SelectItem>
                          <SelectItem value="active_users">Active Users</SelectItem>
                          <SelectItem value="manual_selection">Manual Selection</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {newAirdrop.eligibility === "top_referrers" && (
                      <>
                        <div>
                          <Label htmlFor="minRank" className="text-white">
                            Min Rank
                          </Label>
                          <Input
                            id="minRank"
                            type="number"
                            value={newAirdrop.minRank}
                            onChange={(e) => setNewAirdrop({ ...newAirdrop, minRank: Number.parseInt(e.target.value) })}
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="maxRank" className="text-white">
                            Max Rank
                          </Label>
                          <Input
                            id="maxRank"
                            type="number"
                            value={newAirdrop.maxRank}
                            onChange={(e) => setNewAirdrop({ ...newAirdrop, maxRank: Number.parseInt(e.target.value) })}
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                      </>
                    )}

                    {newAirdrop.eligibility === "quest_completions" && (
                      <div>
                        <Label htmlFor="minCompletions" className="text-white">
                          Min Completions
                        </Label>
                        <Input
                          id="minCompletions"
                          type="number"
                          value={newAirdrop.minCompletions}
                          onChange={(e) =>
                            setNewAirdrop({ ...newAirdrop, minCompletions: Number.parseInt(e.target.value) })
                          }
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                    )}

                    {newAirdrop.eligibility === "manual_selection" && (
                      <div>
                        <Label htmlFor="manualWallets" className="text-white">
                          Wallet Addresses (comma separated)
                        </Label>
                        <Input
                          id="manualWallets"
                          value={newAirdrop.manualWallets}
                          onChange={(e) => setNewAirdrop({ ...newAirdrop, manualWallets: e.target.value })}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="scheduledAt" className="text-white">
                        Scheduled Date
                      </Label>
                      <Input
                        id="scheduledAt"
                        type="date"
                        value={newAirdrop.scheduledAt}
                        onChange={(e) => setNewAirdrop({ ...newAirdrop, scheduledAt: e.target.value })}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>

                    <Button
                      onClick={handleCreateAirdrop}
                      disabled={loading || !newAirdrop.name || !newAirdrop.description}
                      className="w-full"
                    >
                      Create Airdrop
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right Column - Airdrops List */}
              <div className="lg:col-span-2">
                <Tabs defaultValue="scheduled" className="w-full">
                  <TabsList className="bg-white/10 border border-white/20 mb-8">
                    <TabsTrigger value="scheduled" className="data-[state=active]:bg-white/20 text-white">
                      Scheduled
                    </TabsTrigger>
                    <TabsTrigger value="in_progress" className="data-[state=active]:bg-white/20 text-white">
                      In Progress
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="data-[state=active]:bg-white/20 text-white">
                      Completed
                    </TabsTrigger>
                    <TabsTrigger value="failed" className="data-[state=active]:bg-white/20 text-white">
                      Failed
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="scheduled" className="mt-0">
                    <div className="space-y-6">
                      {airdrops.scheduled.length > 0 ? (
                        airdrops.scheduled.map((airdrop) => renderAirdropCard(airdrop))
                      ) : (
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-12 text-center">
                          <h2 className="text-2xl font-bold text-white mb-4">No Scheduled Airdrops</h2>
                          <p className="text-white/80 mb-6">Create a new airdrop to get started.</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="in_progress" className="mt-0">
                    <div className="space-y-6">
                      {airdrops.inProgress.length > 0 ? (
                        airdrops.inProgress.map((airdrop) => renderAirdropCard(airdrop))
                      ) : (
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-12 text-center">
                          <h2 className="text-2xl font-bold text-white mb-4">No In-Progress Airdrops</h2>
                          <p className="text-white/80 mb-6">Process a scheduled airdrop to see it here.</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="completed" className="mt-0">
                    <div className="space-y-6">
                      {airdrops.completed.length > 0 ? (
                        airdrops.completed.map((airdrop) => renderAirdropCard(airdrop))
                      ) : (
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-12 text-center">
                          <h2 className="text-2xl font-bold text-white mb-4">No Completed Airdrops</h2>
                          <p className="text-white/80 mb-6">Complete an airdrop to see it here.</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="failed" className="mt-0">
                    <div className="space-y-6">
                      {airdrops.failed.length > 0 ? (
                        airdrops.failed.map((airdrop) => renderAirdropCard(airdrop))
                      ) : (
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-12 text-center">
                          <h2 className="text-2xl font-bold text-white mb-4">No Failed Airdrops</h2>
                          <p className="text-white/80 mb-6">No airdrops have failed.</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 p-12 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Connect Your Wallet to Access Admin</h2>
              <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                Connect your wallet to access the admin dashboard and manage airdrops.
              </p>
              <Button size="lg" className="bg-white hover:bg-white/90 text-black">
                Connect Wallet
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Recipients Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-black/80 backdrop-blur-md border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selectedAirdrop ? `Recipients for ${selectedAirdrop.name}` : "Recipients"}
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto">
            {eligibleWallets.length > 0 ? (
              <div className="space-y-2">
                {eligibleWallets.map((wallet, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border-b border-white/10">
                    <WalletAddress address={wallet} />

                    {selectedAirdrop && selectedAirdrop.recipients.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-white/60">Status:</span>
                        {selectedAirdrop.recipients.find((r) => r.wallet === wallet)?.status === "success" ? (
                          <span className="text-green-400 flex items-center gap-1">
                            <Check className="h-4 w-4" /> Sent
                          </span>
                        ) : selectedAirdrop.recipients.find((r) => r.wallet === wallet)?.status === "failed" ? (
                          <span className="text-red-400 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" /> Failed
                          </span>
                        ) : (
                          <span className="text-yellow-400 flex items-center gap-1">
                            <Clock className="h-4 w-4" /> Pending
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-white/80">No eligible recipients found.</p>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
              onClick={() => setIsDialogOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
