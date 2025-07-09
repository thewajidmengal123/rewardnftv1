"use client"

import { useState, useEffect } from "react"
import { getWebSocketService } from "@/services/websocket-service"

// Types for real-time analytics data
export interface RealTimeMetrics {
  activeUsers: number
  mintingInProgress: number
  questsInProgress: number
  recentTransactions: Array<{
    id: string
    type: string
    amount: number
    timestamp: number
    status: "pending" | "completed" | "failed"
  }>
}

// Initial state for real-time metrics
const initialMetrics: RealTimeMetrics = {
  activeUsers: 0,
  mintingInProgress: 0,
  questsInProgress: 0,
  recentTransactions: [],
}

// Hook for real-time analytics
export function useRealTimeAnalytics() {
  const [connected, setConnected] = useState(false)
  const [metrics, setMetrics] = useState<RealTimeMetrics>(initialMetrics)

  useEffect(() => {
    const websocketService = getWebSocketService()

    // Connect to WebSocket server
    websocketService
      .connect()
      .then(() => {
        setConnected(true)
      })
      .catch((error) => {
        console.error("Failed to connect to WebSocket server:", error)
      })

    // Subscribe to metrics updates
    const unsubscribeMetrics = websocketService.subscribe("metrics", (data) => {
      setMetrics((prevMetrics) => ({
        ...prevMetrics,
        ...data,
      }))
    })

    // Subscribe to active users updates
    const unsubscribeActiveUsers = websocketService.subscribe("activeUsers", (data) => {
      setMetrics((prevMetrics) => ({
        ...prevMetrics,
        activeUsers: data,
      }))
    })

    // Subscribe to minting updates
    const unsubscribeMinting = websocketService.subscribe("minting", (data) => {
      setMetrics((prevMetrics) => ({
        ...prevMetrics,
        mintingInProgress: data,
      }))
    })

    // Subscribe to quests updates
    const unsubscribeQuests = websocketService.subscribe("quests", (data) => {
      setMetrics((prevMetrics) => ({
        ...prevMetrics,
        questsInProgress: data,
      }))
    })

    // Subscribe to transaction updates
    const unsubscribeTransactions = websocketService.subscribe("transactions", (data) => {
      setMetrics((prevMetrics) => ({
        ...prevMetrics,
        recentTransactions: [data, ...prevMetrics.recentTransactions].slice(0, 10),
      }))
    })

    // Simulate real-time data for development
    if (process.env.NODE_ENV === "development") {
      const simulateData = () => {
        // Simulate active users
        setMetrics((prevMetrics) => ({
          ...prevMetrics,
          activeUsers: Math.floor(Math.random() * 50) + 100,
          mintingInProgress: Math.floor(Math.random() * 10),
          questsInProgress: Math.floor(Math.random() * 20),
          recentTransactions: [
            {
              id: Math.random().toString(36).substring(2, 15),
              type: ["mint", "quest", "referral"][Math.floor(Math.random() * 3)],
              amount: Math.floor(Math.random() * 100),
              timestamp: Date.now(),
              status: ["pending", "completed", "failed"][Math.floor(Math.random() * 3)] as any,
            },
            ...prevMetrics.recentTransactions,
          ].slice(0, 10),
        }))
      }

      const interval = setInterval(simulateData, 3000)
      return () => {
        clearInterval(interval)
        unsubscribeMetrics()
        unsubscribeActiveUsers()
        unsubscribeMinting()
        unsubscribeQuests()
        unsubscribeTransactions()
        websocketService.disconnect()
      }
    }

    return () => {
      unsubscribeMetrics()
      unsubscribeActiveUsers()
      unsubscribeMinting()
      unsubscribeQuests()
      unsubscribeTransactions()
      websocketService.disconnect()
    }
  }, [])

  return { connected, metrics }
}
