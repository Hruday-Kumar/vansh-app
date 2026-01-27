/**
 * 🪷 SENTRY ERROR TRACKING
 * Production error monitoring and reporting
 */

import * as Sentry from '@sentry/node';
import type { Express, NextFunction, Request, Response } from 'express';
import logger from './logger';

// ═══════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════

let isInitialized = false;

/**
 * Initialize Sentry SDK
 * Call this early in your app initialization
 */
export function initSentry(app?: Express) {
  const dsn = process.env.SENTRY_DSN;
  
  if (!dsn) {
    logger.warn('Sentry DSN not configured - error tracking disabled');
    return;
  }
  
  if (isInitialized) {
    logger.debug('Sentry already initialized');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.APP_VERSION || '1.0.0',
    
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Error filtering
    beforeSend(event, hint) {
      // Don't send expected errors (4xx)
      const error = hint.originalException as Error;
      if (error?.name === 'AppError') {
        const appError = error as any;
        if (appError.statusCode < 500) {
          return null;
        }
      }
      return event;
    },
    
    // Sensitive data filtering
    beforeBreadcrumb(breadcrumb) {
      // Filter out sensitive data from breadcrumbs
      if (breadcrumb.category === 'http') {
        delete breadcrumb.data?.password;
        delete breadcrumb.data?.token;
      }
      return breadcrumb;
    },
    
    // Integration options
    integrations: [
      Sentry.httpIntegration(),
    ],
    
    // Ignore common errors
    ignoreErrors: [
      'ECONNRESET',
      'ECONNREFUSED',
      'socket hang up',
    ],
  });

  isInitialized = true;
  logger.info('🔍 Sentry error tracking initialized');
}

// ═══════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════

/**
 * Request handler - adds request context to Sentry
 */
export function sentryRequestHandler() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Add request context to Sentry scope
    Sentry.withScope((scope) => {
      scope.setExtra('url', req.url);
      scope.setExtra('method', req.method);
    });
    next();
  };
}

/**
 * Error handler - captures unhandled errors
 */
export function sentryErrorHandler() {
  return (err: Error, req: Request, res: Response, next: NextFunction) => {
    // Capture error in Sentry
    Sentry.captureException(err, {
      extra: {
        url: req.url,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query,
        userId: (req as any).user?.userId,
      },
    });
    next(err);
  };
}

// ═══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string; role?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearUser() {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, any>,
  level: Sentry.SeverityLevel = 'info'
) {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level,
  });
}

/**
 * Capture a message (non-error event)
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * Capture an exception manually
 */
export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Set custom tag
 */
export function setTag(key: string, value: string) {
  Sentry.setTag(key, value);
}

/**
 * Flush pending events (call before process exit)
 */
export async function flush(timeout = 2000): Promise<boolean> {
  return Sentry.flush(timeout);
}

export { Sentry };

