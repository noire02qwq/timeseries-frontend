/**
 * API Configuration
 * Centralized configuration for API endpoints and WebSocket connections
 */

// Backend API configuration
export const API_CONFIG = {
  // Backend server URL (port 310 as specified)
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:310',

  // API version
  VERSION: 'v1',

  // Request timeout (ms)
  TIMEOUT: 30000,

  // Retry configuration
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
}

// WebSocket configuration
export const WS_CONFIG = {
  // WebSocket URL
  URL: import.meta.env.VITE_WS_URL || 'ws://localhost:310',

  // Reconnection settings
  RECONNECT_INTERVAL: 3000,
  MAX_RECONNECT_ATTEMPTS: 5,

  // Heartbeat
  HEARTBEAT_INTERVAL: 30000,
}

// API Endpoints
export const ENDPOINTS = {
  // Health check
  HEALTH: '/health',

  // Data operations
  DATA_UPLOAD: '/api/v1/data/upload',
  DATA_INFO: '/api/v1/data/info',
  DATA_PREVIEW: '/api/v1/data/preview',

  // Training operations
  TRAIN_START: '/api/v1/train',
  TRAIN_STATUS: (jobId) => `/api/v1/train/${jobId}/status`,
  TRAIN_STOP: (jobId) => `/api/v1/train/${jobId}/stop`,

  // Tuning operations
  TUNE_START: '/api/v1/tune',
  TUNE_STATUS: (jobId) => `/api/v1/tune/${jobId}/status`,
  TUNE_STOP: (jobId) => `/api/v1/tune/${jobId}/stop`,

  // Testing operations
  TEST_START: '/api/v1/test',
  TEST_STATUS: (jobId) => `/api/v1/test/${jobId}/status`,

  // Prediction operations
  PREDICT_START: '/api/v1/predict',
  PREDICT_STATUS: (jobId) => `/api/v1/predict/${jobId}/status`,

  // Model management
  MODELS_LIST: '/api/v1/models',
  MODEL_DETAIL: (modelId) => `/api/v1/models/${modelId}`,
  MODEL_DELETE: (modelId) => `/api/v1/models/${modelId}`,
  MODEL_DOWNLOAD: (modelId) => `/api/v1/models/${modelId}/download`,

  // Configuration
  CONFIG_SAVE: '/api/v1/config/save',
  CONFIG_LOAD: '/api/v1/config/load',

  // WebSocket
  WS_LOGS: '/ws/logs',
}

// Content types
export const CONTENT_TYPES = {
  JSON: 'application/json',
  MULTIPART: 'multipart/form-data',
  TEXT: 'text/plain',
}

// HTTP Status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  SERVER_ERROR: 500,
}

export default {
  API_CONFIG,
  WS_CONFIG,
  ENDPOINTS,
  CONTENT_TYPES,
  HTTP_STATUS,
}