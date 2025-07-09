import { NextRequest, NextResponse } from 'next/server'
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

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

    // Check if user has already played today
    const sessionsRef = collection(db, 'miniGameSessions')
    const existingSessionQuery = query(
      sessionsRef,
      where('walletAddress', '==', walletAddress),
      where('playDate', '==', playDate)
    )

    const existingSessionSnapshot = await getDocs(existingSessionQuery)

    if (!existingSessionSnapshot.empty) {
      const existingSession = existingSessionSnapshot.docs[0].data()
      console.log(`❌ User ${walletAddress} already has a session for ${playDate}:`, existingSession.status)

      // Check if it's been 24 hours since last play
      const lastPlayTime = existingSession.startedAt || existingSession.completedAt
      const now = Date.now()
      const timeSinceLastPlay = now - lastPlayTime
      const twentyFourHours = 24 * 60 * 60 * 1000

      if (timeSinceLastPlay < twentyFourHours) {
        const timeRemaining = twentyFourHours - timeSinceLastPlay
        return NextResponse.json({
          success: false,
          error: 'Must wait 24 hours between plays',
          timeRemaining,
          existingSession: {
            status: existingSession.status,
            playDate: existingSession.playDate,
            lastPlayTime
          }
        }, { status: 400 })
      }
    }

    // Record the new play session
    const sessionData = {
      walletAddress,
      playDate,
      startedAt,
      createdAt: serverTimestamp(),
      status: 'started'
    }

    const docRef = await addDoc(sessionsRef, sessionData)

    console.log(`✅ Mini-game play session recorded for ${walletAddress} on ${playDate}`)

    return NextResponse.json({
      success: true,
      sessionId: docRef.id,
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
