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
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Play, 
  Pause,
  BarChart3,
  TrendingDown
} from 'lucide-react'

// Mock training data for demo
const generateMockTrainingData = () => {
  const epochs = 100
  const data = []
  for (let i = 1; i <= epochs; i++) {
    const trainLoss = 2.5 * Math.exp(-i / 30) + 0.1 + Math.random() * 0.05
    const valLoss = 2.5 * Math.exp(-i / 35) + 0.15 + Math.random() * 0.08
    data.push({
      epoch: i,
      trainLoss: parseFloat(trainLoss.toFixed(4)),
      valLoss: parseFloat(valLoss.toFixed(4))
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

export function TrainingMonitor({ mode = 'single' }) {
  const [trainingData] = useState(generateMockTrainingData)
  const [currentEpoch, setCurrentEpoch] = useState(75)
  const [maxEpochs] = useState(100)
  const [isTraining] = useState(true)
  const [selectedTrial, setSelectedTrial] = useState(4)
  const [currentTrial, setCurrentTrial] = useState(5)
  const [totalTrials] = useState(10)
  
  // Find best epoch (lowest validation loss)
  const bestEpoch = useMemo(() => {
    if (trainingData.length === 0) return null
    const dataUpToNow = trainingData.slice(0, currentEpoch)
    return dataUpToNow.reduce((best, current) => 
      current.valLoss < best.valLoss ? current : best
    , dataUpToNow[0])
  }, [trainingData, currentEpoch])
  
  // Current epoch losses
  const currentLosses = trainingData[currentEpoch - 1] || { trainLoss: 0, valLoss: 0 }
  
  // Check convergence (val loss not improving for 10+ epochs)
  const isConverged = useMemo(() => {
    if (currentEpoch < 20) return false
    const recentData = trainingData.slice(currentEpoch - 10, currentEpoch)
    const minRecent = Math.min(...recentData.map(d => d.valLoss))
    const oldData = trainingData.slice(0, currentEpoch - 10)
    const minOld = Math.min(...oldData.map(d => d.valLoss))
    return minRecent >= minOld * 0.99
  }, [trainingData, currentEpoch])
  
  const epochProgress = (currentEpoch / maxEpochs) * 100
  const trialProgress = (currentTrial / totalTrials) * 100
  
  const viewData = trainingData.slice(0, currentEpoch)
  const completedTrials = MOCK_TRIALS.filter(t => t.completed)

  return (
    <div className="space-y-6">
      {/* Autotune Mode: Trial Progress */}
      {mode === 'autotune' && (
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              Bayesian Optimization Progress
            </CardTitle>
            <CardDescription>
              Trial {currentTrial} of {totalTrials}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Trial Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Trial Progress</span>
                <span className="text-primary">{currentTrial}/{totalTrials}</span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-300"
                  style={{ width: `${trialProgress}%` }}
                />
              </div>
            </div>
            
            {/* Trial Selector */}
            <div className="space-y-2">
              <Label>View Past Trial</Label>
              <div className="flex flex-wrap gap-2">
                {completedTrials.map(trial => (
                  <button
                    key={trial.id}
                    onClick={() => setSelectedTrial(trial.id)}
                    className={`
                      px-3 py-1.5 text-sm rounded-lg border transition-all
                      ${selectedTrial === trial.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:border-primary/50'
                      }
                      ${trial.isBest ? 'ring-2 ring-yellow-500/50' : ''}
                    `}
                  >
                    Trial {trial.id}
                    {trial.isBest && <span className="ml-1 text-yellow-500">★</span>}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Epoch Progress */}
      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            Training Progress
            {isTraining ? (
              <Badge variant="default" className="ml-2">
                <Play className="w-3 h-3 mr-1" />
                Training
              </Badge>
            ) : (
              <Badge variant="secondary" className="ml-2">
                <Pause className="w-3 h-3 mr-1" />
                Paused
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Epoch {currentEpoch} of {maxEpochs}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Epoch Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Epoch Progress</span>
              <span className="text-primary">{epochProgress.toFixed(1)}%</span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-blue-400 transition-all duration-300"
                style={{ width: `${epochProgress}%` }}
              />
            </div>
          </div>
          
          {/* Demo Controls */}
          <div className="space-y-2">
            <Label>Simulate Epoch (Demo)</Label>
            <Input
              type="range"
              min={1}
              max={maxEpochs}
              value={currentEpoch}
              onChange={(e) => setCurrentEpoch(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          
          {/* Loss Values Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Epoch */}
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="text-sm text-muted-foreground mb-2">Current Epoch {currentEpoch}</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Train Loss</div>
                  <div className="text-xl font-bold text-blue-500">{currentLosses.trainLoss}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Val Loss</div>
                  <div className="text-xl font-bold text-orange-500">{currentLosses.valLoss}</div>
                </div>
              </div>
            </div>
            
            {/* Best Epoch */}
            {bestEpoch && (
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                <div className="text-sm text-green-500 mb-2 flex items-center gap-1">
                  <TrendingDown className="w-4 h-4" />
                  Best Epoch {bestEpoch.epoch}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Train Loss</div>
                    <div className="text-xl font-bold text-blue-500">{bestEpoch.trainLoss}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Val Loss</div>
                    <div className="text-xl font-bold text-green-500">{bestEpoch.valLoss}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Convergence Indicator */}
          <div className={`
            p-4 rounded-lg border flex items-center gap-3
            ${isConverged 
              ? 'bg-yellow-500/10 border-yellow-500/30' 
              : 'bg-secondary/50 border-border'
            }
          `}>
            {isConverged ? (
              <>
                <CheckCircle2 className="w-6 h-6 text-yellow-500" />
                <div>
                  <div className="font-medium text-yellow-500">Training Converged</div>
                  <div className="text-sm text-muted-foreground">
                    Validation loss has stabilized. Consider early stopping.
                  </div>
                </div>
              </>
            ) : (
              <>
                <XCircle className="w-6 h-6 text-muted-foreground" />
                <div>
                  <div className="font-medium">Training in Progress</div>
                  <div className="text-sm text-muted-foreground">
                    Model is still learning. Validation loss continues to improve.
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loss Curves Chart */}
      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle>Loss Curves</CardTitle>
          <CardDescription>
            Training and validation loss over epochs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={viewData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="epoch" 
                  stroke="hsl(199, 89%, 60%)"
                  tick={{ fill: 'hsl(199, 89%, 60%)', fontSize: 12 }}
                  tickCount={5}
                />
                <YAxis 
                  stroke="hsl(199, 89%, 60%)"
                  tick={{ fill: 'hsl(199, 89%, 60%)', fontSize: 12 }}
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
                  stroke="hsl(24, 100%, 50%)"
                  strokeWidth={2}
                  dot={false}
                  name="Val Loss"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
