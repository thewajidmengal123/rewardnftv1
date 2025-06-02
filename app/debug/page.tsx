"use client"

import { FirebaseDebug } from "@/components/firebase-debug"
import { useWallet } from "@/contexts/wallet-context"

export default function DebugPage() {
  const { connected, publicKey } = useWallet()

  return (
    <div className="min-h-screen bg-gradient-to-br from-transparent to-indigo-900/20 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Firebase Debug Page</h1>
        
        <div className="space-y-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Wallet Status</h2>
            <div className="text-white">
              <p>Connected: {connected ? "✅ Yes" : "❌ No"}</p>
              <p>Public Key: {publicKey ? publicKey.toString() : "Not available"}</p>
            </div>
          </div>

          <FirebaseDebug />

          <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Environment Info</h2>
            <div className="text-white text-sm">
              <p>NODE_ENV: {process.env.NODE_ENV}</p>
              <p>Firebase Emulator: {process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR || "Not set"}</p>
              <p>App URL: {process.env.NEXT_PUBLIC_APP_URL || "Not set"}</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Instructions</h2>
            <div className="text-white text-sm space-y-2">
              <p>1. Connect your wallet first</p>
              <p>2. Click "Test Connection" to test basic Firebase connectivity</p>
              <p>3. Click "Full Test" to test all Firebase services</p>
              <p>4. Check the browser console for detailed logs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
