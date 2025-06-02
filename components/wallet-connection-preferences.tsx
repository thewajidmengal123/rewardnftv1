"use client"

import { useState } from "react"
import { useEnhancedWallet } from "@/contexts/enhanced-wallet-context"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Settings, Save, RefreshCw } from "lucide-react"

export function WalletConnectionPreferences() {
  const { autoConnectEnabled, setAutoConnectEnabled, connectionPreferences, updateConnectionPreferences } =
    useEnhancedWallet()

  const [rememberWallet, setRememberWallet] = useState(connectionPreferences.rememberWallet)
  const [sessionDuration, setSessionDuration] = useState(connectionPreferences.sessionDuration.toString())

  const handleSavePreferences = () => {
    updateConnectionPreferences({
      autoConnect: autoConnectEnabled,
      rememberWallet,
      sessionDuration: Number.parseInt(sessionDuration, 10),
    })

    toast({
      title: "Preferences Saved",
      description: "Your wallet connection preferences have been updated.",
    })
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Wallet Connection Preferences
        </CardTitle>
        <CardDescription>Customize how your wallet connects to our platform</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-connect">Auto-connect wallet</Label>
            <p className="text-sm text-muted-foreground">Automatically connect your wallet when you visit the site</p>
          </div>
          <Switch id="auto-connect" checked={autoConnectEnabled} onCheckedChange={setAutoConnectEnabled} />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="remember-wallet">Remember wallet</Label>
            <p className="text-sm text-muted-foreground">Remember your last connected wallet</p>
          </div>
          <Switch id="remember-wallet" checked={rememberWallet} onCheckedChange={setRememberWallet} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="session-duration">Session Duration</Label>
          <Select value={sessionDuration} onValueChange={setSessionDuration}>
            <SelectTrigger id="session-duration">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3600000">1 hour</SelectItem>
              <SelectItem value="21600000">6 hours</SelectItem>
              <SelectItem value="43200000">12 hours</SelectItem>
              <SelectItem value="86400000">24 hours</SelectItem>
              <SelectItem value="604800000">7 days</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            How long to keep your wallet connected before requiring reconnection
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Connection
        </Button>
        <Button onClick={handleSavePreferences}>
          <Save className="mr-2 h-4 w-4" />
          Save Preferences
        </Button>
      </CardFooter>
    </Card>
  )
}
