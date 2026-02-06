import React, { useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { TrendingUp, Settings2, Eye, EyeOff } from 'lucide-react'

// Color palette for multiple lines
const LINE_COLORS = [
  'hsl(217, 91%, 60%)',  // blue
  'hsl(142, 71%, 45%)',  // green
  'hsl(38, 92%, 50%)',   // orange
  'hsl(280, 65%, 60%)',  // purple
  'hsl(350, 89%, 60%)',  // red
  'hsl(190, 90%, 50%)',  // cyan
  'hsl(45, 93%, 47%)',   // yellow
  'hsl(330, 81%, 60%)'   // pink
]

// Generate mock data for demo when no data is provided
const generateMockData = () => {
  const data = []
  for (let i = 0; i < 100; i++) {
    data.push({
      time: `${String(Math.floor(i / 4)).padStart(2, '0')}:${String((i % 4) * 15).padStart(2, '0')}`,
      dbp: 35 + Math.sin(i / 10) * 10 + Math.random() * 5,
      temperature: 20 + Math.sin(i / 15) * 5 + Math.random() * 2,
      pH: 7 + Math.sin(i / 20) * 0.5 + Math.random() * 0.2,
      chlorine: 1.5 + Math.sin(i / 12) * 0.3 + Math.random() * 0.1
    })
  }
  return {
    data,
    columns: ['time', 'dbp', 'temperature', 'pH', 'chlorine'],
    referenceColumn: 'time'
  }
}

export function TimeSeriesChart({ data: externalData, columns: externalColumns, columnRoles }) {
  // Use external data or generate mock data
  const mockData = useMemo(() => generateMockData(), [])
  const data = externalData || mockData.data
  const allColumns = externalColumns || mockData.columns
  
  // Determine reference column (x-axis) and plottable columns
  const referenceColumn = useMemo(() => {
    if (columnRoles) {
      const refCol = Object.entries(columnRoles).find(([, role]) => role === 'reference')
      return refCol ? refCol[0] : allColumns[0]
    }
    return mockData.referenceColumn
  }, [columnRoles, allColumns, mockData.referenceColumn])
  
  const plottableColumns = useMemo(() => {
    return allColumns.filter(col => col !== referenceColumn)
  }, [allColumns, referenceColumn])

  // State for visualization controls
  const [rangeStart, setRangeStart] = useState(1)
  const [rangeEnd, setRangeEnd] = useState(data.length)
  const [selectedColumns, setSelectedColumns] = useState(
    plottableColumns.length > 0 ? [plottableColumns[0]] : []
  )

  // Filter data based on range
  const filteredData = useMemo(() => {
    const start = Math.max(0, rangeStart - 1)
    const end = Math.min(data.length, rangeEnd)
    return data.slice(start, end)
  }, [data, rangeStart, rangeEnd])

  // Toggle column visibility
  const toggleColumn = (column) => {
    if (selectedColumns.includes(column)) {
      if (selectedColumns.length > 1) {
        setSelectedColumns(selectedColumns.filter(c => c !== column))
      }
    } else {
      setSelectedColumns([...selectedColumns, column])
    }
  }

  // Select all / deselect all
  const selectAll = () => setSelectedColumns([...plottableColumns])
  const deselectAll = () => setSelectedColumns([plottableColumns[0]])

  // Calculate statistics for selected columns
  const stats = useMemo(() => {
    const result = {}
    selectedColumns.forEach(col => {
      const values = filteredData.map(d => parseFloat(d[col])).filter(v => !isNaN(v))
      if (values.length > 0) {
        result[col] = {
          min: Math.min(...values).toFixed(2),
          max: Math.max(...values).toFixed(2),
          avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
          current: values[values.length - 1]?.toFixed(2) || 'N/A'
        }
      }
    })
    return result
  }, [filteredData, selectedColumns])

  return (
    <div className="space-y-6">
      {/* Visualization Controls */}
      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-primary" />
            Visualization Controls
          </CardTitle>
          <CardDescription>
            Select columns to visualize and define the data range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Range Selection */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Data Range (Row)</Label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Start</Label>
                  <Input
                    type="number"
                    value={rangeStart}
                    onChange={(e) => setRangeStart(Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    max={rangeEnd - 1}
                    className="mt-1"
                  />
                </div>
                <span className="text-muted-foreground mt-6">to</span>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">End</Label>
                  <Input
                    type="number"
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(Math.min(data.length, parseInt(e.target.value) || data.length))}
                    min={rangeStart + 1}
                    max={data.length}
                    className="mt-1"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Showing {rangeEnd - rangeStart + 1} of {data.length} total rows
              </p>
            </div>

            {/* Column Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Columns to Display</Label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAll}>
                    <Eye className="w-4 h-4 mr-1" />
                    All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={deselectAll}>
                    <EyeOff className="w-4 h-4 mr-1" />
                    Min
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {plottableColumns.map((col, index) => (
                  <button
                    key={col}
                    onClick={() => toggleColumn(col)}
                    className={`
                      px-3 py-1.5 text-sm rounded-full border transition-all
                      ${selectedColumns.includes(col)
                        ? 'border-transparent text-white'
                        : 'bg-transparent border-border text-muted-foreground hover:border-primary/50'
                      }
                    `}
                    style={{
                      backgroundColor: selectedColumns.includes(col) 
                        ? LINE_COLORS[index % LINE_COLORS.length] 
                        : 'transparent'
                    }}
                  >
                    {col}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                X-axis: <span className="text-primary">{referenceColumn}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            Time Series Visualization
          </CardTitle>
          <CardDescription>
            Displaying {selectedColumns.length} column(s) • Rows {rangeStart} to {rangeEnd}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey={referenceColumn}
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
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
                {selectedColumns.map((col, index) => (
                  <Line
                    key={col}
                    type="monotone"
                    dataKey={col}
                    stroke={LINE_COLORS[plottableColumns.indexOf(col) % LINE_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    name={col}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {selectedColumns.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {selectedColumns.slice(0, 4).map((col, index) => (
            <Card key={col} className="gradient-card border-border/50">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: LINE_COLORS[plottableColumns.indexOf(col) % LINE_COLORS.length] }}
                  />
                  {col}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: LINE_COLORS[plottableColumns.indexOf(col) % LINE_COLORS.length] }}>
                  {stats[col]?.current || 'N/A'}
                </div>
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span>Min: {stats[col]?.min}</span>
                  <span>Max: {stats[col]?.max}</span>
                  <span>Avg: {stats[col]?.avg}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
