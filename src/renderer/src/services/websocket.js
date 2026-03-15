/**
 * WebSocket Service for Real-Time Log Streaming
 * Handles WebSocket connections for training/tuning/testing log streaming
 */

import { WS_CONFIG } from './config'

// Connection states
export const WS_STATES = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
  RECONNECTING: 'reconnecting',
}

// Message types from server
export const MSG_TYPES = {
  LOG: 'log',
  ERROR: 'error',
  INFO: 'info',
  PROGRESS: 'progress',
  COMPLETE: 'complete',
  HEARTBEAT: 'heartbeat',
}

class WebSocketService {
  constructor() {
    this.ws = null
    this.state = WS_STATES.DISCONNECTED
    this.reconnectAttempts = 0
    this.reconnectTimer = null
    this.heartbeatTimer = null
    this.messageHandlers = new Map()
    this.stateChangeCallbacks = []
    this.logBuffer = []
    this.maxBufferSize = 1000
    this.currentJobId = null
    this.currentJobType = null
  }

  // Register a message handler for a specific type
  on(type, handler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, [])
    }
    this.messageHandlers.get(type).push(handler)

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(type)
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  // Register state change callback
  onStateChange(callback) {
    this.stateChangeCallbacks.push(callback)
    return () => {
      const index = this.stateChangeCallbacks.indexOf(callback)
      if (index > -1) {
        this.stateChangeCallbacks.splice(index, 1)
      }
    }
  }

  // Update connection state
  setState(newState, error = null) {
    const oldState = this.state
    this.state = newState

    // Notify state change listeners
    this.stateChangeCallbacks.forEach((callback) => {
      try {
        callback(newState, oldState, error)
      } catch (err) {
        console.error('Error in state change callback:', err)
      }
    })
  }

  // Connect to WebSocket server
  connect(jobId, jobType = 'train') {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.warn('WebSocket already connected')
      return Promise.resolve()
    }

    this.currentJobId = jobId
    this.currentJobType = jobType
    this.setState(WS_STATES.CONNECTING)

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `${WS_CONFIG.URL}/ws/logs?jobId=${jobId}&type=${jobType}`
        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          console.log('WebSocket connected')
          this.setState(WS_STATES.CONNECTED)
          this.reconnectAttempts = 0
          this.startHeartbeat()
          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data)
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.setState(WS_STATES.ERROR, error)
          reject(error)
        }

        this.ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason)
          this.stopHeartbeat()

          if (this.state !== WS_STATES.DISCONNECTED) {
            this.setState(WS_STATES.DISCONNECTED)
            this.attemptReconnect()
          }
        }
      } catch (error) {
        console.error('Error creating WebSocket:', error)
        this.setState(WS_STATES.ERROR, error)
        reject(error)
      }
    })
  }

  // Handle incoming messages
  handleMessage(data) {
    try {
      const message = JSON.parse(data)
      const { type, payload, timestamp } = message

      // Add to buffer
      this.logBuffer.push({
        type,
        payload,
        timestamp: timestamp || new Date().toISOString(),
      })

      // Limit buffer size
      if (this.logBuffer.length > this.maxBufferSize) {
        this.logBuffer.shift()
      }

      // Call registered handlers
      const handlers = this.messageHandlers.get(type) || []
      handlers.forEach((handler) => {
        try {
          handler(payload, timestamp)
        } catch (err) {
          console.error(`Error in ${type} handler:`, err)
        }
      })

      // Also call 'all' handlers
      const allHandlers = this.messageHandlers.get('all') || []
      allHandlers.forEach((handler) => {
        try {
          handler(type, payload, timestamp)
        } catch (err) {
          console.error('Error in all handler:', err)
        }
      })
    } catch (error) {
      console.error('Error parsing WebSocket message:', error)

      // Handle non-JSON messages as plain text logs
      const handlers = this.messageHandlers.get(MSG_TYPES.LOG) || []
      handlers.forEach((handler) => {
        try {
          handler({ message: data }, new Date().toISOString())
        } catch (err) {
          console.error('Error in log handler:', err)
        }
      })
    }
  }

  // Start heartbeat to keep connection alive
  startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }))
      }
    }, WS_CONFIG.HEARTBEAT_INTERVAL)
  }

  // Stop heartbeat
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  // Attempt to reconnect
  attemptReconnect() {
    if (this.reconnectAttempts >= WS_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached')
      this.setState(WS_STATES.ERROR, new Error('Max reconnection attempts reached'))
      return
    }

    this.reconnectAttempts++
    this.setState(WS_STATES.RECONNECTING)

    console.log(`Reconnecting... attempt ${this.reconnectAttempts}/${WS_CONFIG.MAX_RECONNECT_ATTEMPTS}`)

    this.reconnectTimer = setTimeout(() => {
      if (this.currentJobId) {
        this.connect(this.currentJobId, this.currentJobType).catch((err) => {
          console.error('Reconnection failed:', err)
        })
      }
    }, WS_CONFIG.RECONNECT_INTERVAL)
  }

  // Disconnect WebSocket
  disconnect() {
    this.stopHeartbeat()

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.ws) {
      // Remove event listeners to prevent reconnection attempts
      this.ws.onclose = null
      this.ws.onerror = null
      this.ws.close()
      this.ws = null
    }

    this.setState(WS_STATES.DISCONNECTED)
    this.currentJobId = null
    this.currentJobType = null
    this.reconnectAttempts = 0
  }

  // Get current connection state
  getState() {
    return this.state
  }

  // Check if connected
  isConnected() {
    return this.state === WS_STATES.CONNECTED
  }

  // Get log buffer
  getLogBuffer() {
    return [...this.logBuffer]
  }

  // Clear log buffer
  clearLogBuffer() {
    this.logBuffer = []
  }
}

// Create singleton instance
export const wsService = new WebSocketService()

export default {
  wsService,
  WS_STATES,
  MSG_TYPES,
}