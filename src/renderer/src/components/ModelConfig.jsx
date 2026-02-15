import { useState, useEffect, useMemo } from 'react'
import { Settings, Cpu, Brain, Zap, FolderOutput, Sliders, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'

// Model definitions with their parameters
const MODEL_CONFIGS = {
  // Deep Learning models
  MLP: {
    category: 'dl',
    name: 'MLP',
    fullName: 'Multi-Layer Perceptron',
    supportsHistory: false,
    isSequential: false,
    params: {
      mid_layer_count: { label: 'Hidden Layers', default: 3, type: 'int', desc: 'Number of hidden layers' },
      mid_layer_size: { label: 'Layer Size', default: 256, type: 'int', desc: 'Neurons per hidden layer' },
      dropout: { label: 'Dropout', default: 0.15, type: 'float', desc: 'Dropout rate' },
      batch_size: { label: 'Batch Size', default: 256, type: 'int', desc: 'Training batch size' },
      learning_rate: { label: 'Learning Rate', default: 0.001, type: 'float', desc: 'Optimizer learning rate' },
      weight_decay: { label: 'Weight Decay', default: 0.0, type: 'float', desc: 'L2 regularization' }
    },
    bayesParams: {
      mid_layer_count: { min: 2, max: 16, step: 2, log: false, type: 'int' },
      mid_layer_size: { min: 128, max: 512, step: 32, log: false, type: 'int' },
      dropout: { min: 0.1, max: 0.5, log: true, type: 'float' },
      batch_size: { min: 128, max: 384, step: 16, log: false, type: 'int' },
      learning_rate: { min: 0.0004, max: 0.002, log: true, type: 'float' },
      weight_decay: { min: 0.0001, max: 0.01, log: true, type: 'float' }
    }
  },
  RNN: {
    category: 'dl',
    name: 'RNN',
    fullName: 'Recurrent Neural Network',
    supportsHistory: true,
    isSequential: true,
    params: {
      history_length: { label: 'History Length', default: 64, type: 'int', desc: 'Sequence length' },
      units: { label: 'Units', default: 192, type: 'int', desc: 'Hidden units per layer' },
      num_layers: { label: 'Num Layers', default: 8, type: 'int', desc: 'Number of RNN layers' },
      dropout: { label: 'Dropout', default: 0.35, type: 'float', desc: 'Dropout rate' },
      batch_size: { label: 'Batch Size', default: 192, type: 'int', desc: 'Training batch size' },
      learning_rate: { label: 'Learning Rate', default: 0.0006, type: 'float', desc: 'Optimizer learning rate' },
      weight_decay: { label: 'Weight Decay', default: 0.0, type: 'float', desc: 'L2 regularization' }
    },
    bayesParams: {
      history_length: { min: 64, max: 160, step: 8, log: false, type: 'int' },
      units: { min: 64, max: 384, step: 8, log: false, type: 'int' },
      num_layers: { min: 2, max: 10, step: 2, log: false, type: 'int' },
      dropout: { min: 0.2, max: 0.5, log: false, type: 'float' },
      batch_size: { min: 64, max: 256, step: 4, log: false, type: 'int' },
      learning_rate: { min: 0.0002, max: 0.002, log: true, type: 'float' },
      weight_decay: { min: 0.0001, max: 0.01, log: true, type: 'float' }
    }
  },
  LSTM: {
    category: 'dl',
    name: 'LSTM',
    fullName: 'Long Short-Term Memory',
    supportsHistory: true,
    isSequential: true,
    params: {
      history_length: { label: 'History Length', default: 108, type: 'int', desc: 'Sequence length' },
      units: { label: 'Units', default: 192, type: 'int', desc: 'Hidden units per layer' },
      num_layers: { label: 'Num Layers', default: 8, type: 'int', desc: 'Number of LSTM layers' },
      dropout: { label: 'Dropout', default: 0.4, type: 'float', desc: 'Dropout rate' },
      batch_size: { label: 'Batch Size', default: 128, type: 'int', desc: 'Training batch size' },
      learning_rate: { label: 'Learning Rate', default: 0.001, type: 'float', desc: 'Optimizer learning rate' },
      weight_decay: { label: 'Weight Decay', default: 0.0, type: 'float', desc: 'L2 regularization' }
    },
    bayesParams: {
      history_length: { min: 64, max: 160, step: 8, log: false, type: 'int' },
      units: { min: 64, max: 384, step: 8, log: false, type: 'int' },
      num_layers: { min: 2, max: 10, step: 2, log: false, type: 'int' },
      dropout: { min: 0.2, max: 0.5, log: false, type: 'float' },
      batch_size: { min: 64, max: 256, step: 4, log: false, type: 'int' },
      learning_rate: { min: 0.0002, max: 0.002, log: true, type: 'float' },
      weight_decay: { min: 0.0001, max: 0.01, log: true, type: 'float' }
    }
  },
  GRU: {
    category: 'dl',
    name: 'GRU',
    fullName: 'Gated Recurrent Unit',
    supportsHistory: true,
    isSequential: true,
    params: {
      history_length: { label: 'History Length', default: 64, type: 'int', desc: 'Sequence length' },
      units: { label: 'Units', default: 192, type: 'int', desc: 'Hidden units per layer' },
      num_layers: { label: 'Num Layers', default: 8, type: 'int', desc: 'Number of GRU layers' },
      dropout: { label: 'Dropout', default: 0.35, type: 'float', desc: 'Dropout rate' },
      batch_size: { label: 'Batch Size', default: 192, type: 'int', desc: 'Training batch size' },
      learning_rate: { label: 'Learning Rate', default: 0.0006, type: 'float', desc: 'Optimizer learning rate' },
      weight_decay: { label: 'Weight Decay', default: 0.0, type: 'float', desc: 'L2 regularization' }
    },
    bayesParams: {
      history_length: { min: 64, max: 160, step: 8, log: false, type: 'int' },
      units: { min: 64, max: 384, step: 8, log: false, type: 'int' },
      num_layers: { min: 2, max: 10, step: 2, log: false, type: 'int' },
      dropout: { min: 0.2, max: 0.5, log: false, type: 'float' },
      batch_size: { min: 64, max: 256, step: 4, log: false, type: 'int' },
      learning_rate: { min: 0.0002, max: 0.002, log: true, type: 'float' },
      weight_decay: { min: 0.0001, max: 0.01, log: true, type: 'float' }
    }
  },
  // Machine Learning models
  XGBoost: {
    category: 'ml',
    name: 'XGBoost',
    fullName: 'Extreme Gradient Boosting',
    supportsHistory: false,
    isSequential: false,
    params: {
      max_depth: { label: 'Max Depth', default: 8, type: 'int', desc: 'Maximum tree depth' },
      learning_rate: { label: 'Learning Rate', default: 0.05, type: 'float', desc: 'Boosting learning rate' },
      subsample: { label: 'Subsample', default: 0.9, type: 'float', desc: 'Subsample ratio' },
      colsample_bytree: { label: 'Col Sample', default: 0.8, type: 'float', desc: 'Column sample ratio' },
      gamma: { label: 'Gamma', default: 0.0, type: 'float', desc: 'Min loss reduction' },
      reg_lambda: { label: 'Lambda', default: 1.0, type: 'float', desc: 'L2 regularization' },
      min_child_weight: { label: 'Min Child Weight', default: 1.0, type: 'float', desc: 'Min sum of weights' }
    },
    bayesParams: {
      max_depth: { min: 4, max: 30, step: 2, log: false, type: 'int' },
      learning_rate: { min: 0.002, max: 0.03, log: true, type: 'float' },
      subsample: { min: 0.6, max: 1.0, log: true, type: 'float' },
      colsample_bytree: { min: 0.6, max: 1.0, log: true, type: 'float' },
      gamma: { min: 0.0, max: 2.0, log: true, type: 'float' },
      reg_lambda: { min: 0.5, max: 5.0, log: true, type: 'float' },
      min_child_weight: { min: 1, max: 10, step: 1, log: false, type: 'int' }
    }
  },
  LightGBM: {
    category: 'ml',
    name: 'LightGBM',
    fullName: 'Light Gradient Boosting Machine',
    supportsHistory: false,
    isSequential: false,
    params: {
      num_leaves: { label: 'Num Leaves', default: 255, type: 'int', desc: 'Max number of leaves' },
      max_depth: { label: 'Max Depth', default: -1, type: 'int', desc: 'Max tree depth (-1 for no limit)' },
      learning_rate: { label: 'Learning Rate', default: 0.05, type: 'float', desc: 'Boosting learning rate' },
      subsample: { label: 'Subsample', default: 0.9, type: 'float', desc: 'Subsample ratio' },
      colsample_bytree: { label: 'Col Sample', default: 0.8, type: 'float', desc: 'Column sample ratio' },
      min_child_samples: { label: 'Min Child Samples', default: 40, type: 'int', desc: 'Min samples per leaf' },
      reg_alpha: { label: 'Alpha', default: 0.0, type: 'float', desc: 'L1 regularization' },
      reg_lambda: { label: 'Lambda', default: 1.0, type: 'float', desc: 'L2 regularization' }
    },
    bayesParams: {
      max_depth: { min: 4, max: 30, step: 2, log: false, type: 'int' },
      learning_rate: { min: 0.002, max: 0.02, log: true, type: 'float' },
      subsample: { min: 0.6, max: 1.0, log: true, type: 'float' },
      colsample_bytree: { min: 0.6, max: 1.0, log: true, type: 'float' },
      reg_alpha: { min: 0.0, max: 2.0, log: true, type: 'float' },
      reg_lambda: { min: 0.5, max: 5.0, log: true, type: 'float' },
      min_child_samples: { min: 10, max: 100, step: 5, log: false, type: 'int' }
    }
  },
  CatBoost: {
    category: 'ml',
    name: 'CatBoost',
    fullName: 'Categorical Boosting',
    supportsHistory: false,
    isSequential: false,
    params: {
      depth: { label: 'Depth', default: 8, type: 'int', desc: 'Tree depth' },
      learning_rate: { label: 'Learning Rate', default: 0.05, type: 'float', desc: 'Boosting learning rate' },
      l2_leaf_reg: { label: 'L2 Leaf Reg', default: 3.0, type: 'float', desc: 'L2 regularization' },
      subsample: { label: 'Subsample', default: 0.8, type: 'float', desc: 'Subsample ratio' },
      random_strength: { label: 'Random Strength', default: 1.0, type: 'float', desc: 'Randomness for scoring' },
      bagging_temperature: { label: 'Bagging Temp', default: 1.0, type: 'float', desc: 'Bagging temperature' }
    },
    bayesParams: {
      depth: { min: 4, max: 12, step: 1, log: false, type: 'int' },
      learning_rate: { min: 0.002, max: 0.03, log: true, type: 'float' },
      l2_leaf_reg: { min: 1.0, max: 10.0, log: true, type: 'float' },
      subsample: { min: 0.6, max: 1.0, log: true, type: 'float' },
      random_strength: { min: 0.1, max: 1.0, log: true, type: 'float' },
      bagging_temperature: { min: 0.0, max: 1.0, log: true, type: 'float' }
    }
  }
}

const ALL_DL_MODELS = ['MLP', 'RNN', 'LSTM', 'GRU']
const ML_MODELS = ['XGBoost', 'LightGBM', 'CatBoost']

export function ModelConfig({ mode = 'manual', dataMode = 'sequential' }) {
  const [category, setCategory] = useState('dl')
  const [selectedModel, setSelectedModel] = useState('LSTM')
  const [outputDir, setOutputDir] = useState('./output')
  const [maxEpochs, setMaxEpochs] = useState(500)
  const [seed, setSeed] = useState(42)

  // Single mode parameters
  const [singleParams, setSingleParams] = useState({})

  // Autotune mode parameters (ranges)
  const [bayesParams, setBayesParams] = useState({})

  const modelConfig = useMemo(() => MODEL_CONFIGS[selectedModel], [selectedModel])

  // Filter DL models based on dataMode
  const DL_MODELS = useMemo(() => {
    if (dataMode === 'tabular') {
      return ALL_DL_MODELS.filter((m) => !MODEL_CONFIGS[m].isSequential)
    }
    return ALL_DL_MODELS
  }, [dataMode])

  const availableModels = category === 'dl' ? DL_MODELS : ML_MODELS

  // Initialize parameters when model changes
  useEffect(() => {
    if (modelConfig) {
      const initSingle = {}
      Object.entries(modelConfig.params).forEach(([key, config]) => {
        initSingle[key] = config.default
      })
      setSingleParams(initSingle)

      const initBayes = {}
      Object.entries(modelConfig.bayesParams).forEach(([key, config]) => {
        initBayes[key] = { ...config }
      })
      setBayesParams(initBayes)
    }
  }, [modelConfig])

  // Update selected model when category or dataMode changes
  useEffect(() => {
    if (category === 'dl') {
      if (!DL_MODELS.includes(selectedModel)) {
        setSelectedModel(DL_MODELS[0] || 'MLP')
      }
    } else if (category === 'ml' && !ML_MODELS.includes(selectedModel)) {
      setSelectedModel('XGBoost')
    }
  }, [category, selectedModel, DL_MODELS])

  const handleSingleParamChange = (key, value) => {
    setSingleParams((prev) => ({ ...prev, [key]: value }))
  }

  const handleBayesParamChange = (key, field, value) => {
    setBayesParams((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }))
  }

  return (
    <div className="space-y-6">
      {/* Category Selection */}
      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            Model Selection
          </CardTitle>
          <CardDescription>
            Choose model category and select a specific model
            {dataMode === 'tabular' && (
              <span className="ml-2 text-amber-500">• Sequential models hidden in Tabular mode</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* ML/DL Toggle */}
          <div className="space-y-2">
            <Label>Model Category</Label>
            <div className="flex gap-2">
              <Button
                variant={category === 'dl' ? 'default' : 'outline'}
                onClick={() => setCategory('dl')}
                className="flex-1"
              >
                <Brain className="w-4 h-4 mr-2" />
                Deep Learning
              </Button>
              <Button
                variant={category === 'ml' ? 'default' : 'outline'}
                onClick={() => setCategory('ml')}
                className="flex-1"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Machine Learning
              </Button>
            </div>
          </div>

          {/* Model Cards */}
          <div className="space-y-2">
            <Label>Select Model</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {availableModels.map((model) => (
                <button
                  key={model}
                  onClick={() => setSelectedModel(model)}
                  className={`
                    p-4 rounded-lg border-2 transition-all text-left
                    ${selectedModel === model
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50 bg-secondary/30'}
                  `}
                >
                  <div className="font-semibold">{model}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {MODEL_CONFIGS[model].fullName}
                  </div>
                  {MODEL_CONFIGS[model].isSequential && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      Sequential
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model Parameters */}
      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sliders className="w-6 h-6 text-primary" />
            {mode === 'manual' ? 'Model Parameters' : 'Bayesian Tuning Ranges'}
          </CardTitle>
          <CardDescription>
            {mode === 'manual'
              ? `Configure hyperparameters for ${selectedModel}`
              : `Set parameter search ranges for ${selectedModel} optimization`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === 'manual' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modelConfig &&
                Object.entries(modelConfig.params).map(([key, config]) => (
                  <div key={key} className="space-y-2">
                    <Label className="flex items-center gap-2">
                      {config.label}
                      <Badge variant="secondary" className="text-[10px]">
                        {config.type}
                      </Badge>
                    </Label>
                    <Input
                      type="number"
                      step={config.type === 'float' ? 0.0001 : 1}
                      value={singleParams[key] ?? config.default}
                      onChange={(e) => handleSingleParamChange(key, parseFloat(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">{config.desc}</p>
                  </div>
                ))}
            </div>
          ) : (
            <div className="space-y-4">
              {modelConfig &&
                Object.entries(modelConfig.bayesParams).map(([key, config]) => (
                  <div key={key} className="p-4 rounded-lg bg-secondary/30 border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="font-semibold">
                        {modelConfig.params[key]?.label || key}
                      </Label>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleBayesParamChange(key, 'log', !bayesParams[key]?.log)
                          }
                          className={`px-2 py-1 text-xs rounded border transition-all ${
                            bayesParams[key]?.log
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'border-border text-muted-foreground hover:border-primary/50'
                          }`}
                        >
                          {bayesParams[key]?.log ? 'Log' : 'Uniform'}
                        </button>
                        <Badge variant="outline" className="text-xs">
                          {bayesParams[key]?.type || config.type}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Min</Label>
                        <Input
                          type="number"
                          step={config.type === 'float' ? 0.0001 : 1}
                          value={bayesParams[key]?.min ?? config.min}
                          onChange={(e) =>
                            handleBayesParamChange(key, 'min', parseFloat(e.target.value))
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Max</Label>
                        <Input
                          type="number"
                          step={config.type === 'float' ? 0.0001 : 1}
                          value={bayesParams[key]?.max ?? config.max}
                          onChange={(e) =>
                            handleBayesParamChange(key, 'max', parseFloat(e.target.value))
                          }
                        />
                      </div>
                      {config.step !== undefined && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Step</Label>
                          <Input
                            type="number"
                            step={config.type === 'float' ? 0.0001 : 1}
                            value={bayesParams[key]?.step ?? config.step}
                            onChange={(e) =>
                              handleBayesParamChange(key, 'step', parseFloat(e.target.value))
                            }
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Training Settings */}
      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="w-6 h-6 text-primary" />
            Training Settings
          </CardTitle>
          <CardDescription>General training configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Max Epochs</Label>
              <Input
                type="number"
                value={maxEpochs}
                onChange={(e) => setMaxEpochs(parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Random Seed</Label>
              <Input
                type="number"
                value={seed}
                onChange={(e) => setSeed(parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FolderOutput className="w-4 h-4" />
                Output Directory
              </Label>
              <Input
                type="text"
                value={outputDir}
                onChange={(e) => setOutputDir(e.target.value)}
                placeholder="./output"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mode Indicator */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
        <div className="flex items-center gap-3">
          <Zap className={`w-5 h-5 ${mode === 'autotune' ? 'text-yellow-500' : 'text-primary'}`} />
          <div>
            <p className="font-medium">
              {mode === 'manual' ? 'Manual Training Mode' : 'Bayesian Autotune Mode'}
            </p>
            <p className="text-sm text-muted-foreground">
              {mode === 'manual'
                ? 'Train with fixed hyperparameters'
                : 'Automatic hyperparameter optimization with Bayesian search'}
            </p>
          </div>
        </div>
        <Badge variant={mode === 'autotune' ? 'default' : 'secondary'}>{selectedModel}</Badge>
      </div>
    </div>
  )
}
