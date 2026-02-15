import { useState, useCallback, useEffect } from 'react'
import { Upload, FileText, X, Check, Columns, Rows, Settings2, Shuffle, Info } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Label } from './ui/label'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

// Storage key for localStorage
const STORAGE_KEY = 'dbps_upload_state'

// Column role options
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

// Preset split ratios
const SPLIT_PRESETS = [
  { label: '6:2:2', train: 0.6, val: 0.2, test: 0.2 },
  { label: '7:1:2', train: 0.7, val: 0.1, test: 0.2 },
  { label: '7:2:1', train: 0.7, val: 0.2, test: 0.1 },
  { label: '7:1.5:1.5', train: 0.7, val: 0.15, test: 0.15 },
  { label: '8:1:1', train: 0.8, val: 0.1, test: 0.1 }
]

// Load saved state from localStorage
const loadSavedState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.error('Failed to load saved state:', e)
  }
  return null
}

export function DataUpload({ onDataLoaded, dataMode = 'sequential' }) {
  const savedState = loadSavedState()

  const [fileName, setFileName] = useState(savedState?.fileName || null)
  const [fileSize, setFileSize] = useState(savedState?.fileSize || null)
  const [isDragging, setIsDragging] = useState(false)
  const [pendingFile, setPendingFile] = useState(null) // file waiting for Confirm
  const [parsedData, setParsedData] = useState(savedState?.parsedData || null)
  const [columns, setColumns] = useState(savedState?.columns || [])
  const [columnRoles, setColumnRoles] = useState(savedState?.columnRoles || {})
  const [splitConfig, setSplitConfig] = useState(savedState?.splitConfig || {
    trainStart: 1,
    trainEnd: 60,
    valStart: 61,
    valEnd: 80,
    testStart: 81,
    testEnd: 100
  })
  const [error, setError] = useState(null)
  const [confirmed, setConfirmed] = useState(!!savedState?.parsedData)

  // Save state to localStorage whenever data changes
  useEffect(() => {
    if (parsedData && columns.length > 0) {
      const stateToSave = {
        fileName,
        fileSize,
        parsedData,
        columns,
        columnRoles,
        splitConfig
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
      } catch (e) {
        console.error('Failed to save state:', e)
      }
    }
  }, [parsedData, columns, columnRoles, splitConfig, fileName, fileSize])

  // Notify parent on initial load if we have saved data
  useEffect(() => {
    if (savedState?.parsedData && onDataLoaded) {
      onDataLoaded({
        data: savedState.parsedData,
        columns: savedState.columns,
        columnRoles: savedState.columnRoles,
        splitConfig: savedState.splitConfig
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Parse file (CSV or XLSX)
  const parseFile = useCallback((file) => {
    const ext = file.name.split('.').pop().toLowerCase()

    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            setError(`Parse error: ${results.errors[0].message}`)
            return
          }
          processData(results.meta.fields || [], results.data)
        },
        error: (error) => {
          setError(`Failed to parse file: ${error.message}`)
        }
      })
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)
          if (jsonData.length === 0) {
            setError('The spreadsheet is empty')
            return
          }
          const cols = Object.keys(jsonData[0])
          processData(cols, jsonData)
        } catch (err) {
          setError(`Failed to parse XLSX file: ${err.message}`)
        }
      }
      reader.readAsArrayBuffer(file)
    } else {
      setError('Unsupported file format. Please upload CSV or XLSX files.')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const processData = (cols, data) => {
    setParsedData(data)
    setColumns(cols)

    // Initialize column roles
    const initialRoles = {}
    cols.forEach((col, index) => {
      if (index === 0) {
        initialRoles[col] = COLUMN_ROLES.REFERENCE
      } else if (index === 1) {
        initialRoles[col] = COLUMN_ROLES.INPUT
      } else if (index === 2) {
        initialRoles[col] = COLUMN_ROLES.OUTPUT
      } else {
        initialRoles[col] = COLUMN_ROLES.UNUSED
      }
    })
    setColumnRoles(initialRoles)

    // Initialize split config
    const rowCount = data.length
    const trainEnd = Math.floor(rowCount * 0.6)
    const valEnd = Math.floor(rowCount * 0.8)

    const newSplitConfig = {
      trainStart: 1,
      trainEnd: trainEnd,
      valStart: trainEnd + 1,
      valEnd: valEnd,
      testStart: valEnd + 1,
      testEnd: rowCount
    }
    setSplitConfig(newSplitConfig)
    setError(null)
    setConfirmed(true)

    // Callback to parent
    if (onDataLoaded) {
      onDataLoaded({
        data,
        columns: cols,
        columnRoles: initialRoles,
        splitConfig: newSplitConfig
      })
    }
  }

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
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && isValidFile(droppedFile)) {
      setFileName(droppedFile.name)
      setFileSize(droppedFile.size)
      setPendingFile(droppedFile)
      setConfirmed(false)
      setParsedData(null)
    } else {
      setError('Please upload a CSV or XLSX file')
    }
  }

  const handleFileInput = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && isValidFile(selectedFile)) {
      setFileName(selectedFile.name)
      setFileSize(selectedFile.size)
      setPendingFile(selectedFile)
      setConfirmed(false)
      setParsedData(null)
    } else {
      setError('Please upload a CSV or XLSX file')
    }
  }

  const handleConfirm = () => {
    if (pendingFile) {
      parseFile(pendingFile)
    }
  }

  const removeFile = () => {
    setFileName(null)
    setFileSize(null)
    setPendingFile(null)
    setParsedData(null)
    setColumns([])
    setColumnRoles({})
    setError(null)
    setConfirmed(false)
    localStorage.removeItem(STORAGE_KEY)
  }

  const updateColumnRole = (column, role) => {
    if (role === COLUMN_ROLES.REFERENCE) {
      const newRoles = { ...columnRoles }
      Object.keys(newRoles).forEach((col) => {
        if (newRoles[col] === COLUMN_ROLES.REFERENCE) {
          newRoles[col] = COLUMN_ROLES.UNUSED
        }
      })
      newRoles[column] = role
      setColumnRoles(newRoles)
    } else {
      setColumnRoles({ ...columnRoles, [column]: role })
    }
  }

  const applySplitPreset = (preset) => {
    if (!parsedData) return
    const rowCount = parsedData.length
    const trainEnd = Math.floor(rowCount * preset.train)
    const valEnd = Math.floor(rowCount * (preset.train + preset.val))

    setSplitConfig({
      trainStart: 1,
      trainEnd: trainEnd,
      valStart: trainEnd + 1,
      valEnd: valEnd,
      testStart: valEnd + 1,
      testEnd: rowCount
    })
  }

  const handleSplitChange = (field, value) => {
    const numValue = parseInt(value) || 0
    const newConfig = { ...splitConfig, [field]: numValue }

    if (field === 'trainEnd') {
      newConfig.valStart = numValue + 1
    } else if (field === 'valEnd') {
      newConfig.testStart = numValue + 1
    } else if (field === 'valStart') {
      newConfig.trainEnd = numValue - 1
    } else if (field === 'testStart') {
      newConfig.valEnd = numValue - 1
    }

    setSplitConfig(newConfig)
  }

  const isSplitValid = () => {
    if (!parsedData) return false
    const rowCount = parsedData.length
    return (
      splitConfig.trainStart === 1 &&
      splitConfig.trainEnd >= splitConfig.trainStart &&
      splitConfig.valStart === splitConfig.trainEnd + 1 &&
      splitConfig.valEnd >= splitConfig.valStart &&
      splitConfig.testStart === splitConfig.valEnd + 1 &&
      splitConfig.testEnd === rowCount
    )
  }

  return (
    <div className="space-y-6">
      {/* Tabular Mode Info */}
      {dataMode === 'tabular' && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <Shuffle className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-500">Tabular Data Mode</p>
            <p className="text-xs text-muted-foreground">
              Rows will be randomly shuffled before dataset splitting. Time order is not preserved.
            </p>
          </div>
        </div>
      )}

      {/* File Upload Card */}
      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-6 h-6 text-primary" />
            Upload Data
          </CardTitle>
          <CardDescription>
            Upload a CSV or XLSX file containing your dataset. First row should be column headers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!fileName ? (
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
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button asChild>
                  <span>Select File</span>
                </Button>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-medium">{fileName}</p>
                    <p className="text-sm text-muted-foreground">
                      {fileSize ? (fileSize / 1024).toFixed(2) : 0} KB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!confirmed && pendingFile && (
                    <Button onClick={handleConfirm} size="sm">
                      <Check className="w-4 h-4 mr-1" />
                      Confirm
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={removeFile}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {confirmed && parsedData && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Rows className="w-4 h-4" />
                      Rows
                    </div>
                    <div className="text-2xl font-bold text-primary">{parsedData.length}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Columns className="w-4 h-4" />
                      Columns
                    </div>
                    <div className="text-2xl font-bold text-accent">{columns.length}</div>
                  </div>
                  {dataMode === 'tabular' && (
                    <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Shuffle className="w-4 h-4" />
                        Mode
                      </div>
                      <div className="text-lg font-bold text-amber-500">Shuffled</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Column Configuration Card */}
      {confirmed && parsedData && columns.length > 0 && (
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="w-6 h-6 text-primary" />
              Column Configuration
            </CardTitle>
            <CardDescription>
              Assign roles to each column: Input (model features), Output (prediction target), Reference (X-axis), or Unused
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {columns.map((col) => (
                <div
                  key={col}
                  className="p-3 rounded-lg border border-border bg-secondary/30"
                >
                  <p className="font-medium text-sm mb-2 truncate" title={col}>{col}</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(COLUMN_ROLES).map(([key, value]) => (
                      <button
                        key={value}
                        onClick={() => updateColumnRole(col, value)}
                        className={`
                          px-2 py-1 text-xs rounded border transition-all
                          ${columnRoles[col] === value
                            ? ROLE_COLORS[value]
                            : 'bg-transparent border-border text-muted-foreground hover:border-primary/50'}
                        `}
                      >
                        {key.charAt(0) + key.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Role Summary */}
            <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex flex-wrap gap-4 text-sm">
                <span>
                  <strong className="text-blue-400">Input:</strong>{' '}
                  {Object.values(columnRoles).filter((r) => r === 'input').length} columns
                </span>
                <span>
                  <strong className="text-green-400">Output:</strong>{' '}
                  {Object.values(columnRoles).filter((r) => r === 'output').length} columns
                </span>
                <span>
                  <strong className="text-yellow-400">Reference:</strong>{' '}
                  {Object.values(columnRoles).filter((r) => r === 'reference').length} column
                </span>
                <span>
                  <strong className="text-gray-400">Unused:</strong>{' '}
                  {Object.values(columnRoles).filter((r) => r === 'unused').length} columns
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dataset Split Card */}
      {confirmed && parsedData && (
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rows className="w-6 h-6 text-primary" />
              Dataset Split
            </CardTitle>
            <CardDescription>
              Define row ranges for training, validation, and test sets (total: {parsedData.length} rows)
              {dataMode === 'tabular' && (
                <span className="ml-2 text-amber-500">• Rows will be shuffled</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Preset Buttons */}
            <div className="mb-6">
              <Label className="text-sm text-muted-foreground mb-2 block">Quick Presets</Label>
              <div className="flex flex-wrap gap-2">
                {SPLIT_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="outline"
                    size="sm"
                    onClick={() => applySplitPreset(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Split Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Training Set */}
              <div className="p-4 rounded-lg border border-blue-500/30 bg-blue-500/10">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-blue-400 font-medium">Training Set</Label>
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                    {splitConfig.trainEnd - splitConfig.trainStart + 1} rows
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={splitConfig.trainStart}
                    onChange={(e) => handleSplitChange('trainStart', e.target.value)}
                    className="w-20 text-center"
                    min={1}
                    disabled
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="number"
                    value={splitConfig.trainEnd}
                    onChange={(e) => handleSplitChange('trainEnd', e.target.value)}
                    className="w-20 text-center"
                    min={1}
                    max={parsedData.length - 2}
                  />
                </div>
              </div>

              {/* Validation Set */}
              <div className="p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-yellow-400 font-medium">Validation Set</Label>
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                    {splitConfig.valEnd - splitConfig.valStart + 1} rows
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={splitConfig.valStart}
                    onChange={(e) => handleSplitChange('valStart', e.target.value)}
                    className="w-20 text-center"
                    disabled
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="number"
                    value={splitConfig.valEnd}
                    onChange={(e) => handleSplitChange('valEnd', e.target.value)}
                    className="w-20 text-center"
                    min={splitConfig.valStart}
                    max={parsedData.length - 1}
                  />
                </div>
              </div>

              {/* Test Set */}
              <div className="p-4 rounded-lg border border-green-500/30 bg-green-500/10">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-green-400 font-medium">Test Set</Label>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                    {splitConfig.testEnd - splitConfig.testStart + 1} rows
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={splitConfig.testStart}
                    onChange={(e) => handleSplitChange('testStart', e.target.value)}
                    className="w-20 text-center"
                    disabled
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="number"
                    value={splitConfig.testEnd}
                    onChange={(e) => handleSplitChange('testEnd', e.target.value)}
                    className="w-20 text-center"
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* Validation Status */}
            <div className={`mt-4 p-3 rounded-lg border ${isSplitValid()
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-destructive/10 border-destructive/30 text-destructive'}`}
            >
              <div className="flex items-center gap-2">
                {isSplitValid() ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span className="text-sm">Valid split: All {parsedData.length} rows are allocated</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4" />
                    <span className="text-sm">Invalid split: Ranges must be continuous and cover all rows</span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Preview */}
      {confirmed && parsedData && columns.length > 0 && (
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle>Data Preview</CardTitle>
            <CardDescription>First 5 rows of the uploaded data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">#</th>
                    {columns.map((col) => (
                      <th key={col} className="px-4 py-3 text-left font-medium">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[100px]" title={col}>{col}</span>
                          <span className={`px-1.5 py-0.5 text-[10px] rounded ${ROLE_COLORS[columnRoles[col]]}`}>
                            {columnRoles[col]?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 5).map((row, index) => (
                    <tr key={index} className="border-t border-border">
                      <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                      {columns.map((col) => (
                        <td key={col} className="px-4 py-3 truncate max-w-[150px]" title={String(row[col])}>
                          {row[col]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
