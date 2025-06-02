"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useWallet } from "@/contexts/wallet-context"
import { CollectionService } from "@/services/collection-service"
import { CandyMachineService } from "@/services/candy-machine-service"
import { PublicKey } from "@solana/web3.js"
import { Loader2, CheckCircle, AlertCircle, Zap, Package, Coins, ExternalLink } from "lucide-react"
import { CANDY_MACHINE_CONFIG, COMPANY_WALLET } from "@/config/candy-machine"

export function CandyMachineManager() {
  const { connected, publicKey, signTransaction, connection } = useWallet()
  const [loading, setLoading] = useState(false)
  const [collectionMint, setCollectionMint] = useState<string>("")
  const [candyMachine, setCandyMachine] = useState<string>("")
  const [lastMintedNFT, setLastMintedNFT] = useState<string>("")
  const [status, setStatus] = useState<string>("")
  const [error, setError] = useState<string>("")

  const collectionService = new CollectionService(connection)
  const candyMachineService = new CandyMachineService(connection)

  const createCollection = async () => {
    if (!connected || !publicKey || !signTransaction) {
      setError("Please connect your wallet first")
      return
    }

    setLoading(true)
    setError("")
    setStatus("Creating collection mint...")

    try {
      const result = await collectionService.createCollection(publicKey, signTransaction)

      if (result.success && result.collectionMint) {
        setCollectionMint(result.collectionMint)
        setStatus(`✅ Collection created! Mint: ${result.collectionMint.slice(0, 8)}...`)
      } else {
        setError(result.error || "Failed to create collection")
      }
    } catch (err: any) {
      setError(err.message || "Failed to create collection")
    } finally {
      setLoading(false)
    }
  }

  const createCandyMachineV3 = async () => {
    if (!connected || !publicKey || !signTransaction) {
      setError("Please connect your wallet first")
      return
    }

    if (!collectionMint) {
      setError("Please create a collection first")
      return
    }

    setLoading(true)
    setError("")
    setStatus("Deploying Candy Machine...")

    try {
      const result = await candyMachineService.createCandyMachine(
        publicKey,
        new PublicKey(collectionMint),
        signTransaction,
      )

      if (result.success && result.candyMachine) {
        setCandyMachine(result.candyMachine)
        setStatus(`✅ Candy Machine deployed! Address: ${result.candyMachine.slice(0, 8)}...`)
      } else {
        setError(result.error || "Failed to create Candy Machine")
      }
    } catch (err: any) {
      setError(err.message || "Failed to create Candy Machine")
    } finally {
      setLoading(false)
    }
  }

  const mintNFT = async () => {
    if (!connected || !publicKey || !signTransaction) {
      setError("Please connect your wallet first")
      return
    }

    if (!candyMachine) {
      setError("Please create a Candy Machine first")
      return
    }

    setLoading(true)
    setError("")
    setStatus("Processing USDC payment and minting NFT...")

    try {
      const result = await candyMachineService.mintFromCandyMachine(
        new PublicKey(candyMachine),
        publicKey,
        signTransaction,
      )

      if (result.success && result.nftMint) {
        setLastMintedNFT(result.nftMint)
        setStatus(`🎉 NFT minted successfully! Mint: ${result.nftMint.slice(0, 8)}...`)
      } else {
        setError(result.error || "Failed to mint NFT")
      }
    } catch (err: any) {
      setError(err.message || "Failed to mint NFT")
    } finally {
      setLoading(false)
    }
  }

  const getExplorerLink = (address: string, type: "address" | "tx" = "address") => {
    return `https://explorer.solana.com/${type}/${address}?cluster=devnet`
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">🍭 Simplified Candy Machine V3</h1>
          <p className="text-gray-600">Create collections and deploy NFT minting systems</p>
        </div>

        {/* Configuration Display */}
        <Card>
          <CardHeader>
            <CardTitle>🔧 Configuration</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Company Wallet:</strong> {COMPANY_WALLET.toString().slice(0, 20)}...
            </div>
            <div>
              <strong>Price:</strong> {CANDY_MACHINE_CONFIG.price} USDC
            </div>
            <div>
              <strong>Max Supply:</strong> {CANDY_MACHINE_CONFIG.candyMachine.itemsAvailable.toLocaleString()}
            </div>
            <div>
              <strong>Network:</strong> Devnet
            </div>
          </CardContent>
        </Card>

        {/* Status Display */}
        {status && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{status}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Create Collection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Step 1: Create Collection Mint
            </CardTitle>
            <CardDescription>Create a mint account that will serve as your collection identifier</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Type:</strong> SPL Token Mint
              </div>
              <div>
                <strong>Decimals:</strong> 0 (NFT)
              </div>
              <div>
                <strong>Supply:</strong> 1 token
              </div>
              <div>
                <strong>Authority:</strong> Your wallet
              </div>
            </div>

            {collectionMint && (
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-green-800">
                    <strong>Collection Mint:</strong> {collectionMint.slice(0, 20)}...
                  </p>
                  <a
                    href={getExplorerLink(collectionMint)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-800"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}

            <Button onClick={createCollection} disabled={loading || !!collectionMint} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Package className="w-4 h-4 mr-2" />}
              {collectionMint ? "Collection Created ✓" : "Create Collection Mint"}
            </Button>
          </CardContent>
        </Card>

        {/* Step 2: Create Candy Machine */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Step 2: Deploy Candy Machine
            </CardTitle>
            <CardDescription>Deploy a program account that will manage NFT minting and payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Payment:</strong> 10 USDC
              </div>
              <div>
                <strong>Type:</strong> Program Account
              </div>
              <div>
                <strong>Size:</strong> 1KB config space
              </div>
              <div>
                <strong>Authority:</strong> Your wallet
              </div>
            </div>

            {candyMachine && (
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-green-800">
                    <strong>Candy Machine:</strong> {candyMachine.slice(0, 20)}...
                  </p>
                  <a
                    href={getExplorerLink(candyMachine)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-800"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}

            <Button
              onClick={createCandyMachineV3}
              disabled={loading || !collectionMint || !!candyMachine}
              className="w-full"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
              {candyMachine ? "Candy Machine Deployed ✓" : "Deploy Candy Machine"}
            </Button>
          </CardContent>
        </Card>

        {/* Step 3: Mint NFT */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Coins className="w-5 h-5 mr-2" />
              Step 3: Mint NFT (Test)
            </CardTitle>
            <CardDescription>Test the complete minting flow with USDC payment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
              <div>
                <p className="font-medium">Mint Price</p>
                <p className="text-sm text-gray-600">USDC Payment Required</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-600">10 USDC</p>
                <Badge variant="outline">+ network fees</Badge>
              </div>
            </div>

            {lastMintedNFT && (
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-green-800">
                    <strong>Last Minted NFT:</strong> {lastMintedNFT.slice(0, 20)}...
                  </p>
                  <a
                    href={getExplorerLink(lastMintedNFT)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-800"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}

            <Button onClick={mintNFT} disabled={loading || !candyMachine} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Coins className="w-4 h-4 mr-2" />}
              Mint Test NFT (10 USDC)
            </Button>
          </CardContent>
        </Card>

        {/* Connection Status */}
        {!connected && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-600 mb-4">Connect your wallet to start creating your Candy Machine</p>
              <Badge variant="outline">Wallet Required</Badge>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>ℹ️ Important Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>• This is a simplified implementation for demonstration purposes</p>
            <p>• Ensure you have USDC in your wallet for testing mints</p>
            <p>• All transactions are on Solana Devnet</p>
            <p>• Check Solana Explorer links to verify transactions</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
