"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useWallet } from "@/contexts/wallet-context"
import { SimpleCollectionService } from "@/services/simple-collection-service"
import { Copy, ExternalLink, RefreshCw } from "lucide-react"
import { getExplorerUrl } from "@/config/solana"

interface CollectionInfo {
  collectionMint: string
  createdAt: string
  createdBy: string
  transactionSignature: string
  totalMinted: number
  maxSupply: number
}

export function CollectionAdminContent() {
  const { connected, publicKey, signTransaction, connection } = useWallet()
  const [collectionInfo, setCollectionInfo] = useState<CollectionInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const collectionService = new SimpleCollectionService(connection)

  useEffect(() => {
    loadCollectionInfo()
  }, [])

  const loadCollectionInfo = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/collection-temp")
      if (response.ok) {
        const data = await response.json()
        setCollectionInfo(data.collection)
      } else {
        setError("Failed to load collection info")
      }
    } catch (err) {
      setError("Error loading collection info")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const createCollection = async () => {
    if (!connected || !publicKey || !signTransaction) {
      setError("Please connect your wallet first")
      return
    }

    setCreating(true)
    setError(null)
    try {
      const result = await collectionService.getOrCreateCollection(publicKey, signTransaction)
      
      if (result.success) {
        await loadCollectionInfo() // Reload to get updated info
      } else {
        setError(result.error || "Failed to create collection")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      console.error(err)
    } finally {
      setCreating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const openInExplorer = (signature: string) => {
    window.open(getExplorerUrl(signature, "tx"), "_blank")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Collection Management</h1>
          <p className="text-gray-300">Manage your NFT collection on Solana</p>
        </div>

        {/* Collection Status */}
        <Card className="bg-gray-800/50 border-gray-700 mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Collection Status</CardTitle>
                <CardDescription>Current state of your NFT collection</CardDescription>
              </div>
              <Button
                onClick={loadCollectionInfo}
                disabled={loading}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-400 mx-auto"></div>
                <p className="mt-2 text-gray-400">Loading collection info...</p>
              </div>
            ) : collectionInfo ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Status:</span>
                  <Badge className="bg-green-600 text-white">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Collection Mint:</span>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-700 px-2 py-1 rounded text-sm">
                      {collectionInfo.collectionMint.slice(0, 8)}...{collectionInfo.collectionMint.slice(-8)}
                    </code>
                    <Button
                      onClick={() => copyToClipboard(collectionInfo.collectionMint)}
                      size="sm"
                      variant="ghost"
                      className="p-1 h-auto"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Total Minted:</span>
                  <span className="text-white font-semibold">
                    {collectionInfo.totalMinted} / {collectionInfo.maxSupply}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Created:</span>
                  <span className="text-white">
                    {new Date(collectionInfo.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Creator:</span>
                  <code className="bg-gray-700 px-2 py-1 rounded text-sm">
                    {collectionInfo.createdBy.slice(0, 8)}...{collectionInfo.createdBy.slice(-8)}
                  </code>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Transaction:</span>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-700 px-2 py-1 rounded text-sm">
                      {collectionInfo.transactionSignature.slice(0, 8)}...
                    </code>
                    <Button
                      onClick={() => openInExplorer(collectionInfo.transactionSignature)}
                      size="sm"
                      variant="ghost"
                      className="p-1 h-auto"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📦</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No Collection Found</h3>
                  <p className="text-gray-400 mb-6">
                    No collection has been created yet. The collection will be automatically created when the first NFT is minted.
                  </p>
                </div>
                
                {connected ? (
                  <Button
                    onClick={createCollection}
                    disabled={creating}
                    className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-black font-bold"
                  >
                    {creating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-black mr-2"></div>
                        Creating Collection...
                      </>
                    ) : (
                      "Create Collection Now"
                    )}
                  </Button>
                ) : (
                  <p className="text-gray-400">Connect your wallet to create a collection</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="bg-red-900/20 border-red-700 mb-6">
            <CardContent className="pt-6">
              <div className="text-red-400">
                <strong>Error:</strong> {error}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Collection Configuration */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Collection Configuration</CardTitle>
            <CardDescription>Current collection settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-300 text-sm">Name</label>
                <div className="bg-gray-700 px-3 py-2 rounded mt-1">RewardNFT Collection</div>
              </div>
              <div>
                <label className="text-gray-300 text-sm">Symbol</label>
                <div className="bg-gray-700 px-3 py-2 rounded mt-1">RNFT</div>
              </div>
              <div>
                <label className="text-gray-300 text-sm">Max Supply</label>
                <div className="bg-gray-700 px-3 py-2 rounded mt-1">1,000 NFTs</div>
              </div>
              <div>
                <label className="text-gray-300 text-sm">Price</label>
                <div className="bg-gray-700 px-3 py-2 rounded mt-1">5 USDC</div>
              </div>
              <div>
                <label className="text-gray-300 text-sm">Max Per Wallet</label>
                <div className="bg-gray-700 px-3 py-2 rounded mt-1">5 NFTs</div>
              </div>
              <div>
                <label className="text-gray-300 text-sm">Royalty</label>
                <div className="bg-gray-700 px-3 py-2 rounded mt-1">5%</div>
              </div>
              <div className="md:col-span-2">
                <label className="text-gray-300 text-sm">Treasury Wallet</label>
                <div className="bg-gray-700 px-3 py-2 rounded mt-1 font-mono text-sm">
                  8QY2zcWZWwBZYMeiSfPivWAiPBbLZe1mbnyJauWe8ms6
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
