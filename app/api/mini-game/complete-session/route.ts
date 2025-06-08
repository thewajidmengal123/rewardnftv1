import { NextRequest, NextResponse } from 'next/server'

// Temporary in-memory storage for development (replace with Firebase when credentials are set up)
const playSessionsStore = new Map<string, any[]>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, playDate, gameScore, clicks, xpEarned, completedAt } = body

    if (!walletAddress || !playDate || gameScore === undefined || clicks === undefined || xpEarned === undefined || !completedAt) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 })
    }

    // Get user's sessions from in-memory store
    const userSessions = playSessionsStore.get(walletAddress) || []

    // Find the session for today
    const sessionIndex = userSessions.findIndex(session =>
      session.playDate === playDate && session.status === 'started'
    )

    if (sessionIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'No active session found for today'
      }, { status: 404 })
    }

    // Update the session with completion data
    userSessions[sessionIndex] = {
      ...userSessions[sessionIndex],
      status: 'completed',
      gameScore,
      clicks,
      xpEarned,
      completedAt: new Date(completedAt),
      updatedAt: Date.now()
    }

    // Save back to store
    playSessionsStore.set(walletAddress, userSessions)

    console.log(`✅ Mini-game session completed for ${walletAddress} on ${playDate} - Score: ${gameScore}, XP: ${xpEarned}`)

    return NextResponse.json({
      success: true,
      message: 'Session completed successfully'
    })

  } catch (error) {
    console.error('Error completing session:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to complete session'
    }, { status: 500 })
  }
}
