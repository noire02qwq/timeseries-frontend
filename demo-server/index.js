/**
 * Demo Backend Server for Time Series ML Frontend
 * Simulates ML backend functionality for testing frontend interfaces
 *
 * Runs on port 310 (frontend runs on port 110)
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = 310;
const HOST = '0.0.0.0';

// In-memory storage
const jobs = new Map();
const datasets = new Map();
const models = new Map();
const activeConnections = new Map();

// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
const modelsDir = path.join(__dirname, 'models');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(modelsDir)) fs.mkdirSync(modelsDir, { recursive: true });

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'));
    }
  }
});

// Helper functions
function generateJobId() {
  return uuidv4();
}

function createJob(type, config) {
  const jobId = generateJobId();
  const job = {
    id: jobId,
    type,
    status: 'pending',
    config,
    progress: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    logs: [],
    result: null,
    error: null
  };
  jobs.set(jobId, job);
  return job;
}

function updateJobStatus(jobId, status, data = {}) {
  const job = jobs.get(jobId);
  if (job) {
    job.status = status;
    job.updatedAt = new Date().toISOString();
    Object.assign(job, data);
    return job;
  }
  return null;
}

function addJobLog(jobId, level, message) {
  const job = jobs.get(jobId);
  if (job) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message
    };
    job.logs.push(logEntry);
    return logEntry;
  }
  return null;
}

// WebSocket log streaming
function broadcastLog(jobId, type, payload) {
  const connections = activeConnections.get(jobId);
  if (connections) {
    const message = JSON.stringify({
      type,
      payload,
      timestamp: new Date().toISOString()
    });
    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
}

// Simulate training process
async function simulateTraining(jobId, config) {
  const { epochs = 100, trials = 1 } = config;
  updateJobStatus(jobId, 'running', { progress: 0 });

  for (let trial = 1; trial <= trials; trial++) {
    addJobLog(jobId, 'info', `Starting trial ${trial}/${trials}`);
    broadcastLog(jobId, 'log', { level: 'info', message: `Starting trial ${trial}/${trials}` });

    for (let epoch = 1; epoch <= epochs; epoch++) {
      // Simulate training step
      const trainLoss = 0.5 * Math.exp(-epoch / 50) + 0.08 + Math.random() * 0.02;
      const valLoss = 0.55 * Math.exp(-epoch / 55) + 0.12 + Math.random() * 0.03;

      if (epoch % 10 === 0) {
        const logMsg = `Epoch ${epoch}/${epochs} - Train Loss: ${trainLoss.toFixed(4)}, Val Loss: ${valLoss.toFixed(4)}`;
        addJobLog(jobId, 'info', logMsg);
        broadcastLog(jobId, 'progress', {
          epoch,
          totalEpochs: epochs,
          trial,
          totalTrials: trials,
          trainLoss,
          valLoss,
          message: logMsg
        });
      }

      updateJobStatus(jobId, 'running', { progress: ((trial - 1) * epochs + epoch) / (trials * epochs) * 100 });

      // Simulate some delay
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    addJobLog(jobId, 'info', `Trial ${trial} completed`);
    broadcastLog(jobId, 'log', { level: 'info', message: `Trial ${trial} completed` });
  }

  // Complete the job
  addJobLog(jobId, 'success', 'Training completed successfully');
  broadcastLog(jobId, 'complete', { message: 'Training completed successfully' });
  updateJobStatus(jobId, 'completed', {
    progress: 100,
    result: {
      finalTrainLoss: 0.08,
      finalValLoss: 0.12,
      modelPath: `/models/${jobId}.pt`
    }
  });
}

// API Routes

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Data upload
app.post('/api/v1/data/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'No file uploaded' }
      });
    }

    const datasetId = uuidv4();
    const dataset = {
      id: datasetId,
      filename: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      uploadedAt: new Date().toISOString(),
      columns: [], // Would parse actual CSV/Excel columns
      rowCount: 0, // Would count actual rows
    };

    datasets.set(datasetId, dataset);

    res.json({
      success: true,
      data: {
        datasetId,
        filename: dataset.filename,
        size: dataset.size,
        message: 'File uploaded successfully'
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Upload failed' }
    });
  }
});

// Get dataset info
app.get('/api/v1/data/info/:datasetId', (req, res) => {
  const { datasetId } = req.params;
  const dataset = datasets.get(datasetId);

  if (!dataset) {
    return res.status(404).json({
      success: false,
      error: { message: 'Dataset not found' }
    });
  }

  res.json({
    success: true,
    data: {
      id: dataset.id,
      filename: dataset.filename,
      size: dataset.size,
      columns: [
        { name: 'timestamp', type: 'datetime' },
        { name: 'feature1', type: 'float' },
        { name: 'feature2', type: 'float' },
        { name: 'target', type: 'float' },
      ],
      rowCount: 10000,
      uploadedAt: dataset.uploadedAt,
    }
  });
});

// Start training
app.post('/api/v1/train', async (req, res) => {
  try {
    const config = req.body;
    const job = createJob('train', config);

    // Start training simulation asynchronously
    simulateTraining(job.id, config).catch(err => {
      console.error('Training simulation error:', err);
      updateJobStatus(job.id, 'failed', { error: err.message });
    });

    res.json({
      success: true,
      data: {
        jobId: job.id,
        status: job.status,
        message: 'Training job started'
      }
    });
  } catch (error) {
    console.error('Start training error:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to start training' }
    });
  }
});

// Start tuning
app.post('/api/v1/tune', async (req, res) => {
  try {
    const config = req.body;
    config.trials = config.trials || 10;
    const job = createJob('tune', config);

    // Start tuning simulation asynchronously
    simulateTraining(job.id, config).catch(err => {
      console.error('Tuning simulation error:', err);
      updateJobStatus(job.id, 'failed', { error: err.message });
    });

    res.json({
      success: true,
      data: {
        jobId: job.id,
        status: job.status,
        message: 'Hyperparameter tuning started'
      }
    });
  } catch (error) {
    console.error('Start tuning error:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to start tuning' }
    });
  }
});

// Get job status
app.get('/api/v1/jobs/:jobId/status', (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      error: { message: 'Job not found' }
    });
  }

  res.json({
    success: true,
    data: {
      jobId: job.id,
      type: job.type,
      status: job.status,
      progress: job.progress,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      result: job.result,
      error: job.error,
    }
  });
});

// Stop job
app.post('/api/v1/jobs/:jobId/stop', (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      error: { message: 'Job not found' }
    });
  }

  if (job.status === 'running') {
    updateJobStatus(jobId, 'stopped', { message: 'Job stopped by user' });
    addJobLog(jobId, 'warning', 'Job stopped by user');
    broadcastLog(jobId, 'log', { level: 'warning', message: 'Job stopped by user' });
  }

  res.json({
    success: true,
    data: {
      jobId: job.id,
      status: job.status,
      message: 'Job stopped'
    }
  });
});

// List models
app.get('/api/v1/models', (req, res) => {
  const modelsList = Array.from(models.values()).map(model => ({
    id: model.id,
    name: model.name,
    type: model.type,
    createdAt: model.createdAt,
    size: model.size || 0,
    metrics: model.metrics || {},
  }));

  res.json({
    success: true,
    data: {
      models: modelsList,
      total: modelsList.length,
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: {
      message: err.message || 'Internal server error',
      code: 'INTERNAL_ERROR'
    }
  });
});

// Start HTTP server
const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Demo server running on http://${HOST}:${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api/v1/`);
  console.log(`🔌 WebSocket logs available at ws://localhost:${PORT}/ws/logs`);
});

// WebSocket server for log streaming
const wss = new WebSocket.Server({ server, path: '/ws/logs' });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const jobId = url.searchParams.get('jobId');
  const jobType = url.searchParams.get('type') || 'train';

  console.log(`🔌 WebSocket connection: jobId=${jobId}, type=${jobType}`);

  if (!jobId) {
    ws.close(1008, 'Missing jobId parameter');
    return;
  }

  // Register connection
  if (!activeConnections.has(jobId)) {
    activeConnections.set(jobId, new Set());
  }
  activeConnections.get(jobId).add(ws);

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'info',
    payload: { message: `Connected to ${jobType} logs for job ${jobId}` },
    timestamp: new Date().toISOString()
  }));

  // Send existing logs if job exists
  const job = jobs.get(jobId);
  if (job && job.logs.length > 0) {
    job.logs.forEach(log => {
      ws.send(JSON.stringify({
        type: 'log',
        payload: { level: log.level, message: log.message },
        timestamp: log.timestamp
      }));
    });
  }

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
      }
    } catch (err) {
      // Ignore invalid messages
    }
  });

  ws.on('close', () => {
    console.log(`🔌 WebSocket disconnected: jobId=${jobId}`);
    const connections = activeConnections.get(jobId);
    if (connections) {
      connections.delete(ws);
      if (connections.size === 0) {
        activeConnections.delete(jobId);
      }
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('👋 Server closed');
    process.exit(0);
  });
});

console.log('📝 Starting demo server initialization...');