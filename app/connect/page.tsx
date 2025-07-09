"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/contexts/wallet-context"
import { Loader2 } from "lucide-react"

export default function ConnectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { connectWallet } = useWallet()
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Get session ID from URL
  const sessionId = searchParams.get("session")

  useEffect(() => {
    // If we have a session ID, attempt to connect
    if (sessionId) {
      handleConnection()
    }
  }, [sessionId])

  const handleConnection = async () => {
    if (!sessionId) return

    setConnecting(true)
    setError(null)

    try {
      // In a real implementation, you would verify the session with your backend
      // and get the wallet connection details

      // For now, we'll just try to connect to Phantom
      await connectWallet("phantom")
      setSuccess(true)

      // Redirect back to home after successful connection
      setTimeout(() => {
        router.push("/")
      }, 2000)
    } catch (err) {
      console.error("Connection error:", err)
      setError("Failed to connect wallet. Please try again.")
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-6 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-center">
        <h1 className="text-2xl font-bold mb-6">Wallet Connection</h1>

        {connecting ? (
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-[#00FFE0]" />
            <p>Connecting your wallet...</p>
          </div>
        ) : error ? (
          <div className="space-y-4">
            <p className="text-red-400">{error}</p>
            <Button onClick={handleConnection}>Try Again</Button>
          </div>
        ) : success ? (
          <div className="space-y-4">
            <p className="text-green-400">Wallet connected successfully!</p>
            <p>Redirecting you back to the app...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p>Initializing wallet connection...</p>
            <Button onClick={handleConnection} disabled={!sessionId}>
              Connect Manually
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
