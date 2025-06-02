import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore"

/**
 * Test Firebase connection and basic operations
 */
export async function testFirebaseConnection(): Promise<{
  success: boolean
  error?: string
  details?: any
}> {
  try {
    console.log("🧪 Testing Firebase connection...")

    // Test 1: Try to read from a test collection (this will fail if rules deny access)
    console.log("📖 Testing read access...")
    const testCollectionRef = collection(db, "test")
    const testSnapshot = await getDocs(testCollectionRef)
    console.log("✅ Firebase read test successful")
    console.log("Test collection size:", testSnapshot.size)

    // Test 2: Try to write a test document (this will fail if rules deny access)
    console.log("✏️ Testing write access...")
    const testDocRef = doc(db, "test", "connection-test")
    await setDoc(testDocRef, {
      timestamp: new Date(),
      message: "Firebase connection test",
      success: true,
      userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "server"
    })
    console.log("✅ Firebase write test successful")

    // Test 3: Try to read the test document back
    console.log("🔍 Testing document retrieval...")
    const testDocSnap = await getDoc(testDocRef)
    if (testDocSnap.exists()) {
      console.log("✅ Firebase document read test successful")
      console.log("Test document data:", testDocSnap.data())
    } else {
      console.log("⚠️ Test document not found after write")
    }

    return {
      success: true,
      details: {
        connectionTest: true,
        writeTest: true,
        readTest: testDocSnap.exists(),
        testCollectionSize: testSnapshot.size,
        timestamp: new Date().toISOString()
      }
    }

  } catch (error) {
    console.error("❌ Firebase connection test failed:", error)

    // Provide more specific error information
    let errorMessage = "Unknown error"
    if (error instanceof Error) {
      errorMessage = error.message
      if (error.message.includes("offline")) {
        errorMessage += " - This usually means Firestore security rules are denying access or network issues."
      }
    }

    return {
      success: false,
      error: errorMessage,
      details: {
        error,
        timestamp: new Date().toISOString(),
        suggestion: "Check Firestore security rules in Firebase Console"
      }
    }
  }
}

/**
 * Test user service operations
 */
export async function testUserService(walletAddress: string): Promise<{
  success: boolean
  error?: string
  user?: any
}> {
  try {
    console.log("Testing user service for wallet:", walletAddress)

    // Import here to avoid circular dependencies
    const { firebaseUserService } = await import("@/services/firebase-user-service")

    // Test creating/getting user
    const user = await firebaseUserService.createOrUpdateUser(walletAddress, {
      displayName: "Test User"
    })

    console.log("✅ User service test successful")
    console.log("User data:", user)

    return {
      success: true,
      user
    }

  } catch (error) {
    console.error("❌ User service test failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

/**
 * Test referral service operations
 */
export async function testReferralService(walletAddress: string): Promise<{
  success: boolean
  error?: string
  stats?: any
  history?: any
}> {
  try {
    console.log("Testing referral service for wallet:", walletAddress)

    // Import here to avoid circular dependencies
    const { firebaseReferralService } = await import("@/services/firebase-referral-service")

    // Test getting referral stats
    const stats = await firebaseReferralService.getReferralStats(walletAddress)
    console.log("✅ Referral stats test successful")
    console.log("Stats:", stats)

    // Test getting referral history
    const history = await firebaseReferralService.getReferralHistory(walletAddress)
    console.log("✅ Referral history test successful")
    console.log("History:", history)

    return {
      success: true,
      stats,
      history
    }

  } catch (error) {
    console.error("❌ Referral service test failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

/**
 * Run all Firebase tests
 */
export async function runAllFirebaseTests(walletAddress?: string): Promise<{
  connectionTest: any
  userTest?: any
  referralTest?: any
}> {
  console.log("🧪 Running Firebase tests...")

  const connectionTest = await testFirebaseConnection()
  
  let userTest, referralTest
  
  if (walletAddress) {
    userTest = await testUserService(walletAddress)
    referralTest = await testReferralService(walletAddress)
  }

  console.log("🧪 Firebase tests completed")
  
  return {
    connectionTest,
    userTest,
    referralTest
  }
}
