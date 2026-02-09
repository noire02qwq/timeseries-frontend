import React, { useState } from 'react'
import { Brain, Database, Settings, LineChart, BarChart3, Zap, SlidersHorizontal } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { DataUpload } from './components/DataUpload'
import { TimeSeriesChart } from './components/TimeSeriesChart'
import { ModelConfig } from './components/ModelConfig'
import { TrainingMonitor } from './components/TrainingMonitor'
import { ResultsDashboard } from './components/ResultsDashboard'

function App() {
  // Global state for mode selection
  const [mode, setMode] = useState('single') // 'single' or 'autotune'
  
  // Shared data state between components
  const [uploadedData, setUploadedData] = useState(null)
  const [columns, setColumns] = useState([])
  const [columnRoles, setColumnRoles] = useState({})
  const [splitConfig, setSplitConfig] = useState(null)

  // Handle data loaded from DataUpload
  const handleDataLoaded = (dataConfig) => {
    setUploadedData(dataConfig.data)
    setColumns(dataConfig.columns)
    setColumnRoles(dataConfig.columnRoles)
    setSplitConfig(dataConfig.splitConfig)
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg gradient-purple-blue flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">DBPs Time Series Analysis</h1>
                <p className="text-xs text-muted-foreground">Deep Learning Workflow Platform</p>
              </div>
            </div>
            
            {/* Mode Toggle Switch */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 p-1 rounded-lg bg-secondary border border-border">
                <button
                  onClick={() => setMode('single')}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
                    ${mode === 'single' 
                      ? 'bg-primary text-primary-foreground shadow-lg' 
                      : 'text-muted-foreground hover:text-foreground'}
                  `}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Single
                </button>
                <button
                  onClick={() => setMode('autotune')}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
                    ${mode === 'autotune' 
                      ? 'bg-primary text-primary-foreground shadow-lg' 
                      : 'text-muted-foreground hover:text-foreground'}
                  `}
                >
                  <Zap className="w-4 h-4" />
                  Autotune
                </button>
              </div>
              
              <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                v1.1.0
              </div>
            </div>
          </div>
          
          {/* Mode Description */}
          <div className="mt-2 text-xs text-muted-foreground">
            {mode === 'single' 
              ? '📊 Single Mode: Train with fixed hyperparameters'
              : '🔧 Autotune Mode: Bayesian hyperparameter optimization'}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="data" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
            <TabsTrigger value="data" className="gap-2">
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Data</span>
            </TabsTrigger>
            <TabsTrigger value="visualize" className="gap-2">
              <LineChart className="w-4 h-4" />
              <span className="hidden sm:inline">Visualize</span>
            </TabsTrigger>
            <TabsTrigger value="model" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Model</span>
            </TabsTrigger>
            <TabsTrigger value="training" className="gap-2">
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">Training</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Results</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="data" className="space-y-4">
            <DataUpload onDataLoaded={handleDataLoaded} />
          </TabsContent>

          <TabsContent value="visualize" className="space-y-4">
            <TimeSeriesChart 
              data={uploadedData} 
              columns={columns}
              columnRoles={columnRoles}
            />
          </TabsContent>

          <TabsContent value="model" className="space-y-4">
            <ModelConfig mode={mode} />
          </TabsContent>

          <TabsContent value="training" className="space-y-4">
            <TrainingMonitor mode={mode} />
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            <ResultsDashboard mode={mode} columnRoles={columnRoles} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="container mx-auto px-6 py-6">
          <p className="text-center text-sm text-muted-foreground">
            Deep Learning Time Series Analysis Platform for DBPs Monitoring
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
