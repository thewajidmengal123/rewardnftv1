import { initializeApp, getApps } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyCE5iR7s6wTQXalPCtZnYyepHybSt3DyGg",
  authDomain: "rainbow-nft-bc02e.firebaseapp.com",
  projectId: "rainbow-nft-bc02e",
  storageBucket: "rainbow-nft-bc02e.firebasestorage.app",
  messagingSenderId: "389882690641",
  appId: "1:389882690641:web:f156f43b9ec28d48370c70",
  measurementId: "G-HJHZ7SGNKB"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// Initialize Firestore
export const db = getFirestore(app)

// Initialize Auth
export const auth = getAuth(app)

// Initialize Storage
export const storage = getStorage(app)

// Disable emulator connection for now - use production Firestore
// Uncomment below only if you want to use local emulator
/*
if (process.env.NODE_ENV === "development" &&
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true") {
  try {
    connectFirestoreEmulator(db, "localhost", 8080)
    console.log("🔧 Connected to Firestore emulator")
  } catch (error) {
    console.log("⚠️ Firestore emulator already connected or not available")
  }
}
*/

console.log("🔥 Using production Firestore")

export default app
