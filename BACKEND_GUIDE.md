# Backend Development Guide

This guide is for backend developers who need to implement or extend the backend API for the Time Series Deep Learning Frontend.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Frontend Expectations](#frontend-expectations)
3. [API Implementation Requirements](#api-implementation-requirements)
4. [WebSocket Log Streaming](#websocket-log-streaming)
5. [Job Management](#job-management)
6. [Configuration File Format](#configuration-file-format)
7. [Error Handling Guidelines](#error-handling-guidelines)

---

## Architecture Overview

```
┌─────────────────┐      HTTP/WebSocket      ┌─────────────────┐
│                 │◄────────────────────────►│                 │
│   Frontend      │   Port 110 (Vite)        │   Backend       │
│   (Electron +   │                          │   (Python/Node) │
│    React)       │      Data/Commands       │   Port 310      │
│                 │◄────────────────────────►│                 │
└─────────────────┘                          └─────────────────┘
```

**Key Points:**
- Frontend runs on port 110 (Vite dev server)
- Backend runs on port 310
- Communication via HTTP REST API + WebSocket for real-time logs
- All data exchange uses JSON format

---

## Frontend Expectations

### 1. Synchronous Response for Job Start

When the frontend starts a job (training, tuning, etc.), it expects an **immediate response** with a `jobId`. The actual work happens asynchronously.

**Expected Response Format:**
```json
{
  "success": true,
  "data": {
    "jobId": "uuid-string",
    "status": "pending",
    "message": "Job started successfully"
  }
}
```

### 2. Job Status Polling

The frontend will poll `/api/v1/jobs/{jobId}/status` to check progress.

**Important Status Values:**
- `pending` - Job created but not started
- `running` - Job is actively running
- `completed` - Job finished successfully
- `failed` - Job encountered an error
- `stopped` - Job was manually stopped

### 3. Real-Time Log Streaming

The frontend expects a WebSocket endpoint for streaming logs in real-time.

**Connection URL:** `ws://localhost:310/ws/logs?jobId={jobId}&type={type}`

**Required Message Format:**
```json
{
  "type": "log|error|info|progress|complete",
  "payload": {
    "level": "info|warning|error",
    "message": "Log message here",
    ...additional fields
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## API Implementation Requirements

### Required Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/v1/data/upload` | Upload dataset |
| GET | `/api/v1/data/info/:datasetId` | Get dataset info |
| POST | `/api/v1/train` | Start training |
| GET | `/api/v1/train/:jobId/status` | Get training status |
| POST | `/api/v1/train/:jobId/stop` | Stop training |
| POST | `/api/v1/tune` | Start tuning |
| GET | `/api/v1/tune/:jobId/status` | Get tuning status |
| POST | `/api/v1/tune/:jobId/stop` | Stop tuning |
| POST | `/api/v1/test` | Start testing |
| POST | `/api/v1/predict` | Start prediction |
| GET | `/api/v1/models` | List models |
| GET | `/api/v1/models/:modelId` | Get model details |
| DELETE | `/api/v1/models/:modelId` | Delete model |
| GET | `/api/v1/models/:modelId/download` | Download model |

---

## WebSocket Log Streaming

### Protocol Specification

**Endpoint:** `ws://localhost:310/ws/logs`

**Query Parameters:**
- `jobId` (required): The job ID to stream logs for
- `type` (optional): Job type (`train`, `tune`, `test`, `predict`)

### Message Types (Server → Client)

| Type | Description | Payload Fields |
|------|-------------|----------------|
| `log` | General log message | `level`, `message` |
| `info` | Informational message | `message` |
| `error` | Error message | `message`, `details` |
| `progress` | Progress update | `epoch`, `totalEpochs`, `trainLoss`, `valLoss`, etc. |
| `complete` | Job completion | `message`, `result` |

### Implementation Example (Node.js)

```javascript
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

class LogStreamer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server, path: '/ws/logs' });
    this.connections = new Map();
    this.setupHandlers();
  }

  setupHandlers() {
    this.wss.on('connection', (ws, req) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const jobId = url.searchParams.get('jobId');

      if (!jobId) {
        ws.close(1008, 'Missing jobId');
        return;
      }

      // Register connection
      if (!this.connections.has(jobId)) {
        this.connections.set(jobId, new Set());
      }
      this.connections.get(jobId).add(ws);

      // Send welcome message
      this.send(ws, 'info', { message: `Connected to logs for job ${jobId}` });

      // Handle disconnect
      ws.on('close', () => {
        const conns = this.connections.get(jobId);
        if (conns) {
          conns.delete(ws);
          if (conns.size === 0) {
            this.connections.delete(jobId);
          }
        }
      });
    });
  }

  send(ws, type, payload) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type,
        payload,
        timestamp: new Date().toISOString()
      }));
    }
  }

  broadcast(jobId, type, payload) {
    const conns = this.connections.get(jobId);
    if (conns) {
      conns.forEach(ws => this.send(ws, type, payload));
    }
  }
}

module.exports = LogStreamer;
```

---

## Configuration File Format

The backend should generate configuration files in TOML format:

```toml
[model]
type = "LSTM"
input_size = 10
hidden_size = 128
num_layers = 2
dropout = 0.2
bidirectional = false

[training]
epochs = 100
batch_size = 32
learning_rate = 0.001
optimizer = "Adam"
weight_decay = 1e-5
gradient_clip = 1.0
early_stopping = true
patience = 15
min_delta = 1e-4

[data]
path = "data/train.csv"
input_columns = ["feature1", "feature2", "feature3"]
target_column = "target"
time_column = "timestamp"
train_ratio = 0.7
val_ratio = 0.15
test_ratio = 0.15
shuffle = false
normalize = true

[logging]
log_dir = "logs"
log_level = "INFO"
save_every_n_epochs = 10

[output]
model_dir = "models"
checkpoint_dir = "checkpoints"
```

---

## Error Handling Guidelines

### 1. Always Return JSON

All responses, including errors, must be valid JSON.

### 2. Use Consistent Error Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": []
  }
}
```

### 3. Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_REQUEST` | 400 | Malformed request |
| `VALIDATION_ERROR` | 422 | Validation failed |
| `NOT_FOUND` | 404 | Resource not found |
| `ALREADY_EXISTS` | 409 | Resource conflict |
| `INTERNAL_ERROR` | 500 | Server error |

### 4. Log All Errors

Always log errors on the server side for debugging:

```javascript
console.error(`[${timestamp}] Error in ${endpoint}:`, error);
```

---

## Testing Your Implementation

Use these curl commands to test your implementation:

```bash
# Health check
curl http://localhost:310/health

# Upload data
curl -X POST -F "file=@data.csv" http://localhost:310/api/v1/data/upload

# Start training
curl -X POST http://localhost:310/api/v1/train \
  -H "Content-Type: application/json" \
  -d '{
    "datasetId": "your-dataset-id",
    "modelType": "LSTM",
    "modelConfig": {"hiddenSize": 128},
    "trainingConfig": {"epochs": 100}
  }'

# Check job status
curl http://localhost:310/api/v1/train/{jobId}/status
```

---

## Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [WebSocket Protocol](https://tools.ietf.org/html/rfc6455)
- [TOML Configuration Format](https://toml.io/)

---

## Support

For issues or questions about backend implementation, please refer to the project repository or contact the development team.