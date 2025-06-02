"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/contexts/wallet-context"
import { isPhantomInstalled, checkSolanaNetwork, getPhantomProvider } from "@/utils/phantom-provider"
import type { SolanaNetwork } from "@/utils/solana-network"

export function WalletDebug() {
  const { connected, publicKey } = useWallet()
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({})
  const [showDebug, setShowDebug] = useState(false)

  const runDiagnostics = async () => {
    const diagnostics: Record<string, any> = {
      timestamp: new Date().toISOString(),
      environment: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        vendor: navigator.vendor,
      },
      phantom: {
        installed: isPhantomInstalled(),
      },
      wallet: {
        connected,
        publicKey: publicKey?.toString() || null,
      },
    }

    // Check if Phantom is available
    if (diagnostics.phantom.installed) {
      try {
        const provider = await getPhantomProvider(1, 0)
        diagnostics.phantom.provider = {
          available: !!provider,
          isPhantom: provider?.isPhantom || false,
          isConnected: provider?.isConnected || false,
        }

        // Check network - pass the expected network from environment variable if available
        if (provider) {
          const expectedNetwork = (process.env.NEXT_PUBLIC_SOLANA_NETWORK as SolanaNetwork) || undefined
          const networkInfo = await checkSolanaNetwork(provider, expectedNetwork)
          diagnostics.phantom.network = networkInfo
        }
      } catch (error) {
        diagnostics.phantom.error = {
          message: (error as Error).message,
          stack: (error as Error).stack,
        }
      }
    }

    setDebugInfo(diagnostics)
  }

  useEffect(() => {
    if (showDebug) {
      runDiagnostics()
    }
  }, [showDebug, connected, publicKey])

  if (!showDebug) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDebug(true)}
          className="bg-black/50 text-white border-white/20"
        >
          Debug Wallet
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[90vw] bg-black/80 backdrop-blur-md rounded-lg border border-white/20 p-4 text-white">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Wallet Debug Info</h3>
        <Button variant="ghost" size="sm" onClick={() => setShowDebug(false)}>
          Close
        </Button>
      </div>

      <div className="space-y-2 text-xs font-mono overflow-auto max-h-[50vh]">
        <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
      </div>

      <div className="mt-4 flex justify-between">
        <Button size="sm" variant="outline" onClick={runDiagnostics}>
          Refresh
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2))
          }}
        >
          Copy
        </Button>
      </div>
    </div>
  )
}
