"use client"

import { useState } from "react"
import { Connection } from "@solana/web3.js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { NftVerificationBadge } from "@/components/nft-verification-badge"
import { verifyNftBatch, fetchAndVerifyNftMetadata } from "@/utils/nft-verification"
import { DEFAULT_RPC_ENDPOINT } from "@/config/solana"
import { AlertTriangle, RefreshCw, Shield } from "lucide-react"

export function NftVerificationDashboard() {
  const [mintAddress, setMintAddress] = useState("")
  const [loading, setLoading] = useState(false)
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [batchAddresses, setBatchAddresses] = useState("")
  const [batchResults, setBatchResults] = useState<Map<string, any>>(new Map())
  const [batchLoading, setBatchLoading] = useState(false)

  const handleSingleVerification = async () => {
    if (!mintAddress) return

    try {
      setLoading(true)
      const connection = new Connection(DEFAULT_RPC_ENDPOINT)
      const { metadata, verification } = await fetchAndVerifyNftMetadata(mintAddress, connection)
      setVerificationResult({ mintAddress, metadata, verification })
    } catch (error) {
      console.error("Error verifying NFT:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleBatchVerification = async () => {
    if (!batchAddresses) return

    try {
      setBatchLoading(true)
      const addresses = batchAddresses
        .split(/[\n,]/)
        .map((addr) => addr.trim())
        .filter(Boolean)

      if (addresses.length === 0) return

      const connection = new Connection(DEFAULT_RPC_ENDPOINT)
      const results = await verifyNftBatch(addresses, connection)
      setBatchResults(results)
    } catch (error) {
      console.error("Error verifying NFT batch:", error)
    } finally {
      setBatchLoading(false)
    }
  }

  const getBatchSummary = () => {
    if (batchResults.size === 0) return null

    let verified = 0
    let suspicious = 0
    let unverified = 0

    batchResults.forEach((result) => {
      if (result.status === "verified") verified++
      else if (result.status === "suspicious") suspicious++
      else unverified++
    })

    return { verified, suspicious, unverified, total: batchResults.size }
  }

  const batchSummary = getBatchSummary()

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="mr-2 h-5 w-5" />
          NFT Verification Dashboard
        </CardTitle>
        <CardDescription>Verify the authenticity and integrity of NFTs on the platform</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="single">
          <TabsList className="mb-4">
            <TabsTrigger value="single">Single Verification</TabsTrigger>
            <TabsTrigger value="batch">Batch Verification</TabsTrigger>
          </TabsList>

          <TabsContent value="single">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="mintAddress">NFT Mint Address</Label>
                <div className="flex gap-2">
                  <Input
                    id="mintAddress"
                    placeholder="Enter NFT mint address"
                    value={mintAddress}
                    onChange={(e) => setMintAddress(e.target.value)}
                  />
                  <Button onClick={handleSingleVerification} disabled={loading || !mintAddress}>
                    {loading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Verifying
                      </>
                    ) : (
                      "Verify"
                    )}
                  </Button>
                </div>
              </div>

              {verificationResult && (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">Verification Result</CardTitle>
                      <NftVerificationBadge verification={verificationResult.verification} />
                    </div>
                    <CardDescription className="text-xs truncate">
                      Mint Address: {verificationResult.mintAddress}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {verificationResult.metadata ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="font-medium">Name:</div>
                          <div>{verificationResult.metadata.name}</div>

                          <div className="font-medium">Symbol:</div>
                          <div>{verificationResult.metadata.symbol}</div>

                          <div className="font-medium">Description:</div>
                          <div className="truncate">{verificationResult.metadata.description}</div>
                        </div>

                        <div className="pt-2">
                          <h4 className="text-sm font-medium mb-1">Verification Details:</h4>
                          <div className="grid grid-cols-2 gap-1 text-xs">
                            {Object.entries(verificationResult.verification.details).map(
                              ([key, value]: [string, any]) => (
                                <div key={key} className="flex items-center">
                                  <div
                                    className={`w-4 h-4 rounded-full flex items-center justify-center mr-1 ${value ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}
                                  >
                                    {value ? "✓" : "✗"}
                                  </div>
                                  <span>{key.replace(/Match$/, "")}</span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Verification Failed</AlertTitle>
                        <AlertDescription>Could not retrieve metadata for this NFT.</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="batch">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="batchAddresses">NFT Mint Addresses (one per line or comma-separated)</Label>
                <textarea
                  id="batchAddresses"
                  className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter NFT mint addresses, one per line or comma-separated"
                  value={batchAddresses}
                  onChange={(e) => setBatchAddresses(e.target.value)}
                />
                <Button onClick={handleBatchVerification} disabled={batchLoading || !batchAddresses}>
                  {batchLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Verifying Batch
                    </>
                  ) : (
                    "Verify Batch"
                  )}
                </Button>
              </div>

              {batchSummary && (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold">{batchSummary.total}</p>
                          <p className="text-xs text-muted-foreground">Total NFTs</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{batchSummary.verified}</p>
                          <p className="text-xs text-muted-foreground">Verified</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-yellow-600">{batchSummary.suspicious}</p>
                          <p className="text-xs text-muted-foreground">Suspicious</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-600">{batchSummary.unverified}</p>
                          <p className="text-xs text-muted-foreground">Unverified</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="border rounded-md">
                    <div className="grid grid-cols-[1fr,auto] gap-2 p-3 border-b">
                      <div className="font-medium">Mint Address</div>
                      <div className="font-medium">Status</div>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {Array.from(batchResults.entries()).map(([address, result]) => (
                        <div key={address} className="grid grid-cols-[1fr,auto] gap-2 p-3 border-b last:border-0">
                          <div className="text-sm truncate">{address}</div>
                          <NftVerificationBadge verification={result} size="sm" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
