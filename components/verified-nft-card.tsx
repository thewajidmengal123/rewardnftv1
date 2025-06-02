"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ExternalLink, Info } from "lucide-react"
import { NftVerificationBadge } from "@/components/nft-verification-badge"
import { fetchAndVerifyNftMetadata } from "@/utils/nft-verification"
import { Connection } from "@solana/web3.js"
import { DEFAULT_RPC_ENDPOINT, DEFAULT_SOLANA_EXPLORER_URL } from "@/config/solana"

interface VerifiedNftCardProps {
  mintAddress: string
  onVerificationComplete?: (isVerified: boolean) => void
}

export function VerifiedNftCard({ mintAddress, onVerificationComplete }: VerifiedNftCardProps) {
  const [loading, setLoading] = useState(true)
  const [metadata, setMetadata] = useState<any>(null)
  const [verification, setVerification] = useState<any>({
    isVerified: false,
    status: "pending",
    details: {
      nameMatch: false,
      symbolMatch: false,
      descriptionMatch: false,
      imageMatch: false,
      creatorMatch: false,
      collectionMatch: false,
    },
  })

  useEffect(() => {
    const verifyNft = async () => {
      try {
        setLoading(true)
        const connection = new Connection(DEFAULT_RPC_ENDPOINT)
        const { metadata: nftMetadata, verification: verificationResult } = await fetchAndVerifyNftMetadata(
          mintAddress,
          connection,
        )

        setMetadata(nftMetadata)
        setVerification(verificationResult)

        if (onVerificationComplete) {
          onVerificationComplete(verificationResult.isVerified)
        }
      } catch (error) {
        console.error("Error verifying NFT:", error)
      } finally {
        setLoading(false)
      }
    }

    verifyNft()
  }, [mintAddress, onVerificationComplete])

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <div className="relative aspect-square">
          <Skeleton className="h-full w-full" />
        </div>
        <CardContent className="p-4">
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/2" />
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </CardFooter>
      </Card>
    )
  }

  if (!metadata) {
    return (
      <Card className="overflow-hidden border-red-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-center h-40 bg-red-50 rounded-md">
            <div className="text-center p-4">
              <Info className="h-8 w-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-red-500">Failed to load NFT metadata</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between">
          <NftVerificationBadge verification={verification} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`${DEFAULT_SOLANA_EXPLORER_URL}/address/${mintAddress}`, "_blank")}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card
      className={`overflow-hidden ${verification.status === "verified" ? "border-green-200" : verification.status === "suspicious" ? "border-yellow-200" : "border-gray-200"}`}
    >
      <div className="relative aspect-square">
        <Image
          src={metadata.image || "/placeholder.svg?height=300&width=300"}
          alt={metadata.name || "NFT"}
          fill
          className="object-cover"
        />
        <div className="absolute top-2 right-2">
          <NftVerificationBadge verification={verification} />
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-medium truncate">{metadata.name}</h3>
        <p className="text-sm text-muted-foreground truncate">{metadata.symbol}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between">
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => window.open(`${DEFAULT_SOLANA_EXPLORER_URL}/address/${mintAddress}`, "_blank")}
        >
          View on Explorer
        </Button>
      </CardFooter>
    </Card>
  )
}
