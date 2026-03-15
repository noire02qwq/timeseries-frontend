import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { ScrollArea } from './ui/scroll-area'
import {
  X,
  Terminal,
  Wifi,
  WifiOff,
  AlertCircle,
  Trash2,
  Download,
  Pause,
  Play,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { wsService, WS_STATES, MSG_TYPES } from '../services/websocket'

// Log level colors
const LOG_LEVEL_COLORS = {
  debug: 'text-gray-400',
  info: 'text-blue-400',
  success: 'text-green-400',
  warning: 'text-yellow-400',
  error: 'text-red-400',
  critical: 'text-red-500 font-bold',
}

// Connection status badge
const ConnectionBadge = ({ state }) => {
  const configs = {
    [WS_STATES.CONNECTED]: { variant: 'success', icon: Wifi, text: 'Connected' },
    [WS_STATES.CONNECTING]: { variant: 'warning', icon: Wifi, text: 'Connecting...' },
    [WS_STATES.RECONNECTING]: { variant: 'warning', icon: Wifi, text: 'Reconnecting...' },
    [WS_STATES.DISCONNECTED]: { variant: 'secondary', icon: WifiOff, text: 'Disconnected' },
    [WS_STATES.ERROR]: { variant: 'destructive', icon: AlertCircle, text: 'Error' },
  }

  const config = configs[state] || configs[WS_STATES.DISCONNECTED]
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="w-3 h-3" />
      {config.text}
    </Badge>
  )
}

// Individual log entry component
const LogEntry = ({ log, index }) => {
  const { type, payload, timestamp } = log
  const time = new Date(timestamp).toLocaleTimeString()

  // Extract log level and message
  let level = 'info'
  let message = ''
  let source = ''

  if (typeof payload === 'string') {
    message = payload
    if (payload.includes('ERROR') || payload.includes('Error')) level = 'error'
    else if (payload.includes('WARN')) level = 'warning'
    else if (payload.includes('DEBUG')) level = 'debug'
    else if (payload.includes('SUCCESS') || payload.includes('completed')) level = 'success'
  } else if (payload && typeof payload === 'object') {
    level = payload.level || 'info'
    message = payload.message || payload.log || JSON.stringify(payload)
    source = payload.source || payload.module || ''
  }

  const levelColor = LOG_LEVEL_COLORS[level] || LOG_LEVEL_COLORS.info

  return (
    <div className="font-mono text-sm py-0.5 hover:bg-white/5 transition-colors">
      <span className="text-gray-500 text-xs">[{time}]</span>
      {source && <span className="text-gray-400 text-xs ml-2">[{source}]</span>}
      <span className={`ml-2 ${levelColor}`}>{message}</span>
    </div>
  )
}

// Main LogModal component
export function LogModal({
  isOpen,
  onClose,
  jobId,
  jobType = 'train',
  title = 'Training Logs',
  autoConnect = true,
}) {
  const [logs, setLogs] = useState([])
  const [connectionState, setConnectionState] = useState(WS_STATES.DISCONNECTED)
  const [isPaused, setIsPaused] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [hasError, setHasError] = useState(null)
  const scrollRef = useRef(null)
  const logsEndRef = useRef(null)

  // Scroll to bottom when new logs arrive
  const scrollToBottom = useCallback(() => {
    if (logsEndRef.current && !isPaused) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [isPaused])

  // Handle state changes
  useEffect(() => {
    const unsubscribe = wsService.onStateChange((newState) => {
      setConnectionState(newState)

      if (newState === WS_STATES.ERROR) {
        setHasError('Connection error occurred')
      }
    })

    return unsubscribe
  }, [])

  // Handle incoming logs
  useEffect(() => {
    if (!isOpen) return

    // Handle all message types
    const unsubscribeAll = wsService.on('all', (type, payload, timestamp) => {
      if (!isPaused) {
        setLogs((prev) => {
          const newLogs = [...prev, { type, payload, timestamp }]
          // Keep only last 1000 logs to prevent memory issues
          if (newLogs.length > 1000) {
            return newLogs.slice(-1000)
          }
          return newLogs
        })
      }
    })

    return () => {
      unsubscribeAll()
    }
  }, [isOpen, isPaused])

  // Auto-scroll when logs update
  useEffect(() => {
    scrollToBottom()
  }, [logs, scrollToBottom])

  // Connect on open
  useEffect(() => {
    if (isOpen && autoConnect && jobId) {
      connect()
    }

    return () => {
      if (!isOpen) {
        disconnect()
      }
    }
  }, [isOpen, jobId, jobType])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [])

  const connect = async () => {
    try {
      setHasError(null)
      await wsService.connect(jobId, jobType)
    } catch (error) {
      setHasError(error.message)
    }
  }

  const disconnect = () => {
    wsService.disconnect()
    setLogs([])
  }

  const clearLogs = () => {
    setLogs([])
  }

  const downloadLogs = () => {
    const logText = logs
      .map((log) => {
        const time = new Date(log.timestamp).toISOString()
        const message =
          typeof log.payload === 'string'
            ? log.payload
            : JSON.stringify(log.payload)
        return `[${time}] [${log.type.toUpperCase()}] ${message}`
      })
      .join('\n')

    const blob = new Blob([logText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs_${jobType}_${jobId}_${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ${
        isMinimized
          ? 'bottom-4 right-4 w-80'
          : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] max-w-[90vw]'
      }`}
    >
      <Card className="border border-border/50 shadow-2xl bg-card/95 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Terminal className="w-4 h-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{title}</CardTitle>
                <div className="flex items-center gap-2 mt-0.5">
                  <ConnectionBadge state={connectionState} />
                  {jobId && (
                    <span className="text-xs text-muted-foreground font-mono">
                      Job: {jobId.slice(0, 8)}...
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!isMinimized && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setIsPaused(!isPaused)}
                    title={isPaused ? 'Resume' : 'Pause'}
                  >
                    {isPaused ? (
                      <Play className="w-4 h-4" />
                    ) : (
                      <Pause className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={clearLogs}
                    title="Clear logs"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={downloadLogs}
                    title="Download logs"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Maximize' : 'Minimize'}
              >
                {isMinimized ? (
                  <Maximize2 className="w-4 h-4" />
                ) : (
                  <Minimize2 className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  disconnect()
                  onClose()
                }}
                title="Close"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="pt-0">
            {hasError && (
              <div className="mb-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{hasError}</span>
              </div>
            )}

            <div className="relative rounded-lg border border-border bg-black/50">
              <ScrollArea className="h-[400px] w-full" ref={scrollRef}>
                <div className="p-4 font-mono text-sm">
                  {logs.length === 0 ? (
                    <div className="text-muted-foreground text-center py-8">
                      {connectionState === WS_STATES.CONNECTED
                        ? 'Connected. Waiting for logs...'
                        : connectionState === WS_STATES.CONNECTING
                          ? 'Connecting to log stream...'
                          : 'Not connected. Start a job to view logs.'}
                    </div>
                  ) : (
                    logs.map((log, index) => (
                      <LogEntry key={`${log.timestamp}-${index}`} log={log} index={index} />
                    ))
                  )}
                  <div ref={logsEndRef} />
                </div>
              </ScrollArea>

              {isPaused && (
                <div className="absolute bottom-4 right-4">
                  <Badge variant="warning" className="gap-1">
                    <Pause className="w-3 h-3" />
                    Paused
                  </Badge>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
              <span>{logs.length} log entries</span>
              <span>
                {connectionState === WS_STATES.CONNECTED
                  ? 'Live streaming'
                  : connectionState === WS_STATES.RECONNECTING
                    ? 'Reconnecting...'
                    : 'Disconnected'}
              </span>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

export default LogModal