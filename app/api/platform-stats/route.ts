import { type NextRequest, NextResponse } from "next/server"
import {
  collection,
  getDocs,
  query,
  where
} from "firebase/firestore"
import { db } from "@/lib/firebase"

export async function GET(request: NextRequest) {
  try {
    console.log("Loading platform statistics...")

    // Get real-time platform statistics from Firebase
    const [usersSnapshot, nftsSnapshot, rewardedReferralsSnapshot, allReferralsSnapshot] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "nfts")),
      getDocs(query(collection(db, "referrals"), where("status", "==", "rewarded"))),
      getDocs(collection(db, "referrals"))
    ])

    // Get NFT data for accurate revenue calculation
    const nfts = nftsSnapshot.docs.map(doc => doc.data())
    const totalNFTsMinted = nfts.length

    // Calculate accurate USDC revenue from actual NFT mint costs
    const totalNFTRevenue = nfts.reduce((sum, nft) => sum + (nft.mintCost || nft.usdcRevenue || 10), 0)

    // Calculate referral rewards (4 USDC per completed referral)
    const rewardedReferrals = rewardedReferralsSnapshot.docs.map(doc => doc.data())
    const totalReferralRewards = rewardedReferrals.reduce((sum, r) => sum + (r.rewardAmount || 4), 0)

    // Total USDC in ecosystem (revenue + referral rewards)
    const totalUSDCEarned = totalNFTRevenue + totalReferralRewards

    // Calculate active users (users who have minted at least one NFT)
    const users = usersSnapshot.docs.map(doc => doc.data())
    const activeUsers = users.filter(user => (user.nftsMinted || 0) > 0).length

    // Get total users and referrals
    const totalUsers = users.length
    const totalReferrals = allReferralsSnapshot.size

    console.log(`Platform stats: ${totalNFTsMinted} NFTs, ${totalNFTRevenue} USDC revenue, ${activeUsers} active users`)

    const stats = {
      nftsMinted: totalNFTsMinted,
      usdcEarned: totalUSDCEarned,
      activeUsers: Math.max(activeUsers, 1), // Ensure we show at least 1
      totalUsers,
      totalReferrals,
      treasuryEarnings: totalNFTRevenue,
      referralRewards: totalReferralRewards,
      netRevenue: totalNFTRevenue - totalReferralRewards, // Revenue after referral payouts
      averageRevenuePerMint: totalNFTsMinted > 0 ? totalNFTRevenue / totalNFTsMinted : 0,
      uniqueMinters: new Set(nfts.map(nft => nft.ownerWallet)).size
    }

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error("Platform stats API error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
