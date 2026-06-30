/**
 * CivicPulse — Backend Entry Point
 * Express server with all routes, middleware, and periodic risk scanning.
 */
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config/env.js';
import analyticsService from './services/AnalyticsService.js';
import ticketRoutes from './routes/tickets.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import votingRoutes from './routes/voting.js';
import analyticsRoutes from './routes/analytics.js';
import chatRoutes from './routes/chat.js';
import { errorHandler } from './middleware/errorHandler.js';
import orchestrator from './orchestrator/Orchestrator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ── Middleware ──────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ── API Routes ─────────────────────────────────────────────────
app.use('/api/tickets', ticketRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/votes', votingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'CivicPulse Backend',
    version: '1.0.0',
    mode: config.useMock ? 'mock' : 'live',
    timestamp: new Date().toISOString(),
  });
});

// ── API Error Handler ──────────────────────────────────────────
app.use('/api', errorHandler);

// ── Serve Frontend Static Files ────────────────────────────────
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// SPA fallback — any non-API route returns index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// ── Initialize Services ────────────────────────────────────────
analyticsService.init();

// ── Periodic Risk Scan ─────────────────────────────────────────
// Run risk scan every 5 minutes
const RISK_SCAN_INTERVAL = 5 * 60 * 1000;
setInterval(async () => {
  try {
    await orchestrator.runRiskScan();
  } catch (err) {
    console.error('Periodic risk scan failed:', err.message);
  }
}, RISK_SCAN_INTERVAL);

// ── Start Server ───────────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║                                                  ║
║   🏛️  CivicPulse Backend v1.0.0                  ║
║                                                  ║
║   Port:  ${String(config.port).padEnd(39)}║
║   Mode:  ${(config.useMock ? '🔶 MOCK' : '🟢 LIVE').padEnd(39)}║
║   Env:   ${config.nodeEnv.padEnd(39)}║
║                                                  ║
╚══════════════════════════════════════════════════╝
  `);
});

export default app;
