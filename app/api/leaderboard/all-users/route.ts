import { type NextRequest, NextResponse } from "next/server"

async function fetchFromAPI(url: string) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}${url}`)
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error)
    return { success: false, error: typeof error === "object" && error !== null && "message" in error ? (error as any).message : String(error) }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "referrals"
    const limit = parseInt(searchParams.get("limit") || "100")

    console.log(`🏆 Fetching all users leaderboard - Type: ${type}, Limit: ${limit}`)

    // Get all users data from the admin data maintenance API
    const allUsersResponse = await fetchFromAPI('/api/admin/data-maintenance?action=get-all-users&limit=200')
    
    if (!allUsersResponse.success) {
      console.log("Failed to get users from data maintenance, trying alternative...")
      // Fallback: try to get users from sync API
      const syncResponse = await fetchFromAPI('/api/admin/sync-users?action=get-all-users&limit=200')
      
      if (!syncResponse.success) {
        throw new Error("Could not fetch users from any API")
      }
      
      const users = syncResponse.users || []
      return buildLeaderboardResponse(users, type, limit)
    }

    const users = allUsersResponse.data?.users || []
    return buildLeaderboardResponse(users, type, limit)

  } catch (error) {
    console.error("Error fetching all users leaderboard:", error)
    
    // Return empty leaderboard on error
    return NextResponse.json({
      success: true,
      data: {
        leaderboard: [],
        stats: {
          totalUsers: 0,
          totalReferrals: 0,
          totalRewards: 0,
          topReferrer: null
        }
      }
    })
  }
}

function buildLeaderboardResponse(users: any[], type: string, limit: number) {
  // Sort users based on type
  let sortedUsers = [...users]
  
  switch (type) {
    case "referrals":
      sortedUsers.sort((a, b) => (b.totalReferrals || 0) - (a.totalReferrals || 0))
      break
    case "xp":
      sortedUsers.sort((a, b) => (b.totalXP || 0) - (a.totalXP || 0))
      break
    case "earnings":
      sortedUsers.sort((a, b) => (b.totalEarned || 0) - (a.totalEarned || 0))
      break
    default:
      sortedUsers.sort((a, b) => (b.totalReferrals || 0) - (a.totalReferrals || 0))
  }

  // Build leaderboard entries
  const leaderboard = sortedUsers.slice(0, limit).map((user, index) => ({
    rank: index + 1,
    walletAddress: user.walletAddress,
    displayName: user.displayName || `User ${user.walletAddress?.slice(0, 8) || 'Unknown'}`,
    totalReferrals: user.totalReferrals || 0,
    totalEarned: user.totalEarned || 0,
    questsCompleted: user.questsCompleted || 0,
    nftsMinted: user.nftsMinted || 0,
    totalXP: user.totalXP || 0,
    level: user.level || 1,
    score: getScore(user, type),
    lastActive: new Date(user.lastActive || user.createdAt || Date.now())
  }))

  // Calculate stats
  const stats = {
    totalUsers: users.length,
    totalReferrals: users.reduce((sum, user) => sum + (user.totalReferrals || 0), 0),
    totalRewards: users.reduce((sum, user) => sum + (user.totalEarned || 0), 0),
    topReferrer: leaderboard.length > 0 ? leaderboard[0] : null
  }

  console.log(`✅ Built leaderboard with ${leaderboard.length} users (${stats.totalUsers} total users)`)

  return NextResponse.json({
    success: true,
    data: {
      leaderboard,
      stats
    }
  })
}

function getScore(user: any, type: string): number {
  switch (type) {
    case "referrals":
      return user.totalReferrals || 0
    case "earnings":
      return user.totalEarned || 0
    case "xp":
      return user.totalXP || 0
    case "quests":
      return user.questsCompleted || 0
    default:
      return user.totalReferrals || 0
  }
}
