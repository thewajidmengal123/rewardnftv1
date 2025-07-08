import { NextRequest, NextResponse } from 'next/server'
import { firebaseQuestService } from '@/services/firebase-quest-service'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Test XP API: Creating sample XP data...')
    
    // Sample wallets and XP amounts for testing
    const sampleData = [
      { wallet: 'test-user-1', xp: 1500, name: 'Alice' },
      { wallet: 'test-user-2', xp: 1200, name: 'Bob' },
      { wallet: 'test-user-3', xp: 900, name: 'Charlie' },
      { wallet: 'test-user-4', xp: 750, name: 'Diana' },
      { wallet: 'test-user-5', xp: 600, name: 'Eve' },
      { wallet: 'test-user-6', xp: 450, name: 'Frank' },
      { wallet: 'test-user-7', xp: 300, name: 'Grace' },
      { wallet: 'test-user-8', xp: 200, name: 'Henry' },
      { wallet: 'test-user-9', xp: 150, name: 'Ivy' },
      { wallet: 'test-user-10', xp: 100, name: 'Jack' },
    ]
    
    const results = []
    
    for (const user of sampleData) {
      try {
        console.log(`🧪 Adding ${user.xp} XP to ${user.wallet} (${user.name})`)
        const result = await firebaseQuestService.addUserXP(user.wallet, user.xp)
        results.push({
          wallet: user.wallet,
          name: user.name,
          xpAdded: user.xp,
          totalXP: result.totalXP,
          level: result.level,
          success: true
        })
      } catch (error) {
        console.error(`🧪 Failed to add XP for ${user.wallet}:`, error)
        results.push({
          wallet: user.wallet,
          name: user.name,
          xpAdded: user.xp,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    console.log(`🧪 Test XP API: Completed. ${results.filter(r => r.success).length}/${results.length} successful`)
    
    return NextResponse.json({
      success: true,
      message: `Created ${results.filter(r => r.success).length} test XP entries`,
      data: results
    })
    
  } catch (error) {
    console.error('🧪 Test XP API Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create test XP data'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Test XP API is available. Use POST to create sample XP data.',
    instructions: 'Send a POST request to this endpoint to create sample XP data for testing the leaderboard.'
  })
}
