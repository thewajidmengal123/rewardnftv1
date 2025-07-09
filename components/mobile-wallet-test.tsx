"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  isMobileDevice, 
  isIOSDevice, 
  isIOSSafari,
  generatePhantomBrowseURL,
  generatePhantomConnectURL,
  getWalletUniversalLink,
  getWalletDeepLink,
  debugMobileWalletConnection,
  connectToMobileWallet
} from "@/utils/mobile-wallet-adapter"
import { toast } from "@/components/ui/use-toast"

export function MobileWalletTest() {
  const [testResults, setTestResults] = useState<any>(null)

  const runMobileDetectionTest = () => {
    const results = {
      isMobile: isMobileDevice(),
      isIOS: isIOSDevice(),
      isIOSSafari: isIOSSafari(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
      screenSize: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A',
      touchPoints: typeof navigator !== 'undefined' ? navigator.maxTouchPoints : 'N/A',
      orientation: typeof window !== 'undefined' && 'orientation' in window ? window.orientation : 'N/A',
      phantomBrowseUrl: generatePhantomBrowseURL(),
      phantomConnectUrl: generatePhantomConnectURL(),
      phantomUniversalLink: getWalletUniversalLink('phantom'),
      phantomDeepLink: getWalletDeepLink('phantom', 'connect'),
      solflareUniversalLink: getWalletUniversalLink('solflare'),
      solflareDeepLink: getWalletDeepLink('solflare', 'connect'),
    }

    setTestResults(results)
    console.log('📱 Mobile Detection Test Results:', results)
    
    toast({
      title: "Mobile Detection Test Complete",
      description: "Check console for detailed results",
    })
  }

  const testPhantomConnection = async () => {
    debugMobileWalletConnection('phantom')
    
    try {
      const success = await connectToMobileWallet('phantom')
      toast({
        title: success ? "Phantom Connection Initiated" : "Phantom Connection Failed",
        description: success 
          ? "Phantom should open or redirect to app store" 
          : "Failed to initiate Phantom connection",
        variant: success ? "default" : "destructive"
      })
    } catch (error) {
      console.error('Phantom connection test error:', error)
      toast({
        title: "Phantom Connection Error",
        description: "Check console for error details",
        variant: "destructive"
      })
    }
  }

  const testSolflareConnection = async () => {
    debugMobileWalletConnection('solflare')
    
    try {
      const success = await connectToMobileWallet('solflare')
      toast({
        title: success ? "Solflare Connection Initiated" : "Solflare Connection Failed",
        description: success 
          ? "Solflare should open or redirect to app store" 
          : "Failed to initiate Solflare connection",
        variant: success ? "default" : "destructive"
      })
    } catch (error) {
      console.error('Solflare connection test error:', error)
      toast({
        title: "Solflare Connection Error",
        description: "Check console for error details",
        variant: "destructive"
      })
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Mobile Wallet Integration Test</CardTitle>
        <CardDescription>
          Test mobile wallet detection and connection functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Device Detection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Device Detection</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant={isMobileDevice() ? "default" : "secondary"}>
              Mobile: {isMobileDevice() ? "Yes" : "No"}
            </Badge>
            <Badge variant={isIOSDevice() ? "default" : "secondary"}>
              iOS: {isIOSDevice() ? "Yes" : "No"}
            </Badge>
            <Badge variant={isIOSSafari() ? "default" : "secondary"}>
              Safari: {isIOSSafari() ? "Yes" : "No"}
            </Badge>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Tests</h3>
          <div className="flex flex-wrap gap-2">
            <Button onClick={runMobileDetectionTest} variant="outline">
              Run Detection Test
            </Button>
            <Button onClick={testPhantomConnection} className="bg-purple-600 hover:bg-purple-700">
              Test Phantom Connection
            </Button>
            <Button onClick={testSolflareConnection} className="bg-orange-600 hover:bg-orange-700">
              Test Solflare Connection
            </Button>
          </div>
        </div>

        {/* Test Results */}
        {testResults && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Test Results</h3>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <pre className="text-sm overflow-auto">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Instructions</h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p><strong>Desktop:</strong> Should detect as non-mobile and show wallet extensions</p>
            <p><strong>Mobile:</strong> Should detect as mobile and use universal links/deep links</p>
            <p><strong>Phantom (Mobile):</strong> Should open dApp in Phantom's in-app browser</p>
            <p><strong>Other Wallets (Mobile):</strong> Should open wallet app or redirect to app store</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
