import { type NextRequest, NextResponse } from "next/server"
import { isAdminWallet } from "@/config/admin"
import { db } from "@/lib/firebase"
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  Timestamp
} from "firebase/firestore"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get("wallet")
    const action = searchParams.get("action") || "get-dashboard-data"

    // Verify admin access
    if (!walletAddress || !isAdminWallet(walletAddress)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin access required" },
        { status: 403 }
      )
    }

    // Helper function to safely get collection data
    const safeGetCollection = async (collectionName: string, orderField?: string, limitCount = 100) => {
      try {
        let q = collection(db, collectionName)
        let queryRef: any = q
        if (orderField) {
          queryRef = query(q, orderBy(orderField, "desc"), limit(limitCount))
        } else {
          queryRef = query(q, limit(limitCount))
        }
        const snapshot = await getDocs(queryRef)
        return snapshot
      } catch (err) {
        console.error(`Error loading ${collectionName}:`, err)
        return { docs: [], size: 0 }
      }
    }

    switch (action) {
      case "get-dashboard-data": {
        console.log("Loading admin dashboard data...")

        // Get basic collections data safely
        const usersSnapshot = await safeGetCollection("users", "createdAt")
        const nftsSnapshot = await safeGetCollection("nfts", "mintedAt")
        const referralsSnapshot = await safeGetCollection("referrals", "createdAt")

        // Get optional collections data
        const userXPSnapshot = await safeGetCollection("userXP", "totalXP", 50)
        const questsSnapshot = await safeGetCollection("quests", undefined, 100)

        console.log(`Loaded: ${usersSnapshot.docs?.length || 0} users, ${nftsSnapshot.docs?.length || 0} NFTs, ${referralsSnapshot.docs?.length || 0} referrals`)

        const users: any[] = usersSnapshot.docs?.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        })) || []

        const nfts: any[] = nftsSnapshot.docs?.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        })) || []

        const referrals: any[] = referralsSnapshot.docs?.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        })) || []

        const quests: any[] = questsSnapshot.docs?.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        })) || []

        const userXPData: any[] = userXPSnapshot.docs?.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        })) || []

        // Get quest progress data for better insights (skip for now)
        const questProgressSnapshot = { docs: [] }
        type QuestProgress = {
          id: string
          status?: string
          [key: string]: any
        }
        const questProgress: QuestProgress[] = questProgressSnapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        }))

        console.log(`Loaded ${questProgress.length} quest progress records`)

        // Calculate real-time stats
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayTimestamp = today.getTime() / 1000

        const newUsersToday = users.filter(user => {
          if (!user.createdAt) return false
          const userDate = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt.seconds * 1000)
          return userDate >= new Date(todayTimestamp * 1000)
        }).length

        const mintsToday = nfts.filter(nft => {
          if (!nft.mintedAt) return false
          const mintDate = nft.mintedAt.toDate ? nft.mintedAt.toDate() : new Date(nft.mintedAt.seconds * 1000)
          return mintDate >= new Date(todayTimestamp * 1000)
        }).length

        const referralsToday = referrals.filter(referral => {
          if (!referral.createdAt) return false
          const referralDate = referral.createdAt.toDate ? referral.createdAt.toDate() : new Date(referral.createdAt.seconds * 1000)
          return referralDate >= new Date(todayTimestamp * 1000)
        }).length

        // Calculate accurate revenue from actual NFT mint costs
        const totalRevenue = nfts.reduce((sum, nft) => sum + (nft.mintCost || nft.usdcRevenue || 10), 0)
        const revenueToday = nfts
          .filter(nft => {
            if (!nft.mintedAt) return false
            const mintDate = nft.mintedAt.toDate ? nft.mintedAt.toDate() : new Date(nft.mintedAt.seconds * 1000)
            return mintDate >= new Date(todayTimestamp * 1000)
          })
          .reduce((sum, nft) => sum + (nft.mintCost || nft.usdcRevenue || 10), 0)

        const totalReferralRewards = referrals.filter(r => r.status === "rewarded").reduce((sum, r) => sum + (r.rewardAmount || 4), 0)
        const netRevenue = totalRevenue - totalReferralRewards // Revenue after referral payouts

        // Enhanced quest statistics
        const completedQuests = questProgress.filter(q => q.status === "completed" || q.status === "claimed").length
        const activeQuests = questProgress.filter(q => q.status === "in_progress").length
        const totalQuestRewards = questProgress
          .filter(q => q.status === "claimed")
          .reduce((sum, q) => sum + (q.rewardXP || 0), 0)

        return NextResponse.json({
          success: true,
          data: {
            users: users.slice(0, 50), // Limit for performance
            nfts: nfts.slice(0, 50),
            referrals: referrals.slice(0, 50),
            quests: quests.slice(0, 20),
            questProgress: questProgress.slice(0, 50),
            userXPData: userXPData.slice(0, 20),
            stats: {
              totalUsers: users.length,
              totalMints: nfts.length,
              totalReferrals: referrals.length,
              totalRevenue,
              netRevenue,
              totalReferralRewards,
              newUsersToday,
              mintsToday,
              referralsToday,
              revenueToday,
              activeQuests,
              completedQuests,
              totalQuestRewards,
              totalXPAwarded: userXPData.reduce((sum, user) => sum + (user.totalXP || 0), 0),
              averageXPPerUser: userXPData.length > 0 ? userXPData.reduce((sum, user) => sum + (user.totalXP || 0), 0) / userXPData.length : 0,
              questCompletionRate: questProgress.length > 0 ? (completedQuests / questProgress.length) * 100 : 0,
              averageRevenuePerMint: nfts.length > 0 ? totalRevenue / nfts.length : 0,
              uniqueMinters: new Set(nfts.map(nft => nft.ownerWallet)).size
            }
          }
        })
      }

      case "get-real-time-stats": {
        // Get just the real-time stats for periodic updates
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayTimestamp = today.getTime() / 1000

        const todayTimestampFirestore = Timestamp.fromDate(new Date(todayTimestamp * 1000))

        // Use safe collection helper for real-time stats
        const safeGetTodayData = async (collectionName: string, dateField: string) => {
          try {
            const q = collection(db, collectionName)
            const queryRef = query(q, where(dateField, ">=", todayTimestampFirestore))
            const snapshot = await getDocs(queryRef)
            return snapshot
          } catch (err) {
            console.error(`Error loading today's ${collectionName}:`, err)
            return { docs: [], size: 0 }
          }
        }

        const [usersToday, mintsToday, referralsToday] = await Promise.all([
          safeGetTodayData("users", "createdAt"),
          safeGetTodayData("nfts", "mintedAt"),
          safeGetTodayData("referrals", "createdAt")
        ])

        // Calculate actual revenue from today's mints
        const todayMints = mintsToday.docs?.map((doc: any) => doc.data()) || []
        const actualRevenueToday = todayMints.reduce((sum: number, nft: any) => sum + (nft.mintCost || nft.usdcRevenue || 10), 0)

        return NextResponse.json({
          success: true,
          data: {
            newUsersToday: usersToday.size || 0,
            mintsToday: mintsToday.size || 0,
            referralsToday: referralsToday.size || 0,
            revenueToday: actualRevenueToday
          }
        })
      }

      case "export-data": {
        // Export all data for admin using safe collection helper
        const [users, nfts, referrals] = await Promise.all([
          safeGetCollection("users"),
          safeGetCollection("nfts"),
          safeGetCollection("referrals")
        ])

        const exportData = {
          timestamp: new Date().toISOString(),
          users: users.docs?.map((doc: any) => ({ id: doc.id, ...doc.data() })) || [],
          nfts: nfts.docs?.map((doc: any) => ({ id: doc.id, ...doc.data() })) || [],
          referrals: referrals.docs?.map((doc: any) => ({ id: doc.id, ...doc.data() })) || [],
          summary: {
            totalUsers: users.size || 0,
            totalNFTs: nfts.size || 0,
            totalReferrals: referrals.size || 0,
            totalRevenue: (nfts.size || 0) * 10
          }
        }

        return new NextResponse(JSON.stringify(exportData, null, 2), {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="admin-export-${new Date().toISOString().split('T')[0]}.json"`
          }
        })
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("Admin dashboard API error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
