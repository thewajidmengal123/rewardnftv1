import { NextRequest, NextResponse } from 'next/server'

// Temporary in-memory storage for development (replace with Firebase when credentials are set up)
const playSessionsStore = new Map<string, any[]>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, playDate, startedAt } = body

    if (!walletAddress || !playDate || !startedAt) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: walletAddress, playDate, startedAt'
      }, { status: 400 })
    }

    // Get user's sessions from in-memory store
    const userSessions = playSessionsStore.get(walletAddress) || []

    // Check if user has already played today
    const existingSession = userSessions.find(session => session.playDate === playDate)

    if (existingSession) {
      console.log(`❌ User ${walletAddress} already has a session for ${playDate}:`, existingSession.status)
      return NextResponse.json({
        success: false,
        error: 'User has already played today',
        existingSession: {
          status: existingSession.status,
          playDate: existingSession.playDate
        }
      }, { status: 400 })
    }

    // Record the new play session
    const sessionData = {
      id: `${walletAddress}-${playDate}-${Date.now()}`,
      walletAddress,
      playDate,
      startedAt,
      createdAt: Date.now(),
      status: 'started'
    }

    // Add to user's sessions
    userSessions.push(sessionData)
    playSessionsStore.set(walletAddress, userSessions)

    console.log(`✅ Mini-game play session recorded for ${walletAddress} on ${playDate}`)

    return NextResponse.json({
      success: true,
      sessionId: sessionData.id,
      message: 'Play session recorded successfully'
    })

  } catch (error) {
    console.error('Error recording play session:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to record play session'
    }, { status: 500 })
  }
}
