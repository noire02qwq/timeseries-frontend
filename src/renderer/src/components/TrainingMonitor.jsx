import React, { useState, useEffect } from 'react'
import { Play, Pause, Square, Activity } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function TrainingMonitor() {
  const [isTraining, setIsTraining] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [epoch, setEpoch] = useState(0)
  const [lossHistory, setLossHistory] = useState([])

  useEffect(() => {
    if (isTraining && !isPaused) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + 1
          if (newProgress >= 100) {
            setIsTraining(false)
            return 100
          }
          return newProgress
        })
        setEpoch((prev) => prev + 1)

        // Simulate decreasing loss
        setLossHistory((prev) => [
          ...prev,
          {
            epoch: prev.length + 1,
            trainLoss: Math.max(0.1, 2.0 - prev.length * 0.02 + Math.random() * 0.1),
            valLoss: Math.max(0.15, 2.1 - prev.length * 0.018 + Math.random() * 0.15)
          }
        ])
      }, 100)
      return () => clearInterval(interval)
    }
  }, [isTraining, isPaused])

  const startTraining = () => {
    setIsTraining(true)
    setIsPaused(false)
    if (progress === 0 || progress === 100) {
      setProgress(0)
      setEpoch(0)
      setLossHistory([])
    }
  }

  const pauseTraining = () => {
    setIsPaused(!isPaused)
  }

  const stopTraining = () => {
    setIsTraining(false)
    setIsPaused(false)
    setProgress(0)
    setEpoch(0)
    setLossHistory([])
  }

  return (
    <div className="space-y-6">
      <Card className="gradient-card border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-6 h-6 text-primary" />
                Training Progress
              </CardTitle>
              <CardDescription>Monitor model training in real-time</CardDescription>
            </div>
            <Badge variant={isTraining ? 'default' : 'secondary'}>
              {isTraining ? (isPaused ? 'Paused' : 'Training') : 'Ready'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-muted-foreground">Epoch {epoch} / 100</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="flex gap-2">
              {!isTraining ? (
                <Button onClick={startTraining} className="gradient-purple-blue">
                  <Play className="w-4 h-4 mr-2" />
                  Start Training
                </Button>
              ) : (
                <>
                  <Button onClick={pauseTraining} variant="secondary">
                    <Pause className="w-4 h-4 mr-2" />
                    {isPaused ? 'Resume' : 'Pause'}
                  </Button>
                  <Button onClick={stopTraining} variant="destructive">
                    <Square className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="gradient-card border-border/50">
          <CardHeader className="pb-3">
            <CardDescription>Current Loss</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {lossHistory.length > 0 ? lossHistory[lossHistory.length - 1].trainLoss.toFixed(4) : '0.0000'}
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50">
          <CardHeader className="pb-3">
            <CardDescription>Validation Loss</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {lossHistory.length > 0 ? lossHistory[lossHistory.length - 1].valLoss.toFixed(4) : '0.0000'}
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50">
          <CardHeader className="pb-3">
            <CardDescription>Time Elapsed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(epoch * 0.5)} min</div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50">
          <CardHeader className="pb-3">
            <CardDescription>Est. Time Left</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor((100 - epoch) * 0.5)} min</div>
          </CardContent>
        </Card>
      </div>

      {lossHistory.length > 0 && (
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle>Loss Curves</CardTitle>
            <CardDescription>Training and validation loss over epochs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lossHistory} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="epoch"
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
                  <Line
                    type="monotone"
                    dataKey="trainLoss"
                    stroke="hsl(217, 91%, 60%)"
                    strokeWidth={2}
                    dot={false}
                    name="Training Loss"
                  />
                  <Line
                    type="monotone"
                    dataKey="valLoss"
                    stroke="hsl(263, 70%, 60%)"
                    strokeWidth={2}
                    dot={false}
                    name="Validation Loss"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
