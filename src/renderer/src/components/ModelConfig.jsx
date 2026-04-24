import { useState, useEffect } from 'react'
import { Settings, Cpu, Brain, Zap, Sliders, BarChart3, Play, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { useWorkflowStore, WORKFLOW_STEPS } from '../store/workflowStore'
import { trainApi, tuneApi } from '../services/api'

// Model configurations
const MODEL_CONFIGS = {
  MLP: {
    category: 'dl',
    name: 'MLP',
    fullName: 'Multi-Layer Perceptron',
    supportsHistory: false,
    params: {
      mid_layer_count: { label: 'Hidden Layers', default: 3, type: 'int' },
      mid_layer_size: { label: 'Layer Size', default: 256, type: 'int' },
      dropout: { label: 'Dropout', default: 0.15, type: 'float' },
      batch_size: { label: 'Batch Size', default: 256, type: 'int' },
      learning_rate: { label: 'Learning Rate', default: 0.001, type: 'float' },
      weight_decay: { label: 'Weight Decay', default: 0.0, type: 'float' }
    }
  },
  LSTM: {
    category: 'dl',
    name: 'LSTM',
    fullName: 'Long Short-Term Memory',
    supportsHistory: true,
    params: {
      history_length: { label: 'History Length', default: 64, type: 'int' },
      units: { label: 'Units', default: 128, type: 'int' },
      num_layers: { label: 'Num Layers', default: 2, type: 'int' },
      dropout: { label: 'Dropout', default: 0.2, type: 'float' },
      batch_size: { label: 'Batch Size', default: 128, type: 'int' },
      learning_rate: { label: 'Learning Rate', default: 0.001, type: 'float' },
      weight_decay: { label: 'Weight Decay', default: 0.0, type: 'float' }
    }
  },
  RNN: {
    category: 'dl',
    name: 'RNN',
    fullName: 'Recurrent Neural Network',
    supportsHistory: true,
    params: {
      history_length: { label: 'History Length', default: 64, type: 'int' },
      units: { label: 'Units', default: 128, type: 'int' },
      num_layers: { label: 'Num Layers', default: 2, type: 'int' },
      dropout: { label: 'Dropout', default: 0.2, type: 'float' },
      batch_size: { label: 'Batch Size', default: 128, type: 'int' },
      learning_rate: { label: 'Learning Rate', default: 0.001, type: 'float' },
      weight_decay: { label: 'Weight Decay', default: 0.0, type: 'float' }
    }
  },
  GRU: {
    category: 'dl',
    name: 'GRU',
    fullName: 'Gated Recurrent Unit',
    supportsHistory: true,
    params: {
      history_length: { label: 'History Length', default: 64, type: 'int' },
      units: { label: 'Units', default: 128, type: 'int' },
      num_layers: { label: 'Num Layers', default: 2, type: 'int' },
      dropout: { label: 'Dropout', default: 0.2, type: 'float' },
      batch_size: { label: 'Batch Size', default: 128, type: 'int' },
      learning_rate: { label: 'Learning Rate', default: 0.001, type: 'float' },
      weight_decay: { label: 'Weight Decay', default: 0.0, type: 'float' }
    }
  },
  TRANSFORMER: {
    category: 'dl',
    name: 'TRANSFORMER',
    fullName: 'Transformer Encoder',
    supportsHistory: true,
    params: {
      history_length: { label: 'History Length', default: 64, type: 'int' },
      d_model: { label: 'd_model', default: 128, type: 'int' },
      nhead: { label: 'Num Heads', default: 8, type: 'int' },
      num_encoder_layers: { label: 'Encoder Layers', default: 4, type: 'int' },
      dim_feedforward: { label: 'FF Dim', default: 512, type: 'int' },
      dropout: { label: 'Dropout', default: 0.1, type: 'float' },
      batch_size: { label: 'Batch Size', default: 128, type: 'int' },
      learning_rate: { label: 'Learning Rate', default: 0.001, type: 'float' },
      weight_decay: { label: 'Weight Decay', default: 0.0, type: 'float' }
    }
  },
  XGBoost: {
    category: 'ml',
    name: 'XGBoost',
    fullName: 'XGBoost (Single Output)',
    supportsHistory: false,
    singleOutputOnly: true,
    params: {
      max_depth: { label: 'Max Depth', default: 6, type: 'int' },
      learning_rate: { label: 'Learning Rate', default: 0.1, type: 'float' },
      n_estimators: { label: 'Estimators', default: 100, type: 'int' },
      subsample: { label: 'Subsample', default: 0.8, type: 'float' },
      colsample_bytree: { label: 'Col Sample', default: 0.8, type: 'float' }
    }
  },
  LightGBM: {
    category: 'ml',
    name: 'LightGBM',
    fullName: 'LightGBM (Single Output)',
    supportsHistory: false,
    singleOutputOnly: true,
    params: {
      max_depth: { label: 'Max Depth', default: 6, type: 'int' },
      learning_rate: { label: 'Learning Rate', default: 0.1, type: 'float' },
      n_estimators: { label: 'Estimators', default: 100, type: 'int' },
      subsample: { label: 'Subsample', default: 0.8, type: 'float' },
      colsample_bytree: { label: 'Col Sample', default: 0.8, type: 'float' }
    }
  },
  CatBoost: {
    category: 'ml',
    name: 'CatBoost',
    fullName: 'CatBoost (Single Output)',
    supportsHistory: false,
    singleOutputOnly: true,
    params: {
      max_depth: { label: 'Max Depth', default: 6, type: 'int' },
      learning_rate: { label: 'Learning Rate', default: 0.1, type: 'float' },
      n_estimators: { label: 'Estimators', default: 100, type: 'int' },
      subsample: { label: 'Subsample', default: 0.8, type: 'float' },
      colsample_bylevel: { label: 'Col Sample', default: 0.8, type: 'float' }
    }
  }
}

export function ModelConfig() {
  const {
    dataMode,
    trainingMode,
    dataset,
    splitConfig,
    modelConfig,
    setModelConfig,
    setTraining,
    setTuning,
    setCurrentStep,
    getInputColumns,
    getOutputColumns,
    canProceedToTraining
  } = useWorkflowStore()

  const [category, setCategory] = useState(modelConfig.category || 'dl')
  const [selectedModel, setSelectedModel] = useState(modelConfig.modelType || 'LSTM')
  const [params, setParams] = useState({})
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState(null)

  const modelDef = MODEL_CONFIGS[selectedModel]

  // Initialize params when model changes
  useEffect(() => {
    if (modelDef) {
      const initialParams = {}
      Object.entries(modelDef.params).forEach(([key, config]) => {
        initialParams[key] = config.default
      })
      setParams(initialParams)
    }
  }, [modelDef])

  const handleParamChange = (key, value) => {
    const paramDef = modelDef.params[key]
    let parsedValue = value

    if (paramDef.type === 'int') {
      parsedValue = parseInt(value) || 0
    } else if (paramDef.type === 'float') {
      parsedValue = parseFloat(value) || 0
    }

    setParams(prev => ({ ...prev, [key]: parsedValue }))
  }

  const handleStartTraining = async () => {
    if (!canProceedToTraining()) {
      setError('Please complete data upload and split first')
      return
    }

    const inputColumns = getInputColumns()
    const outputColumns = getOutputColumns()

    if (inputColumns.length === 0) {
      setError('Please select at least one input column')
      return
    }

    if (outputColumns.length === 0) {
      setError('Please select at least one output column')
      return
    }

    // Check single output restriction for ML models
    if (modelDef.category === 'ml' && modelDef.singleOutputOnly && outputColumns.length > 1) {
      setError(`${selectedModel} only supports single output. Please select only one output column.`)
      return
    }

    try {
      setStarting(true)
      setError(null)

      // Build training config
      const trainingConfig = {
        datasetId: dataset.id,
        splitId: splitConfig.splitId,
        modelType: selectedModel,
        modelParams: params,
        trainingParams: {
          maxEpochs: modelConfig.maxEpochs,
          batchSize: params.batch_size || 128,
          learningRate: params.learning_rate || 0.001,
          weightDecay: params.weight_decay || 0.0,
          seed: modelConfig.seed
        },
        dataConfig: {
          inputColumns,
          outputColumns,
          trainPath: splitConfig.trainPath,
          valPath: splitConfig.valPath,
          testPath: splitConfig.testPath
        },
        outputDir: modelConfig.outputDir
      }

      // Start training or tuning based on mode
      const jobState = {
        jobId: null,
        status: 'pending',
        progress: 0,
        logs: [],
        result: null,
        error: null
      }
      if (trainingMode === 'autotune') {
        const response = await tuneApi.start({
          ...trainingConfig,
          searchSpace: {} // TODO: Add search space configuration
        })
        setTuning({ ...jobState, jobId: response.data.jobId })
      } else {
        const response = await trainApi.start(trainingConfig)
        setTraining({ ...jobState, jobId: response.data.jobId })
      }

      // Move to training step
      setCurrentStep(WORKFLOW_STEPS.TRAINING)

    } catch (err) {
      setError(err.message || 'Failed to start training')
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Model Category Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Model Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              variant={category === 'dl' ? 'default' : 'outline'}
              onClick={() => {
                setCategory('dl')
                setSelectedModel('LSTM')
              }}
              className="flex-1"
            >
              <Brain className="w-4 h-4 mr-2" />
              Deep Learning
            </Button>
            <Button
              variant={category === 'ml' ? 'default' : 'outline'}
              onClick={() => {
                setCategory('ml')
                setSelectedModel('XGBoost')
              }}
              className="flex-1"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Machine Learning
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Model Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="w-5 h-5" />
            Select Model
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(MODEL_CONFIGS)
              .filter(([, config]) => config.category === category)
              .map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setSelectedModel(key)}
                  className={`
                    p-4 rounded-lg border-2 transition-all text-left
                    ${selectedModel === key
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50 bg-secondary/30'
                    }
                  `}
                >
                  <div className="font-semibold">{config.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {config.fullName}
                  </div>
                  {config.supportsHistory && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      Sequential
                    </Badge>
                  )}
                </button>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Model Parameters */}
      {modelDef && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sliders className="w-5 h-5" />
              Model Parameters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(modelDef.params).map(([key, config]) => (
                <div key={key}>
                  <Label className="flex items-center gap-2">
                    {config.label}
                    <Badge variant="secondary" className="text-[10px]">
                      {config.type}
                    </Badge>
                  </Label>
                  <Input
                    type={config.type === 'int' ? 'number' : 'number'}
                    step={config.type === 'float' ? 0.001 : 1}
                    value={params[key] ?? config.default}
                    onChange={(e) => handleParamChange(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Start Training */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Ready to Train</h3>
              <p className="text-sm text-muted-foreground">
                {canProceedToTraining()
                  ? 'All requirements met. Start training your model.'
                  : 'Please complete data upload and split first.'}
              </p>
            </div>
            <Button
              size="lg"
              onClick={handleStartTraining}
              disabled={starting || !canProceedToTraining()}
              className="gap-2"
            >
              {starting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Start Training
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
