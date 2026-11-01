// ==================== 1. DNS & ENV BOOTSTRAP (MUST BE LINE 1) ====================
const dns = require('dns');
const path = require('path');
const dotenv = require('dotenv');

// Load .env ONCE quietly (prevents duplicate "injected env (0) from .env" logs)
dotenv.config({ path: path.resolve(__dirname, '.env'), quiet: true });

// Force IPv4 resolution first across all Node.js network requests (MongoDB + Gmail SMTP)
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

// Force Node's c-ares resolver (used by mongodb+srv:// querySrv) to use Google & Cloudflare IPv4 DNS
try {
  dns.setServers([
    '8.8.8.8', // Google Primary IPv4
    '1.1.1.1', // Cloudflare Primary IPv4
    '8.8.4.4', // Google Secondary IPv4
    '1.0.0.1', // Cloudflare Secondary IPv4
  ]);
  console.log('[DNS Engine] Bound Node.js c-ares resolver to Public IPv4 DNS (8.8.8.8, 1.1.1.1)');
} catch (err) {
  console.warn('[DNS Engine] Using system default DNS resolver:', err.message);
}

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

// Import MongoDB database connection and Auth routes
let connectDB;
let seedDefaultAccounts;
let authRoutes;
let orderRoutes;
let verifySmtpConnection;

try {
  const dbModule = require('./dist/config/db');
  connectDB = dbModule.connectDB || dbModule.connectDatabase || dbModule.default;
  const userModule = require('./dist/models/User');
  seedDefaultAccounts = userModule.seedDefaultAccounts;
  const routesModule = require('./dist/routes/authRoutes');
  authRoutes = routesModule.default || routesModule;
  const orderRoutesModule = require('./dist/routes/orderRoutes');
  orderRoutes = orderRoutesModule.default || orderRoutesModule;
  const notifService = require('./dist/services/notificationService');
  verifySmtpConnection = notifService.verifySmtpConnection;
} catch (err) {
  try {
    const fallbackDb = require('./config/db');
    connectDB = fallbackDb.connectDatabase || fallbackDb.connectDB;
    orderRoutes = require('./routes/orderRoutes');
  } catch (e) {
    console.warn('[Server Warning] Could not load database or route modules:', e.message);
  }
}

const app = express();

const ML_SERVICE_URL =
  process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
const HUGGINGFACE_MODEL =
  process.env.HUGGINGFACE_MODEL ||
  'linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification';
const HUGGINGFACE_API_URL =
  process.env.HUGGINGFACE_API_URL ||
  'https://router.huggingface.co/hf-inference/models';
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

// Middleware
app.use(cors());
app.use(express.json({ limit: '12mb' }));

// Mount Authentication & Security Routes
if (authRoutes) {
  app.use('/api/auth', authRoutes);
}

// Mount E-Commerce & Razorpay Order Routes
if (orderRoutes) {
  app.use('/api/orders', orderRoutes);
}

// Receive uploaded images in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_BYTES,
  },
  fileFilter: (req, file, callback) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(
        new Error('Only JPG, PNG, and WEBP images are allowed.')
      );
    }
  },
});

// Backend health check
app.get('/', (req, res) => {
  res.json({
    message: 'Future Farming Backend is running!',
    status: 'OK',
  });
});

// Check whether the Python ML service is reachable
app.get('/api/health', async (req, res) => {
  try {
    const response = await axios.get(
      `${ML_SERVICE_URL}/health`,
      { timeout: 5000 }
    );

    res.json({
      backend: 'healthy',
      mlService: response.data,
    });
  } catch (error) {
    console.error('ML health check failed:', error.message);

    res.status(503).json({
      backend: 'healthy',
      mlService: 'unavailable',
      message:
        'The Python ML service could not be reached. Check that it is running on port 8000.',
    });
  }
});

// Crop disease analysis
app.post(
  '/api/crop/analyze',
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Please upload a crop image.',
        });
      }

      console.log(
        'Received crop image:',
        req.file.originalname
      );

      // Forward the image to the Python ML service
      const form = new FormData();

      form.append('image', req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });

      const mlResponse = await axios.post(
        `${ML_SERVICE_URL}/api/crop/analyze`,
        form,
        {
          headers: form.getHeaders(),
          timeout: 60000,
          maxBodyLength: 6 * 1024 * 1024,
        }
      );

      return res.status(200).json({
        success: true,
        message: 'Crop image processed by the ML service.',
        result: mlResponse.data,
      });
    } catch (error) {
      console.error(
        'Crop analysis failed:',
        error.response?.data || error.message
      );

      if (error.response) {
        return res.status(error.response.status).json({
          success: false,
          message: 'The ML service could not process the image.',
          details: error.response.data,
        });
      }

      if (
        error.code === 'ECONNREFUSED' ||
        error.code === 'ECONNABORTED'
      ) {
        return res.status(503).json({
          success: false,
          message:
            'The ML service is unavailable or took too long to respond.',
        });
      }

      return res.status(500).json({
        success: false,
        message: 'An error occurred during crop analysis.',
      });
    }
  }
);

// Optional Hugging Face / local ML disease prediction
function detectImageMime(buffer) {
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    return 'image/jpeg';
  }

  if (
    buffer.length > 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }

  if (
    buffer.length > 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }

  return null;
}

function decodeBase64Image(value) {
  if (typeof value !== 'string') return null;

  const commaIndex = value.indexOf(',');
  const stripped =
    value.startsWith('data:') && commaIndex >= 0
      ? value.slice(commaIndex + 1)
      : value;
  const cleaned = stripped.replace(/\s+/g, '');

  if (cleaned.length < 64) return null;
  if (!/^[A-Za-z0-9+/=_-]+$/.test(cleaned)) return null;

  const buffer = Buffer.from(
    cleaned.replace(/-/g, '+').replace(/_/g, '/'),
    'base64'
  );

  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) {
    return null;
  }

  return buffer;
}

function normalizeHfPredictions(payload) {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.predictions)
      ? payload.predictions
      : [];

  return list
    .filter(
      (item) =>
        item &&
        typeof item.label === 'string' &&
        Number.isFinite(Number(item.score))
    )
    .map((item) => ({
      label: item.label,
      score: Number(item.score),
    }))
    .sort((a, b) => b.score - a.score);
}

function extractLocalPrediction(payload) {
  const candidate =
    payload?.prediction ??
    payload?.result?.prediction ??
    payload?.result ??
    null;

  if (
    candidate &&
    typeof candidate === 'object' &&
    typeof candidate.label === 'string'
  ) {
    return {
      label: candidate.label,
      score: Number(candidate.score ?? candidate.confidence ?? 0),
    };
  }

  return null;
}

function extensionForMime(mime) {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

app.post(
  '/api/predict-disease',
  upload.single('image'),
  async (req, res) => {
    const startedAt = Date.now();
    let buffer = req.file?.buffer ?? null;
    let mime = req.file?.mimetype ?? null;

    if (!buffer) {
      const raw =
        req.body?.imageBase64 ??
        req.body?.image_base64 ??
        req.body?.image;

      buffer = decodeBase64Image(raw);

      if (buffer) {
        mime = detectImageMime(buffer);
      }
    }

    if (!buffer) {
      return res.status(400).json({
        available: false,
        prediction: null,
        message:
          'Provide imageBase64 (JSON) or an image file in the "image" field.',
      });
    }

    if (!mime) {
      mime =
        req.file?.mimetype ?? detectImageMime(buffer) ?? 'image/jpeg';
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(mime)) {
      return res.status(400).json({
        available: false,
        prediction: null,
        message: 'Only JPG, PNG, and WEBP images are allowed.',
      });
    }

    const cropHint =
      typeof req.body?.cropHint === 'string'
        ? req.body.cropHint
        : null;

    const basePayload = {
      available: false,
      prediction: null,
      alternatives: [],
      model: HUGGINGFACE_MODEL,
      provider: 'none',
      cropHint,
      latencyMs: 0,
      message: null,
    };

    if (process.env.HUGGINGFACE_API_KEY) {
      try {
        const hfResponse = await axios.post(
          `${HUGGINGFACE_API_URL}/${HUGGINGFACE_MODEL}`,
          buffer,
          {
            headers: {
              Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
              'Content-Type': mime,
              Accept: 'application/json',
            },
            timeout: 25000,
            maxBodyLength: Infinity,
          }
        );

        const predictions = normalizeHfPredictions(hfResponse.data);

        if (predictions.length > 0) {
          const [top, ...rest] = predictions;

          return res.status(200).json({
            ...basePayload,
            available: true,
            provider: 'huggingface',
            prediction: {
              ...top,
              model: HUGGINGFACE_MODEL,
              provider: 'huggingface',
            },
            alternatives: rest.slice(0, 4),
            latencyMs: Date.now() - startedAt,
          });
        }
      } catch (error) {
        console.error(
          'Hugging Face inference failed:',
          error.response?.data || error.message
        );
      }
    }

    try {
      const form = new FormData();

      form.append('image', buffer, {
        filename: `leaf.${extensionForMime(mime)}`,
        contentType: mime,
      });

      const mlResponse = await axios.post(
        `${ML_SERVICE_URL}/api/crop/analyze`,
        form,
        {
          headers: form.getHeaders(),
          timeout: 30000,
          maxBodyLength: Infinity,
        }
      );

      const localPrediction = extractLocalPrediction(
        mlResponse.data
      );

      if (localPrediction) {
        return res.status(200).json({
          ...basePayload,
          available: true,
          provider: 'local-ml-service',
          prediction: {
            ...localPrediction,
            model: 'local-ensemble',
            provider: 'local-ml-service',
          },
          latencyMs: Date.now() - startedAt,
        });
      }
    } catch (error) {
      console.error(
        'Local ML inference failed:',
        error.response?.data || error.message
      );
    }

    return res.status(200).json({
      ...basePayload,
      latencyMs: Date.now() - startedAt,
      message:
        'No vision model is configured. Set HUGGINGFACE_API_KEY on the backend or connect the Python ML service. The mobile app continues with on-device pixel segmentation.',
    });
  }
);

// Handle invalid uploads and other request errors
app.use((err, req, res, next) => {
  console.error('Request error:', err.message);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message:
        err.code === 'LIMIT_FILE_SIZE'
          ? `Image must be smaller than ${MAX_IMAGE_BYTES / (1024 * 1024)} MB.`
          : err.message,
    });
  }

  return res.status(400).json({
    success: false,
    message: err.message || 'Invalid request.',
  });
});

// ==================== HTTP SERVER & PORT GUARD ====================
const http = require('http');
const { exec } = require('child_process');

const PORT = Number(process.env.PORT) || 5000;
const server = http.createServer(app);

let retryCount = 0;
const MAX_PORT_RETRIES = 3;

function startServer(portToBind) {
  server.listen(portToBind, '0.0.0.0', async () => {
    retryCount = 0;
    console.log(`[Server] Future Farming Backend running smoothly on http://localhost:${portToBind}`);
    console.log(`ML service configured at ${ML_SERVICE_URL}`);

    // Initialize secure MongoDB connection
    if (connectDB) {
      try {
        const conn = await connectDB(3);
        if (conn && seedDefaultAccounts) {
          await seedDefaultAccounts();
        }
      } catch (dbErr) {
        console.warn('[MongoDB Diagnostic] Server operating in resilient fallback mode:', dbErr.message);
      }
    }

    // Initialize and verify Gmail SMTP Transporter
    if (verifySmtpConnection) {
      verifySmtpConnection().catch((err) => {
        console.warn('[Gmail SMTP] Startup diagnostic notice:', err.message);
      });
    }
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    retryCount += 1;
    console.warn(`[Server Port Guard] Port ${PORT} is busy (Attempt ${retryCount}/${MAX_PORT_RETRIES}). Reclaiming port ${PORT}...`);

    if (retryCount <= MAX_PORT_RETRIES && process.platform === 'win32') {
      // Find and terminate the stale background PID holding port 5000 (excluding current process.pid)
      exec(`netstat -ano | findstr :${PORT}`, (execErr, stdout) => {
        if (!execErr && stdout) {
          const lines = stdout.trim().split('\n');
          const pids = new Set();
          for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            const state = parts[3];
            const pid = parseInt(parts[parts.length - 1], 10);
            if (state === 'LISTENING' && pid && pid !== process.pid && pid > 0) {
              pids.add(pid);
            }
          }
          pids.forEach((pid) => {
            try {
              process.kill(pid, 'SIGKILL');
              console.log(`[Server Port Guard] Terminated stale process PID ${pid} on port ${PORT}`);
            } catch (_) {}
          });
        }
        setTimeout(() => {
          try {
            server.close();
          } catch (_) {}
          startServer(PORT);
        }, 1200);
      });
    } else if (retryCount <= MAX_PORT_RETRIES) {
      setTimeout(() => {
        try {
          server.close();
        } catch (_) {}
        startServer(PORT);
      }, 1200);
    } else {
      console.warn(`[Server Port Guard] Port ${PORT} is already running an active Future Farming Backend instance.`);
    }
  } else {
    console.error('[Server Error]:', err.message);
  }
});

// Close all active keep-alive connections immediately when node --watch or Ctrl+C restarts server.js
function gracefulShutdown(signal) {
  console.log(`[Server] Received ${signal}. Releasing port ${PORT}...`);
  if (typeof server.closeAllConnections === 'function') {
    server.closeAllConnections();
  }
  server.close(() => {
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 500).unref();
}

process.once('SIGINT', () => gracefulShutdown('SIGINT'));
process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.once('SIGUSR2', () => gracefulShutdown('SIGUSR2'));

startServer(PORT);