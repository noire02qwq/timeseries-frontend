import { useEffect, useState, useRef } from 'react'
import {
  Brain,
  Database,
  Settings,
  BarChart3,
  Zap,
  Layers,
  ArrowRightLeft,
  SlidersHorizontal,
  Crosshair,
  LineChart as LineChartIcon,
  ArrowRight,
  Loader2
} from 'lucide-react'
import { Tabs, TabsContent, TabsTrigger, TabsList } from './components/ui/tabs'
import { DataUpload } from './components/DataUpload'
import { ModelConfig } from './components/ModelConfig'
import { TrainingMonitor } from './components/TrainingMonitor'
import { ResultsDashboard } from './components/ResultsDashboard'
import { PredictionPage } from './components/PredictionPage'
import { TimeSeriesChart } from './components/TimeSeriesChart'
import { useWorkflowStore } from './store/workflowStore'
import { healthCheck } from './services/api'

const STEP_TO_TAB = {
  data_upload: 'data',
  data_split: 'data',
  model_config: 'model',
  training: 'training',
  results: 'results'
}

// Navigation notification component
function NavNotification({ message, type, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-in slide-in-from-bottom-2 ${
        type === 'success'
          ? 'bg-green-900/90 border-green-700 text-green-100'
          : type === 'info'
          ? 'bg-blue-900/90 border-blue-700 text-blue-100'
          : 'bg-gray-900/90 border-gray-700 text-gray-100'
      }`}
    >
      {type === 'info' ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <ArrowRight className="w-5 h-5" />
      )}
      <span className="text-sm font-medium">{message}</span>
    </div>
  )
}

// Debug panel to show system state
function DebugPanel() {
  const { training, tuning, trainingMode } = useWorkflowStore()
  const [lossDebug, setLossDebug] = useState(null)
  const [compDebug, setCompDebug] = useState(null)
  const [debugOpen, setDebugOpen] = useState(false)
  const activeJob = trainingMode === 'autotune' ? tuning : training

  const testLossHistory = async () => {
    if (!activeJob.jobId) {
      setLossDebug({ error: 'No jobId - start training first' })
      return
    }
    try {
      const resp = await fetch(`http://localhost:5555/api/v1/jobs/${activeJob.jobId}/loss-history`)
      const data = await resp.json()
      setLossDebug({
        status: resp.status,
        success: data.success,
        rows: data.data?.lossHistory?.length || 0,
        columns: data.data?.columns || [],
        firstRow: data.data?.lossHistory?.[0] || null,
        error: data.error?.message || null
      })
    } catch (e) {
      setLossDebug({ error: e.message })
    }
  }

  const testComparison = async () => {
    if (!activeJob.jobId) {
      setCompDebug({ error: 'No jobId - start training first' })
      return
    }
    try {
      const resp = await fetch(`http://localhost:5555/api/v1/jobs/${activeJob.jobId}/test-comparison`)
      const data = await resp.json()
      setCompDebug({
        status: resp.status,
        success: data.success,
        rows: data.data?.comparison?.length || 0,
        outputColumns: data.data?.outputColumns || [],
        firstRow: data.data?.comparison?.[0] || null,
        error: data.error?.message || null
      })
    } catch (e) {
      setCompDebug({ error: e.message })
    }
  }

  return (
    <>
      <button
        onClick={() => setDebugOpen(!debugOpen)}
        className="fixed bottom-6 left-6 z-50 px-3 py-2 bg-yellow-900/90 border border-yellow-600 text-yellow-200 rounded-lg text-xs font-mono shadow-lg"
      >
        {debugOpen ? 'Hide Debug' : 'Debug Panel'}
      </button>

      {debugOpen && (
        <div className="fixed bottom-20 left-6 z-50 w-96 bg-gray-900/95 border border-gray-600 rounded-lg p-4 shadow-xl text-xs font-mono text-gray-200 max-h-[70vh] overflow-auto">
          <h3 className="font-bold text-yellow-400 mb-3">🔧 System Debug Panel</h3>

          <div className="mb-3 p-2 bg-gray-800 rounded">
            <div className="font-bold text-gray-400 mb-1">Current State:</div>
            <div>Mode: <span className="text-green-400">{trainingMode}</span></div>
            <div>JobId: <span className={activeJob.jobId ? 'text-green-400' : 'text-red-400'}>{activeJob.jobId || 'null'}</span></div>
            <div>Status: <span className="text-blue-400">{activeJob.status}</span></div>
            <div>Progress: <span className="text-blue-400">{activeJob.progress?.toFixed(1)}%</span></div>
          </div>

          <div className="mb-3">
            <div className="font-bold text-gray-400 mb-1">Loss History API Test:</div>
            <button onClick={testLossHistory} className="mb-2 px-2 py-1 bg-blue-700 hover:bg-blue-600 rounded text-white">
              Test /loss-history API
            </button>
            {lossDebug && (
              <pre className="p-2 bg-gray-800 rounded overflow-auto max-h-40 text-[10px]">
                {JSON.stringify(lossDebug, null, 2)}
              </pre>
            )}
          </div>

          <div className="mb-3">
            <div className="font-bold text-gray-400 mb-1">Test Comparison API Test:</div>
            <button onClick={testComparison} className="mb-2 px-2 py-1 bg-blue-700 hover:bg-blue-600 rounded text-white">
              Test /test-comparison API
            </button>
            {compDebug && (
              <pre className="p-2 bg-gray-800 rounded overflow-auto max-h-40 text-[10px]">
                {JSON.stringify(compDebug, null, 2)}
              </pre>
            )}
          </div>

          <div className="text-[10px] text-gray-500 mt-2">
            Note: After starting training, wait for completion then run test, then check results.
          </div>
        </div>
      )}
    </>
  )
}

function App() {
  const {
    currentStep,
    dataMode,
    trainingMode,
    setDataMode,
    setTrainingMode,
    training,
    tuning
  } = useWorkflowStore()

  const [activeTab, setActiveTab] = useState(STEP_TO_TAB[currentStep] || 'data')
  const [navNotification, setNavNotification] = useState(null)

  // Track previous job IDs to detect new training/tuning starts
  const prevTrainingJobId = useRef(null)
  const prevTuningJobId = useRef(null)

  // Auto-switch tab when workflow step changes
  useEffect(() => {
    const targetTab = STEP_TO_TAB[currentStep]
    if (targetTab && targetTab !== activeTab) {
      setActiveTab(targetTab)
    }
  }, [currentStep])

  // Auto-navigate to Training tab when a new job starts
  useEffect(() => {
    const { training, tuning } = useWorkflowStore.getState()

    // Use a ref to avoid triggering re-render cascade
    if (training.jobId && training.jobId !== prevTrainingJobId.current) {
      console.log('[App] Auto-navigating to training (manual):', training.jobId)
      prevTrainingJobId.current = training.jobId
      // Delay navigation slightly to avoid cascade
      requestAnimationFrame(() => {
        setActiveTab('training')
        setNavNotification({ message: 'Training started! Switching to Training tab...', type: 'info' })
      })
    }
    if (tuning.jobId && tuning.jobId !== prevTuningJobId.current) {
      console.log('[App] Auto-navigating to training (autotune):', tuning.jobId)
      prevTuningJobId.current = tuning.jobId
      requestAnimationFrame(() => {
        setActiveTab('training')
        setNavNotification({ message: 'Autotune started! Switching to Training tab...', type: 'info' })
      })
    }
  }, [training.jobId, tuning.jobId])

  // Backend health check on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        await healthCheck()
      } catch (err) {
        console.error('Backend not available:', err)
      }
    }
    checkBackend()
    const interval = setInterval(checkBackend, 30000)
    return () => clearInterval(interval)
  }, [])

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

            {/* Mode Toggles */}
            <div className="flex items-center gap-3">
              {/* Data Mode Toggle */}
              <div className="flex items-center gap-2 p-1 rounded-lg bg-secondary border border-border">
                <button
                  onClick={() => setDataMode('sequential')}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                    ${dataMode === 'sequential'
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'text-muted-foreground hover:text-foreground'}
                  `}
                >
                  <Layers className="w-4 h-4" />
                  Sequential
                </button>
                <button
                  onClick={() => setDataMode('tabular')}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                    ${dataMode === 'tabular'
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'text-muted-foreground hover:text-foreground'}
                  `}
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  Tabular
                </button>
              </div>

              {/* Training Mode Toggle */}
              <div className="flex items-center gap-2 p-1 rounded-lg bg-secondary border border-border">
                <button
                  onClick={() => setTrainingMode('manual')}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                    ${trainingMode === 'manual'
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'text-muted-foreground hover:text-foreground'}
                  `}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Manual
                </button>
                <button
                  onClick={() => setTrainingMode('autotune')}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                    ${trainingMode === 'autotune'
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'text-muted-foreground hover:text-foreground'}
                  `}
                >
                  <Zap className="w-4 h-4" />
                  Autotune
                </button>
              </div>

              <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                v1.2.0
              </div>
            </div>
          </div>

          {/* Mode Description */}
          <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
            <span>
              {dataMode === 'sequential'
                ? 'Sequential Data: preserves time order during splitting'
                : 'Tabular Data: rows randomly shuffled during splitting'}
            </span>
            <span>|</span>
            <span>
              {trainingMode === 'manual'
                ? 'Manual Mode: train with fixed hyperparameters'
                : 'Autotune Mode: Bayesian hyperparameter optimization'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-flex">
            <TabsTrigger value="data" className="gap-2">
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Data</span>
            </TabsTrigger>
            <TabsTrigger value="visualize" className="gap-2">
              <LineChartIcon className="w-4 h-4" />
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
            <TabsTrigger value="prediction" className="gap-2">
              <Crosshair className="w-4 h-4" />
              <span className="hidden sm:inline">Prediction</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="data" className="space-y-4">
            <DataUpload />
          </TabsContent>

          <TabsContent value="visualize" className="space-y-4">
            <TimeSeriesChart />
          </TabsContent>

          <TabsContent value="model" className="space-y-4">
            <ModelConfig />
          </TabsContent>

          <TabsContent value="training" className="space-y-4">
            <TrainingMonitor />
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            <ResultsDashboard />
          </TabsContent>

          <TabsContent value="prediction" className="space-y-4">
            <PredictionPage />
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

      {/* Navigation Notification */}
      {navNotification && (
        <NavNotification
          message={navNotification.message}
          type={navNotification.type}
          onDismiss={() => setNavNotification(null)}
        />
      )}

      {/* Debug Panel */}
      <DebugPanel />
    </div>
  )
}

export default App
