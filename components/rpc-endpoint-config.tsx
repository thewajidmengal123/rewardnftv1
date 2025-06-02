"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Settings } from "lucide-react"
import { SOLANA_RPC_ENDPOINTS } from "@/config/solana"
import { toast } from "@/components/ui/use-toast"

interface RpcEndpointConfigProps {
  currentEndpoint: string
  onEndpointChange: (endpoint: string) => void
}

export function RpcEndpointConfig({ currentEndpoint, onEndpointChange }: RpcEndpointConfigProps) {
  const [open, setOpen] = useState(false)
  const [endpoint, setEndpoint] = useState(currentEndpoint)
  const [customEndpoint, setCustomEndpoint] = useState("")

  const handleSave = () => {
    try {
      // Validate the endpoint URL
      new URL(endpoint)

      // Save the endpoint
      onEndpointChange(endpoint)
      setOpen(false)

      toast({
        title: "RPC Endpoint Updated",
        description: "The RPC endpoint has been updated. Please refresh the page for changes to take effect.",
      })
    } catch (error) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL for the RPC endpoint",
        variant: "destructive",
      })
    }
  }

  const handleSelectEndpoint = (endpoint: string) => {
    setEndpoint(endpoint)
    setCustomEndpoint("")
  }

  const handleCustomEndpointChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomEndpoint(e.target.value)
    setEndpoint(e.target.value)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Configure RPC Endpoint</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configure RPC Endpoint</DialogTitle>
          <DialogDescription>Select a predefined RPC endpoint or enter a custom one.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Predefined Endpoints</Label>
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant={endpoint === SOLANA_RPC_ENDPOINTS.mainnet ? "default" : "outline"}
                onClick={() => handleSelectEndpoint(SOLANA_RPC_ENDPOINTS.mainnet)}
                className="justify-start"
              >
                Mainnet
              </Button>
              <Button
                variant={endpoint === SOLANA_RPC_ENDPOINTS.devnet ? "default" : "outline"}
                onClick={() => handleSelectEndpoint(SOLANA_RPC_ENDPOINTS.devnet)}
                className="justify-start"
              >
                Devnet
              </Button>
              <Button
                variant={endpoint === SOLANA_RPC_ENDPOINTS.testnet ? "default" : "outline"}
                onClick={() => handleSelectEndpoint(SOLANA_RPC_ENDPOINTS.testnet)}
                className="justify-start"
              >
                Testnet
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="custom-endpoint">Custom Endpoint</Label>
            <Input
              id="custom-endpoint"
              placeholder="https://..."
              value={customEndpoint}
              onChange={handleCustomEndpointChange}
            />
          </div>
          <div className="space-y-2">
            <Label>Current Endpoint</Label>
            <div className="bg-muted p-2 rounded-md text-sm font-mono break-all">{endpoint}</div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
