import { NextRequest, NextResponse } from 'next/server'

// Temporary in-memory storage for development (replace with Firebase when credentials are set up)
const playSessionsStore = new Map<string, any[]>()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('walletAddress')
    const date = searchParams.get('date')

    if (!walletAddress || !date) {
      return NextResponse.json({
        success: false,
        error: 'Missing walletAddress or date parameter'
      }, { status: 400 })
    }

    console.log(`🔍 Checking play status for ${walletAddress} on ${date}`)

    // Get user's sessions from in-memory store
    const userSessions = playSessionsStore.get(walletAddress) || []

    // Check if user has played today
    const todaySession = userSessions.find(session => session.playDate === date)
    const hasPlayedToday = !!todaySession
    let sessionStatus = todaySession?.status || null

    // Get the most recent play date
    const sortedSessions = userSessions.sort((a, b) => b.playDate.localeCompare(a.playDate))
    const lastPlayDate = sortedSessions.length > 0 ? sortedSessions[0].playDate : null

    console.log(`🎮 Play status result:`, {
      hasPlayedToday,
      sessionStatus,
      lastPlayDate,
      totalSessions: userSessions.length
    })

    return NextResponse.json({
      success: true,
      hasPlayedToday,
      lastPlayDate,
      currentDate: date,
      sessionStatus
    })

  } catch (error) {
    console.error('Error checking play status:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to check play status'
    }, { status: 500 })
  }
}
