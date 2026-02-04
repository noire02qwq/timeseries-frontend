import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { TrendingUp } from 'lucide-react'

// Generate mock time series data
const generateMockData = () => {
  const data = []
  const baseValue = 35
  for (let i = 0; i < 100; i++) {
    data.push({
      time: `${String(Math.floor(i / 4)).padStart(2, '0')}:${String((i % 4) * 15).padStart(2, '0')}`,
      dbp: baseValue + Math.sin(i / 10) * 10 + Math.random() * 5,
      predicted: baseValue + Math.sin((i + 5) / 10) * 10 + Math.random() * 3,
      threshold: 45
    })
  }
  return data
}

export function TimeSeriesChart() {
  const data = generateMockData()

  return (
    <div className="space-y-6">
      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            DBPs Concentration Over Time
          </CardTitle>
          <CardDescription>Real-time and predicted disinfection byproducts levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="time"
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
                  dataKey="dbp"
                  stroke="hsl(217, 91%, 60%)"
                  strokeWidth={2}
                  dot={false}
                  name="Measured DBP"
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="hsl(263, 70%, 60%)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Predicted DBP"
                />
                <Line
                  type="monotone"
                  dataKey="threshold"
                  stroke="hsl(0, 62.8%, 50.6%)"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                  name="Safety Threshold"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="gradient-card border-border/50">
          <CardHeader className="pb-3">
            <CardDescription>Current DBP Level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold gradient-purple-blue bg-clip-text text-transparent">
              {data[data.length - 1].dbp.toFixed(2)} μg/L
            </div>
            <p className="text-xs text-muted-foreground mt-1">Within normal range</p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50">
          <CardHeader className="pb-3">
            <CardDescription>24h Average</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">
              {(data.reduce((sum, d) => sum + d.dbp, 0) / data.length).toFixed(2)} μg/L
            </div>
            <p className="text-xs text-muted-foreground mt-1">↓ 3.2% from yesterday</p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50">
          <CardHeader className="pb-3">
            <CardDescription>Anomalies Detected</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">0</div>
            <p className="text-xs text-muted-foreground mt-1">No alerts in the last 24h</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
