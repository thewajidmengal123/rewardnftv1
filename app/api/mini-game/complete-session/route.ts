import { NextRequest, NextResponse } from 'next/server'
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

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

    // Find the active session for today
    const sessionsRef = collection(db, 'miniGameSessions')
    const sessionQuery = query(
      sessionsRef,
      where('walletAddress', '==', walletAddress),
      where('playDate', '==', playDate),
      where('status', '==', 'started')
    )

    const sessionSnapshot = await getDocs(sessionQuery)

    if (sessionSnapshot.empty) {
      return NextResponse.json({
        success: false,
        error: 'No active session found for today'
      }, { status: 404 })
    }

    // Update the session with completion data
    const sessionDoc = sessionSnapshot.docs[0]
    const sessionRef = doc(db, 'miniGameSessions', sessionDoc.id)

    await updateDoc(sessionRef, {
      status: 'completed',
      gameScore,
      clicks,
      xpEarned,
      completedAt,
      updatedAt: serverTimestamp()
    })

    console.log(`✅ Mini-game session completed for ${walletAddress} on ${playDate} - Score: ${gameScore}, XP: ${xpEarned}`)
    // Update user's total XP in users collection
    const userQuery = query(collection(db, 'users'), where('walletAddress', '==', walletAddress))
    const userSnapshot = await getDocs(userQuery)
    
    if (!userSnapshot.empty) {
      const userDoc = userSnapshot.docs[0]
      const userRef = doc(db, 'users', userDoc.id)
      const currentXp = userDoc.data().xp || 0
      
      await updateDoc(userRef, {
        xp: currentXp + xpEarned,
        totalXpEarned: (userDoc.data().totalXpEarned || 0) + xpEarned,
        updatedAt: serverTimestamp()
      })
      
      console.log(`✅ User XP updated: ${currentXp} → ${currentXp + xpEarned}`)
    }
    return NextResponse.json({
      success: true,
      message: 'Session completed successfully',
      sessionId: sessionDoc.id
    })

  } catch (error) {
    console.error('Error completing session:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to complete session'
    }, { status: 500 })
  }
}
