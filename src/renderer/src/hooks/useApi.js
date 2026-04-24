/**
 * API Hooks
 * React hooks for interacting with the backend API
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { dataApi, trainApi, tuneApi, testApi, healthCheck, APIError } from '../services/api'

// Hook for health check
export const useHealthCheck = () => {
  const [status, setStatus] = useState('checking')
  const [error, setError] = useState(null)

  const check = useCallback(async () => {
    try {
      setStatus('checking')
      setError(null)
      await healthCheck()
      setStatus('connected')
    } catch (err) {
      setStatus('error')
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    check()
    const interval = setInterval(check, 30000)
    return () => clearInterval(interval)
  }, [check])

  return { status, error, check }
}

// Hook for data upload
export const useDataUpload = () => {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const upload = useCallback(async (file) => {
    try {
      setUploading(true)
      setProgress(0)
      setError(null)
      setResult(null)

      const response = await dataApi.upload(file, (p) => setProgress(p))
      setResult(response.data)
      return response.data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setUploading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setUploading(false)
    setProgress(0)
    setError(null)
    setResult(null)
  }, [])

  return { upload, uploading, progress, error, result, reset }
}

// Hook for dataset split
export const useDataSplit = () => {
  const [splitting, setSplitting] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const split = useCallback(async (datasetId, config) => {
    try {
      setSplitting(true)
      setError(null)
      setResult(null)

      const response = await dataApi.split(datasetId, config)
      setResult(response.data)
      return response.data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setSplitting(false)
    }
  }, [])

  const reset = useCallback(() => {
    setSplitting(false)
    setError(null)
    setResult(null)
  }, [])

  return { split, splitting, error, result, reset }
}

// Hook for training
export const useTraining = () => {
  const [starting, setStarting] = useState(false)
  const [stopping, setStopping] = useState(false)
  const [error, setError] = useState(null)
  const [jobId, setJobId] = useState(null)
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState([])
  const [result, setResult] = useState(null)

  const pollIntervalRef = useRef(null)

  const clearPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
  }, [])

  const pollStatus = useCallback(async (id) => {
    try {
      const response = await trainApi.getStatus(id)
      const data = response.data

      setStatus(data.status)
      setProgress(data.progress || 0)
      if (data.logs) {
        setLogs(data.logs)
      }

      if (data.status === 'completed' || data.status === 'failed' || data.status === 'stopped') {
        clearPolling()
        setResult(data.result)
        if (data.error) {
          setError(data.error)
        }
      }
    } catch (err) {
      console.error('Failed to poll training status:', err)
    }
  }, [clearPolling])

  const start = useCallback(async (config) => {
    try {
      setStarting(true)
      setError(null)
      setJobId(null)
      setStatus('idle')
      setProgress(0)
      setLogs([])
      setResult(null)
      clearPolling()

      const response = await trainApi.start(config)
      const data = response.data

      setJobId(data.jobId)
      setStatus('pending')

      // Start polling
      pollIntervalRef.current = setInterval(() => {
        pollStatus(data.jobId)
      }, 2000)

      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setStarting(false)
    }
  }, [clearPolling, pollStatus])

  const stop = useCallback(async () => {
    if (!jobId) return

    try {
      setStopping(true)
      await trainApi.stop(jobId)
      clearPolling()
      setStatus('stopped')
    } catch (err) {
      setError(err.message)
    } finally {
      setStopping(false)
    }
  }, [jobId, clearPolling])

  const reset = useCallback(() => {
    clearPolling()
    setStarting(false)
    setStopping(false)
    setError(null)
    setJobId(null)
    setStatus('idle')
    setProgress(0)
    setLogs([])
    setResult(null)
  }, [clearPolling])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPolling()
    }
  }, [clearPolling])

  return {
    start,
    stop,
    reset,
    starting,
    stopping,
    error,
    jobId,
    status,
    progress,
    logs,
    result
  }
}

// Hook for tuning (Bayesian optimization)
export const useTuning = () => {
  const [starting, setStarting] = useState(false)
  const [stopping, setStopping] = useState(false)
  const [error, setError] = useState(null)
  const [jobId, setJobId] = useState(null)
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState([])
  const [result, setResult] = useState(null)

  const pollIntervalRef = useRef(null)

  const clearPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
  }, [])

  const pollStatus = useCallback(async (id) => {
    try {
      const response = await tuneApi.getStatus(id)
      const data = response.data

      setStatus(data.status)
      setProgress(data.progress || 0)
      if (data.logs) {
        setLogs(data.logs)
      }

      if (data.status === 'completed' || data.status === 'failed' || data.status === 'stopped') {
        clearPolling()
        setResult(data.result)
        if (data.error) {
          setError(data.error)
        }
      }
    } catch (err) {
      console.error('Failed to poll tuning status:', err)
    }
  }, [clearPolling])

  const start = useCallback(async (config) => {
    try {
      setStarting(true)
      setError(null)
      setJobId(null)
      setStatus('idle')
      setProgress(0)
      setLogs([])
      setResult(null)
      clearPolling()

      const response = await tuneApi.start(config)
      const data = response.data

      setJobId(data.jobId)
      setStatus('pending')

      // Start polling
      pollIntervalRef.current = setInterval(() => {
        pollStatus(data.jobId)
      }, 2000)

      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setStarting(false)
    }
  }, [clearPolling, pollStatus])

  const stop = useCallback(async () => {
    if (!jobId) return

    try {
      setStopping(true)
      await tuneApi.stop(jobId)
      clearPolling()
      setStatus('stopped')
    } catch (err) {
      setError(err.message)
    } finally {
      setStopping(false)
    }
  }, [jobId, clearPolling])

  const reset = useCallback(() => {
    clearPolling()
    setStarting(false)
    setStopping(false)
    setError(null)
    setJobId(null)
    setStatus('idle')
    setProgress(0)
    setLogs([])
    setResult(null)
  }, [clearPolling])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPolling()
    }
  }, [clearPolling])

  return {
    start,
    stop,
    reset,
    starting,
    stopping,
    error,
    jobId,
    status,
    progress,
    logs,
    result
  }
}

export default {
  useHealthCheck,
  useDataUpload,
  useDataSplit,
  useTraining,
  useTuning
}
