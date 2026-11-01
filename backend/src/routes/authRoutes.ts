import { Router } from 'express';
import {
  register,
  login,
  getMe,
  logout,
  getActivityLogs,
  testEmail,
} from '../controllers/authController';
import { protect, adminOnly } from '../middleware/authMiddleware';
import { isDatabaseConnected } from '../config/db';

const router = Router();

// ─── Health check for auth & database subsystem ───────────────────────
router.get('/health', (_req, res) => {
  const dbConnected = isDatabaseConnected();
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? 'healthy' : 'degraded',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// ─── Diagnostic Test Email Endpoint ───────────────────────────────────
router.get('/test-email', testEmail);

// ─── Public Authentication Routes ─────────────────────────────────────
router.post('/register', register);
router.post('/login', login);

// ─── Protected Routes (Requires valid JWT in Authorization header) ────
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

// ─── Admin-Only Protected Routes ──────────────────────────────────────
router.get('/logs', protect, adminOnly, getActivityLogs);

export default router;
