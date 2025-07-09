"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Loader2 } from "lucide-react"

export default function QuickInitPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [questCount, setQuestCount] = useState(0)

  const initializeQuests = async () => {
    setStatus('loading')
    setMessage('Initializing unique quests...')

    try {
      // Use admin wallet address directly
      const adminWallet = "6nHPbBNxh31qpKfLrs3WzzDGkDjmQYQGuVsh9qB7VLBQ"
      
      const response = await fetch('/api/admin/init-unique-quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: adminWallet })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setStatus('success')
        setMessage(result.message)
        setQuestCount(result.quests?.length || 0)
      } else {
        setStatus('error')
        setMessage(result.error || 'Failed to initialize quests')
      }
    } catch (error) {
      setStatus('error')
      setMessage('Network error: Failed to initialize quests')
    }
  }

  const checkQuestStatus = async () => {
    try {
      const adminWallet = "6nHPbBNxh31qpKfLrs3WzzDGkDjmQYQGuVsh9qB7VLBQ"
      const response = await fetch(`/api/admin/init-unique-quests?wallet=${adminWallet}`)
      const result = await response.json()
      
      if (result.success) {
        setQuestCount(result.questCount || 0)
        if (result.questCount > 0) {
          setStatus('success')
          setMessage(`Found ${result.questCount} existing quests`)
        }
      }
    } catch (error) {
      console.error('Error checking quest status:', error)
    }
  }

  useEffect(() => {
    checkQuestStatus()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center">
      <Card className="w-full max-w-lg mx-auto bg-gray-800/50 border-gray-700">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl text-white">
            Quest System <span className="text-blue-400">Initialization</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Status Display */}
          <div className="text-center">
            {status === 'idle' && questCount === 0 && (
              <div className="space-y-2">
                <div className="text-gray-400">No quests found in the system</div>
                <div className="text-sm text-gray-500">Click below to initialize unique quests</div>
              </div>
            )}
            
            {status === 'loading' && (
              <div className="flex items-center justify-center gap-2 text-blue-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{message}</span>
              </div>
            )}
            
            {status === 'success' && (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-green-400">
                  <CheckCircle className="w-6 h-6" />
                  <span className="font-semibold">Success!</span>
                </div>
                <div className="text-white">{message}</div>
                <div className="text-sm text-gray-400">
                  {questCount} unique quests are now available
                </div>
              </div>
            )}
            
            {status === 'error' && (
              <div className="text-red-400">
                <div className="font-semibold">Error</div>
                <div className="text-sm">{message}</div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {questCount === 0 && status !== 'success' && (
              <Button 
                onClick={initializeQuests}
                disabled={status === 'loading'}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
                size="lg"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  'Initialize Unique Quests'
                )}
              </Button>
            )}
            
            <Button 
              onClick={checkQuestStatus}
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Check Quest Status
            </Button>
            
            {status === 'success' && (
              <Button 
                onClick={() => window.location.href = '/quests'}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                Go to Quests Page
              </Button>
            )}
          </div>

          {/* Quest List Preview */}
          {status === 'success' && (
            <div className="bg-gray-700/30 rounded-lg p-4">
              <div className="text-sm font-semibold text-gray-300 mb-2">Initialized Quests:</div>
              <div className="space-y-1 text-xs text-gray-400">
                <div>• Connect Discord (100 XP)</div>
                <div>• Refer 3 Friends (500 XP)</div>
                <div>• Share on Twitter (150 XP)</div>
                <div>• Play Mini-Game Challenge (200 XP)</div>
                <div>• Join Community Call (250 XP)</div>
                <div>• Complete Login Streak (300 XP)</div>
              </div>
            </div>
          )}

          <div className="text-center text-xs text-gray-500">
            Admin wallet: 6nHPbBNxh31qpKfLrs3WzzDGkDjmQYQGuVsh9qB7VLBQ
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
