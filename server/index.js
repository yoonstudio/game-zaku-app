/**
 * Zaku Colony Destroyer - Backend Server
 *
 * Provides REST API for leaderboard and WebSocket for real-time features.
 * The client can optionally connect to this server for online features.
 *
 * Features:
 * - POST /api/scores - Submit a new score
 * - GET /api/scores - Get top scores (leaderboard)
 * - GET /api/scores/:playerName - Get scores for a specific player
 * - WebSocket /ws - Real-time player count and high score notifications
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';

import { initDatabase } from './db/database.js';
import { initWebSocket, getConnectedCount } from './ws/websocket.js';
import scoresRouter from './routes/scores.js';

// Configuration
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'http://localhost:5173',      // Vite dev server
  'http://localhost:3000',      // Alternative dev port
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL      // Production frontend URL
].filter(Boolean);

// Initialize Express app
const app = express();

// Create HTTP server for both Express and WebSocket
const server = createServer(app);

// ============================================
// Middleware Configuration
// ============================================

// Security headers with Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false // Disable for game assets
}));

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (ALLOWED_ORIGINS.includes(origin) || NODE_ENV === 'development') {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '1kb' })); // Small limit for security
app.use(express.urlencoded({ extended: false }));

// Request logging (development only)
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// ============================================
// Rate Limiting
// ============================================

// General API rate limit
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter rate limit for score submission
const scoreLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 score submissions per minute
  message: {
    success: false,
    error: 'Too many score submissions, please wait before trying again'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiters
app.use('/api/', generalLimiter);
app.use('/api/scores', (req, res, next) => {
  if (req.method === 'POST') {
    return scoreLimiter(req, res, next);
  }
  next();
});

// ============================================
// Routes
// ============================================

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    service: 'zaku-colony-destroyer-server',
    version: '1.0.0',
    uptime: process.uptime(),
    connectedPlayers: getConnectedCount(),
    timestamp: new Date().toISOString()
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Zaku Colony Destroyer API',
    version: '1.0.0',
    endpoints: {
      'POST /api/scores': 'Submit a new score',
      'GET /api/scores': 'Get top scores (query: limit)',
      'GET /api/scores/:playerName': 'Get scores for a player',
      'GET /api/scores/rank/:score': 'Get rank for a score',
      'GET /health': 'Server health check',
      'WS /ws': 'WebSocket for real-time updates'
    }
  });
});

// Scores API routes
app.use('/api/scores', scoresRouter);

// ============================================
// Error Handling
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.stack || err.message || err);

  // CORS error
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      error: 'Origin not allowed'
    });
  }

  // JSON parse error
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON in request body'
    });
  }

  // Default server error
  res.status(err.status || 500).json({
    success: false,
    error: NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// ============================================
// Server Startup
// ============================================

async function startServer() {
  try {
    // Initialize database
    await initDatabase();

    // Initialize WebSocket
    initWebSocket(server);

    // Start HTTP server
    server.listen(PORT, HOST, () => {
      console.log('');
      console.log('='.repeat(60));
      console.log('  Zaku Colony Destroyer - Game Server');
      console.log('='.repeat(60));
      console.log(`  Environment: ${NODE_ENV}`);
      console.log(`  HTTP Server: http://${HOST}:${PORT}`);
      console.log(`  WebSocket:   ws://${HOST}:${PORT}/ws`);
      console.log(`  Health:      http://${HOST}:${PORT}/health`);
      console.log('='.repeat(60));
      console.log('');
    });

    // Graceful shutdown handling
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    console.error('[Startup Error]', error);
    process.exit(1);
  }
}

function gracefulShutdown() {
  console.log('\n[Server] Shutting down gracefully...');

  server.close(() => {
    console.log('[Server] HTTP server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.log('[Server] Forcing shutdown');
    process.exit(1);
  }, 10000);
}

// Start the server
startServer();
