import { useEffect, useState, useRef } from 'react'
import {
  Square,
  RotateCcw,
  Terminal,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Check,
  TrendingDown,
  RefreshCw
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { ScrollArea } from './ui/scroll-area'
import { useWorkflowStore, WORKFLOW_STEPS } from '../store/workflowStore'
import { trainApi, tuneApi, outputApi } from '../services/api'

const STATUS_CONFIG = {
  idle: { label: 'Idle', color: 'bg-gray-500', icon: Clock },
  pending: { label: 'Pending', color: 'bg-yellow-500', icon: Loader2 },
  running: { label: 'Running', color: 'bg-blue-500', icon: Activity },
  completed: { label: 'Completed', color: 'bg-green-500', icon: CheckCircle },
  failed: { label: 'Failed', color: 'bg-red-500', icon: XCircle },
  stopped: { label: 'Stopped', color: 'bg-orange-500', icon: Square }
}

export function TrainingMonitor() {
  const { trainingMode, training, tuning, setTraining, setTuning, setCurrentStep } =
    useWorkflowStore()

  const isTuning = trainingMode === 'autotune'
  const activeJob = isTuning ? tuning : training

  const [logs, setLogs] = useState([])
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('idle')
  const [isStopping, setIsStopping] = useState(false)
  const [lossHistory, setLossHistory] = useState([])
  const [lossColumns, setLossColumns] = useState([])
  const [lossLoading, setLossLoading] = useState(false)
  const lossPollRef = useRef(null)

  // Poll for status updates
  useEffect(() => {
    if (!activeJob.jobId) return

    const pollInterval = setInterval(async () => {
      try {
        const api = isTuning ? tuneApi : trainApi
        const response = await api.getStatus(activeJob.jobId)
        const data = response.data

        // Update local state
        setStatus(data.status)
        setProgress(data.progress || 0)
        if (data.logs && data.logs.length > 0) {
          setLogs(data.logs)
        }

        // Update store
        if (isTuning) {
          setTuning({
            status: data.status,
            progress: data.progress,
            logs: data.logs,
            result: data.result,
            error: data.error
          })
        } else {
          setTraining({
            status: data.status,
            progress: data.progress,
            logs: data.logs,
            result: data.result,
            error: data.error
          })
        }

        // Handle completion
        if (['completed', 'failed', 'stopped'].includes(data.status)) {
          clearInterval(pollInterval)
        }
      } catch (err) {
        console.error('Failed to poll status:', err)
      }
    }, 2000)

    return () => clearInterval(pollInterval)
  }, [activeJob.jobId, isTuning, setTraining, setTuning])

  // Poll loss history
  useEffect(() => {
    if (!activeJob.jobId || activeJob.status === 'idle') {
      setLossHistory([])
      setLossColumns([])
      return
    }

    const fetchLoss = async () => {
      try {
        const response = await outputApi.getLossHistory(activeJob.jobId)
        if (response.data?.lossHistory) {
          setLossHistory(response.data.lossHistory)
          setLossColumns(response.data.columns || [])
        }
      } catch (err) {
        if (err.status !== 404) {
          console.error('Failed to fetch loss history:', err)
        }
      }
    }

    fetchLoss()

    if (activeJob.status === 'running' || activeJob.status === 'pending') {
      lossPollRef.current = setInterval(fetchLoss, 5000)
    }

    return () => {
      if (lossPollRef.current) {
        clearInterval(lossPollRef.current)
        lossPollRef.current = null
      }
    }
  }, [activeJob.jobId, activeJob.status])

  const handleStop = async () => {
    if (!activeJob.jobId) return
    try {
      setIsStopping(true)
      const api = isTuning ? tuneApi : trainApi
      await api.stop(activeJob.jobId)
      setStatus('stopped')
    } catch (err) {
      console.error('Failed to stop:', err)
    } finally {
      setIsStopping(false)
    }
  }

  const handleViewResults = () => {
    setCurrentStep(WORKFLOW_STEPS.RESULTS)
  }

  const handleReset = () => {
    setLogs([])
    setProgress(0)
    setStatus('idle')
    setLossHistory([])
    setLossColumns([])
  }

  const handleRefreshLoss = async () => {
    if (!activeJob.jobId) return
    setLossLoading(true)
    try {
      const response = await outputApi.getLossHistory(activeJob.jobId)
      if (response.data?.lossHistory) {
        setLossHistory(response.data.lossHistory)
        setLossColumns(response.data.columns || [])
      }
    } catch (err) {
      console.error('Failed to refresh loss:', err)
    } finally {
      setLossLoading(false)
    }
  }

  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.idle
  const StatusIcon = statusConfig.icon

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Training Status
            </span>
            <Badge className={statusConfig.color}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress.toFixed(1)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="flex gap-2">
            {status === 'running' || status === 'pending' ? (
              <Button variant="destructive" onClick={handleStop} disabled={isStopping} className="gap-2">
                {isStopping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
                Stop
              </Button>
            ) : status === 'completed' ? (
              <Button onClick={handleViewResults} className="gap-2">
                <Check className="w-4 h-4" />
                View Results
              </Button>
            ) : null}

            {['completed', 'failed', 'stopped'].includes(status) && (
              <Button variant="outline" onClick={handleReset} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Training Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            Training Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64 w-full rounded-md border">
            <div className="p-4 space-y-1 font-mono text-sm">
              {logs.length === 0 ? (
                <p className="text-muted-foreground">No logs yet...</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="text-foreground">{log}</div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Loss Curve */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              Training Loss Curve
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshLoss}
              disabled={lossLoading || !activeJob.jobId}
              className="gap-1"
            >
              <RefreshCw className={`w-4 h-4 ${lossLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lossHistory.length === 0 ? (
            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
              {lossLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading...
                </div>
              ) : (
                <p>No loss data yet. Click Refresh after training starts.</p>
              )}
            </div>
          ) : (
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lossHistory} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="epoch"
                    stroke="hsl(199, 89%, 60%)"
                    tick={{ fill: 'hsl(199, 89%, 60%)', fontSize: 12 }}
                    label={{ value: 'Epoch', position: 'insideBottom', offset: -5, fill: 'hsl(199, 89%, 60%)' }}
                  />
                  <YAxis
                    stroke="hsl(199, 89%, 60%)"
                    tick={{ fill: 'hsl(199, 89%, 60%)', fontSize: 12 }}
                    label={{ value: 'Loss', angle: -90, position: 'insideLeft', fill: 'hsl(199, 89%, 60%)' }}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Legend />
                  {lossColumns.includes('train_loss') && (
                    <Line type="monotone" dataKey="train_loss" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={false} name="Train Loss" />
                  )}
                  {lossColumns.includes('val_loss') && (
                    <Line type="monotone" dataKey="val_loss" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={false} name="Val Loss" strokeDasharray="5 5" />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
