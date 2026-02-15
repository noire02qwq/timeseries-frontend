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
  Scatter,
  ReferenceLine
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Label } from './ui/label'
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
  X
} from 'lucide-react'

// Mock prediction results for demo
const generateMockPredictions = () => {
  const data = []
  for (let i = 0; i < 80; i++) {
    const actual = 18 + Math.sin(i / 8) * 10 + Math.random() * 2
    const predicted = actual + (Math.random() - 0.5) * 5
    data.push({
      index: i,
      actual: parseFloat(actual.toFixed(2)),
      predicted: parseFloat(predicted.toFixed(2))
    })
  }
  return data
}

export function PredictionPage() {
  const [dataFile, setDataFile] = useState(null)
  const [dataFileName, setDataFileName] = useState(null)
  const [modelDir, setModelDir] = useState('./saved_models/latest')
  const [predicted, setPredicted] = useState(false)
  const [selectedOutput, setSelectedOutput] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  const predictions = useMemo(() => generateMockPredictions(), [])
  const outputColumns = ['Temperature', 'Humidity'] // mock output columns from model config

  // Mock metrics
  const metrics = { r2: 0.908, mse: 11.23, mae: 2.71, rmse: 3.35 }

  const scatterData = useMemo(() => {
    return predictions.map((d) => ({
      actual: d.actual,
      predicted: d.predicted
    }))
  }, [predictions])

  const scatterBounds = useMemo(() => {
    const allVals = predictions.flatMap((d) => [d.actual, d.predicted])
    const min = Math.floor(Math.min(...allVals))
    const max = Math.ceil(Math.max(...allVals))
    return { min, max }
  }, [predictions])

  const isValidFile = (file) => {
    const ext = file.name.split('.').pop().toLowerCase()
    return ['csv', 'xlsx', 'xls'].includes(ext)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && isValidFile(file)) {
      setDataFile(file)
      setDataFileName(file.name)
      setPredicted(false)
    }
  }

  const handleFileInput = (e) => {
    const file = e.target.files[0]
    if (file && isValidFile(file)) {
      setDataFile(file)
      setDataFileName(file.name)
      setPredicted(false)
    }
  }

  const removeFile = () => {
    setDataFile(null)
    setDataFileName(null)
    setPredicted(false)
  }

  const handlePredict = () => {
    setPredicted(true)
    if (!selectedOutput && outputColumns.length > 0) {
      setSelectedOutput(outputColumns[0])
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
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileInput}
                className="hidden"
                id="prediction-file-upload"
              />
              <label htmlFor="prediction-file-upload">
                <Button asChild size="sm">
                  <span>Select File</span>
                </Button>
              </label>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-medium">{dataFileName}</p>
                  <p className="text-sm text-muted-foreground">Ready for prediction</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={removeFile}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
          <p className="text-xs text-amber-500 mt-3">
            ⚠ Please ensure the dataset contains all the input and output columns required by the model.
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
            Path to saved model directory (default: latest saved model)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Input
              type="text"
              value={modelDir}
              onChange={(e) => setModelDir(e.target.value)}
              placeholder="./saved_models/latest"
              className="flex-1"
            />
            <Badge variant="outline" className="text-xs shrink-0">
              config.toml + model files
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            The directory should contain config.toml and model files (.onnx or .pt).
            The model&apos;s input/output column configuration will be loaded from config.toml.
          </p>
        </CardContent>
      </Card>

      {/* Run Prediction Button */}
      {dataFileName && !predicted && (
        <div className="flex justify-center">
          <Button onClick={handlePredict} size="lg">
            <FlaskConical className="w-5 h-5 mr-2" />
            Run Prediction
          </Button>
        </div>
      )}

      {/* Prediction Results */}
      {predicted && (
        <>
          {/* Output Variable Selection */}
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

          {/* Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'R²', value: metrics.r2.toFixed(4), icon: Target, color: 'text-blue-400' },
              { label: 'MSE', value: metrics.mse.toFixed(4), icon: TrendingUp, color: 'text-yellow-400' },
              { label: 'MAE', value: metrics.mae.toFixed(4), icon: BarChart3, color: 'text-green-400' },
              { label: 'RMSE', value: metrics.rmse.toFixed(4), icon: CheckCircle2, color: 'text-purple-400' }
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

          {/* Line Chart + Scatter Stacked */}
            {/* Prediction vs Actual Line Chart */}
          <Card className="gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                Prediction vs Actual — {selectedOutput}
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
                Actual vs Predicted Scatter — {selectedOutput}
              </CardTitle>
              <CardDescription>
                R² = {metrics.r2.toFixed(4)} • Points closer to the diagonal line indicate better predictions
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
    </div>
  )
}
