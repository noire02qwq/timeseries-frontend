import { useState, useMemo } from 'react'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import {
  Activity,
  CheckCircle2,
  TrendingDown,
  Eye,
  ChevronDown
} from 'lucide-react'

// Mock training data for demo
const generateMockTrainingData = () => {
  const data = []
  for (let i = 1; i <= 200; i++) {
    data.push({
      epoch: i,
      trainLoss: 0.5 * Math.exp(-i / 50) + 0.08 + Math.random() * 0.02,
      valLoss: 0.55 * Math.exp(-i / 55) + 0.12 + Math.random() * 0.03
    })
  }
  return data
}

const MOCK_TRIALS = [
  { id: 1, bestEpoch: 87, bestValLoss: 0.1823, trainLoss: 0.1234, completed: true },
  { id: 2, bestEpoch: 92, bestValLoss: 0.1756, trainLoss: 0.1189, completed: true },
  { id: 3, bestEpoch: 78, bestValLoss: 0.1912, trainLoss: 0.1345, completed: true },
  { id: 4, bestEpoch: 95, bestValLoss: 0.1698, trainLoss: 0.1156, completed: true, isBest: true },
  { id: 5, bestEpoch: 0, bestValLoss: null, trainLoss: null, completed: false }
]

export function TrainingMonitor({ mode = 'manual' }) {
  const trainingData = useMemo(() => generateMockTrainingData(), [])

  // Current progress state
  const currentEpoch = 156
  const maxEpochs = 500
  const epochProgress = (currentEpoch / maxEpochs) * 100

  // Trial state for autotune
  const currentTrial = 5
  const maxTrials = 10
  const trialProgress = (currentTrial / maxTrials) * 100

  // Show button state - only show charts on demand
  const [showCharts, setShowCharts] = useState(false)
  const [selectedTrial, setSelectedTrial] = useState(currentTrial)

  // Current training losses
  const currentTrainLoss = trainingData[currentEpoch - 1]?.trainLoss?.toFixed(4) || 'N/A'
  const currentValLoss = trainingData[currentEpoch - 1]?.valLoss?.toFixed(4) || 'N/A'

  // Best losses
  const bestValLossEntry = useMemo(() => {
    const slice = trainingData.slice(0, currentEpoch)
    return slice.reduce(
      (best, entry) => (entry.valLoss < best.valLoss ? entry : best),
      slice[0]
    )
  }, [trainingData, currentEpoch])

  // Convergence detection
  const isConverging = useMemo(() => {
    if (currentEpoch < 20) return false
    const recent = trainingData.slice(currentEpoch - 20, currentEpoch)
    const avgRecent = recent.reduce((sum, d) => sum + d.valLoss, 0) / recent.length
    const earlier = trainingData.slice(currentEpoch - 40, currentEpoch - 20)
    if (earlier.length === 0) return false
    const avgEarlier = earlier.reduce((sum, d) => sum + d.valLoss, 0) / earlier.length
    return Math.abs(avgRecent - avgEarlier) < 0.005
  }, [trainingData, currentEpoch])

  // Chart data up to current epoch
  const chartData = useMemo(() => {
    if (!showCharts) return []
    return trainingData.slice(0, currentEpoch)
  }, [trainingData, currentEpoch, showCharts])

  return (
    <div className="space-y-6">
      {/* Progress Bars */}
      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            Training Progress
          </CardTitle>
          <CardDescription>
            {mode === 'manual' ? 'Manual training progress' : 'Autotune optimization progress'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Trial Progress (Autotune only) */}
          {mode === 'autotune' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Trial Progress</span>
                <span className="font-mono font-medium">
                  {currentTrial} / {maxTrials} trials
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-3">
                <div
                  className="bg-yellow-500 h-3 rounded-full transition-all"
                  style={{ width: `${trialProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Epoch Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Epoch Progress</span>
              <span className="font-mono font-medium">
                {currentEpoch} / {maxEpochs} ({epochProgress.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-3">
              <div
                className="bg-primary h-3 rounded-full transition-all"
                style={{ width: `${epochProgress}%` }}
              />
            </div>
          </div>

          {/* Current & Best Losses */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Current Epoch {currentEpoch}</p>
              <div className="flex justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Train Loss</p>
                  <p className="text-lg font-mono font-bold text-blue-400">{currentTrainLoss}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Val Loss</p>
                  <p className="text-lg font-mono font-bold text-yellow-400">{currentValLoss}</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
              <p className="text-xs text-muted-foreground mb-1">
                Best Epoch {bestValLossEntry?.epoch}
              </p>
              <div className="flex justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Train Loss</p>
                  <p className="text-lg font-mono font-bold text-blue-400">
                    {bestValLossEntry?.trainLoss?.toFixed(4)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Val Loss</p>
                  <p className="text-lg font-mono font-bold text-green-400">
                    {bestValLossEntry?.valLoss?.toFixed(4)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Convergence Indicator */}
          <div
            className={`flex items-center gap-2 p-3 rounded-lg border ${
              isConverging
                ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                : 'bg-green-500/10 border-green-500/30 text-green-400'
            }`}
          >
            {isConverging ? (
              <>
                <TrendingDown className="w-4 h-4" />
                <span className="text-sm">Training appears to be converging</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm">Training is progressing normally</span>
              </>
            )}
          </div>

          {/* Show Button */}
          <div className="flex items-center justify-between">
            {mode === 'autotune' && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">View Trial:</label>
                <select
                  value={selectedTrial}
                  onChange={(e) => setSelectedTrial(Number(e.target.value))}
                  className="bg-secondary border border-border rounded-md px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {MOCK_TRIALS.map((trial) => (
                    <option key={trial.id} value={trial.id}>
                      Trial #{trial.id}
                      {trial.isBest ? ' ★ Best' : ''}
                      {trial.bestValLoss ? ` — Val Loss: ${trial.bestValLoss.toFixed(4)}` : ' — In Progress'}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Button onClick={() => setShowCharts(true)} className="ml-auto">
              <Eye className="w-4 h-4 mr-2" />
              Show Loss Curves
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loss Curves Chart - only shown after clicking Show */}
      {showCharts && (
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-6 h-6 text-primary" />
              Loss Curves
              {mode === 'autotune' && (
                <Badge variant="outline" className="ml-2">
                  Trial #{selectedTrial}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Snapshot at epoch {currentEpoch} — Click Show again to refresh
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="epoch"
                    stroke="hsl(199, 89%, 60%)"
                    tick={{ fill: 'hsl(199, 89%, 60%)', fontSize: 12 }}
                    label={{
                      value: 'Epoch',
                      position: 'insideBottomRight',
                      offset: -5,
                      fill: 'hsl(199, 89%, 60%)'
                    }}
                  />
                  <YAxis
                    stroke="hsl(199, 89%, 60%)"
                    tick={{ fill: 'hsl(199, 89%, 60%)', fontSize: 12 }}
                    label={{
                      value: 'Loss',
                      angle: -90,
                      position: 'insideLeft',
                      fill: 'hsl(199, 89%, 60%)'
                    }}
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
                  <Line
                    type="monotone"
                    dataKey="trainLoss"
                    stroke="hsl(217, 91%, 60%)"
                    strokeWidth={2}
                    dot={false}
                    name="Train Loss"
                  />
                  <Line
                    type="monotone"
                    dataKey="valLoss"
                    stroke="hsl(45, 93%, 47%)"
                    strokeWidth={2}
                    dot={false}
                    name="Validation Loss"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
