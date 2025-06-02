"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { testFirebaseConnection, runAllFirebaseTests } from "@/utils/firebase-test"
import { useWallet } from "@/contexts/wallet-context"

export function FirebaseDebug() {
  const { publicKey } = useWallet()
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<any>(null)

  const handleBasicTest = async () => {
    setTesting(true)
    try {
      const result = await testFirebaseConnection()
      setResults({ basicTest: result })
    } catch (error) {
      setResults({ error: error instanceof Error ? error.message : "Test failed" })
    } finally {
      setTesting(false)
    }
  }

  const handleFullTest = async () => {
    if (!publicKey) {
      setResults({ error: "Wallet not connected" })
      return
    }

    setTesting(true)
    try {
      const result = await runAllFirebaseTests(publicKey.toString())
      setResults({ fullTest: result })
    } catch (error) {
      setResults({ error: error instanceof Error ? error.message : "Test failed" })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
      <h3 className="text-lg font-semibold text-white mb-4">Firebase Debug Tools</h3>
      
      <div className="flex gap-2 mb-4">
        <Button
          onClick={handleBasicTest}
          disabled={testing}
          variant="outline"
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          {testing ? "Testing..." : "Test Connection"}
        </Button>
        
        <Button
          onClick={handleFullTest}
          disabled={testing || !publicKey}
          variant="outline"
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          {testing ? "Testing..." : "Full Test"}
        </Button>
      </div>

      {results && (
        <Alert className="bg-blue-500/10 border-blue-500/20">
          <AlertDescription className="text-blue-400">
            <div className="font-semibold mb-2">Test Results:</div>
            <pre className="text-xs overflow-auto max-h-64 bg-black/20 p-2 rounded whitespace-pre-wrap">
              {JSON.stringify(results, null, 2)}
            </pre>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
