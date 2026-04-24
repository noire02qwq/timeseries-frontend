/**
 * API Client Service
 * Handles all HTTP communication with the backend server
 */

import { API_CONFIG, ENDPOINTS, CONTENT_TYPES, HTTP_STATUS } from './config'

// Custom error class for API errors
export class APIError extends Error {
  constructor(message, status, data = null) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.data = data
  }
}

// Build full URL from endpoint
const buildUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`
}

// Default headers
const getDefaultHeaders = (contentType = CONTENT_TYPES.JSON) => {
  const headers = {
    'Accept': 'application/json',
  }
  if (contentType !== CONTENT_TYPES.MULTIPART) {
    headers['Content-Type'] = contentType
  }
  return headers
}

// Handle API response
const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type')
  const isJson = contentType && contentType.includes('application/json')

  let data
  try {
    data = isJson ? await response.json() : await response.text()
  } catch {
    data = null
  }

  if (!response.ok) {
    const message = isJson && data?.error?.message
      ? data.error.message
      : `HTTP Error ${response.status}: ${response.statusText}`
    throw new APIError(message, response.status, data)
  }

  return data
}

// Retry logic with exponential backoff
const fetchWithRetry = async (url, options, retries = API_CONFIG.RETRY_ATTEMPTS) => {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT)

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    return response
  } catch (error) {
    if (retries > 0 && error.name !== 'AbortError') {
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY))
      return fetchWithRetry(url, options, retries - 1)
    }
    throw error
  }
}

// Generic request method
const request = async (endpoint, options = {}) => {
  const url = buildUrl(endpoint)
  const headers = { ...getDefaultHeaders(), ...options.headers }

  try {
    const response = await fetchWithRetry(url, { ...options, headers })
    return await handleResponse(response)
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError(
      error.message || 'Network error occurred',
      null,
      { originalError: error.message }
    )
  }
}

// Health check
export const healthCheck = async () => {
  return request(ENDPOINTS.HEALTH, { method: 'GET' })
}

// Data API
export const dataApi = {
  // Upload dataset file
  upload: async (file, onProgress = null) => {
    const formData = new FormData()
    formData.append('file', file)

    const url = buildUrl(ENDPOINTS.DATA_UPLOAD)

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      })
      return await handleResponse(response)
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new APIError(error.message, null)
    }
  },

  // Get dataset info
  getInfo: async (datasetId) => {
    return request(`${ENDPOINTS.DATA_INFO}/${datasetId}`, { method: 'GET' })
  },

  // Split dataset
  split: async (datasetId, splitConfig) => {
    return request(ENDPOINTS.DATA_SPLIT, {
      method: 'POST',
      body: JSON.stringify({
        datasetId,
        ...splitConfig
      })
    })
  }
}

// Training API
export const trainApi = {
  // Start training
  start: async (config) => {
    return request(ENDPOINTS.TRAIN_START, {
      method: 'POST',
      body: JSON.stringify(config),
    })
  },

  // Get training status
  getStatus: async (jobId) => {
    return request(ENDPOINTS.TRAIN_STATUS(jobId), { method: 'GET' })
  },

  // Stop training
  stop: async (jobId) => {
    return request(ENDPOINTS.TRAIN_STOP(jobId), { method: 'POST' })
  },
}

// Tuning API
export const tuneApi = {
  // Start hyperparameter tuning
  start: async (config) => {
    return request(ENDPOINTS.TUNE_START, {
      method: 'POST',
      body: JSON.stringify(config),
    })
  },

  // Get tuning status
  getStatus: async (jobId) => {
    return request(ENDPOINTS.TUNE_STATUS(jobId), { method: 'GET' })
  },

  // Stop tuning
  stop: async (jobId) => {
    return request(ENDPOINTS.TUNE_STOP(jobId), { method: 'POST' })
  },
}

// Testing API
export const testApi = {
  // Start testing/evaluation
  start: async (config) => {
    return request(ENDPOINTS.TEST_START, {
      method: 'POST',
      body: JSON.stringify(config),
    })
  },

  // Get test status
  getStatus: async (jobId) => {
    return request(ENDPOINTS.TEST_STATUS(jobId), { method: 'GET' })
  },
}

// Prediction API
export const predictApi = {
  // Start prediction
  start: async (config) => {
    return request(ENDPOINTS.PREDICT_START, {
      method: 'POST',
      body: JSON.stringify(config),
    })
  },

  // Get prediction status
  getStatus: async (jobId) => {
    return request(ENDPOINTS.PREDICT_STATUS(jobId), { method: 'GET' })
  },
}

// Model Management API
export const modelApi = {
  // List all models
  list: async () => {
    return request(ENDPOINTS.MODELS_LIST, { method: 'GET' })
  },

  // Get model details
  get: async (modelId) => {
    return request(ENDPOINTS.MODEL_DETAIL(modelId), { method: 'GET' })
  },

  // Delete model
  delete: async (modelId) => {
    return request(ENDPOINTS.MODEL_DELETE(modelId), { method: 'DELETE' })
  },

  // Download model
  download: async (modelId) => {
    const url = buildUrl(ENDPOINTS.MODEL_DOWNLOAD(modelId))
    window.open(url, '_blank')
  },
}

// Configuration API
export const configApi = {
  // Save configuration
  save: async (config) => {
    return request(ENDPOINTS.CONFIG_SAVE, {
      method: 'POST',
      body: JSON.stringify(config),
    })
  },

  // Load configuration
  load: async (configId) => {
    return request(`${ENDPOINTS.CONFIG_LOAD}/${configId}`, { method: 'GET' })
  },
}

// Training Output API
export const outputApi = {
  // Get loss history for a job
  getLossHistory: async (jobId) => {
    return request(ENDPOINTS.LOSS_HISTORY(jobId), { method: 'GET' })
  },

  // Get test comparison data (true vs predicted)
  getTestComparison: async (jobId) => {
    return request(ENDPOINTS.TEST_COMPARISON(jobId), { method: 'GET' })
  },
}

// Export all APIs as a single object
export const api = {
  health: healthCheck,
  data: dataApi,
  train: trainApi,
  tune: tuneApi,
  test: testApi,
  predict: predictApi,
  model: modelApi,
  config: configApi,
}

export default api
