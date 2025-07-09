// WebSocket service for real-time analytics
export class WebSocketService {
  private socket: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private listeners: Map<string, Set<(data: any) => void>> = new Map()
  private url: string

  constructor(url: string) {
    this.url = url
  }

  // Connect to WebSocket server
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(this.url)

        this.socket.onopen = () => {
          console.log("WebSocket connected")
          this.reconnectAttempts = 0
          resolve()
        }

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            const { type, payload } = data

            if (this.listeners.has(type)) {
              const typeListeners = this.listeners.get(type)
              if (typeListeners) {
                typeListeners.forEach((listener) => {
                  try {
                    listener(payload)
                  } catch (error) {
                    console.error(`Error in listener for type ${type}:`, error)
                  }
                })
              }
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error)
          }
        }

        this.socket.onclose = (event) => {
          console.log(`WebSocket closed: ${event.code} ${event.reason}`)
          this.socket = null

          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
            console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)
            setTimeout(() => this.connect(), delay)
          }
        }

        this.socket.onerror = (error) => {
          console.error("WebSocket error:", error)
          reject(error)
        }
      } catch (error) {
        console.error("Error creating WebSocket:", error)
        reject(error)
      }
    })
  }

  // Disconnect from WebSocket server
  disconnect(): void {
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }

  // Send data to WebSocket server
  send(type: string, payload: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, payload }))
    } else {
      console.error("WebSocket not connected")
    }
  }

  // Subscribe to a specific event type
  subscribe(type: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }

    const typeListeners = this.listeners.get(type)
    if (typeListeners) {
      typeListeners.add(callback)
    }

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(type)
      if (listeners) {
        listeners.delete(callback)
        if (listeners.size === 0) {
          this.listeners.delete(type)
        }
      }
    }
  }

  // Check if WebSocket is connected
  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN
  }
}

// Create a singleton instance for the app
let websocketService: WebSocketService | null = null

// Get the WebSocket service instance
export function getWebSocketService(): WebSocketService {
  if (!websocketService) {
    // Use a mock WebSocket URL for development
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "wss://echo.websocket.org"
    websocketService = new WebSocketService(wsUrl)
  }
  return websocketService
}
