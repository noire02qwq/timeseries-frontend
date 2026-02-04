import React, { useState } from 'react'
import { Settings, Brain, Layers } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { Button } from './ui/button'

export function ModelConfig() {
  const [config, setConfig] = useState({
    modelType: 'LSTM',
    epochs: 100,
    batchSize: 32,
    learningRate: 0.001,
    hiddenLayers: 2,
    neuronsPerLayer: 64,
    dropoutRate: 0.2,
    windowSize: 24
  })

  const updateConfig = (key, value) => {
    setConfig({ ...config, [key]: value })
  }

  return (
    <div className="space-y-6">
      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            Model Selection
          </CardTitle>
          <CardDescription>Choose the deep learning architecture for time series analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['LSTM', 'GRU', 'Transformer'].map((model) => (
              <button
                key={model}
                onClick={() => updateConfig('modelType', model)}
                className={`
                  p-4 rounded-lg border-2 transition-all text-left
                  ${
                    config.modelType === model
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }
                `}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">{model}</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  {model === 'LSTM'
                    ? 'Long Short-Term Memory network'
                    : model === 'GRU'
                      ? 'Gated Recurrent Unit network'
                      : 'Attention-based architecture'}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            Hyperparameters
          </CardTitle>
          <CardDescription>Configure training and model parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="epochs">Training Epochs</Label>
              <Input
                id="epochs"
                type="number"
                value={config.epochs}
                onChange={(e) => updateConfig('epochs', parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Number of training iterations</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="batchSize">Batch Size</Label>
              <Input
                id="batchSize"
                type="number"
                value={config.batchSize}
                onChange={(e) => updateConfig('batchSize', parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Samples per training batch</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="learningRate">Learning Rate</Label>
              <Input
                id="learningRate"
                type="number"
                step="0.0001"
                value={config.learningRate}
                onChange={(e) => updateConfig('learningRate', parseFloat(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Optimizer learning rate</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hiddenLayers">Hidden Layers</Label>
              <Input
                id="hiddenLayers"
                type="number"
                value={config.hiddenLayers}
                onChange={(e) => updateConfig('hiddenLayers', parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Number of hidden layers</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="neurons">Neurons per Layer</Label>
              <Input
                id="neurons"
                type="number"
                value={config.neuronsPerLayer}
                onChange={(e) => updateConfig('neuronsPerLayer', parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Units in each layer</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dropout">Dropout Rate</Label>
              <Input
                id="dropout"
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={config.dropoutRate}
                onChange={(e) => updateConfig('dropoutRate', parseFloat(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Regularization dropout</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="windowSize">Time Window (hours)</Label>
              <Input
                id="windowSize"
                type="number"
                value={config.windowSize}
                onChange={(e) => updateConfig('windowSize', parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Input sequence length</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <Button className="w-full gradient-purple-blue">
              <Brain className="w-4 h-4 mr-2" />
              Initialize Model
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
