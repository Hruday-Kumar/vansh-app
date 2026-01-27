/**
 * 🪷 WINSTON LOGGER
 * Structured logging for production
 */

import path from 'path';
import winston from 'winston';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom format for development
const devFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  let log = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(meta).length > 0) {
    log += ` ${JSON.stringify(meta)}`;
  }
  if (stack) {
    log += `\n${stack}`;
  }
  return log;
});

// Custom format for production (JSON)
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

// Determine log level based on environment
const getLogLevel = () => {
  switch (process.env.NODE_ENV) {
    case 'production':
      return 'info';
    case 'test':
      return 'error'; // Minimal logging in tests
    default:
      return 'debug';
  }
};

// Create logger instance
const logger = winston.createLogger({
  level: getLogLevel(),
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true })
  ),
  defaultMeta: { service: 'vansh-api' },
  transports: [
    // Console transport (always active)
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production'
        ? prodFormat
        : combine(colorize(), devFormat),
    }),
  ],
});

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  const logsDir = process.env.LOGS_DIR || path.join(process.cwd(), 'logs');
  
  // Error log file
  logger.add(new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }));
  
  // Combined log file
  logger.add(new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }));
}

// ═══════════════════════════════════════════════════════════
// HELPER METHODS
// ═══════════════════════════════════════════════════════════

/**
 * Log HTTP request
 */
export function logRequest(req: {
  method: string;
  path: string;
  ip?: string;
  userId?: string;
}) {
  logger.info('HTTP Request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userId: req.userId,
  });
}

/**
 * Log HTTP response
 */
export function logResponse(res: {
  statusCode: number;
  duration: number;
  path: string;
}) {
  const level = res.statusCode >= 400 ? 'warn' : 'info';
  logger[level]('HTTP Response', {
    statusCode: res.statusCode,
    duration: `${res.duration}ms`,
    path: res.path,
  });
}

/**
 * Log database query (development only)
 */
export function logQuery(query: string, params?: any[], duration?: number) {
  if (process.env.NODE_ENV !== 'production') {
    logger.debug('DB Query', {
      query: query.substring(0, 200),
      params: params?.length,
      duration: duration ? `${duration}ms` : undefined,
    });
  }
}

/**
 * Log error with context
 */
export function logError(error: Error, context?: Record<string, any>) {
  logger.error(error.message, {
    stack: error.stack,
    name: error.name,
    ...context,
  });
}

/**
 * Log security event
 */
export function logSecurity(event: string, details: Record<string, any>) {
  logger.warn(`Security: ${event}`, {
    type: 'security',
    ...details,
  });
}

/**
 * Log business event
 */
export function logEvent(event: string, data?: Record<string, any>) {
  logger.info(event, { type: 'event', ...data });
}

export default logger;
