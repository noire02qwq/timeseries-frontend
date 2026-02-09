import { useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { 
  Trophy, 
  Target,
  TrendingUp,
  BarChart3,
  CheckCircle2
} from 'lucide-react'

// Mock metrics and predictions
const generateMockPredictions = () => {
  const data = []
  for (let i = 0; i < 100; i++) {
    const actual = Math.sin(i / 10) * 50 + 100 + (Math.random() - 0.5) * 10
    const predicted = actual + (Math.random() - 0.5) * 15
    data.push({
      index: i,
      actual: parseFloat(actual.toFixed(2)),
      predicted: parseFloat(predicted.toFixed(2)),
      error: parseFloat((predicted - actual).toFixed(2))
    })
  }
  return data
}

const MOCK_TRIALS_RESULTS = [
  { 
    id: 1, 
    r2: 0.892, mse: 12.45, mae: 2.89, rmse: 3.53,
    params: { learning_rate: 0.001, units: 128, num_layers: 4, dropout: 0.3 }
  },
  { 
    id: 2, 
    r2: 0.905, mse: 10.82, mae: 2.65, rmse: 3.29,
    params: { learning_rate: 0.0008, units: 192, num_layers: 6, dropout: 0.35 }
  },
  { 
    id: 3, 
    r2: 0.878, mse: 14.21, mae: 3.12, rmse: 3.77,
    params: { learning_rate: 0.0015, units: 96, num_layers: 3, dropout: 0.25 }
  },
  { 
    id: 4, 
    r2: 0.923, mse: 8.76, mae: 2.34, rmse: 2.96, isBest: true,
    params: { learning_rate: 0.0006, units: 256, num_layers: 8, dropout: 0.4 }
  }
]

// Available output columns for evaluation
const OUTPUT_COLUMNS = ['Temperature', 'Humidity', 'Pressure', 'WindSpeed']

export function ResultsDashboard({ mode = 'single', columnRoles = {} }) {
  const [predictions] = useState(generateMockPredictions)
  const [selectedColumn, setSelectedColumn] = useState(OUTPUT_COLUMNS[0])
  const [selectedTrial, setSelectedTrial] = useState(4)
  
  // Get available output columns from columnRoles or use mock
  const outputColumns = useMemo(() => {
    const outputs = Object.entries(columnRoles)
      .filter(([, role]) => role === 'output')
      .map(([col]) => col)
    return outputs.length > 0 ? outputs : OUTPUT_COLUMNS
  }, [columnRoles])
  
  // Get current trial data
  const currentTrialData = MOCK_TRIALS_RESULTS.find(t => t.id === selectedTrial) || MOCK_TRIALS_RESULTS[0]
  const bestTrial = MOCK_TRIALS_RESULTS.find(t => t.isBest)
  
  // Mock metrics (would come from actual training results)
  const metrics = currentTrialData

  // Scatter data for actual vs predicted
  const scatterData = predictions.map(p => ({
    x: p.actual,
    y: p.predicted
  }))

  return (
    <div className="space-y-6">
      {/* Autotune Mode: Best Trial & Trial Selection */}
      {mode === 'autotune' && (
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Optimization Results
            </CardTitle>
            <CardDescription>
              Best trial and hyperparameter selection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Best Trial Highlight */}
            {bestTrial && (
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-yellow-500" />
                  <span className="font-medium text-yellow-500">Best Trial: #{bestTrial.id}</span>
                  <Badge className="bg-yellow-500/20 text-yellow-500">R² = {bestTrial.r2}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Achieved lowest validation loss with optimal hyperparameters
                </div>
              </div>
            )}
            
            {/* Trial Selector */}
            <div className="space-y-2">
              <Label>Select Trial to View</Label>
              <div className="flex flex-wrap gap-2">
                {MOCK_TRIALS_RESULTS.map(trial => (
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
            
            {/* Selected Trial Hyperparameters */}
            <div className="space-y-2">
              <Label>Trial #{selectedTrial} Hyperparameters</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(currentTrialData.params).map(([key, value]) => (
                  <div key={key} className="p-2 rounded bg-secondary/50 border border-border">
                    <div className="text-xs text-muted-foreground">{key}</div>
                    <div className="font-mono text-sm">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Output Column Selection */}
      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            Evaluation Target
          </CardTitle>
          <CardDescription>
            Select which output variable to evaluate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {outputColumns.map(col => (
              <button
                key={col}
                onClick={() => setSelectedColumn(col)}
                className={`
                  px-4 py-2 text-sm rounded-lg border transition-all
                  ${selectedColumn === col
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:border-primary/50'
                  }
                `}
              >
                {col}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Metrics Display */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="gradient-card border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>R² Score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{metrics.r2.toFixed(4)}</div>
            <div className="text-xs text-muted-foreground mt-1">Coefficient of Determination</div>
          </CardContent>
        </Card>
        
        <Card className="gradient-card border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>MSE</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">{metrics.mse.toFixed(4)}</div>
            <div className="text-xs text-muted-foreground mt-1">Mean Squared Error</div>
          </CardContent>
        </Card>
        
        <Card className="gradient-card border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>MAE</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">{metrics.mae.toFixed(4)}</div>
            <div className="text-xs text-muted-foreground mt-1">Mean Absolute Error</div>
          </CardContent>
        </Card>
        
        <Card className="gradient-card border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>RMSE</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-500">{metrics.rmse.toFixed(4)}</div>
            <div className="text-xs text-muted-foreground mt-1">Root Mean Squared Error</div>
          </CardContent>
        </Card>
      </div>

      {/* Prediction vs Actual Chart */}
      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            Prediction vs Actual ({selectedColumn})
          </CardTitle>
          <CardDescription>
            Comparison of predicted values against actual values on test set
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={predictions} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="index"
                  stroke="hsl(199, 89%, 60%)"
                  tick={{ fill: 'hsl(199, 89%, 60%)', fontSize: 12 }}
                  label={{ value: 'Sample Index', position: 'insideBottom', offset: -5, fill: 'hsl(199, 89%, 60%)' }}
                />
                <YAxis 
                  stroke="hsl(199, 89%, 60%)"
                  tick={{ fill: 'hsl(199, 89%, 60%)', fontSize: 12 }}
                  label={{ value: selectedColumn, angle: -90, position: 'insideLeft', fill: 'hsl(199, 89%, 60%)' }}
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
                  dataKey="actual"
                  stroke="hsl(142, 76%, 36%)"
                  strokeWidth={2}
                  dot={false}
                  name="Actual"
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="hsl(217, 91%, 60%)"
                  strokeWidth={2}
                  dot={false}
                  name="Predicted"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Scatter Plot: Actual vs Predicted */}
      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Actual vs Predicted Scatter
          </CardTitle>
          <CardDescription>
            Ideal predictions follow the diagonal line (y=x)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  type="number"
                  dataKey="x"
                  name="Actual"
                  stroke="hsl(199, 89%, 60%)"
                  tick={{ fill: 'hsl(199, 89%, 60%)', fontSize: 12 }}
                  label={{ value: 'Actual Value', position: 'insideBottom', offset: -5, fill: 'hsl(199, 89%, 60%)' }}
                />
                <YAxis 
                  type="number"
                  dataKey="y"
                  name="Predicted"
                  stroke="hsl(199, 89%, 60%)"
                  tick={{ fill: 'hsl(199, 89%, 60%)', fontSize: 12 }}
                  label={{ value: 'Predicted Value', angle: -90, position: 'insideLeft', fill: 'hsl(199, 89%, 60%)' }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Scatter 
                  name="Predictions" 
                  data={scatterData} 
                  fill="hsl(217, 91%, 60%)"
                  fillOpacity={0.6}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
