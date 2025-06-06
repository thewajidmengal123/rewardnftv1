import { NextRequest, NextResponse } from "next/server"
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  limit, 
  where,
  Timestamp 
} from "firebase/firestore"
import { db } from "@/lib/firebase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get("timeframe") || "all" // all, today, week, month
    const detailed = searchParams.get("detailed") === "true"

    // Calculate time filters
    const now = new Date()
    let startDate: Date | null = null

    switch (timeframe) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
    }

    // Build query
    let nftQuery = query(collection(db, "nfts"), orderBy("mintedAt", "desc"))
    
    if (startDate) {
      const startTimestamp = Timestamp.fromDate(startDate)
      nftQuery = query(
        collection(db, "nfts"),
        where("mintedAt", ">=", startTimestamp),
        orderBy("mintedAt", "desc")
      )
    }

    // Add limit for performance unless detailed view is requested
    if (!detailed) {
      nftQuery = query(nftQuery, limit(100))
    }

    // Get NFT data
    const nftSnapshot = await getDocs(nftQuery)
    const nfts = nftSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Calculate statistics
    const totalMints = nfts.length
    const totalRevenue = nfts.reduce((sum, nft) => sum + (nft.mintCost || nft.usdcRevenue || 10), 0)
    const averageMintCost = totalMints > 0 ? totalRevenue / totalMints : 0

    // Get unique minters
    const uniqueMinters = new Set(nfts.map(nft => nft.ownerWallet)).size

    // Calculate mints by day for trending
    const mintsByDay: { [key: string]: number } = {}
    const revenueByDay: { [key: string]: number } = {}

    nfts.forEach(nft => {
      if (nft.mintedAt && nft.mintedAt.toDate) {
        const date = nft.mintedAt.toDate().toISOString().split('T')[0]
        mintsByDay[date] = (mintsByDay[date] || 0) + 1
        revenueByDay[date] = (revenueByDay[date] || 0) + (nft.mintCost || nft.usdcRevenue || 10)
      }
    })

    // Get top minters
    const minterCounts: { [wallet: string]: number } = {}
    nfts.forEach(nft => {
      if (nft.ownerWallet) {
        minterCounts[nft.ownerWallet] = (minterCounts[nft.ownerWallet] || 0) + 1
      }
    })

    const topMinters = Object.entries(minterCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([wallet, count]) => ({ wallet, count }))

    // Recent mints (last 10)
    const recentMints = nfts.slice(0, 10).map(nft => ({
      mintAddress: nft.mintAddress,
      ownerWallet: nft.ownerWallet,
      mintCost: nft.mintCost || nft.usdcRevenue || 10,
      mintedAt: nft.mintedAt,
      transactionSignature: nft.transactionSignature
    }))

    const stats = {
      totalMints,
      totalRevenue,
      averageMintCost,
      uniqueMinters,
      timeframe,
      mintsByDay,
      revenueByDay,
      topMinters,
      recentMints
    }

    // Include detailed NFT data if requested
    const response: any = {
      success: true,
      stats
    }

    if (detailed) {
      response.nfts = nfts.map(nft => ({
        id: nft.id,
        mintAddress: nft.mintAddress,
        ownerWallet: nft.ownerWallet,
        name: nft.name,
        symbol: nft.symbol,
        mintCost: nft.mintCost || nft.usdcRevenue || 10,
        mintedAt: nft.mintedAt,
        transactionSignature: nft.transactionSignature,
        isVerified: nft.isVerified,
        attributes: nft.attributes
      }))
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error getting NFT stats:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
