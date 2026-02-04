import React, { useState } from 'react'
import { Upload, FileText, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'

export function DataUpload() {
  const [files, setFiles] = useState([])
  const [isDragging, setIsDragging] = useState(false)

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
    const droppedFiles = Array.from(e.dataTransfer.files)
    setFiles([...files, ...droppedFiles])
  }

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files)
    setFiles([...files, ...selectedFiles])
  }

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-6 h-6 text-primary" />
            Upload DBPs Time Series Data
          </CardTitle>
          <CardDescription>
            Upload CSV, Excel, or JSON files containing DBPs time series measurements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center transition-all
              ${isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}
            `}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">Drag and drop files here</p>
            <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
            <input
              type="file"
              multiple
              accept=".csv,.xlsx,.xls,.json"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button asChild>
                <span>Select Files</span>
              </Button>
            </label>
          </div>

          {files.length > 0 && (
            <div className="mt-6 space-y-2">
              <h3 className="font-medium mb-3">Uploaded Files ({files.length})</h3>
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeFile(index)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle>Dataset Preview</CardTitle>
          <CardDescription>Sample data from the uploaded files</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Timestamp</th>
                  <th className="px-4 py-3 text-left font-medium">DBP Level</th>
                  <th className="px-4 py-3 text-left font-medium">Temperature</th>
                  <th className="px-4 py-3 text-left font-medium">pH</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-4 py-3">2024-{String(i).padStart(2, '0')}-15 14:30:00</td>
                    <td className="px-4 py-3">{(Math.random() * 50 + 20).toFixed(2)}</td>
                    <td className="px-4 py-3">{(Math.random() * 10 + 20).toFixed(1)}°C</td>
                    <td className="px-4 py-3">{(Math.random() * 2 + 6).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="success">Normal</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
