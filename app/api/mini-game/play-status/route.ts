import { NextRequest, NextResponse } from 'next/server'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'

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

    // Get user's mini-game sessions from Firebase
    const sessionsRef = collection(db, 'miniGameSessions')
    const userSessionsQuery = query(
      sessionsRef,
      where('walletAddress', '==', walletAddress),
      orderBy('playDate', 'desc'),
      limit(30) // Get last 30 days of sessions
    )

    const sessionsSnapshot = await getDocs(userSessionsQuery)
    const userSessions = sessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Array<{
      id: string
      playDate: string
      status: string
      startedAt?: number
      completedAt?: number
      [key: string]: any
    }>

    // Check if user has played today
    const todaySession = userSessions.find(session => session.playDate === date)
    const hasPlayedToday = !!todaySession
    let sessionStatus = todaySession?.status || null

    // Get the most recent play date
    const lastPlayDate = userSessions.length > 0 ? userSessions[0].playDate : null

    // Calculate time until next play (24 hours from last play)
    let timeUntilNextPlay = null
    if (hasPlayedToday && todaySession) {
      const lastPlayTime = todaySession.startedAt || todaySession.completedAt
      if (lastPlayTime) {
        const nextPlayTime = lastPlayTime + (24 * 60 * 60 * 1000) // 24 hours in milliseconds
        const now = Date.now()
        if (nextPlayTime > now) {
          timeUntilNextPlay = nextPlayTime - now
        }
      }
    }

    console.log(`🎮 Play status result:`, {
      hasPlayedToday,
      sessionStatus,
      lastPlayDate,
      totalSessions: userSessions.length,
      timeUntilNextPlay
    })

    return NextResponse.json({
      success: true,
      hasPlayedToday,
      lastPlayDate,
      currentDate: date,
      sessionStatus,
      timeUntilNextPlay,
      canPlay: !hasPlayedToday || (timeUntilNextPlay && timeUntilNextPlay <= 0)
    })

  } catch (error) {
    console.error('Error checking play status:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to check play status',
      hasPlayedToday: false, // Fail open to allow play
      canPlay: true
    }, { status: 500 })
  }
}
