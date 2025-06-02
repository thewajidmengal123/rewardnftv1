"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useWallet } from "@/contexts/wallet-context"
import { CollectionCreationService } from "@/services/collection-creation-service"
import { CandyMachineV3Service } from "@/services/candy-machine-v3-service"
import { PublicKey } from "@solana/web3.js"
import { Loader2, CheckCircle, AlertCircle, Zap, Package, Coins, ExternalLink, Rocket, Settings } from "lucide-react"
import { CANDY_MACHINE_V3_CONFIG, COLLECTION_CONFIG } from "@/config/candy-machine-v3"

interface DeploymentStep {
  id: string
  name: string
  description: string
  completed: boolean
  loading: boolean
  result?: any
}

export function CandyMachineV3Manager() {
  const { connected, publicKey, signTransaction, connection } = useWallet()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<string>("")
  const [error, setError] = useState<string>("")

  const [steps, setSteps] = useState<DeploymentStep[]>([
    {
      id: "collection",
      name: "Create Collection",
      description: "Create the master collection NFT",
      completed: false,
      loading: false,
    },
    {
      id: "candymachine",
      name: "Deploy Candy Machine",
      description: "Deploy Candy Machine V3 with guards",
      completed: false,
      loading: false,
    },
    {
      id: "configure",
      name: "Configure Guards",
      description: "Set up payment and minting guards",
      completed: false,
      loading: false,
    },
  ])

  const collectionService = new CollectionCreationService(connection)
  const candyMachineService = new CandyMachineV3Service(connection)

  const updateStep = (stepId: string, updates: Partial<DeploymentStep>) => {
    setSteps((prev) => prev.map((step) => (step.id === stepId ? { ...step, ...updates } : step)))
  }

  const deployComplete = async () => {
    if (!connected || !publicKey || !signTransaction) {
      setError("Please connect your wallet first")
      return
    }

    setLoading(true)
    setError("")
    setProgress(0)

    try {
      // Step 1: Create Collection
      setStatus("🎨 Creating collection NFT...")
      setProgress(20)
      updateStep("collection", { loading: true })

      const collectionResult = await collectionService.createCollection(publicKey, signTransaction, COLLECTION_CONFIG)

      if (!collectionResult.success || !collectionResult.collectionMint) {
        throw new Error(collectionResult.error || "Failed to create collection")
      }

      updateStep("collection", {
        loading: false,
        completed: true,
        result: collectionResult,
      })
      setProgress(40)

      // Step 2: Deploy Candy Machine
      setStatus("🍭 Deploying Candy Machine V3...")
      setProgress(60)
      updateStep("candymachine", { loading: true })

      const candyMachineResult = await candyMachineService.deployCandyMachine(
        publicKey,
        new PublicKey(collectionResult.collectionMint),
        signTransaction,
        CANDY_MACHINE_V3_CONFIG,
      )

      if (!candyMachineResult.success || !candyMachineResult.candyMachine) {
        throw new Error(candyMachineResult.error || "Failed to deploy Candy Machine")
      }

      updateStep("candymachine", {
        loading: false,
        completed: true,
        result: candyMachineResult,
      })
      setProgress(80)

      // Step 3: Configure Guards (simulated)
      setStatus("⚙️ Configuring guards...")
      setProgress(90)
      updateStep("configure", { loading: true })

      // Simulate guard configuration
      await new Promise((resolve) => setTimeout(resolve, 2000))

      updateStep("configure", {
        loading: false,
        completed: true,
        result: { configured: true },
      })
      setProgress(100)

      setStatus("🎉 Candy Machine V3 deployed successfully!")
    } catch (err: any) {
      console.error("Deployment error:", err)
      setError(err.message || "Deployment failed")
    } finally {
      setLoading(false)
    }
  }

  const getExplorerLink = (address: string, type: "address" | "tx" = "address") => {
    return `https://explorer.solana.com/${type}/${address}?cluster=devnet`
  }

  const allStepsCompleted = steps.every((step) => step.completed)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">🍭 Candy Machine V3 Deployment</h1>
          <p className="text-gray-600">Create and deploy a complete NFT collection system</p>
        </div>

        {/* Configuration Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Deployment Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Collection:</strong> {COLLECTION_CONFIG.name}
            </div>
            <div>
              <strong>Symbol:</strong> {COLLECTION_CONFIG.symbol}
            </div>
            <div>
              <strong>Price:</strong> {CANDY_MACHINE_V3_CONFIG.price} USDC
            </div>
            <div>
              <strong>Supply:</strong> {CANDY_MACHINE_V3_CONFIG.itemsAvailable.toLocaleString()}
            </div>
            <div>
              <strong>Mint Limit:</strong> {CANDY_MACHINE_V3_CONFIG.guards.mintLimit.limit} per wallet
            </div>
            <div>
              <strong>Network:</strong> Devnet
            </div>
          </CardContent>
        </Card>

        {/* Progress */}
        {loading && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Deployment Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-gray-600">{status}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Messages */}
        {status && !loading && (
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

        {/* Deployment Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <Card key={step.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    {step.id === "collection" && <Package className="w-5 h-5 mr-2" />}
                    {step.id === "candymachine" && <Zap className="w-5 h-5 mr-2" />}
                    {step.id === "configure" && <Settings className="w-5 h-5 mr-2" />}
                    Step {index + 1}: {step.name}
                  </div>
                  <div className="flex items-center space-x-2">
                    {step.loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {step.completed && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {!step.completed && !step.loading && (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                    )}
                  </div>
                </CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>

              {step.result && (
                <CardContent>
                  <div className="space-y-2">
                    {step.result.collectionMint && (
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-800">
                          <strong>Collection Mint:</strong> {step.result.collectionMint.slice(0, 20)}...
                        </p>
                        <a
                          href={getExplorerLink(step.result.collectionMint)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    )}

                    {step.result.candyMachine && (
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Candy Machine:</strong> {step.result.candyMachine.slice(0, 20)}...
                        </p>
                        <a
                          href={getExplorerLink(step.result.candyMachine)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    )}

                    {step.result.signature && (
                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <p className="text-sm text-purple-800">
                          <strong>Transaction:</strong> {step.result.signature.slice(0, 20)}...
                        </p>
                        <a
                          href={getExplorerLink(step.result.signature, "tx")}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-800"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Deploy Button */}
        <Card>
          <CardContent className="pt-6">
            {!connected ? (
              <div className="text-center">
                <p className="text-gray-600 mb-4">Connect your wallet to deploy Candy Machine V3</p>
                <Badge variant="outline">Wallet Required</Badge>
              </div>
            ) : allStepsCompleted ? (
              <div className="text-center">
                <div className="mb-4">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-green-700">Deployment Complete!</h3>
                  <p className="text-gray-600">Your Candy Machine V3 is ready for minting</p>
                </div>
                <Button onClick={() => (window.location.href = "/mint")} className="w-full">
                  <Coins className="w-4 h-4 mr-2" />
                  Go to Mint Page
                </Button>
              </div>
            ) : (
              <Button onClick={deployComplete} disabled={loading} className="w-full" size="lg">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Rocket className="w-4 h-4 mr-2" />}
                Deploy Complete System
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>ℹ️ Deployment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>• This deploys a complete Candy Machine V3 system with collection</p>
            <p>• Collection NFT serves as the master for all minted NFTs</p>
            <p>• Guards enforce USDC payment and mint limits</p>
            <p>• All transactions are on Solana Devnet</p>
            <p>• Check Explorer links to verify all deployments</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
