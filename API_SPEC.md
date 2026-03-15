# API Specification

**Version:** 1.0.0
**Base URL:** `http://localhost:310/api/v1`
**WebSocket:** `ws://localhost:310/ws/logs`

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Error Handling](#error-handling)
4. [Endpoints](#endpoints)
   - [Health Check](#health-check)
   - [Data Management](#data-management)
   - [Training](#training)
   - [Hyperparameter Tuning](#hyperparameter-tuning)
   - [Testing](#testing)
   - [Prediction](#prediction)
   - [Model Management](#model-management)
5. [WebSocket Log Streaming](#websocket-log-streaming)

---

## Overview

This API provides endpoints for managing time series deep learning workflows including data upload, model training, hyperparameter tuning, and prediction.

### Content Types

- Request: `application/json` (except file uploads: `multipart/form-data`)
- Response: `application/json`

---

## Authentication

Currently, no authentication is required. All endpoints are publicly accessible.

---

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error description",
    "details": [
      {
        "field": "fieldName",
        "message": "Field-specific error"
      }
    ]
  }
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource conflict (e.g., job already running) |
| 422 | Unprocessable Entity - Validation error |
| 500 | Internal Server Error - Server error |

---

## Endpoints

### Health Check

#### GET `/health`

Check if the server is running.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

---

### Data Management

#### POST `/api/v1/data/upload`

Upload a dataset file (CSV or Excel).

**Content-Type:** `multipart/form-data`

**Request Body:**
- `file` (required): The CSV or Excel file to upload

**Response:**
```json
{
  "success": true,
  "data": {
    "datasetId": "uuid-string",
    "filename": "data.csv",
    "size": 1024000,
    "message": "File uploaded successfully"
  }
}
```

#### GET `/api/v1/data/info/:datasetId`

Get information about an uploaded dataset.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "filename": "data.csv",
    "size": 1024000,
    "columns": [
      { "name": "timestamp", "type": "datetime" },
      { "name": "feature1", "type": "float" },
      { "name": "feature2", "type": "float" },
      { "name": "target", "type": "float" }
    ],
    "rowCount": 10000,
    "uploadedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### Training

#### POST `/api/v1/train`

Start a training job.

**Request Body:**
```json
{
  "datasetId": "uuid-string",
  "modelType": "LSTM",
  "modelConfig": {
    "inputSize": 10,
    "hiddenSize": 128,
    "numLayers": 2,
    "dropout": 0.2
  },
  "trainingConfig": {
    "epochs": 100,
    "batchSize": 32,
    "learningRate": 0.001,
    "optimizer": "Adam"
  },
  "dataConfig": {
    "inputColumns": ["feature1", "feature2"],
    "targetColumn": "target",
    "trainRatio": 0.7,
    "valRatio": 0.15,
    "testRatio": 0.15
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "uuid-string",
    "status": "pending",
    "message": "Training job started"
  }
}
```

#### GET `/api/v1/train/:jobId/status`

Get the status of a training job.

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "uuid-string",
    "type": "train",
    "status": "running",
    "progress": 45.5,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:10:00.000Z",
    "result": null,
    "error": null
  }
}
```

#### POST `/api/v1/train/:jobId/stop`

Stop a running training job.

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "uuid-string",
    "status": "stopped",
    "message": "Job stopped"
  }
}
```

---

### Hyperparameter Tuning

#### POST `/api/v1/tune`

Start a hyperparameter tuning job using Bayesian optimization.

**Request Body:**
```json
{
  "datasetId": "uuid-string",
  "modelType": "LSTM",
  "searchSpace": {
    "hiddenSize": { "type": "int", "low": 64, "high": 512 },
    "numLayers": { "type": "int", "low": 1, "high": 4 },
    "dropout": { "type": "float", "low": 0.0, "high": 0.5 },
    "learningRate": { "type": "log", "low": 1e-4, "high": 1e-2 }
  },
  "tuningConfig": {
    "trials": 50,
    "epochs": 100,
    "metric": "val_loss",
    "direction": "minimize"
  },
  "dataConfig": {
    "inputColumns": ["feature1", "feature2"],
    "targetColumn": "target",
    "trainRatio": 0.7,
    "valRatio": 0.15,
    "testRatio": 0.15
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "uuid-string",
    "status": "pending",
    "message": "Hyperparameter tuning started"
  }
}
```

#### GET `/api/v1/tune/:jobId/status`

Get the status of a tuning job.

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "uuid-string",
    "type": "tune",
    "status": "running",
    "progress": 40.0,
    "currentTrial": 20,
    "totalTrials": 50,
    "bestTrial": {
      "trial": 15,
      "value": 0.1523,
      "params": {
        "hiddenSize": 256,
        "numLayers": 2,
        "dropout": 0.2,
        "learningRate": 0.001
      }
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:20:00.000Z"
  }
}
```

#### POST `/api/v1/tune/:jobId/stop`

Stop a running tuning job.

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "uuid-string",
    "status": "stopped",
    "message": "Job stopped"
  }
}
```

---

### Testing

#### POST `/api/v1/test`

Run model evaluation on test data.

**Request Body:**
```json
{
  "modelId": "uuid-string",
  "datasetId": "uuid-string",
  "dataConfig": {
    "inputColumns": ["feature1", "feature2"],
    "targetColumn": "target"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "uuid-string",
    "status": "pending",
    "message": "Evaluation started"
  }
}
```

---

### Prediction

#### POST `/api/v1/predict`

Run prediction on new data.

**Request Body:**
```json
{
  "modelId": "uuid-string",
  "datasetId": "uuid-string",
  "dataConfig": {
    "inputColumns": ["feature1", "feature2"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "uuid-string",
    "status": "pending",
    "message": "Prediction started"
  }
}
```

---

### Model Management

#### GET `/api/v1/models`

List all saved models.

**Response:**
```json
{
  "success": true,
  "data": {
    "models": [
      {
        "id": "uuid-string",
        "name": "lstm_model_v1",
        "type": "LSTM",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "size": 5242880,
        "metrics": {
          "trainLoss": 0.08,
          "valLoss": 0.12,
          "testR2": 0.95
        }
      }
    ],
    "total": 1
  }
}
```

---

## WebSocket Log Streaming

Connect to `ws://localhost:310/ws/logs?jobId={jobId}&type={type}`

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| jobId | string | The job ID to stream logs for |
| type | string | Job type: `train`, `tune`, `test`, or `predict` |

### Message Format

**Server → Client:**
```json
{
  "type": "log|error|info|progress|complete",
  "payload": {
    "level": "info",
    "message": "Training epoch 10/100"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Client → Server:**
```json
{
  "type": "ping",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Message Types

| Type | Description |
|------|-------------|
| `log` | Regular log message |
| `error` | Error message |
| `info` | Informational message |
| `progress` | Progress update with metrics |
| `complete` | Job completion notification |
| `ping` | Keep-alive ping (client → server) |
| `pong` | Keep-alive response (server → client) |

---

## Running the Demo Server

```bash
cd demo-server
yarn install
yarn start
```

The server will start on `http://localhost:310`.

---

## Frontend Configuration

The frontend expects the backend at `http://localhost:310`. Update `src/renderer/src/services/config.js` if your backend runs on a different port.
