"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

export function QuestTestComponent() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testQuestAPI = async (action: string, params: any = {}) => {
    setLoading(true)
    try {
      let url = `/api/quests?action=${action}`
      
      // Add query parameters
      Object.keys(params).forEach(key => {
        if (params[key]) {
          url += `&${key}=${encodeURIComponent(params[key])}`
        }
      })

      const response = await fetch(url)
      const data = await response.json()
      
      setResult({ action, success: response.ok, data })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: `${action} completed successfully`,
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "API call failed",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Test error:", error)
      setResult({ action, success: false, error: error.message })
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const initializeQuests = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/quests/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      
      setResult({ action: "initialize", success: response.ok, data })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Quests initialized successfully",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to initialize quests",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Initialize error:", error)
      setResult({ action: "initialize", success: false, error: error.message })
      toast({
        title: "Error",
        description: "Failed to initialize quests",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Quest System Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Button 
            onClick={initializeQuests}
            disabled={loading}
            variant="outline"
          >
            Initialize Quests
          </Button>
          
          <Button 
            onClick={() => testQuestAPI("get-quests")}
            disabled={loading}
            variant="outline"
          >
            Get All Quests
          </Button>
          
          <Button 
            onClick={() => testQuestAPI("get-quests", { type: "daily" })}
            disabled={loading}
            variant="outline"
          >
            Get Daily Quests
          </Button>
          
          <Button 
            onClick={() => testQuestAPI("get-quests", { type: "weekly" })}
            disabled={loading}
            variant="outline"
          >
            Get Weekly Quests
          </Button>
        </div>

        {result && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-semibold mb-2">
              Last Test: {result.action} - {result.success ? "✅ Success" : "❌ Failed"}
            </h3>
            <pre className="text-sm overflow-auto max-h-64">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
