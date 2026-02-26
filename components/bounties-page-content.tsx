"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Trophy, 
  Target, 
  Award, 
  Gem, 
  Loader2, 
  ArrowLeft,
  ExternalLink,
  Clock,
  CheckCircle,
  Wallet
} from "lucide-react"
import { useWallet } from "@/contexts/wallet-context"
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Link from "next/link"

interface Bounty {
  id: string
  title: string
  description: string
  fullDescription: string
  imageUrl: string
  reward: string
  difficulty: "easy" | "medium" | "hard"
  category: string
  steps: string[]
  isActive: boolean
  createdAt: any
  createdBy: string
}

interface Submission {
  id: string
  bountyId: string
  userWallet: string
  link: string
  status: "pending" | "approved" | "rejected"
  createdAt: any
}

export function BountiesPageContent() {
  const { publicKey } = useWallet()
  const [bounties, setBounties] = useState<Bounty[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null)
  const [submitModalOpen, setSubmitModalOpen] = useState(false)
  const [submissionLink, setSubmissionLink] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [hasNFT, setHasNFT] = useState(false)

  const walletAddress = publicKey?.toString()

  // FIX: NFT Detection with case-insensitive search
  useEffect(() => {
    if (!walletAddress) {
      setHasNFT(false)
      return
    }
    
    const checkNFT = async () => {
      try {
        console.log("🔍 Checking NFT for:", walletAddress)
        
        // Method 1: Direct query
        const q = query(
          collection(db, "nfts"), 
          where("ownerWallet", "==", walletAddress)
        )
        const snapshot = await getDocs(q)
        
        if (!snapshot.empty) {
          console.log("✅ NFT found (direct match)")
          setHasNFT(true)
          return
        }
        
        // Method 2: Case-insensitive check
        const allNfts = await getDocs(collection(db, "nfts"))
        const walletLower = walletAddress.toLowerCase()
        
        for (const doc of allNfts.docs) {
          const data = doc.data()
          const ownerWallet = (data.ownerWallet || "").toLowerCase()
          
          if (ownerWallet === walletLower) {
            console.log("✅ NFT found (case-insensitive):", doc.id)
            setHasNFT(true)
            return
          }
        }
        
        console.log("❌ No NFT found")
        // TEMPORARY: Allow all users to submit (remove this line after fixing NFT data)
        // setHasNFT(true)
        
      } catch (err) {
        console.error("❌ Error:", err)
        // If error, allow submission (fail-safe)
        setHasNFT(true)
      }
    }
    
    checkNFT()
  }, [walletAddress])

  // Fetch bounties
  useEffect(() => {
    setLoading(true)
    
    const q = query(
      collection(db, "bounties"),
      orderBy("createdAt", "desc")
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bountyList: Bounty[] = []
      snapshot.forEach((doc) => {
        bountyList.push({ 
          id: doc.id, 
          ...doc.data()
        } as Bounty)
      })
      setBounties(bountyList)
      setLoading(false)
    }, (error) => {
      console.error("Error:", error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!walletAddress) return

    const q = query(
      collection(db, "submissions"),
      where("userWallet", "==", walletAddress)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subList: Submission[] = []
      snapshot.forEach((doc) => {
        subList.push({ id: doc.id, ...doc.data() } as Submission)
      })
      setSubmissions(subList)
    })

    return () => unsubscribe()
  }, [walletAddress])

  const handleSubmit = async () => {
    if (!selectedBounty || !walletAddress || !submissionLink) return

    setSubmitting(true)
    try {
      await addDoc(collection(db, "submissions"), {
        bountyId: selectedBounty.id,
        userWallet: walletAddress,
        link: submissionLink,
        status: "pending",
        createdAt: serverTimestamp(),
        bountyTitle: selectedBounty.title
      })

      toast({
        title: "✅ Submitted!",
        description: "Your submission is under review."
      })

      setSubmissionLink("")
      setSubmitModalOpen(false)
      setSelectedBounty(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit. Try again.",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getSubmissionStatus = (bountyId: string) => {
    const sub = submissions.find(s => s.bountyId === bountyId)
    return sub?.status || null
  }

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "easy": return "from-green-400 to-emerald-500"
      case "medium": return "from-yellow-400 to-orange-500"
      case "hard": return "from-red-400 to-pink-500"
      default: return "from-blue-400 to-purple-500"
    }
  }

  const StatCard = ({ icon: Icon, label, value, gradient }: any) => (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative bg-gradient-to-br from-gray-900/90 to-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/30 hover:border-gray-600/50 transition-all">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="text-gray-400 text-sm font-medium mb-1">{label}</div>
        <div className="text-2xl font-bold text-white">{value}</div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-white text-xl flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          Loading bounties...
        </div>
      </div>
    )
  }

  // FIX: Filter only active bounties
  const activeBounties = bounties.filter(b => b.isActive !== false)

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-20">
      <main className="relative z-10 pt-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/quests">
              <Button variant="outline" size="icon" className="border-gray-700 hover:bg-gray-800">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold">
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
                  Bounties
                </span>
              </h1>
              <p className="text-gray-400 mt-1">Complete high-value tasks and earn big rewards</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <StatCard 
              icon={Trophy} 
              label="Active Bounties" 
              value={activeBounties.length}
              gradient="from-orange-400 to-red-500"
            />
            <StatCard 
              icon={Target} 
              label="Your Submissions" 
              value={submissions.length}
              gradient="from-blue-400 to-indigo-500"
            />
            <StatCard 
              icon={Award} 
              label="Approved" 
              value={submissions.filter(s => s.status === "approved").length}
              gradient="from-purple-400 to-pink-500"
            />
            <StatCard 
              icon={Gem} 
              label="Pending" 
              value={submissions.filter(s => s.status === "pending").length}
              gradient="from-emerald-400 to-teal-500"
            />
          </div>

          {/* DEBUG INFO */}
          <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm">
            <p>
              Debug: Wallet: {walletAddress?.slice(0, 8)}... | 
              NFT: {hasNFT ? "✅" : "❌"} | 
              Total Bounties: {bounties.length} | 
              Active: {activeBounties.length}
            </p>
          </div>

          {!hasNFT && (
            <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-4">
              <Wallet className="w-8 h-8 text-red-400" />
              <div>
                <p className="text-red-400 font-medium">Mint Pass Required</p>
                <p className="text-gray-400 text-sm">You need to mint RewardNFT to submit bounties</p>
              </div>
              <Link href="/mint" className="ml-auto">
                <Button className="bg-red-500 hover:bg-red-600">Mint Now</Button>
              </Link>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeBounties.map((bounty) => {
              const status = getSubmissionStatus(bounty.id)
              
              return (
                <div 
                  key={bounty.id}
                  onClick={() => setSelectedBounty(bounty)}
                  className="group relative bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-xl rounded-2xl overflow-hidden border border-gray-700/30 hover:border-gray-600/50 transition-all duration-300 hover:transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10 cursor-pointer"
                >
                  <div className="relative h-48 overflow-hidden">
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getDifficultyColor(bounty.difficulty)} z-10`} />
                    <img 
                      src={bounty.imageUrl || "/placeholder.svg"} 
                      alt={bounty.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
                    
                    {status && (
                      <div className="absolute top-3 right-3">
                        <Badge className={`${
                          status === "approved" ? "bg-green-500" : 
                          status === "rejected" ? "bg-red-500" : 
                          "bg-yellow-500"
                        } text-white`}>
                          {status === "approved" && <CheckCircle className="w-3 h-3 mr-1" />}
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-xs px-3 py-1 rounded-full bg-gradient-to-r ${getDifficultyColor(bounty.difficulty)} text-white font-medium`}>
                        {bounty.difficulty.charAt(0).toUpperCase() + bounty.difficulty.slice(1)}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {bounty.category}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                      {bounty.title}
                    </h3>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                      {bounty.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-yellow-400">
                        <Trophy className="w-4 h-4" />
                        <span className="font-bold">{bounty.reward}</span>
                      </div>
                      <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                        View Details <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {activeBounties.length === 0 && (
            <div className="text-center py-20">
              <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-400">No Active Bounties</h3>
              <p className="text-gray-500 mt-2">Check back later for new opportunities!</p>
            </div>
          )}
        </div>
      </main>

      <Dialog open={!!selectedBounty && !submitModalOpen} onOpenChange={() => setSelectedBounty(null)}>
        <DialogContent className="bg-[#0f0f14] border-gray-700/50 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedBounty && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getDifficultyColor(selectedBounty.difficulty)} flex items-center justify-center`}>
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  {selectedBounty.title}
                </DialogTitle>
              </DialogHeader>

              <div className="mt-4 space-y-6">
                <div className="relative h-64 rounded-xl overflow-hidden">
                  <img 
                    src={selectedBounty.imageUrl || "/placeholder.svg"} 
                    alt={selectedBounty.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f14] via-transparent to-transparent" />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">
                    <Trophy className="w-5 h-5" />
                    <span className="font-bold text-lg">{selectedBounty.reward}</span>
                  </div>
                  <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${getDifficultyColor(selectedBounty.difficulty)} text-white font-medium`}>
                    {selectedBounty.difficulty.charAt(0).toUpperCase() + selectedBounty.difficulty.slice(1)} Difficulty
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">About this Bounty</h4>
                  <p className="text-gray-400 leading-relaxed">
                    {selectedBounty.fullDescription || selectedBounty.description}
                  </p>
                </div>

                {selectedBounty.steps && selectedBounty.steps.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">How to Complete</h4>
                    <div className="space-y-3">
                      {selectedBounty.steps.map((step, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700/30">
                          <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm font-bold shrink-0">
                            {index + 1}
                          </div>
                          <p className="text-gray-300 text-sm">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {getSubmissionStatus(selectedBounty.id) ? (
                  <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/30 text-center">
                    <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p className="text-white font-medium">Already Submitted</p>
                    <p className="text-gray-400 text-sm">Status: {getSubmissionStatus(selectedBounty.id)}</p>
                  </div>
                ) : hasNFT ? (
                  <Button 
                    onClick={() => setSubmitModalOpen(true)}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-6 text-lg rounded-xl"
                  >
                    Submit Work <ExternalLink className="w-5 h-5 ml-2" />
                  </Button>
                ) : (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
                    <p className="text-red-400 font-medium">Mint Pass Required</p>
                    <p className="text-gray-400 text-sm">You need to mint RewardNFT to submit bounties</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={submitModalOpen} onOpenChange={setSubmitModalOpen}>
        <DialogContent className="bg-[#0f0f14] border-gray-700/50 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Submit Your Work</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Submission Link / Proof</label>
              <Input
                value={submissionLink}
                onChange={(e) => setSubmissionLink(e.target.value)}
                placeholder="https://..."
                className="bg-gray-900/50 border-gray-700 text-white focus:border-purple-500"
              />
              <p className="text-gray-500 text-xs mt-2">
                Paste a link to your work (Google Drive, GitHub, Twitter, etc.)
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setSubmitModalOpen(false)}
                className="flex-1 border-gray-700 text-gray-400 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!submissionLink || submitting}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
