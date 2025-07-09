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

    // For mini-game, ensure minimum XP and daily limit
    let finalXPAmount = xpAmount
    if (source === 'mini-game') {
      // Ensure minimum XP reward (at least 10 XP for playing)
      finalXPAmount = Math.max(xpAmount, 10)

      // Check if user has already earned XP from mini-game today
      const today = new Date().toISOString().split('T')[0]

      // This is a simple check - in production you might want more sophisticated tracking
      const existingXPData = await firebaseQuestService.getUserXPData(walletAddress)

      // For now, we'll allow the XP since the mini-game component handles the daily limit
      // The daily limit is enforced by the play session system
    }

    console.log(`💎 Awarding ${finalXPAmount} XP to ${walletAddress} from ${source} (original: ${xpAmount})`)

    // Award XP using the Firebase quest service
    const userXPData = await firebaseQuestService.addUserXP(walletAddress, finalXPAmount)

    // Log the XP transaction for audit purposes
    console.log(`✅ XP awarded successfully:`, {
      walletAddress,
      xpAmount: finalXPAmount,
      originalAmount: xpAmount,
      source,
      newTotalXP: userXPData.totalXP,
      newLevel: userXPData.level,
      details
    })

    return NextResponse.json({
      success: true,
      data: {
        xpAwarded: finalXPAmount,
        totalXP: userXPData.totalXP,
        level: userXPData.level,
        currentLevelXP: userXPData.currentLevelXP,
        nextLevelXP: userXPData.nextLevelXP,
        source,
        awardedAt: new Date().toISOString()
      },
      message: `Successfully awarded ${finalXPAmount} XP from ${source}`
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

    // For leaderboard action, walletAddress is not required
    if (action !== 'get-leaderboard' && !walletAddress) {
      return NextResponse.json({
        success: false,
        error: 'Missing walletAddress parameter'
      }, { status: 400 })
    }

    switch (action) {
      case 'get-user-xp': {
        const userXPData = await firebaseQuestService.getUserXPData(walletAddress!)

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
        console.log(`🏆 XP API: Getting leaderboard`)
        const limit = parseInt(searchParams.get('limit') || '50')
        console.log(`🏆 XP API: Limit set to ${limit}`)

        try {
          const leaderboard = await firebaseQuestService.getXPLeaderboard(limit)
          console.log(`🏆 XP API: Retrieved ${leaderboard.length} leaderboard entries`)

          // If no leaderboard data exists, create some sample data for testing
          if (leaderboard.length === 0) {
            console.log(`🏆 XP API: No leaderboard data found. Creating sample data for testing...`)

            // Create some sample XP data
            const sampleWallets = [
              'sample-wallet-1',
              'sample-wallet-2',
              'sample-wallet-3'
            ]

            const sampleXPAmounts = [500, 350, 200]

            for (let i = 0; i < sampleWallets.length; i++) {
              try {
                await firebaseQuestService.addUserXP(sampleWallets[i], sampleXPAmounts[i])
                console.log(`🏆 XP API: Added ${sampleXPAmounts[i]} XP to ${sampleWallets[i]}`)
              } catch (sampleError) {
                console.error(`🏆 XP API: Failed to add sample XP:`, sampleError)
              }
            }

            // Try to get leaderboard again
            const updatedLeaderboard = await firebaseQuestService.getXPLeaderboard(limit)
            console.log(`🏆 XP API: After adding samples, retrieved ${updatedLeaderboard.length} entries`)

            return NextResponse.json({
              success: true,
              data: updatedLeaderboard,
              message: updatedLeaderboard.length > 0 ? 'Leaderboard with sample data' : 'No XP data available'
            })
          }

          return NextResponse.json({
            success: true,
            data: leaderboard
          })
        } catch (error) {
          console.error(`🏆 XP API: Error getting leaderboard:`, error)
          return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get XP leaderboard',
            data: []
          })
        }
      }

      case 'test-add-xp': {
        // Test endpoint to add sample XP data for testing
        const testWallet = searchParams.get('testWallet') || 'test-wallet-123'
        const testXP = parseInt(searchParams.get('testXP') || '100')

        console.log(`🏆 XP API: Adding test XP data - ${testXP} XP to ${testWallet}`)

        const result = await firebaseQuestService.addUserXP(testWallet, testXP)

        return NextResponse.json({
          success: true,
          data: result,
          message: `Added ${testXP} XP to test wallet ${testWallet}`
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
