import React from 'react'
import { BarChart3, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// Mock prediction results
const predictionData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, '0')}:00`,
  actual: 35 + Math.sin(i / 3) * 8 + Math.random() * 4,
  predicted: 35 + Math.sin(i / 3) * 8 + Math.random() * 3
}))

const performanceMetrics = [
  { metric: 'MAE', value: 1.23, unit: 'μg/L' },
  { metric: 'RMSE', value: 1.87, unit: 'μg/L' },
  { metric: 'R²', value: 0.94, unit: '' },
  { metric: 'MAPE', value: 3.2, unit: '%' }
]

const featureImportance = [
  { feature: 'Temperature', importance: 0.28 },
  { feature: 'pH Level', importance: 0.24 },
  { feature: 'Chlorine', importance: 0.19 },
  { feature: 'Flow Rate', importance: 0.15 },
  { feature: 'Time of Day', importance: 0.14 }
]

export function ResultsDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {performanceMetrics.map(({ metric, value, unit }) => (
          <Card key={metric} className="gradient-card border-border/50">
            <CardHeader className="pb-3">
              <CardDescription>{metric}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold gradient-purple-blue bg-clip-text text-transparent">
                {value}
                {unit && <span className="text-sm ml-1 text-muted-foreground">{unit}</span>}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                <span className="text-xs text-muted-foreground">Excellent</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            Predictions vs Actual Values
          </CardTitle>
          <CardDescription>Model performance on test dataset</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={predictionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="hour"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
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
                  dot={{ r: 3 }}
                  name="Actual DBP"
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="hsl(263, 70%, 60%)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3 }}
                  name="Predicted DBP"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              Feature Importance
            </CardTitle>
            <CardDescription>Top factors influencing DBP predictions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={featureImportance} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    type="number"
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    dataKey="feature"
                    type="category"
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Bar dataKey="importance" fill="hsl(263, 70%, 60%)" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-primary" />
              Anomaly Detection
            </CardTitle>
            <CardDescription>Detected outliers and unusual patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium">No Critical Anomalies</p>
                    <p className="text-xs text-muted-foreground">All values within expected ranges</p>
                  </div>
                </div>
                <Badge variant="success">Normal</Badge>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Recent Alerts (Resolved)</h4>
                {[
                  { time: '2024-02-04 18:30', type: 'Minor spike', status: 'Resolved' },
                  { time: '2024-02-03 14:15', type: 'Data gap', status: 'Resolved' }
                ].map((alert, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                    <div>
                      <p className="text-sm font-medium">{alert.type}</p>
                      <p className="text-xs text-muted-foreground">{alert.time}</p>
                    </div>
                    <Badge variant="secondary">{alert.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
