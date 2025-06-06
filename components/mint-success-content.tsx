"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, ExternalLink, Users, Gift, Zap, Copy, QrCode, Share2, ArrowRight, Sparkles, Trophy, Star } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { getExplorerUrl, NFT_IPFS_URLS, CURRENT_NETWORK } from "@/config/solana"
import Image from "next/image"
import { motion } from "framer-motion"

// Loading component for Suspense fallback
function MintSuccessLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <motion.div
          className="w-16 h-16 border-4 border-teal-400/30 border-t-teal-400 rounded-full mx-auto mb-6"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.p
          className="text-gray-400 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Loading your NFT details...
        </motion.p>
      </div>
    </div>
  )
}

// Component that uses useSearchParams
function MintSuccessContentInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [copied, setCopied] = useState<string | null>(null)
  const [showQRCode, setShowQRCode] = useState<string | null>(null)

  // Get multiple mint addresses and signatures
  const mint1 = searchParams.get("mint1") || searchParams.get("mint")
  const mint2 = searchParams.get("mint2")
  const mint3 = searchParams.get("mint3")
  const mint4 = searchParams.get("mint4")
  const mint5 = searchParams.get("mint5")

  const sig1 = searchParams.get("sig1") || searchParams.get("signature")
  const sig2 = searchParams.get("sig2")
  const sig3 = searchParams.get("sig3")
  const sig4 = searchParams.get("sig4")
  const sig5 = searchParams.get("sig5")

  const usdcSignature = searchParams.get("usdc")
  const totalCost = searchParams.get("total")

  // Collect all minted NFTs
  const mintedNFTs = [
    { mint: mint1, signature: sig1 },
    { mint: mint2, signature: sig2 },
    { mint: mint3, signature: sig3 },
    { mint: mint4, signature: sig4 },
    { mint: mint5, signature: sig5 },
  ].filter(nft => nft.mint && nft.signature)

  useEffect(() => {
    if (mintedNFTs.length === 0) {
      router.push("/mint")
    }
  }, [mintedNFTs.length, router])

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard`,
      })
      setTimeout(() => setCopied(null), 2000)
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please copy manually",
        variant: "destructive",
      })
    }
  }

  const generateQRCodeURL = (mintAddress: string) => {
    // Generate QR code URL for the NFT mint address
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${mintAddress}`
  }

  const shareNFT = async (mintAddress: string) => {
    const shareData = {
      title: 'Check out my new RewardNFT!',
      text: `I just minted a RewardNFT! Mint Address: ${mintAddress}`,
      url: `${window.location.origin}/nft/${mintAddress}`
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        copyToClipboard(shareData.text, "Share text")
      }
    } else {
      copyToClipboard(shareData.text, "Share text")
    }
  }

  if (mintedNFTs.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 5, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="relative w-32 h-32 mx-auto mb-8"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-teal-400 rounded-full animate-pulse" />
              <div className="absolute inset-2 bg-black rounded-full flex items-center justify-center">
                <CheckCircle className="w-16 h-16 text-green-400" />
              </div>
              <motion.div
                className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-4 h-4 text-black" />
              </motion.div>
            </motion.div>

            <motion.h1
              className="text-6xl font-bold mb-6 bg-gradient-to-r from-green-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Mint Successful! 🎉
            </motion.h1>

            <motion.p
              className="text-2xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              Congratulations! {mintedNFTs.length === 1 ? 'Your exclusive RewardNFT has' : `Your ${mintedNFTs.length} exclusive RewardNFTs have`} been successfully minted for{' '}
              <span className="text-teal-400 font-bold">{totalCost} USDC</span>
              <br />
              <span className="text-lg text-teal-300">Welcome to our exclusive community! 🚀</span>
            </motion.p>

            <motion.div
              className="flex flex-wrap justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Badge className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-3 text-lg font-semibold border-0">
                <Trophy className="w-5 h-5 mr-2" />
                Referral Access Granted
              </Badge>
              <Badge variant="outline" className="border-teal-400 text-teal-400 px-6 py-3 text-lg font-semibold bg-teal-400/10">
                <Star className="w-5 h-5 mr-2" />
                {mintedNFTs.length} NFT{mintedNFTs.length > 1 ? 's' : ''} Minted
              </Badge>
            </motion.div>
          </motion.div>

          {/* Minted NFTs Grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            {mintedNFTs.map((nft, index) => (
              <motion.div
                key={nft.mint}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 + index * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
              >
                <Card className="bg-black/40 backdrop-blur-xl border-gray-700/50 hover:border-teal-400/50 transition-all duration-500 overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <CardHeader className="pb-4 relative z-10">
                    <CardTitle className="flex items-center justify-between text-white">
                      <span className="flex items-center">
                        <motion.div
                          className="w-8 h-8 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full flex items-center justify-center mr-3"
                          whileHover={{ rotate: 180 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Zap className="w-4 h-4 text-black" />
                        </motion.div>
                        <span className="text-xl font-bold">NFT #{index + 1}</span>
                      </span>
                      <Badge className="bg-gradient-to-r from-green-500 to-teal-500 text-white border-0 px-3 py-1">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Minted
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-gray-400 text-base">RewardNFT Collection • Membership Token</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6 relative z-10">
                    {/* NFT Image */}
                    <div className="relative aspect-square bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 rounded-2xl overflow-hidden p-1 group-hover:scale-105 transition-transform duration-500">
                      <div className="w-full h-full bg-gray-900 rounded-xl overflow-hidden relative">
                        <Image
                          src="https://quicknode.quicknode-ipfs.com/ipfs/QmWrmCfPm6L85p1o8KMc9WZCsdwsgW89n37nQMJ6UCVYNW"
                          alt={`RewardNFT #${index + 1}`}
                          width={300}
                          height={300}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1578632292335-df3abbb0d586?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3"
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    </div>

                    {/* NFT Details */}
                    <div className="space-y-4">
                      <h3 className="font-bold text-white text-lg">RewardNFT Collection #{index + 1}</h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="border-yellow-400 text-yellow-400 bg-yellow-400/10 px-3 py-1">
                          <Trophy className="w-3 h-3 mr-1" />
                          Legendary
                        </Badge>
                        <Badge variant="outline" className="border-purple-400 text-purple-400 bg-purple-400/10 px-3 py-1">
                          <Star className="w-3 h-3 mr-1" />
                          Membership
                        </Badge>
                        <Badge variant="outline" className="border-green-400 text-green-400 bg-green-400/10 px-3 py-1">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      </div>

                      {/* Mint Address */}
                      <div className="bg-gray-800/50 rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-sm font-medium">Mint Address:</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(nft.mint!, "Mint Address")}
                            className="h-8 px-2 text-gray-400 hover:text-white hover:bg-gray-700/50"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <div className="font-mono text-sm text-gray-300 bg-black/30 rounded-lg p-2 break-all">
                          {nft.mint}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowQRCode(showQRCode === nft.mint ? null : nft.mint)}
                          className="border-teal-500/50 text-teal-400 hover:bg-teal-500/20 hover:border-teal-400 transition-all duration-300"
                        >
                          <QrCode className="w-4 h-4 mr-2" />
                          {showQRCode === nft.mint ? 'Hide QR' : 'Show QR'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => shareNFT(nft.mint!)}
                          className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20 hover:border-blue-400 transition-all duration-300"
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                      </div>

                      {/* QR Code Display */}
                      {showQRCode === nft.mint && (
                        <motion.div
                          className="bg-white rounded-xl p-6"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="text-center">
                            <img
                              src={generateQRCodeURL(nft.mint!)}
                              alt="NFT QR Code"
                              className="mx-auto mb-3 rounded-lg"
                            />
                            <p className="text-sm text-gray-600 font-medium">Scan to view NFT details</p>
                          </div>
                        </motion.div>
                      )}

                      {/* Transaction Link */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(getExplorerUrl(nft.signature!, "tx"), "_blank")}
                        className="w-full justify-center bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white border border-gray-700/50 hover:border-gray-600 transition-all duration-300"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View on Solana Explorer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Action Cards */}
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.8 }}
          >
            {/* Transaction Summary */}
            <Card className="bg-black/40 backdrop-blur-xl border-gray-700/50 hover:border-teal-400/30 transition-all duration-500">
              <CardHeader>
                <CardTitle className="flex items-center text-white text-xl">
                  <motion.div
                    className="w-8 h-8 bg-gradient-to-r from-green-400 to-teal-400 rounded-full flex items-center justify-center mr-3"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <CheckCircle className="w-4 h-4 text-black" />
                  </motion.div>
                  Transaction Summary
                </CardTitle>
                <CardDescription className="text-gray-400 text-base">Your minting transaction details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                    <span className="text-gray-400 font-medium">NFTs Minted:</span>
                    <span className="text-white font-bold text-lg">{mintedNFTs.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                    <span className="text-gray-400 font-medium">Total Cost:</span>
                    <span className="text-teal-400 font-bold text-lg">{totalCost} USDC</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                    <span className="text-gray-400 font-medium">Network:</span>
                    <span className="text-white font-medium">Solana {CURRENT_NETWORK === 'mainnet-beta' ? 'Mainnet' : 'Devnet'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                    <span className="text-gray-400 font-medium">Status:</span>
                    <Badge className="bg-gradient-to-r from-green-500 to-teal-500 text-white border-0 px-3 py-1">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Confirmed
                    </Badge>
                  </div>
                </div>

                {/* Transaction Links */}
                {usdcSignature && (
                  <div className="pt-4 border-t border-gray-700/50">
                    <h4 className="font-medium text-white mb-3">Payment Transaction:</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(getExplorerUrl(usdcSignature, "tx"), "_blank")}
                      className="w-full border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white hover:border-gray-500 transition-all duration-300"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View USDC Payment Transaction
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* What's Next */}
            <Card className="bg-black/40 backdrop-blur-xl border-gray-700/50 hover:border-cyan-400/30 transition-all duration-500">
              <CardHeader>
                <CardTitle className="flex items-center text-white text-xl">
                  <motion.div
                    className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full flex items-center justify-center mr-3"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Gift className="w-4 h-4 text-black" />
                  </motion.div>
                  What's Next?
                </CardTitle>
                <CardDescription className="text-gray-400 text-base">Explore your new benefits and opportunities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Benefits */}
                <div className="space-y-4">
                  <h4 className="font-bold text-white text-lg flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-yellow-400" />
                    Your Benefits:
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { icon: Users, text: "Referral system access", color: "text-teal-400" },
                      { icon: Zap, text: "Exclusive quest participation", color: "text-purple-400" },
                      { icon: Star, text: "Daily GM points collection", color: "text-yellow-400" },
                      { icon: Trophy, text: "Leaderboard ranking", color: "text-orange-400" }
                    ].map((benefit, index) => (
                      <motion.div
                        key={index}
                        className="flex items-center p-3 bg-gray-800/30 rounded-lg"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.7 + index * 0.1 }}
                      >
                        <benefit.icon className={`w-5 h-5 mr-3 ${benefit.color}`} />
                        <span className="text-gray-300 font-medium">{benefit.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={() => router.push("/referrals")}
                      className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-black font-bold text-lg py-6"
                      size="lg"
                    >
                      <Users className="w-5 h-5 mr-2" />
                      Start Referring Friends
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </motion.div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => router.push("/quests")}
                      variant="outline"
                      className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20 hover:border-purple-400 transition-all duration-300"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Explore Quests
                    </Button>

                    <Button
                      onClick={() => router.push("/mint")}
                      variant="outline"
                      className="border-gray-600/50 text-gray-300 hover:bg-gray-700/50 hover:border-gray-500 transition-all duration-300"
                    >
                      Mint More NFTs
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// Main export component with Suspense boundary
export function MintSuccessContent() {
  return (
    <Suspense fallback={<MintSuccessLoading />}>
      <MintSuccessContentInner />
    </Suspense>
  )
}
