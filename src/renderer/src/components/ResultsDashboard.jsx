import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
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
  Scatter,
  ReferenceLine
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import {
  Trophy,
  Target,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  Save,
  FlaskConical,
  FolderOutput,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'
import { ScrollArea } from './ui/scroll-area'
import { useWorkflowStore } from '../store/workflowStore'
import { testApi, trainApi, tuneApi, outputApi } from '../services/api'

export function ResultsDashboard() {
  const {
    trainingMode,
    training,
    tuning,
    dataset,
    splitConfig,
    setTraining,
    setTuning
  } = useWorkflowStore()

  const isTuning = trainingMode === 'autotune'
  const activeJob = isTuning ? tuning : training

  const [testRun, setTestRun] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testJobId, setTestJobId] = useState(null)
  const [testResult, setTestResult] = useState(null)
  const [testError, setTestError] = useState(null)
  const [selectedOutput, setSelectedOutput] = useState(null)
  const [saveDir, setSaveDir] = useState('./saved_models')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedTrial, setSelectedTrial] = useState(null)
  const [comparisonData, setComparisonData] = useState([])
  const [apiOutputColumns, setApiOutputColumns] = useState([])
  const [comparisonLoading, setComparisonLoading] = useState(false)
  const [comparisonError, setComparisonError] = useState(null)

  // Get output columns - prefer API-derived columns, fall back to store
  const outputColumns = useMemo(() => {
    if (apiOutputColumns.length > 0) return apiOutputColumns
    const roles = useWorkflowStore.getState().dataset.columnRoles
    const outputs = Object.entries(roles)
      .filter(([, role]) => role === 'output')
      .map(([col]) => col)
    return outputs.length > 0 ? outputs : []
  }, [apiOutputColumns, dataset.columnRoles])

  // Initialize selected output when columns change
  useEffect(() => {
    if (outputColumns.length > 0) {
      if (!selectedOutput || !outputColumns.includes(selectedOutput)) {
        setSelectedOutput(outputColumns[0])
      }
    }
  }, [outputColumns, selectedOutput])

  // Parse test results
  const metrics = useMemo(() => {
    if (!testResult) return null
    // Try to parse metrics from the test output
    if (testResult.metrics) return testResult.metrics
    if (testResult.result) {
      const result = testResult.result
      // Handle per-target metrics
      if (result.per_target && selectedOutput && result.per_target[selectedOutput]) {
        return result.per_target[selectedOutput]
      }
      if (result.r2 !== undefined) {
        return {
          r2: result.r2,
          mse: result.mse,
          mae: result.mae,
          rmse: result.rmse
        }
      }
    }
    return null
  }, [testResult, selectedOutput])

  // Prediction data from comparison API response
  const predictions = useMemo(() => {
    if (comparisonData.length === 0 || !selectedOutput) return []
    const trueKey = `${selectedOutput}_true`
    const predKey = `${selectedOutput}_pred`
    return comparisonData.map((row, i) => ({
      index: i,
      actual: row[trueKey] != null ? parseFloat(Number(row[trueKey]).toFixed(4)) : 0,
      predicted: row[predKey] != null ? parseFloat(Number(row[predKey]).toFixed(4)) : 0
    }))
  }, [comparisonData, selectedOutput])

  // Scatter data
  const scatterData = useMemo(() => {
    return predictions.map((d) => ({
      actual: d.actual,
      predicted: d.predicted
    }))
  }, [predictions])

  const scatterBounds = useMemo(() => {
    if (scatterData.length === 0) return { min: 0, max: 1 }
    const allVals = scatterData.flatMap((d) => [d.actual, d.predicted])
    const minVal = Math.min(...allVals)
    const maxVal = Math.max(...allVals)
    const padding = (maxVal - minVal) * 0.05
    return { min: minVal - padding, max: maxVal + padding }
  }, [scatterData])

  // Format tick values for axis
  const formatTick = (val) => {
    if (Math.abs(val) >= 1000) return val.toFixed(0)
    if (Math.abs(val) >= 100) return val.toFixed(1)
    return val.toFixed(2)
  }

  // Autotune trials
  const trialsResults = useMemo(() => {
    if (!isTuning || !activeJob.result?.trials) return []
    return activeJob.result.trials
  }, [isTuning, activeJob.result])

  const bestTrial = useMemo(() => {
    if (trialsResults.length === 0) return null
    return trialsResults.reduce((best, trial) =>
      (trial.valLoss ?? Infinity) < (best.valLoss ?? Infinity) ? trial : best
    )
  }, [trialsResults])

  const activeTrial = useMemo(() => {
    if (!isTuning) return null
    if (showAdvanced && selectedTrial !== null) {
      return trialsResults.find((t) => t.id === selectedTrial) || bestTrial
    }
    return bestTrial
  }, [isTuning, showAdvanced, selectedTrial, bestTrial, trialsResults])

  // Poll test job status
  const pollRef = useRef(null)

  // Fetch comparison data
  const fetchComparison = useCallback(async () => {
    if (!activeJob.jobId) return
    setComparisonLoading(true)
    setComparisonError(null)
    try {
      console.log('[ResultsDashboard] Fetching test comparison for jobId:', activeJob.jobId)
      const compResponse = await outputApi.getTestComparison(activeJob.jobId)
      console.log('[ResultsDashboard] Comparison response:', {
        rows: compResponse.data?.comparison?.length,
        outputColumns: compResponse.data?.outputColumns
      })
      if (compResponse.data?.comparison) {
        setComparisonData(compResponse.data.comparison || [])
        setApiOutputColumns(compResponse.data.outputColumns || [])
      } else if (compResponse.data?.error) {
        setComparisonError(compResponse.data.error.message)
      }
    } catch (err) {
      console.error('[ResultsDashboard] Failed to fetch comparison data:', err)
      setComparisonError(err.message || 'Failed to fetch comparison data')
    } finally {
      setComparisonLoading(false)
    }
  }, [activeJob.jobId])

  useEffect(() => {
    if (!testJobId) return

    const poll = async () => {
      try {
        const response = await testApi.getStatus(testJobId)
        const data = response.data

        if (data.status === 'completed') {
          setTestResult(data.result || data)
          setTestRun(true)
          setTesting(false)
          if (pollRef.current) clearInterval(pollRef.current)
          // Fetch comparison data
          fetchComparison()
        } else if (data.status === 'failed') {
          setTestError(data.error || 'Test failed')
          setTesting(false)
          if (pollRef.current) clearInterval(pollRef.current)
        }
      } catch (err) {
        console.error('Failed to poll test status:', err)
      }
    }

    pollRef.current = setInterval(poll, 2000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [testJobId, activeJob.jobId, fetchComparison])

  const handleRunTest = async () => {
    const modelDir = activeJob.result?.modelDir
    if (!modelDir) {
      setTestError('No trained model available. Please complete training first.')
      return
    }

    try {
      setTesting(true)
      setTestError(null)

      const config = {
        modelDir: modelDir,
        testCsv: splitConfig.testPath
      }

      const response = await testApi.start(config)
      setTestJobId(response.data.jobId)
    } catch (err) {
      setTestError(err.message || 'Failed to start test')
      setTesting(false)
    }
  }

  const handleSave = async () => {
    if (!activeJob.result?.modelDir) {
      alert('No model directory available for saving.')
      return
    }
    alert(`Model saved at: ${activeJob.result.modelDir}\n\nContains:\n- config.toml\n- best_model.pt\n- loss_history.csv`)
  }

  const isTrainingComplete = activeJob.status === 'completed'

  return (
    <div className="space-y-6">
      {/* Ready to test banner */}
      {isTrainingComplete && !testRun && (
        <Card className="bg-green-900/30 border-green-600">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <FlaskConical className="w-8 h-8 text-green-400" />
              <div className="flex-1">
                <p className="font-medium text-green-200">Training Complete!</p>
                <p className="text-sm text-green-300/70">
                  Click the button below to run evaluation and see the prediction charts.
                </p>
              </div>
              <Button onClick={handleRunTest} size="lg" disabled={testing} className="bg-green-600 hover:bg-green-500">
                {testing ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Running Test...</>
                ) : (
                  <><FlaskConical className="w-5 h-5 mr-2" />Run Test on Test Set</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts ready banner */}
      {testRun && predictions.length === 0 && (
        <Card className="bg-yellow-900/30 border-yellow-600">
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-yellow-400" />
              <p className="text-sm text-yellow-200 flex-1">
                Charts will appear after loading. Click <strong>Refresh Charts</strong> if needed.
              </p>
              <Button variant="outline" size="sm" onClick={fetchComparison} disabled={comparisonLoading}>
                <RefreshCw className={`w-4 h-4 mr-1 ${comparisonLoading ? 'animate-spin' : ''}`} />
                Refresh Charts
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header with Save button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary" />
            Results & Assessment
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isTuning ? 'Autotune optimization results' : 'Manual training results'}
            {!isTrainingComplete && ' — Waiting for training to complete...'}
          </p>
        </div>
        {isTrainingComplete && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={saveDir}
                onChange={(e) => setSaveDir(e.target.value)}
                className="w-48 text-sm"
                placeholder="./saved_models"
              />
            </div>
            <Button onClick={handleSave} variant="outline">
              <Save className="w-4 h-4 mr-2" />
              Save Model
            </Button>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {testError && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{testError}</AlertDescription>
        </Alert>
      )}

      {/* Autotune Trial Selection */}
      {isTuning && isTrainingComplete && trialsResults.length > 0 && (
        <Card className="gradient-card border-border/50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium">
                    Best Trial: #{bestTrial?.id ?? '?'} — Val Loss: {bestTrial?.valLoss?.toFixed(4) ?? 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {bestTrial?.r2 !== undefined && `R²: ${bestTrial.r2.toFixed(3)}`}
                    {bestTrial?.rmse !== undefined && ` | RMSE: ${bestTrial.rmse.toFixed(2)}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showAdvanced}
                    onChange={(e) => {
                      setShowAdvanced(e.target.checked)
                      if (!e.target.checked) setSelectedTrial(null)
                    }}
                    className="rounded border-border"
                  />
                  Advanced
                </label>
                {showAdvanced && (
                  <select
                    value={selectedTrial ?? bestTrial?.id ?? ''}
                    onChange={(e) => setSelectedTrial(Number(e.target.value))}
                    className="bg-secondary border border-border rounded-md px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {trialsResults.map((trial) => (
                      <option key={trial.id} value={trial.id}>
                        Trial #{trial.id} — Val Loss: {(trial.valLoss ?? 0).toFixed(4)}
                        {trial.id === bestTrial?.id ? ' Best' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {showAdvanced && activeTrial?.params && (
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(activeTrial.params).map(([key, value]) => (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {key}: {typeof value === 'number' ? (value < 0.01 ? value.toExponential(2) : value) : value}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Run Test Button */}
      {isTrainingComplete && !testRun && (
        <Card className="gradient-card border-border/50">
          <CardContent className="py-12">
            <div className="text-center">
              <FlaskConical className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-40" />
              <p className="text-lg font-medium text-muted-foreground mb-4">
                Training completed. Run evaluation on the test set to see results.
              </p>
              <Button onClick={handleRunTest} size="lg" disabled={testing}>
                {testing ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Running Test...</>
                ) : (
                  <><FlaskConical className="w-5 h-5 mr-2" />Run Test on Test Set</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Not yet trained */}
      {!isTrainingComplete && (
        <Card className="gradient-card border-border/50">
          <CardContent className="py-16">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p className="text-lg font-medium">No training results yet</p>
              <p className="text-sm mt-1">Complete a training run first, then evaluate on the test set.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results (shown only after test) */}
      {testRun && (
        <>
          {/* Output Variable Selection */}
          {outputColumns.length > 1 && (
            <Card className="gradient-card border-border/50">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <Label className="text-sm font-medium shrink-0">Evaluation Target:</Label>
                  <div className="flex flex-wrap gap-2">
                    {outputColumns.map((col) => (
                      <button
                        key={col}
                        onClick={() => setSelectedOutput(col)}
                        className={`
                          px-3 py-1.5 text-sm rounded-full border transition-all
                          ${selectedOutput === col
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-transparent border-border text-muted-foreground hover:border-primary/50'}
                        `}
                      >
                        {col}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metrics Cards */}
          {metrics ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'R2', value: metrics.r2?.toFixed(4) ?? 'N/A', icon: Target, color: 'text-blue-400' },
                { label: 'MSE', value: metrics.mse?.toFixed(4) ?? 'N/A', icon: TrendingUp, color: 'text-yellow-400' },
                { label: 'MAE', value: metrics.mae?.toFixed(4) ?? 'N/A', icon: BarChart3, color: 'text-green-400' },
                { label: 'RMSE', value: metrics.rmse?.toFixed(4) ?? 'N/A', icon: CheckCircle2, color: 'text-purple-400' }
              ].map((metric) => (
                <Card key={metric.label} className="gradient-card border-border/50">
                  <CardContent className="py-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <metric.icon className="w-4 h-4" />
                      {metric.label}
                    </div>
                    <div className={`text-2xl font-mono font-bold ${metric.color}`}>
                      {metric.value}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="gradient-card border-border/50">
              <CardContent className="py-6">
                <p className="text-sm text-muted-foreground">
                  Test completed but no detailed metrics available. Check the training logs for results.
                </p>
                {testResult?.output && (
                  <pre className="mt-4 p-3 bg-secondary rounded-md text-xs overflow-auto max-h-64">
                    {testResult.output}
                  </pre>
                )}
              </CardContent>
            </Card>
          )}

          {/* Charts - show with data or show placeholders */}
          {testRun && (
            <>
              {/* Prediction vs Actual Line Chart */}
              <Card className="gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="w-6 h-6 text-primary" />
                      Prediction vs Actual — {selectedOutput || 'Target'}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchComparison}
                      disabled={comparisonLoading}
                      className="gap-1"
                    >
                      <RefreshCw className={`w-4 h-4 ${comparisonLoading ? 'animate-spin' : ''}`} />
                      Refresh Charts
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {comparisonError ? (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>{comparisonError}</AlertDescription>
                    </Alert>
                  ) : predictions.length === 0 ? (
                    <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                      {comparisonLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Loading chart data...
                        </div>
                      ) : (
                        <p>No comparison data available</p>
                      )}
                    </div>
                  ) : (
                    <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={predictions} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis
                            dataKey="index"
                            stroke="hsl(199, 89%, 60%)"
                            tick={{ fill: 'hsl(199, 89%, 60%)', fontSize: 12 }}
                          />
                          <YAxis
                            stroke="hsl(199, 89%, 60%)"
                            tick={{ fill: 'hsl(199, 89%, 60%)', fontSize: 12 }}
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
                          <Line
                            type="monotone"
                            dataKey="actual"
                            stroke="hsl(217, 91%, 60%)"
                            strokeWidth={2}
                            dot={false}
                            name="Actual"
                          />
                          <Line
                            type="monotone"
                            dataKey="predicted"
                            stroke="hsl(142, 71%, 45%)"
                            strokeWidth={2}
                            dot={false}
                            name="Predicted"
                            strokeDasharray="5 5"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Scatter Plot */}
              <Card className="gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-6 h-6 text-primary" />
                    Actual vs Predicted Scatter — {selectedOutput || 'Target'}
                  </CardTitle>
                  <CardDescription>
                    {metrics?.r2 && `R2 = ${metrics.r2.toFixed(4)}`} Points closer to the diagonal line indicate better predictions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {predictions.length > 0 ? (
                    <div style={{ width: '50%', aspectRatio: '1.05 / 1', margin: '0 auto' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 10, right: 30, left: 20, bottom: 25 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis
                            dataKey="actual"
                            type="number"
                            name="Actual"
                            stroke="hsl(199, 89%, 60%)"
                            tick={{ fill: 'hsl(199, 89%, 60%)', fontSize: 12 }}
                            tickFormatter={formatTick}
                            domain={[scatterBounds.min, scatterBounds.max]}
                            label={{
                              value: 'Actual',
                              position: 'insideBottom',
                              offset: -15,
                              fill: 'hsl(199, 89%, 60%)'
                            }}
                          />
                          <YAxis
                            dataKey="predicted"
                            type="number"
                            name="Predicted"
                            stroke="hsl(199, 89%, 60%)"
                            tick={{ fill: 'hsl(199, 89%, 60%)', fontSize: 12 }}
                            tickFormatter={formatTick}
                            domain={[scatterBounds.min, scatterBounds.max]}
                            label={{
                              value: 'Predicted',
                              angle: -90,
                              position: 'insideLeft',
                              offset: 0,
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
                          <ReferenceLine
                            segment={[
                              { x: scatterBounds.min, y: scatterBounds.min },
                              { x: scatterBounds.max, y: scatterBounds.max }
                            ]}
                            stroke="hsl(350, 89%, 60%)"
                            strokeWidth={2}
                            strokeDasharray="8 4"
                            label={{
                              value: 'y=x',
                              position: 'end',
                              fill: 'hsl(350, 89%, 60%)',
                              fontSize: 12
                            }}
                          />
                          <Scatter
                            data={scatterData}
                            fill="hsl(217, 91%, 60%)"
                            fillOpacity={0.6}
                            r={3}
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      <p>No scatter data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Bottom Save Button */}
          <Card className="gradient-card border-border/50">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FolderOutput className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Export Model & Results</p>
                    <p className="text-xs text-muted-foreground">
                      Save config.toml, model files (.pt), and loss_history.csv
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={saveDir}
                    onChange={(e) => setSaveDir(e.target.value)}
                    className="w-48 text-sm"
                    placeholder="./saved_models"
                  />
                  <Button onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
