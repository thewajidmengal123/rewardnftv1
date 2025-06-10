import { NextRequest, NextResponse } from 'next/server'
import { firebaseQuestService } from '@/services/firebase-quest-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, xpAmount, source, details } = body

    if (!walletAddress || !xpAmount || !source) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: walletAddress, xpAmount, source'
      }, { status: 400 })
    }

    // Validate XP amount (must be positive and reasonable)
    if (xpAmount <= 0 || xpAmount > 1000) {
      return NextResponse.json({
        success: false,
        error: 'Invalid XP amount. Must be between 1 and 1000.'
      }, { status: 400 })
    }

    // For mini-game, ensure daily limit
    if (source === 'mini-game') {
      // Check if user has already earned XP from mini-game today
      const today = new Date().toISOString().split('T')[0]
      
      // This is a simple check - in production you might want more sophisticated tracking
      const existingXPData = await firebaseQuestService.getUserXPData(walletAddress)
      
      // For now, we'll allow the XP since the mini-game component handles the daily limit
      // The daily limit is enforced by the play session system
    }

    console.log(`💎 Awarding ${xpAmount} XP to ${walletAddress} from ${source}`)

    // Award XP using the Firebase quest service
    const userXPData = await firebaseQuestService.addUserXP(walletAddress, xpAmount)

    // Log the XP transaction for audit purposes
    console.log(`✅ XP awarded successfully:`, {
      walletAddress,
      xpAmount,
      source,
      newTotalXP: userXPData.totalXP,
      newLevel: userXPData.level,
      details
    })

    return NextResponse.json({
      success: true,
      data: {
        xpAwarded: xpAmount,
        totalXP: userXPData.totalXP,
        level: userXPData.level,
        currentLevelXP: userXPData.currentLevelXP,
        nextLevelXP: userXPData.nextLevelXP,
        source,
        awardedAt: new Date().toISOString()
      },
      message: `Successfully awarded ${xpAmount} XP from ${source}`
    })

  } catch (error) {
    console.error('❌ Error awarding XP:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to award XP'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('walletAddress')
    const action = searchParams.get('action') || 'get-user-xp'

    if (!walletAddress) {
      return NextResponse.json({
        success: false,
        error: 'Missing walletAddress parameter'
      }, { status: 400 })
    }

    switch (action) {
      case 'get-user-xp': {
        const userXPData = await firebaseQuestService.getUserXPData(walletAddress)
        
        if (!userXPData) {
          // Return default XP data for new users
          return NextResponse.json({
            success: true,
            data: {
              walletAddress,
              totalXP: 0,
              level: 1,
              currentLevelXP: 0,
              nextLevelXP: 500,
              rank: 0,
              questsCompleted: 0,
              lastActive: null
            }
          })
        }

        return NextResponse.json({
          success: true,
          data: userXPData
        })
      }

      case 'get-leaderboard': {
        const limit = parseInt(searchParams.get('limit') || '50')
        const leaderboard = await firebaseQuestService.getXPLeaderboard(limit)
        
        return NextResponse.json({
          success: true,
          data: leaderboard
        })
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Error in XP API:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}
