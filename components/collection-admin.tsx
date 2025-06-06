"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useWallet } from "@/contexts/wallet-context"
import { Loader2, CheckCircle, AlertCircle, Copy, ExternalLink } from "lucide-react"
import { PublicKey } from "@solana/web3.js"

export function CollectionAdmin() {
  const { connected, publicKey, signTransaction, connection } = useWallet()
  const [loading, setLoading] = useState(false)
  const [collectionMint, setCollectionMint] = useState<string>("")
  const [collectionInfo, setCollectionInfo] = useState<any>(null)
  const [validationResult, setValidationResult] = useState<any>(null)


 

 
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("Copied to clipboard!")
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Collection Admin</h1>
        <p className="text-gray-300">Manage your NFT collection setup and configuration</p>
      </div>

      {/* Collection Configuration */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-white">Collection Configuration</CardTitle>
        </CardHeader>
    
      </Card>

      {/* Create Collection */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-white">Create Collection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-gray-300 text-sm">
            Create the main collection NFT. This is a one-time setup that creates the collection all individual NFTs will belong to.
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={connected ? "default" : "secondary"}>
              {connected ? "Wallet Connected" : "Wallet Not Connected"}
            </Badge>
            {connected && (
              <div className="text-xs text-gray-400">
                {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
              </div>
            )}
          </div>


          {collectionMint && (
            <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <div className="text-green-400 font-semibold">Collection Created!</div>
              </div>
              <div className="text-sm text-gray-300 mb-2">Collection Mint Address:</div>
              <div className="flex items-center gap-2">
                <code className="bg-black/20 px-2 py-1 rounded text-xs text-green-300 flex-1">
                  {collectionMint}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(collectionMint)}
                  className="bg-green-600/20 border-green-500/30 text-green-400 hover:bg-green-600/30"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-gray-400 mt-2">
                Save this address to your environment variables as NEXT_PUBLIC_COLLECTION_MINT_ADDRESS
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validate Collection */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-white">Validate Collection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-gray-300 text-sm">
            Enter a collection mint address to validate and get information about an existing collection.
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Collection mint address..."
              value={collectionMint}
              onChange={(e) => setCollectionMint(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
            />
        
          </div>

          {validationResult && (
            <div className={`border rounded-lg p-4 ${
              validationResult.success 
                ? "bg-green-900/20 border-green-700" 
                : "bg-red-900/20 border-red-700"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {validationResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                )}
                <div className={`font-semibold ${
                  validationResult.success ? "text-green-400" : "text-red-400"
                }`}>
                  {validationResult.success ? "Collection Valid" : "Validation Failed"}
                </div>
              </div>
              {validationResult.error && (
                <div className="text-red-300 text-sm">{validationResult.error}</div>
              )}
            </div>
          )}

          {collectionInfo && collectionInfo.success && (
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
              <div className="text-blue-400 font-semibold mb-3">Collection Information</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-400">Total Supply</div>
                  <div className="text-white">{collectionInfo.supplyInfo.totalSupply}</div>
                </div>
                <div>
                  <div className="text-gray-400">Available</div>
                  <div className="text-white">{collectionInfo.supplyInfo.available}</div>
                </div>
                <div>
                  <div className="text-gray-400">Max Supply</div>
                  <div className="text-white">{collectionInfo.supplyInfo.maxSupply}</div>
                </div>
                <div>
                  <div className="text-gray-400">Price</div>
                  <div className="text-white">{collectionInfo.config.pricePerNFT} USDC</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-white">Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-gray-300 text-sm space-y-2">
            <div>1. <strong>Create Collection:</strong> Use the "Create Collection" button above to deploy your collection NFT</div>
            <div>2. <strong>Save Address:</strong> Copy the collection mint address and add it to your environment variables</div>
            <div>3. <strong>Update Code:</strong> Update your minting service to use the collection mint address</div>
            <div>4. <strong>Test Minting:</strong> Test the minting process with and without referral codes</div>
            <div>5. <strong>Deploy:</strong> Deploy your application with the collection configuration</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
