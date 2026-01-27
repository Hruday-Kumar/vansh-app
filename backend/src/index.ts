/**
 * 🪷 VANSH BACKEND SERVER - Production Ready
 * Express.js API for the family heritage app
 */

import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import morgan from 'morgan';
import { networkInterfaces } from 'os';
import path from 'path';

import { closePool, testConnection } from './config/database';
import { errorHandler, requestLogger } from './middleware/index';
import authRoutes from './routes/auth.routes';
import familyRoutes from './routes/family.routes';
import kathaRoutes from './routes/katha.routes';
import memberRoutes from './routes/member.routes';
import memoryRoutes from './routes/memory.routes';
import userRoutes from './routes/user.routes';
import vasiyatRoutes from './routes/vasiyat.routes';
import { initSentry, logger, sentryErrorHandler } from './services';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Initialize Sentry early (before other middleware)
initSentry(app);

// Get local network IP for BASE_URL
function getLocalIP(): string {
  const nets = networkInterfaces();
  const candidates: string[] = [];
  
  for (const name of Object.keys(nets)) {
    const interfaces = nets[name];
    if (!interfaces) continue;
    for (const net of interfaces) {
      // Skip internal and non-IPv4 addresses
      if (net.family === 'IPv4' && !net.internal) {
        candidates.push(net.address);
        if (!isProduction) console.log(`  Found IP: ${net.address} (${name})`);
      }
    }
  }
  
  const preferred = candidates.find(ip => 
    ip.startsWith('172.') || ip.startsWith('10.')
  ) || candidates.find(ip => 
    ip.startsWith('192.168.')
  );
  
  return preferred || candidates[0] || 'localhost';
}

// Set BASE_URL to network IP so devices can access files
if (!isProduction) console.log('🔍 Detecting network interfaces...');
const localIP = getLocalIP();
process.env.BASE_URL = process.env.BASE_URL || `http://${localIP}:${PORT}`;
console.log(`📡 BASE_URL set to: ${process.env.BASE_URL}`);

// ═══════════════════════════════════════════════════════════
// PRODUCTION MIDDLEWARE
// ═══════════════════════════════════════════════════════════

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Disable for API
}));

// Compression
app.use(compression());

// Request logging
if (isProduction) {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Rate limiting - general
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 100 : 1000, // limit per IP
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting - auth endpoints (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 10 : 100,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many auth attempts' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS configuration
app.use(cors({
  origin: isProduction 
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://vansh.app']
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom request logger (for non-production)
if (!isProduction) {
  app.use(requestLogger);
}

// Apply rate limiting
app.use('/api/', generalLimiter);
app.use('/api/auth', authLimiter);

// Static file serving for uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/families', familyRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/kathas', kathaRoutes);
app.use('/api/vasiyats', vasiyatRoutes);

// Debug endpoint for token testing
app.get('/api/debug/token', (req, res) => {
  const authHeader = req.headers.authorization;
  const secret = process.env.JWT_SECRET || 'vansh_secret';
  
  if (!authHeader) {
    return res.json({
      success: false,
      error: 'No Authorization header',
      help: 'Make sure you send: Authorization: Bearer <token>'
    });
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    return res.json({
      success: false,
      error: 'Authorization header must start with "Bearer "',
      received: authHeader.substring(0, 50)
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.json({
      success: false,
      error: 'No token after "Bearer"'
    });
  }
  
  try {
    const decoded = jwt.verify(token, secret);
    
    return res.json({
      success: true,
      message: 'Token is valid! ✅',
      decoded,
      tokenLength: token.length
    });
  } catch (error: any) {
    return res.json({
      success: false,
      error: error.message,
      errorType: error.name,
      tokenLength: token.length,
      help: error.name === 'TokenExpiredError' 
        ? 'Token expired - log out and log back in'
        : error.name === 'JsonWebTokenError'
        ? 'Token is malformed or signed with wrong secret'
        : 'Unknown error'
    });
  }
});

// Health check with database status
app.get('/api/health', async (req, res) => {
  try {
    const dbHealthy = await testConnection();
    res.json({ 
      success: true, 
      message: '🪷 Vansh API is running',
      timestamp: new Date().toISOString(),
      database: dbHealthy ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime()
    });
  } catch {
    res.json({ 
      success: true, 
      message: '🪷 Vansh API is running',
      timestamp: new Date().toISOString(),
      database: 'unknown',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime()
    });
  }
});

// Sentry error handler (must be before our error handler)
app.use(sentryErrorHandler());

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint not found' }
  });
});

// ═══════════════════════════════════════════════════════════
// SERVER STARTUP & GRACEFUL SHUTDOWN
// ═══════════════════════════════════════════════════════════

const portNumber = typeof PORT === 'string' ? parseInt(PORT, 10) : PORT;

// Store server reference for graceful shutdown
const server = app.listen(portNumber, '0.0.0.0', async () => {
  // Test database connection on startup
  const dbConnected = await testConnection();
  
  logger.info('🪷 VANSH HERITAGE API SERVER STARTED', {
    status: isProduction ? 'PRODUCTION' : 'DEVELOPMENT',
    port: PORT,
    localIP,
    database: dbConnected ? 'connected' : 'disconnected',
    baseUrl: process.env.BASE_URL,
  });
  
  // Also print banner for readability
  console.log(`
  🪷 ═══════════════════════════════════════════════════════
     VANSH HERITAGE API SERVER
     
     Status:    ${isProduction ? '🟢 PRODUCTION' : '🟡 DEVELOPMENT'}
     Server:    http://0.0.0.0:${PORT}
     Local:     http://localhost:${PORT}
     Network:   http://${localIP}:${PORT}
     Database:  ${dbConnected ? '✅ Connected' : '❌ Disconnected'}
     
     BASE_URL:  ${process.env.BASE_URL}
  ═══════════════════════════════════════════════════════ 🪷
  `);
});

// Graceful shutdown handler
async function gracefulShutdown(signal: string) {
  logger.info(`Graceful shutdown initiated`, { signal });
  
  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed');
    
    try {
      // Close database pool
      await closePool();
      logger.info('Database connections closed');
    } catch (err) {
      logger.error('Error closing database', { error: err });
    }
    
    // Flush Sentry events before exit
    const { flush } = await import('./services/sentry');
    await flush(2000);
    
    logger.info('Graceful shutdown complete');
    process.exit(0);
  });
  
  // Force exit after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Error handlers
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  const { captureException } = require('./services/sentry');
  captureException(error);
  if (isProduction) {
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  }
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise: String(promise) });
});

export default app;
