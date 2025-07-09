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
        // Export leaderboard data only - wallet address, XP, and referrals ranked by position
        const [users, userXP] = await Promise.all([
          safeGetCollection("users"),
          safeGetCollection("userXP", "totalXP")
        ])

        // Get all users data
        const usersData = users.docs?.map((doc: any) => ({ id: doc.id, ...doc.data() })) || []
        const userXPData = userXP.docs?.map((doc: any) => ({ id: doc.id, ...doc.data() })) || []

        // Create XP lookup map
        const xpMap = new Map()
        userXPData.forEach(xp => {
          xpMap.set(xp.walletAddress, xp.totalXP || 0)
        })

        // Build leaderboard entries with ranking
        const leaderboardEntries = usersData.map(user => ({
          walletAddress: user.walletAddress,
          totalReferrals: user.totalReferrals || 0,
          totalXP: xpMap.get(user.walletAddress) || user.totalXP || 0,
          totalEarned: user.totalEarned || 0,
          nftsMinted: user.nftsMinted || 0,
          questsCompleted: user.questsCompleted || 0
        }))

        // Sort by referrals first, then by XP as tiebreaker
        const sortedByReferrals = [...leaderboardEntries].sort((a, b) => {
          if (b.totalReferrals !== a.totalReferrals) {
            return b.totalReferrals - a.totalReferrals
          }
          return b.totalXP - a.totalXP
        })

        // Sort by XP first, then by referrals as tiebreaker
        const sortedByXP = [...leaderboardEntries].sort((a, b) => {
          if (b.totalXP !== a.totalXP) {
            return b.totalXP - a.totalXP
          }
          return b.totalReferrals - a.totalReferrals
        })

        // Add ranking to each leaderboard
        const referralLeaderboard = sortedByReferrals.map((entry, index) => ({
          rank: index + 1,
          walletAddress: entry.walletAddress,
          totalReferrals: entry.totalReferrals,
          totalXP: entry.totalXP,
          totalEarned: entry.totalEarned
        }))

        const xpLeaderboard = sortedByXP.map((entry, index) => ({
          rank: index + 1,
          walletAddress: entry.walletAddress,
          totalXP: entry.totalXP,
          totalReferrals: entry.totalReferrals,
          totalEarned: entry.totalEarned
        }))

        const exportData = {
          timestamp: new Date().toISOString(),
          exportType: "Leaderboard Data",
          description: "Ranked leaderboard data with wallet addresses, XP, and referrals",
          referralLeaderboard: referralLeaderboard,
          xpLeaderboard: xpLeaderboard,
          summary: {
            totalUsers: usersData.length,
            totalReferrals: usersData.reduce((sum, user) => sum + (user.totalReferrals || 0), 0),
            totalXP: userXPData.reduce((sum, xp) => sum + (xp.totalXP || 0), 0),
            totalEarned: usersData.reduce((sum, user) => sum + (user.totalEarned || 0), 0),
            topReferrer: referralLeaderboard[0] || null,
            topXPHolder: xpLeaderboard[0] || null
          }
        }

        return new NextResponse(JSON.stringify(exportData, null, 2), {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="leaderboard-export-${new Date().toISOString().split('T')[0]}.json"`
          }
        })
      }

      case "export-csv": {
        // Export leaderboard data as CSV for easier analysis
        const [users, userXP] = await Promise.all([
          safeGetCollection("users"),
          safeGetCollection("userXP", "totalXP")
        ])

        // Get all users data
        const usersData = users.docs?.map((doc: any) => ({ id: doc.id, ...doc.data() })) || []
        const userXPData = userXP.docs?.map((doc: any) => ({ id: doc.id, ...doc.data() })) || []

        // Create XP lookup map
        const xpMap = new Map()
        userXPData.forEach(xp => {
          xpMap.set(xp.walletAddress, xp.totalXP || 0)
        })

        // Build leaderboard entries
        const leaderboardEntries = usersData.map(user => ({
          walletAddress: user.walletAddress,
          totalReferrals: user.totalReferrals || 0,
          totalXP: xpMap.get(user.walletAddress) || user.totalXP || 0,
          totalEarned: user.totalEarned || 0
        }))

        // Sort by referrals first, then by XP as tiebreaker
        const sortedEntries = leaderboardEntries.sort((a, b) => {
          if (b.totalReferrals !== a.totalReferrals) {
            return b.totalReferrals - a.totalReferrals
          }
          return b.totalXP - a.totalXP
        })

        // Create CSV content
        const csvHeader = "Rank,Wallet Address,Total Referrals,Total XP,Total Earned (USDC)\n"
        const csvRows = sortedEntries.map((entry, index) =>
          `${index + 1},"${entry.walletAddress}",${entry.totalReferrals},${entry.totalXP},${entry.totalEarned}`
        ).join("\n")

        const csvContent = csvHeader + csvRows

        return new NextResponse(csvContent, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="leaderboard-${new Date().toISOString().split('T')[0]}.csv"`
          }
        })
      }

      case "export-quest-data": {
        // Export quest leaderboard data only - wallet address, XP, quests completed, and level ranked by XP
        const [userXP, questProgress] = await Promise.all([
          safeGetCollection("userXP", "totalXP"),
          safeGetCollection("questProgress")
        ])

        // Get all XP data
        const userXPData = userXP.docs?.map((doc: any) => ({ id: doc.id, ...doc.data() })) || []
        const questProgressData = questProgress.docs?.map((doc: any) => ({ id: doc.id, ...doc.data() })) || []

        // Create quest completion lookup map
        const questCompletionMap = new Map()
        questProgressData.forEach(progress => {
          const userId = progress.userId || progress.walletAddress
          if (userId) {
            const currentCount = questCompletionMap.get(userId) || 0
            if (progress.status === 'completed' || progress.status === 'claimed') {
              questCompletionMap.set(userId, currentCount + 1)
            }
          }
        })

        // Build quest leaderboard entries
        const questLeaderboard = userXPData.map((user, index) => ({
          rank: index + 1,
          walletAddress: user.walletAddress,
          totalXP: user.totalXP || 0,
          level: user.level || 1,
          questsCompleted: questCompletionMap.get(user.walletAddress) || 0,
          lastActive: user.lastActive || user.updatedAt || null,
          currentLevelXP: user.currentLevelXP || 0,
          nextLevelXP: user.nextLevelXP || 500
        }))

        // Sort by total XP (descending)
        const sortedQuestLeaderboard = questLeaderboard.sort((a, b) => b.totalXP - a.totalXP)

        // Update ranks after sorting
        sortedQuestLeaderboard.forEach((entry, index) => {
          entry.rank = index + 1
        })

        const exportData = {
          exportType: "quest-leaderboard",
          exportDate: new Date().toISOString(),
          totalEntries: sortedQuestLeaderboard.length,
          leaderboard: sortedQuestLeaderboard,
          summary: {
            totalXPAwarded: sortedQuestLeaderboard.reduce((sum, entry) => sum + entry.totalXP, 0),
            totalQuestsCompleted: sortedQuestLeaderboard.reduce((sum, entry) => sum + entry.questsCompleted, 0),
            averageXPPerUser: sortedQuestLeaderboard.length > 0 ?
              sortedQuestLeaderboard.reduce((sum, entry) => sum + entry.totalXP, 0) / sortedQuestLeaderboard.length : 0,
            topLevel: sortedQuestLeaderboard.length > 0 ? Math.max(...sortedQuestLeaderboard.map(entry => entry.level)) : 0
          }
        }

        return new NextResponse(JSON.stringify(exportData, null, 2), {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="quest-leaderboard-export-${new Date().toISOString().split('T')[0]}.json"`
          }
        })
      }

      case "export-quest-csv": {
        // Export quest leaderboard data as CSV for easier analysis
        const [userXP, questProgress] = await Promise.all([
          safeGetCollection("userXP", "totalXP"),
          safeGetCollection("questProgress")
        ])

        // Get all XP data
        const userXPData = userXP.docs?.map((doc: any) => ({ id: doc.id, ...doc.data() })) || []
        const questProgressData = questProgress.docs?.map((doc: any) => ({ id: doc.id, ...doc.data() })) || []

        // Create quest completion lookup map
        const questCompletionMap = new Map()
        questProgressData.forEach(progress => {
          const userId = progress.userId || progress.walletAddress
          if (userId) {
            const currentCount = questCompletionMap.get(userId) || 0
            if (progress.status === 'completed' || progress.status === 'claimed') {
              questCompletionMap.set(userId, currentCount + 1)
            }
          }
        })

        // Build quest leaderboard entries
        const questLeaderboard = userXPData.map(user => ({
          walletAddress: user.walletAddress,
          totalXP: user.totalXP || 0,
          level: user.level || 1,
          questsCompleted: questCompletionMap.get(user.walletAddress) || 0,
          currentLevelXP: user.currentLevelXP || 0,
          nextLevelXP: user.nextLevelXP || 500
        }))

        // Sort by total XP (descending)
        const sortedQuestLeaderboard = questLeaderboard.sort((a, b) => b.totalXP - a.totalXP)

        // Create CSV content
        const csvHeader = "Rank,Wallet Address,Total XP,Level,Quests Completed,Current Level XP,Next Level XP\n"
        const csvRows = sortedQuestLeaderboard.map((entry, index) =>
          `${index + 1},"${entry.walletAddress}",${entry.totalXP},${entry.level},${entry.questsCompleted},${entry.currentLevelXP},${entry.nextLevelXP}`
        ).join("\n")

        const csvContent = csvHeader + csvRows

        return new NextResponse(csvContent, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="quest-leaderboard-${new Date().toISOString().split('T')[0]}.csv"`
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
