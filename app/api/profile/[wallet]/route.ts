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
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ wallet: string }> }) {
  const { wallet } = await params
  try {

    console.log(`🔍 Fetching real profile data for wallet: ${wallet}`)

    // Fetch real data from existing APIs
    const [
      userReferralsData,
      userXPData,
      testReferralsData,
      userProgressData,
      debugReferralData
    ] = await Promise.all([
      fetchFromAPI(`/api/users/referrals?wallet=${wallet}`),
      fetchFromAPI(`/api/quests?action=get-user-xp&wallet=${wallet}`),
      fetchFromAPI(`/api/test-referrals?wallet=${wallet}`),
      fetchFromAPI(`/api/quests?action=get-user-progress&wallet=${wallet}`),
      fetchFromAPI(`/api/debug/referral-perspective?wallet=${wallet}`)
    ])

    console.log('API Responses:', {
      userReferrals: userReferralsData.success,
      userXP: userXPData.success,
      testReferrals: testReferralsData.success,
      userProgress: userProgressData.success,
      debugReferral: debugReferralData.success
    })

    // Extract data from API responses
    const referralData = userReferralsData.success ? userReferralsData.data : null
    const xpData = userXPData.success ? userXPData.data : null
    const testData = testReferralsData.success ? testReferralsData : null
    const progressData = userProgressData.success ? userProgressData.data : null
    const debugData = debugReferralData.success ? debugReferralData.debug : null

    // Build activities from real data
    const activities = []

    // Add referral activities
    if (referralData?.history && referralData.history.length > 0) {
      referralData.history.slice(0, 10).forEach((referral: { referredWallet?: string; completedAt?: string }, index: number) => {
        activities.push({
          id: `referral-${index}`,
          type: "referral",
          title: "Friend Referred",
          description: `Successfully referred ${referral.referredWallet?.slice(0, 8)}...`,
          timestamp: referral.completedAt || new Date().toISOString(),
          points: 200,
        })
      })
    }

    // Add quest activities
    if (progressData && Array.isArray(progressData) && progressData.length > 0) {
      progressData.filter(quest => quest.status === 'completed').slice(0, 5).forEach((quest, index) => {
        activities.push({
          id: `quest-${quest.id || index}`,
          type: "quest",
          title: "Quest Completed",
          description: `Completed quest: ${quest.questId || 'Unknown Quest'}`,
          timestamp: quest.completedAt || new Date().toISOString(),
          points: quest.rewardXP || 50,
        })
      })
    }

    // Add welcome message if no activities
    if (activities.length === 0) {
      activities.push({
        id: 'welcome',
        type: 'reward',
        title: 'Welcome to RewardNFT!',
        description: 'Your profile has been created. Start minting NFTs and referring friends to earn rewards!',
        timestamp: new Date().toISOString(),
        points: 0,
      })
    }

    // Build profile with real data from multiple sources
    const profile = {
      address: wallet,
      nfts: [], // Will be populated when NFT API is available
      stats: {
        totalNFTs: referralData?.user?.nftsMinted || debugData?.user?.nftsMinted || 0,
        questsCompleted: referralData?.user?.questsCompleted || debugData?.user?.questsCompleted || 0,
        referrals: referralData?.stats?.totalReferrals || testData?.stats?.totalReferrals || debugData?.stats?.totalReferrals || 0,
        points: xpData?.totalXP || 0,
        rank: xpData?.rank || 0,
      },
      activities: activities,
      referralCode: referralData?.user?.referralCode || testData?.user?.referralCode || debugData?.user?.referralCode || `REF${wallet.slice(0, 8).toUpperCase()}`,
      referralStats: {
        totalReferrals: referralData?.stats?.totalReferrals || testData?.stats?.totalReferrals || debugData?.stats?.totalReferrals || 0,
        activeReferrals: referralData?.stats?.activeReferrals || testData?.stats?.activeReferrals || debugData?.stats?.activeReferrals || 0,
        totalEarned: referralData?.stats?.totalEarned || testData?.stats?.totalEarned || debugData?.stats?.totalEarned || 0,
      },
    }

    console.log(`✅ Profile data compiled for wallet: ${wallet}`, {
      referrals: profile.stats.referrals,
      points: profile.stats.points,
      totalEarned: profile.referralStats.totalEarned,
      activitiesCount: activities.length,
      referralCode: profile.referralCode,
      dataSources: {
        hasReferralData: !!referralData,
        hasXPData: !!xpData,
        hasTestData: !!testData,
        hasProgressData: !!progressData,
        hasDebugData: !!debugData
      }
    })

    return NextResponse.json({
      success: true,
      data: profile,
    })
  } catch (error) {
    console.error("Error fetching profile:", error)

    // Return fallback profile on error
    const fallbackProfile = {
      address: wallet,
      nfts: [],
      stats: {
        totalNFTs: 0,
        questsCompleted: 0,
        referrals: 0,
        points: 0,
        rank: 0,
      },
      activities: [
        {
          id: 'error',
          type: 'reward',
          title: 'Profile Loading',
          description: 'There was an issue loading your profile data. Please try refreshing the page.',
          timestamp: new Date().toISOString(),
          points: 0,
        }
      ],
      referralCode: `REF${wallet.slice(0, 8).toUpperCase()}`,
      referralStats: {
        totalReferrals: 0,
        activeReferrals: 0,
        totalEarned: 0,
      },
    }

    return NextResponse.json({
      success: true,
      data: fallbackProfile,
    })
  }
}
