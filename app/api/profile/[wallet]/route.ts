import { type NextRequest, NextResponse } from "next/server"
import { firebaseUserService } from "@/services/firebase-user-service"

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

// Generate referral code in the same format as Firebase user service
function generateFallbackReferralCode(walletAddress: string): string {
  const prefix = walletAddress.substring(0, 4)
  const suffix = walletAddress.substring(walletAddress.length - 4)
  const timestamp = Date.now().toString(36).substring(4, 8)
  return `${prefix}${timestamp}${suffix}`.toLowerCase()
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ wallet: string }> }) {
  const { wallet } = await params

  // Ensure user exists in Firebase and get their referral code
  let firebaseUser = null
  try {
    firebaseUser = await firebaseUserService.getUserByWallet(wallet)
    if (!firebaseUser) {
      console.log("🔧 Creating new user in Firebase for wallet:", wallet)
      firebaseUser = await firebaseUserService.createOrUpdateUser(wallet, {})
    }
  } catch (firebaseError) {
    console.error("Error getting/creating Firebase user:", firebaseError)
  }

  try {

    console.log(`🔍 Fetching real profile data for wallet: ${wallet}`)

    // Fetch comprehensive data from existing APIs
    const [
      userReferralsData,
      userXPData,
      testReferralsData,
      userProgressData,
      debugReferralData,
      userBasicData,
      nftStatsData,
      miniGameData
    ] = await Promise.all([
      fetchFromAPI(`/api/users/referrals?wallet=${wallet}`),
      fetchFromAPI(`/api/quests?action=get-user-xp&wallet=${wallet}`),
      fetchFromAPI(`/api/test-referrals?wallet=${wallet}`),
      fetchFromAPI(`/api/quests?action=get-user-progress&wallet=${wallet}`),
      fetchFromAPI(`/api/debug/referral-perspective?wallet=${wallet}`),
      fetchFromAPI(`/api/users?wallet=${wallet}`),
      fetchFromAPI(`/api/nfts/stats?detailed=true&wallet=${wallet}`),
      fetchFromAPI(`/api/mini-game/play-status?walletAddress=${wallet}&date=${new Date().toISOString().split('T')[0]}`)
    ])

    console.log('API Responses:', {
      userReferrals: userReferralsData.success,
      userXP: userXPData.success,
      testReferrals: testReferralsData.success,
      userProgress: userProgressData.success,
      debugReferral: debugReferralData.success,
      userBasic: userBasicData.success,
      nftStats: nftStatsData.success,
      miniGame: miniGameData.success
    })

    // Extract data from API responses
    const referralData = userReferralsData.success ? userReferralsData.data : null
    const xpData = userXPData.success ? userXPData.data : null
    const testData = testReferralsData.success ? testReferralsData : null
    const progressData = userProgressData.success ? userProgressData.data : null
    const debugData = debugReferralData.success ? debugReferralData.debug : null
    const basicData = userBasicData.success ? userBasicData.data : null
    const nftData = nftStatsData.success ? nftStatsData : null
    const gameData = miniGameData.success ? miniGameData : null

    // Build activities from real data
    const activities = []

    // Add NFT minting activities
    if (nftData?.nfts && nftData.nfts.length > 0) {
      nftData.nfts.slice(0, 5).forEach((nft: any, index: number) => {
        activities.push({
          id: `nft-${nft.mintAddress || index}`,
          type: "mint",
          title: "NFT Minted",
          description: `Minted ${nft.name || 'RewardNFT'} for ${nft.mintCost || 10} USDC`,
          timestamp: nft.mintedAt || new Date().toISOString(),
          points: 100,
        })
      })
    }

    // Add referral activities
    if (referralData?.history && referralData.history.length > 0) {
      referralData.history.slice(0, 5).forEach((referral: { referredWallet?: string; completedAt?: string }, index: number) => {
        activities.push({
          id: `referral-${index}`,
          type: "referral",
          title: "Friend Referred",
          description: `Successfully referred ${referral.referredWallet?.slice(0, 8)}... and earned 4 USDC`,
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

    // Add mini-game activities (if user has played recently)
    if (gameData?.hasPlayedToday) {
      activities.push({
        id: `minigame-${gameData.currentDate}`,
        type: "reward",
        title: "Mini-Game Played",
        description: `Played the daily mini-game challenge`,
        timestamp: new Date().toISOString(),
        points: 0, // XP varies based on performance
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

    // Sort activities by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Build NFT data from API response
    const nfts = nftData?.nfts ? nftData.nfts.slice(0, 10).map((nft: any) => ({
      mint: nft.mintAddress,
      name: nft.name || 'RewardNFT',
      image: nft.image || '/nft-placeholder.png',
      attributes: nft.attributes || [
        { trait_type: 'Platform', value: 'RewardNFT' },
        { trait_type: 'Utility', value: 'Referral Rewards' }
      ]
    })) : []

    // Build profile with comprehensive real data
    const profile = {
      address: wallet,
      nfts: nfts,
      stats: {
        totalNFTs: basicData?.nftsMinted || nftData?.stats?.totalMints || referralData?.user?.nftsMinted || debugData?.user?.nftsMinted || 0,
        questsCompleted: progressData?.filter((q: any) => q.status === 'completed').length || referralData?.user?.questsCompleted || debugData?.user?.questsCompleted || 0,
        referrals: referralData?.stats?.totalReferrals || testData?.stats?.totalReferrals || debugData?.stats?.totalReferrals || 0,
        points: xpData?.totalXP || 0,
        rank: xpData?.rank || 0,
      },
      activities: activities.slice(0, 20), // Limit to 20 most recent activities
      referralCode: firebaseUser?.referralCode || referralData?.user?.referralCode || testData?.user?.referralCode || debugData?.user?.referralCode || generateFallbackReferralCode(wallet),
      referralStats: {
        totalReferrals: referralData?.stats?.totalReferrals || testData?.stats?.totalReferrals || debugData?.stats?.totalReferrals || 0,
        activeReferrals: referralData?.stats?.activeReferrals || testData?.stats?.activeReferrals || debugData?.stats?.activeReferrals || 0,
        totalEarned: (referralData?.stats?.totalReferrals || testData?.stats?.totalReferrals || debugData?.stats?.totalReferrals || 0) * 4, // $4 per referral
      },
    }

    console.log(`✅ Profile data compiled for wallet: ${wallet}`, {
      nfts: profile.nfts.length,
      referrals: profile.stats.referrals,
      points: profile.stats.points,
      questsCompleted: profile.stats.questsCompleted,
      totalNFTs: profile.stats.totalNFTs,
      totalEarned: profile.referralStats.totalEarned,
      activitiesCount: profile.activities.length,
      referralCode: profile.referralCode,
      dataSources: {
        hasReferralData: !!referralData,
        hasXPData: !!xpData,
        hasTestData: !!testData,
        hasProgressData: !!progressData,
        hasDebugData: !!debugData,
        hasBasicData: !!basicData,
        hasNFTData: !!nftData,
        hasGameData: !!gameData
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
      referralCode: firebaseUser?.referralCode || generateFallbackReferralCode(wallet),
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
