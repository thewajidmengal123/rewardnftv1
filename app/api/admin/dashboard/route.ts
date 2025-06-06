import { type NextRequest, NextResponse } from "next/server"
import {
  collection,
  query,
  orderBy,
  limit,
  where,
  getDocs,
  Timestamp
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { isAdminWallet } from "@/config/admin"

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

    switch (action) {
      case "get-dashboard-data": {
        console.log("Loading admin dashboard data...")

        // Get comprehensive dashboard data including quests and XP
        const [usersSnapshot, nftsSnapshot, referralsSnapshot, questsSnapshot, userXPSnapshot] = await Promise.all([
          getDocs(query(collection(db, "users"), orderBy("createdAt", "desc"), limit(100))).catch(err => {
            console.error("Error loading users:", err)
            return { docs: [] }
          }),
          getDocs(query(collection(db, "nfts"), orderBy("mintedAt", "desc"), limit(100))).catch(err => {
            console.error("Error loading NFTs:", err)
            return { docs: [] }
          }),
          getDocs(query(collection(db, "referrals"), orderBy("createdAt", "desc"), limit(100))).catch(err => {
            console.error("Error loading referrals:", err)
            return { docs: [] }
          }),
          getDocs(query(collection(db, "userQuests"), limit(100))).catch(err => {
            console.error("Error loading quests:", err)
            return { docs: [] }
          }),
          getDocs(query(collection(db, "userXP"), orderBy("totalXP", "desc"), limit(50))).catch(err => {
            console.error("Error loading XP data:", err)
            return { docs: [] }
          })
        ])

        console.log(`Loaded: ${usersSnapshot.docs.length} users, ${nftsSnapshot.docs.length} NFTs, ${referralsSnapshot.docs.length} referrals, ${questsSnapshot.docs.length} quests, ${userXPSnapshot.docs.length} XP records`)

        const users = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        const nfts = nftsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        const referrals = referralsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        const quests = questsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        const userXPData = userXPSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        // Get quest progress data for better insights
        const questProgressSnapshot = await getDocs(query(collection(db, "userQuests"), limit(200))).catch(err => {
          console.error("Error loading quest progress:", err)
          return { docs: [] }
        })
        const questProgress = questProgressSnapshot.docs.map(doc => ({
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

        const [usersToday, mintsToday, referralsToday] = await Promise.all([
          getDocs(query(
            collection(db, "users"),
            where("createdAt", ">=", todayTimestampFirestore)
          )),
          getDocs(query(
            collection(db, "nfts"),
            where("mintedAt", ">=", todayTimestampFirestore)
          )),
          getDocs(query(
            collection(db, "referrals"),
            where("createdAt", ">=", todayTimestampFirestore)
          ))
        ])

        // Calculate actual revenue from today's mints
        const todayMints = mintsToday.docs.map(doc => doc.data())
        const actualRevenueToday = todayMints.reduce((sum, nft) => sum + (nft.mintCost || nft.usdcRevenue || 10), 0)

        return NextResponse.json({
          success: true,
          data: {
            newUsersToday: usersToday.size,
            mintsToday: mintsToday.size,
            referralsToday: referralsToday.size,
            revenueToday: actualRevenueToday
          }
        })
      }

      case "export-data": {
        // Export all data for admin
        const [users, nfts, referrals] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "nfts")),
          getDocs(collection(db, "referrals"))
        ])

        const exportData = {
          timestamp: new Date().toISOString(),
          users: users.docs.map(doc => ({ id: doc.id, ...doc.data() })),
          nfts: nfts.docs.map(doc => ({ id: doc.id, ...doc.data() })),
          referrals: referrals.docs.map(doc => ({ id: doc.id, ...doc.data() })),
          summary: {
            totalUsers: users.size,
            totalNFTs: nfts.size,
            totalReferrals: referrals.size,
            totalRevenue: nfts.size * 10
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
