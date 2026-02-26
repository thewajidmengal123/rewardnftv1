"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Trash2, 
  Trophy, 
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  ArrowLeft,
  Search
} from "lucide-react"
import { useWallet } from "@/contexts/wallet-context"
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  updateDoc, 
  doc,
  orderBy
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import Link from "next/link"

const ADMIN_WALLET = "6nHPbBNxh31qpKfLrs3WzzDGkDjmQYQGuVsh9qB7VLBQ"

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
}

interface Submission {
  id: string
  bountyId: string
  bountyTitle: string
  userWallet: string
  link: string
  status: "pending" | "approved" | "rejected"
  createdAt: any
}

export function AdminBountiesContent() {
  const { publicKey } = useWallet()
  const [bounties, setBounties] = useState<Bounty[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"bounties" | "submissions">("bounties")
  const [searchTerm, setSearchTerm] = useState("")

  const isAdmin = publicKey?.toString() === ADMIN_WALLET

  const [newBounty, setNewBounty] = useState({
    title: "",
    description: "",
    fullDescription: "",
    imageUrl: "",
    reward: "",
    difficulty: "medium" as "easy" | "medium" | "hard",
    category: "Content",
    steps: [""]
  })

  useEffect(() => {
    const bountiesQ = query(collection(db, "bounties"), orderBy("createdAt", "desc"))
    const submissionsQ = query(collection(db, "submissions"), orderBy("createdAt", "desc"))

    const unsubBounties = onSnapshot(bountiesQ, (snapshot) => {
      const list: Bounty[] = []
      snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as Bounty))
      setBounties(list)
      setLoading(false)
    })

    const unsubSubmissions = onSnapshot(submissionsQ, (snapshot) => {
      const list: Submission[] = []
      snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as Submission))
      setSubmissions(list)
    })

    return () => {
      unsubBounties()
      unsubSubmissions()
    }
  }, [])

  const handleCreateBounty = async () => {
    if (!newBounty.title || !newBounty.description) {
      toast({ title: "Error", description: "Title and description required", variant: "destructive" })
      return
    }

    try {
      await addDoc(collection(db, "bounties"), {
        ...newBounty,
        isActive: true,
        createdAt: serverTimestamp(),
        createdBy: publicKey?.toString()
      })

      toast({ title: "✅ Bounty Created!", description: "Live for all users" })
      setCreateModalOpen(false)
      setNewBounty({
        title: "",
        description: "",
        fullDescription: "",
        imageUrl: "",
        reward: "",
        difficulty: "medium",
        category: "Content",
        steps: [""]
      })
    } catch (error) {
      toast({ title: "Error", description: "Failed to create", variant: "destructive" })
    }
  }

  const handleDeleteBounty = async (id: string) => {
    if (!confirm("Delete this bounty?")) return
    try {
      await updateDoc(doc(db, "bounties", id), { isActive: false, deletedAt: serverTimestamp() })
      toast({ title: "✅ Deleted" })
    } catch (error) {
      toast({ title: "Error", variant: "destructive" })
    }
  }

  const handleUpdateSubmission = async (id: string, status: "approved" | "rejected") => {
    try {
      await updateDoc(doc(db, "submissions", id), { status })
      toast({ title: `✅ ${status.charAt(0).toUpperCase() + status.slice(1)}` })
    } catch (error) {
      toast({ title: "Error", variant: "destructive" })
    }
  }

  const addStep = () => setNewBounty({...newBounty, steps: [...newBounty.steps, ""]})
  const updateStep = (index: number, value: string) => {
    const newSteps = [...newBounty.steps]
    newSteps[index] = value
    setNewBounty({...newBounty, steps: newSteps})
  }
  const removeStep = (index: number) => {
    const newSteps = newBounty.steps.filter((_, i) => i !== index)
    setNewBounty({...newBounty, steps: newSteps})
  }

  const filteredBounties = bounties.filter(b => 
    b.isActive && (
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const filteredSubmissions = submissions.filter(s =>
    s.bountyTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.userWallet.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-gray-400 mt-2">Admin only</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard">
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Bounties Management</h1>
              <p className="text-gray-400">Create and manage bounties & submissions</p>
            </div>
          </div>
          <Button 
            onClick={() => setCreateModalOpen(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500"
          >
            <Plus className="w-4 h-4 mr-2" /> Create Bounty
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search..."
            className="pl-10 bg-gray-900 border-gray-700 text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={activeTab === "bounties" ? "default" : "outline"}
            onClick={() => setActiveTab("bounties")}
            className={activeTab === "bounties" ? "bg-purple-600" : "border-gray-700"}
          >
            Bounties ({filteredBounties.length})
          </Button>
          <Button
            variant={activeTab === "submissions" ? "default" : "outline"}
            onClick={() => setActiveTab("submissions")}
            className={activeTab === "submissions" ? "bg-purple-600" : "border-gray-700"}
          >
            Submissions ({filteredSubmissions.filter(s => s.status === "pending").length} pending)
          </Button>
        </div>

   {/* Bounties Section - NEW */}
{(activeFilter === "all" || activeFilter === "bounties") && (
  <div className="mb-12">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Bounties</h2>
          <p className="text-gray-500 text-sm">High-value tasks with big rewards</p>
        </div>
      </div>
      <Link href="/quests/bounties">
        <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10">
          View All <ExternalLink className="w-4 h-4 ml-2" />
        </Button>
      </Link>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 rounded-2xl p-6 border border-purple-500/30 text-center">
        <Trophy className="w-12 h-12 text-purple-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Explore Bounties</h3>
        <p className="text-gray-400 mb-4">Complete high-value tasks and earn exclusive rewards</p>
        <Link href="/quests/bounties">
          <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
            Browse Bounties
          </Button>
        </Link>
      </div>
    </div>
  </div>
)}

        {/* Submissions Tab */}
        {activeTab === "submissions" && (
          <div className="space-y-4">
            {filteredSubmissions.map((sub) => (
              <div key={sub.id} className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{sub.bountyTitle || "Unknown Bounty"}</h3>
                    <p className="text-gray-400 text-sm font-mono">{sub.userWallet.slice(0, 8)}...{sub.userWallet.slice(-8)}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      {sub.createdAt?.toDate?.().toLocaleString() || "Just now"}
                    </p>
                  </div>
                  <Badge className={`${
                    sub.status === "approved" ? "bg-green-500" :
                    sub.status === "rejected" ? "bg-red-500" :
                    "bg-yellow-500"
                  } text-white`}>
                    {sub.status}
                  </Badge>
                </div>

                <a 
                  href={sub.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline flex items-center gap-2 mb-4 p-3 bg-gray-800/50 rounded-lg"
                >
                  <ExternalLink className="w-4 h-4" />
                  {sub.link}
                </a>

                {sub.status === "pending" && (
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleUpdateSubmission(sub.id, "approved")}
                      className="bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" /> Approve
                    </Button>
                    <Button 
                      onClick={() => handleUpdateSubmission(sub.id, "rejected")}
                      variant="outline"
                      className="border-red-500 text-red-400 hover:bg-red-500/10"
                      size="sm"
                    >
                      <XCircle className="w-4 h-4 mr-1" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="bg-[#0f0f14] border-gray-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Create New Bounty</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="text-gray-400 text-sm">Title *</label>
              <Input
                value={newBounty.title}
                onChange={(e) => setNewBounty({...newBounty, title: e.target.value})}
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm">Short Description *</label>
              <Input
                value={newBounty.description}
                onChange={(e) => setNewBounty({...newBounty, description: e.target.value})}
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm">Full Description</label>
              <Textarea
                value={newBounty.fullDescription}
                onChange={(e) => setNewBounty({...newBounty, fullDescription: e.target.value})}
                className="bg-gray-900 border-gray-700 text-white"
                rows={3}
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm">Image URL</label>
              <Input
                value={newBounty.imageUrl}
                onChange={(e) => setNewBounty({...newBounty, imageUrl: e.target.value})}
                placeholder="https://..."
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm">Reward *</label>
                <Input
                  value={newBounty.reward}
                  onChange={(e) => setNewBounty({...newBounty, reward: e.target.value})}
                  placeholder="e.g., 500 XP + NFT"
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm">Difficulty</label>
                <select
                  value={newBounty.difficulty}
                  onChange={(e) => setNewBounty({...newBounty, difficulty: e.target.value as any})}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-sm">Category</label>
              <Input
                value={newBounty.category}
                onChange={(e) => setNewBounty({...newBounty, category: e.target.value})}
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm">Steps to Complete</label>
              {newBounty.steps.map((step, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    value={step}
                    onChange={(e) => updateStep(index, e.target.value)}
                    placeholder={`Step ${index + 1}`}
                    className="bg-gray-900 border-gray-700 text-white flex-1"
                  />
                  {newBounty.steps.length > 1 && (
                    <Button onClick={() => removeStep(index)} variant="outline" size="icon" className="border-gray-700">
                      <XCircle className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button onClick={addStep} variant="outline" size="sm" className="border-gray-700">
                <Plus className="w-4 h-4 mr-1" /> Add Step
              </Button>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
                className="flex-1 border-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateBounty}
                disabled={!newBounty.title || !newBounty.description}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
              >
                Create Bounty
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
