import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
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
        // Get comprehensive dashboard data
        const [usersSnapshot, nftsSnapshot, referralsSnapshot] = await Promise.all([
          adminDb.collection("users").limit(100).get(),
          adminDb.collection("nfts").limit(100).get(),
          adminDb.collection("referrals").limit(100).get()
        ])

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

        // Calculate real-time stats
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayTimestamp = today.getTime() / 1000

        const newUsersToday = users.filter(user => 
          user.createdAt && user.createdAt.seconds >= todayTimestamp
        ).length

        const mintsToday = nfts.filter(nft => 
          nft.mintedAt && nft.mintedAt.seconds >= todayTimestamp
        ).length

        const referralsToday = referrals.filter(referral => 
          referral.createdAt && referral.createdAt.seconds >= todayTimestamp
        ).length

        const revenueToday = mintsToday * 10 // 10 USDC per mint

        return NextResponse.json({
          success: true,
          data: {
            users,
            nfts,
            referrals,
            stats: {
              totalUsers: users.length,
              totalMints: nfts.length,
              totalReferrals: referrals.length,
              totalRevenue: nfts.length * 10,
              newUsersToday,
              mintsToday,
              referralsToday,
              revenueToday
            }
          }
        })
      }

      case "get-real-time-stats": {
        // Get just the real-time stats for periodic updates
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayTimestamp = today.getTime() / 1000

        const [usersToday, mintsToday, referralsToday] = await Promise.all([
          adminDb.collection("users")
            .where("createdAt", ">=", new Date(todayTimestamp * 1000))
            .get(),
          adminDb.collection("nfts")
            .where("mintedAt", ">=", new Date(todayTimestamp * 1000))
            .get(),
          adminDb.collection("referrals")
            .where("createdAt", ">=", new Date(todayTimestamp * 1000))
            .get()
        ])

        return NextResponse.json({
          success: true,
          data: {
            newUsersToday: usersToday.size,
            mintsToday: mintsToday.size,
            referralsToday: referralsToday.size,
            revenueToday: mintsToday.size * 10
          }
        })
      }

      case "export-data": {
        // Export all data for admin
        const [users, nfts, referrals] = await Promise.all([
          adminDb.collection("users").get(),
          adminDb.collection("nfts").get(),
          adminDb.collection("referrals").get()
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
