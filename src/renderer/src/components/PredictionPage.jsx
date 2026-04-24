import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
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
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'
import {
  Crosshair,
  Upload,
  FileText,
  FolderOpen,
  Target,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  FlaskConical,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { useWorkflowStore } from '../store/workflowStore'
import { predictApi, dataApi, modelApi } from '../services/api'

export function PredictionPage() {
  const { dataset, training, tuning, trainingMode } = useWorkflowStore()
  const activeJob = trainingMode === 'autotune' ? tuning : training

  const [dataFile, setDataFile] = useState(null)
  const [dataFileName, setDataFileName] = useState(null)
  const [datasetId, setDatasetId] = useState(null)
  const [modelDir, setModelDir] = useState('')
  const [availableModels, setAvailableModels] = useState([])
  const [selectedOutput, setSelectedOutput] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  // Prediction state
  const [predicting, setPredicting] = useState(false)
  const predictionFileInputRef = useRef(null)
  const [predictJobId, setPredictJobId] = useState(null)
  const [predictResult, setPredictResult] = useState(null)
  const [predictError, setPredictError] = useState(null)

  // Get output columns from the store
  const outputColumns = useMemo(() => {
    const roles = useWorkflowStore.getState().dataset.columnRoles
    return Object.entries(roles)
      .filter(([, role]) => role === 'output')
      .map(([col]) => col)
  }, [dataset.columnRoles])

  // Initialize selected output
  useEffect(() => {
    if (outputColumns.length > 0 && !selectedOutput) {
      setSelectedOutput(outputColumns[0])
    }
  }, [outputColumns])

  // Set default model dir from training result
  useEffect(() => {
    if (!modelDir && activeJob.result?.modelDir) {
      setModelDir(activeJob.result.modelDir)
    }
  }, [activeJob.result])

  // Load available models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const response = await modelApi.list()
        if (response.data?.models) {
          setAvailableModels(response.data.models)
        }
      } catch (err) {
        console.error('Failed to load models:', err)
      }
    }
    loadModels()
  }, [])

  // Poll prediction job status
  const pollRef = useRef(null)

  useEffect(() => {
    if (!predictJobId) return

    const poll = async () => {
      try {
        const response = await predictApi.getStatus(predictJobId)
        const data = response.data

        if (data.status === 'completed') {
          setPredictResult(data.result || data)
          setPredicting(false)
          if (pollRef.current) clearInterval(pollRef.current)
        } else if (data.status === 'failed') {
          setPredictError(data.error || 'Prediction failed')
          setPredicting(false)
          if (pollRef.current) clearInterval(pollRef.current)
        }
      } catch (err) {
        console.error('Failed to poll prediction status:', err)
      }
    }

    pollRef.current = setInterval(poll, 2000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [predictJobId])

  // Parse prediction results
  const metrics = useMemo(() => {
    if (!predictResult?.metrics && !predictResult?.result) return null
    const result = predictResult.metrics || predictResult.result
    if (result.per_target && selectedOutput && result.per_target[selectedOutput]) {
      return result.per_target[selectedOutput]
    }
    if (result.r2 !== undefined) {
      return { r2: result.r2, mse: result.mse, mae: result.mae, rmse: result.rmse }
    }
    return null
  }, [predictResult, selectedOutput])

  const predictions = useMemo(() => {
    if (!predictResult?.predictions) return []
    const preds = predictResult.predictions
    if (selectedOutput && preds[selectedOutput]) {
      return preds[selectedOutput].map((actual, i) => ({
        index: i,
        actual: parseFloat(actual.toFixed(4)),
        predicted: parseFloat(preds.predicted?.[selectedOutput]?.[i]?.toFixed(4) ?? actual.toFixed(4))
      }))
    }
    if (Array.isArray(preds)) {
      return preds.map((p, i) => ({
        index: i,
        actual: parseFloat(p.actual?.toFixed(4) ?? 0),
        predicted: parseFloat(p.predicted?.toFixed(4) ?? 0)
      }))
    }
    return []
  }, [predictResult, selectedOutput])

  const scatterData = useMemo(() => {
    return predictions.map((d) => ({
      actual: d.actual,
      predicted: d.predicted
    }))
  }, [predictions])

  const scatterBounds = useMemo(() => {
    if (scatterData.length === 0) return { min: 0, max: 1 }
    const allVals = scatterData.flatMap((d) => [d.actual, d.predicted])
    const min = Math.floor(Math.min(...allVals))
    const max = Math.ceil(Math.max(...allVals))
    return { min, max }
  }, [scatterData])

  const isValidFile = (file) => {
    const ext = file.name.split('.').pop().toLowerCase()
    return ['csv', 'xlsx', 'xls'].includes(ext)
  }

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && isValidFile(file)) {
      await handleFileUpload(file)
    }
  }, [])

  const handleFileInput = useCallback(async (e) => {
    const file = e.target.files[0]
    if (file && isValidFile(file)) {
      await handleFileUpload(file)
    }
  }, [])

  const handleFileUpload = async (file) => {
    try {
      setDataFile(file)
      setDataFileName(file.name)
      setPredictResult(null)
      setPredictError(null)

      // Upload to backend
      const response = await dataApi.upload(file)
      setDatasetId(response.data.datasetId)
    } catch (err) {
      setPredictError(err.message || 'Failed to upload file')
    }
  }

  const removeFile = () => {
    setDataFile(null)
    setDataFileName(null)
    setDatasetId(null)
    setPredictResult(null)
    setPredictError(null)
  }

  const handlePredict = async () => {
    if (!modelDir && !activeJob.result?.modelDir) {
      setPredictError('No model directory specified. Please train a model first or enter a model path.')
      return
    }

    try {
      setPredicting(true)
      setPredictError(null)
      setPredictResult(null)

      const config = {
        modelDir: modelDir || activeJob.result?.modelDir,
        datasetId: datasetId,
        inputColumns: useWorkflowStore.getState().getInputColumns(),
        outputColumns: outputColumns
      }

      const response = await predictApi.start(config)
      setPredictJobId(response.data.jobId)
      if (!selectedOutput && outputColumns.length > 0) {
        setSelectedOutput(outputColumns[0])
      }
    } catch (err) {
      setPredictError(err.message || 'Failed to start prediction')
      setPredicting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Crosshair className="w-7 h-7 text-primary" />
          Prediction
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Test a trained model on external datasets. Independent of training mode settings.
        </p>
      </div>

      {/* Error Alert */}
      {predictError && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{predictError}</AlertDescription>
        </Alert>
      )}

      {/* Data Upload */}
      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-6 h-6 text-primary" />
            External Dataset
          </CardTitle>
          <CardDescription>
            Upload a CSV or XLSX file for prediction
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!dataFileName ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-10 text-center transition-all cursor-pointer
                ${isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}
              `}
            >
              <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-base font-medium mb-2">Drag and drop file here</p>
              <p className="text-sm text-muted-foreground mb-3">Supported formats: .csv, .xlsx</p>
              <input
                ref={predictionFileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileInput}
                className="hidden"
                id="prediction-file-upload"
              />
              <Button size="sm" onClick={() => predictionFileInputRef.current?.click()}>
                Select File
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-medium">{dataFileName}</p>
                  <p className="text-sm text-muted-foreground">
                    {datasetId ? 'Uploaded and ready for prediction' : 'Uploading...'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={removeFile}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
          <p className="text-xs text-amber-500 mt-3">
            Please ensure the dataset contains all the input columns required by the model.
          </p>
        </CardContent>
      </Card>

      {/* Model Directory */}
      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-primary" />
            Model Directory
          </CardTitle>
          <CardDescription>
            Path to saved model directory (default: latest trained model)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Input
                type="text"
                value={modelDir}
                onChange={(e) => setModelDir(e.target.value)}
                placeholder="./outputs/model_name/timestamp"
                className="flex-1"
              />
              <Badge variant="outline" className="text-xs shrink-0">
                config.toml + model files
              </Badge>
            </div>

            {/* Available models list */}
            {availableModels.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Available trained models:</Label>
                <div className="flex flex-wrap gap-2">
                  {availableModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => setModelDir(model.path)}
                      className={`
                        px-2 py-1 text-xs rounded border transition-all
                        ${modelDir === model.path
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50 text-muted-foreground'}
                      `}
                    >
                      {model.name}/{model.id.split('/').pop()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              The directory should contain config.toml and model files (.pt).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Run Prediction Button */}
      {dataFileName && !predictResult && !predicting && (
        <div className="flex justify-center">
          <Button onClick={handlePredict} size="lg" disabled={!modelDir && !activeJob.result?.modelDir}>
            <FlaskConical className="w-5 h-5 mr-2" />
            Run Prediction
          </Button>
        </div>
      )}

      {/* Predicting indicator */}
      {predicting && (
        <Card className="gradient-card border-border/50">
          <CardContent className="py-8">
            <div className="text-center">
              <Loader2 className="w-10 h-10 mx-auto mb-3 animate-spin text-primary" />
              <p className="text-lg font-medium">Running prediction...</p>
              <p className="text-sm text-muted-foreground mt-1">This may take a moment</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prediction Results */}
      {predictResult && (
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
                  Prediction completed. Check the results below.
                </p>
                {predictResult.output && (
                  <pre className="mt-4 p-3 bg-secondary rounded-md text-xs overflow-auto max-h-64">
                    {predictResult.output}
                  </pre>
                )}
              </CardContent>
            </Card>
          )}

          {/* Charts */}
          {predictions.length > 0 && (
            <>
              {/* Prediction vs Actual Line Chart */}
              <Card className="gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-primary" />
                    Prediction vs Actual — {selectedOutput || 'Target'}
                  </CardTitle>
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
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  )
}
