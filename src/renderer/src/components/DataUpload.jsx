import { useState, useCallback, useRef } from 'react'
import { Upload, FileText, X, Check, Database, Split, Loader2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'
import { useWorkflowStore, WORKFLOW_STEPS } from '../store/workflowStore'
import { dataApi } from '../services/api'
import { API_CONFIG, ENDPOINTS } from '../services/config'

// Column role definitions
const COLUMN_ROLES = {
  INPUT: 'input',
  OUTPUT: 'output',
  REFERENCE: 'reference',
  UNUSED: 'unused'
}

const ROLE_COLORS = {
  input: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  output: 'bg-green-500/20 text-green-400 border-green-500/50',
  reference: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  unused: 'bg-gray-500/20 text-gray-400 border-gray-500/50'
}

const ROLE_ICONS = {
  input: '→',
  output: '⚡',
  reference: '📍',
  unused: '○'
}

export function DataUpload() {
  // Get state from store
  const {
    currentStep,
    dataMode,
    dataset,
    splitConfig,
    setCurrentStep,
    setDataset,
    setColumnRole,
    setSplitConfig,
    getInputColumns,
    getOutputColumns
  } = useWorkflowStore()

  // Local UI state
  const fileInputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [splitting, setSplitting] = useState(false)
  const [error, setError] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  // File handling
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
    if (!file) return

    await uploadFile(file)
  }, [])

  const handleFileInput = useCallback(async (e) => {
    const file = e.target.files[0]
    if (!file) return

    await uploadFile(file)
  }, [])

  const uploadFile = async (file) => {
    // Validate file type
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      setError('Please upload a CSV or XLSX file')
      return
    }

    try {
      setUploading(true)
      setError(null)
      setUploadProgress(0)

      // Call backend API
      const response = await dataApi.upload(file, (progress) => {
        setUploadProgress(progress)
      })

      // Update store with dataset info
      setDataset({
        id: response.data.datasetId,
        fileName: file.name,
        fileSize: file.size,
        rowCount: response.data.rowCount || 0,
        columns: response.data.columns || [],
        columnRoles: {},
        previewData: null
      })

      // Fetch preview data in background
      try {
        const previewUrl = `${API_CONFIG.BASE_URL}${ENDPOINTS.DATA_PREVIEW}/${response.data.datasetId}?limit=500`
        const previewResponse = await fetch(previewUrl)
        const previewData = await previewResponse.json()
        if (previewData.success && previewData.data.rows) {
          useWorkflowStore.getState().setDataset({
            previewData: previewData.data.rows
          })
        }
      } catch (previewErr) {
        console.warn('Failed to fetch preview data:', previewErr)
      }

      // Initialize column roles (first column as reference, next as input/output)
      if (response.data.columns) {
        response.data.columns.forEach((col, index) => {
          let role = COLUMN_ROLES.UNUSED
          if (index === 0) {
            role = COLUMN_ROLES.REFERENCE
          } else if (index === 1) {
            role = COLUMN_ROLES.INPUT
          } else if (index === 2) {
            role = COLUMN_ROLES.OUTPUT
          }
          setColumnRole(col.name, role)
        })
      }

    } catch (err) {
      setError(err.message || 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  // Handle dataset split
  const handleSplit = async () => {
    if (!dataset.id) {
      setError('Please upload a dataset first')
      return
    }

    const inputCols = getInputColumns()
    const outputCols = getOutputColumns()

    if (inputCols.length === 0) {
      setError('Please select at least one input column')
      return
    }

    if (outputCols.length === 0) {
      setError('Please select at least one output column')
      return
    }

    try {
      setSplitting(true)
      setError(null)

      const response = await dataApi.split(dataset.id, {
        trainRatio: splitConfig.trainRatio,
        valRatio: splitConfig.valRatio,
        testRatio: splitConfig.testRatio,
        shuffle: dataMode === 'tabular',
        seed: splitConfig.seed,
        inputColumns: inputCols,
        outputColumns: outputCols
      })

      // Update store with split result
      setSplitConfig({
        ...splitConfig,
        splitId: response.data.splitId,
        trainPath: response.data.trainPath,
        valPath: response.data.valPath,
        testPath: response.data.testPath
      })

      // Move to next step
      setCurrentStep(WORKFLOW_STEPS.MODEL_CONFIG)

    } catch (err) {
      setError(err.message || 'Failed to split dataset')
    } finally {
      setSplitting(false)
    }
  }

  // Render functions...
  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* File Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Dataset
          </CardTitle>
          <CardDescription>
            Upload a CSV or Excel file containing your time series data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!dataset.id ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer
                ${isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}
              `}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Drag and drop file here</p>
              <p className="text-sm text-muted-foreground mb-4">Supported formats: .csv, .xlsx</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                Select File
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-medium">{dataset.fileName}</p>
                  <p className="text-sm text-muted-foreground">
                    {dataset.rowCount.toLocaleString()} rows × {dataset.columns.length} columns
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => {
                // Reset dataset
                useWorkflowStore.getState().setDataset({
                  id: null,
                  fileName: null,
                  fileSize: null,
                  rowCount: 0,
                  columns: [],
                  columnRoles: {},
                  previewData: null
                })
              }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Column Configuration */}
      {dataset.id && dataset.columns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Column Configuration
            </CardTitle>
            <CardDescription>
              Assign roles to each column: Input (features), Output (targets), Reference (time/index), or Unused
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {dataset.columns.map((col) => {
                const role = dataset.columnRoles[col.name] || COLUMN_ROLES.UNUSED
                return (
                  <div
                    key={col.name}
                    className={`
                      p-3 rounded-lg border transition-all cursor-pointer
                      ${ROLE_COLORS[role]}
                    `}
                    onClick={() => {
                      // Cycle through roles
                      const roles = [COLUMN_ROLES.INPUT, COLUMN_ROLES.OUTPUT, COLUMN_ROLES.REFERENCE, COLUMN_ROLES.UNUSED]
                      const currentIndex = roles.indexOf(role)
                      const nextRole = roles[(currentIndex + 1) % roles.length]
                      setColumnRole(col.name, nextRole)
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium truncate" title={col.name}>
                        {ROLE_ICONS[role]} {col.name}
                      </span>
                    </div>
                    <div className="text-[10px] opacity-70 uppercase tracking-wider">
                      {role}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Role Summary */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                <span>{getInputColumns().length} Inputs</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                <span>{getOutputColumns().length} Outputs</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                <span>
                  {Object.values(dataset.columnRoles).filter(r => r === COLUMN_ROLES.REFERENCE).length} References
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dataset Split Configuration */}
      {dataset.id && getInputColumns().length > 0 && getOutputColumns().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Split className="w-5 h-5" />
              Dataset Split
            </CardTitle>
            <CardDescription>
              Configure how to split your data into training, validation, and test sets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Split Ratios */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Train Ratio</Label>
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={splitConfig.trainRatio}
                  onChange={(e) => setSplitConfig({ trainRatio: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Validation Ratio</Label>
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={splitConfig.valRatio}
                  onChange={(e) => setSplitConfig({ valRatio: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Test Ratio</Label>
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={splitConfig.testRatio}
                  onChange={(e) => setSplitConfig({ testRatio: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            {/* Shuffle Option */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={splitConfig.shuffle}
                  onChange={(e) => setSplitConfig({ shuffle: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span>Shuffle data before splitting</span>
              </label>

              <div className="flex items-center gap-2">
                <Label className="mb-0">Seed:</Label>
                <Input
                  type="number"
                  value={splitConfig.seed}
                  onChange={(e) => setSplitConfig({ seed: parseInt(e.target.value) })}
                  className="w-24"
                />
              </div>
            </div>

            {/* Split Action */}
            <div className="flex justify-end">
              <Button
                onClick={handleSplit}
                disabled={splitting}
                className="gap-2"
              >
                {splitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Splitting...
                  </>
                ) : (
                  <>
                    <Split className="w-4 h-4" />
                    Split Dataset
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
