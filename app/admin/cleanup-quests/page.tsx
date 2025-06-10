"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useWallet } from "@/contexts/wallet-context"
import { isAdminWallet } from "@/config/admin"
import { toast } from "@/components/ui/use-toast"
import { Trash2, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react"

export default function CleanupQuestsPage() {
  const { publicKey } = useWallet()
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [duplicateData, setDuplicateData] = useState<any>(null)
  const [cleanupResult, setCleanupResult] = useState<any>(null)

  const isAdmin = publicKey && isAdminWallet(publicKey.toString())

  useEffect(() => {
    if (isAdmin) {
      analyzeDuplicates()
    }
  }, [isAdmin])

  const analyzeDuplicates = async () => {
    if (!publicKey || !isAdmin) return

    try {
      setAnalyzing(true)
      const response = await fetch(`/api/admin/cleanup-quests?wallet=${publicKey.toString()}`)
      const result = await response.json()
      
      if (result.success) {
        setDuplicateData(result)
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to analyze duplicates",
        variant: "destructive"
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const cleanupDuplicates = async () => {
    if (!publicKey || !isAdmin) return

    try {
      setLoading(true)
      const response = await fetch('/api/admin/cleanup-quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: publicKey.toString() })
      })
      const result = await response.json()
      
      if (result.success) {
        setCleanupResult(result)
        toast({
          title: "Success!",
          description: result.message
        })
        // Re-analyze after cleanup
        await analyzeDuplicates()
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cleanup duplicates",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-gray-400">Admin access required to use this tool.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 via-orange-500 to-yellow-600 bg-clip-text text-transparent mb-4">
            Quest Cleanup Tool
          </h1>
          <p className="text-xl text-white/80">
            Remove duplicate quests from the database
          </p>
        </div>

        {/* Analysis Results */}
        <Card className="bg-gray-800/50 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <RefreshCw className={`w-5 h-5 ${analyzing ? 'animate-spin' : ''}`} />
              Duplicate Analysis
            </CardTitle>
            <CardDescription>
              Current state of quests in the database
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analyzing ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
                <p className="text-gray-400">Analyzing quest database...</p>
              </div>
            ) : duplicateData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-700/30 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-white">{duplicateData.totalQuests}</div>
                    <div className="text-gray-400 text-sm">Total Quests</div>
                  </div>
                  <div className="bg-gray-700/30 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-cyan-400">{duplicateData.uniqueTitles}</div>
                    <div className="text-gray-400 text-sm">Unique Titles</div>
                  </div>
                  <div className="bg-gray-700/30 rounded-lg p-4 text-center">
                    <div className={`text-2xl font-bold ${duplicateData.duplicateGroups > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {duplicateData.duplicateGroups}
                    </div>
                    <div className="text-gray-400 text-sm">Duplicate Groups</div>
                  </div>
                </div>

                {duplicateData.duplicates && duplicateData.duplicates.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      Found Duplicates
                    </h3>
                    <div className="space-y-3">
                      {duplicateData.duplicates.map((duplicate: any, index: number) => (
                        <div key={index} className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-white font-medium">{duplicate.title}</div>
                              <div className="text-gray-400 text-sm">
                                {duplicate.count} duplicate instances found
                              </div>
                            </div>
                            <Badge variant="destructive">
                              {duplicate.count} copies
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {duplicateData.duplicateGroups === 0 && (
                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 text-center">
                    <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <div className="text-green-400 font-medium">No duplicates found!</div>
                    <div className="text-gray-400 text-sm">All quests are unique</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">Click "Analyze" to check for duplicates</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cleanup Results */}
        {cleanupResult && (
          <Card className="bg-gray-800/50 border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Cleanup Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <div className="text-green-400 font-medium mb-2">{cleanupResult.message}</div>
                {cleanupResult.summary && (
                  <div className="text-gray-300 text-sm space-y-1">
                    <div>• Removed {cleanupResult.summary.duplicatesRemoved} duplicate quests</div>
                    <div>• Cleaned up {cleanupResult.summary.userQuestRecordsRemoved} orphaned user records</div>
                    <div>• {cleanupResult.summary.uniqueQuestsAfter} unique quests remaining</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={analyzeDuplicates}
            disabled={analyzing}
            variant="outline"
            className="bg-gray-800/50 border-gray-600 text-white hover:bg-gray-700/50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${analyzing ? 'animate-spin' : ''}`} />
            {analyzing ? 'Analyzing...' : 'Analyze Duplicates'}
          </Button>

          {duplicateData && duplicateData.duplicateGroups > 0 && (
            <Button
              onClick={cleanupDuplicates}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {loading ? 'Cleaning...' : 'Remove Duplicates'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
