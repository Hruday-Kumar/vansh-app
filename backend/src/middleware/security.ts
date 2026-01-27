/**
 * 🪷 SECURITY MIDDLEWARE
 * Rate limiting, security headers, and request validation
 */

import { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { body, param, query, ValidationChain, validationResult } from 'express-validator';
import helmet from 'helmet';

// ═══════════════════════════════════════════════════════════
// HELMET SECURITY HEADERS
// ═══════════════════════════════════════════════════════════

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Required for mobile app
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// ═══════════════════════════════════════════════════════════
// RATE LIMITING
// ═══════════════════════════════════════════════════════════

/**
 * General API rate limit - 100 requests per 15 minutes
 */
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'बहुत अधिक अनुरोध। कृपया बाद में पुनः प्रयास करें।',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

/**
 * Auth endpoints rate limit - 5 attempts per 15 minutes
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    message: 'बहुत अधिक लॉगिन प्रयास। कृपया 15 मिनट बाद पुनः प्रयास करें।',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  validate: { xForwardedForHeader: false },
});

/**
 * Sensitive operations rate limit - 10 per hour
 */
export const sensitiveRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: false,
    message: 'सुरक्षा सीमा पार हो गई। कृपया बाद में पुनः प्रयास करें।',
    code: 'SENSITIVE_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * File upload rate limit - 20 per hour
 */
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: {
    success: false,
    message: 'अपलोड सीमा पार हो गई। कृपया बाद में पुनः प्रयास करें।',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ═══════════════════════════════════════════════════════════
// INPUT VALIDATION RULES
// ═══════════════════════════════════════════════════════════

export const validationRules = {
  // Auth validation
  register: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('कृपया वैध ईमेल पता दर्ज करें'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('पासवर्ड कम से कम 6 अक्षर का होना चाहिए'),
    body('memberName')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('नाम 2-100 अक्षरों के बीच होना चाहिए')
      .escape(),
    body('phone')
      .optional()
      .isMobilePhone('any')
      .withMessage('कृपया वैध फ़ोन नंबर दर्ज करें'),
  ],

  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('कृपया वैध ईमेल पता दर्ज करें'),
    body('password')
      .notEmpty()
      .withMessage('पासवर्ड आवश्यक है'),
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('वर्तमान पासवर्ड आवश्यक है'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('नया पासवर्ड कम से कम 8 अक्षर का होना चाहिए')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('पासवर्ड में कम से कम एक बड़ा अक्षर, छोटा अक्षर और अंक होना चाहिए'),
  ],

  // Member validation
  createMember: [
    body('fullName')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('नाम 2-100 अक्षरों के बीच होना चाहिए')
      .escape(),
    body('birthDate')
      .optional()
      .isISO8601()
      .withMessage('कृपया वैध जन्म तिथि दर्ज करें'),
    body('gender')
      .optional()
      .isIn(['male', 'female', 'other'])
      .withMessage('अमान्य लिंग मान'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('कृपया वैध ईमेल पता दर्ज करें'),
    body('phone')
      .optional()
      .isMobilePhone('any')
      .withMessage('कृपया वैध फ़ोन नंबर दर्ज करें'),
  ],

  // Memory validation
  createMemory: [
    body('title')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('शीर्षक 1-200 अक्षरों के बीच होना चाहिए')
      .escape(),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('विवरण 5000 अक्षरों से अधिक नहीं हो सकता')
      .escape(),
    body('visibility')
      .optional()
      .isIn(['public', 'family', 'private'])
      .withMessage('अमान्य दृश्यता मान'),
  ],

  // Katha validation
  createKatha: [
    body('title')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('शीर्षक 1-200 अक्षरों के बीच होना चाहिए')
      .escape(),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('विवरण 2000 अक्षरों से अधिक नहीं हो सकता')
      .escape(),
  ],

  // UUID validation
  uuid: [
    param('id')
      .isUUID()
      .withMessage('अमान्य ID प्रारूप'),
  ],

  // Pagination validation
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('पृष्ठ संख्या 1 या अधिक होनी चाहिए'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('सीमा 1-100 के बीच होनी चाहिए'),
  ],
};

// ═══════════════════════════════════════════════════════════
// VALIDATION MIDDLEWARE
// ═══════════════════════════════════════════════════════════

/**
 * Validate request and return errors if any
 */
export function validate(validations: ValidationChain[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: 'path' in err ? err.path : 'unknown',
        message: err.msg,
      })),
    });
  };
}

// ═══════════════════════════════════════════════════════════
// INPUT SANITIZATION
// ═══════════════════════════════════════════════════════════

/**
 * Sanitize user input to prevent XSS and injection
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Middleware to sanitize request body
 */
export function sanitizeBody(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
}

// ═══════════════════════════════════════════════════════════
// IP BLOCKING (for suspicious activity)
// ═══════════════════════════════════════════════════════════

const blockedIPs = new Set<string>();
const suspiciousActivity = new Map<string, number>();

/**
 * Track suspicious activity from an IP
 */
export function trackSuspiciousActivity(ip: string): void {
  const count = (suspiciousActivity.get(ip) || 0) + 1;
  suspiciousActivity.set(ip, count);
  
  // Auto-block after 10 suspicious requests
  if (count >= 10) {
    blockedIPs.add(ip);
    console.warn(`🚫 IP blocked for suspicious activity: ${ip}`);
  }
}

/**
 * Middleware to check if IP is blocked
 */
export function checkBlockedIP(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
  
  if (blockedIPs.has(ip)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
      code: 'IP_BLOCKED',
    });
  }
  
  next();
}

// ═══════════════════════════════════════════════════════════
// REQUEST LOGGING (for security audit)
// ═══════════════════════════════════════════════════════════

export function securityAuditLog(req: Request, _res: Response, next: NextFunction) {
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    userId: (req as any).user?.id,
  };
  
  // Log to console in development, use proper logging in production
  if (process.env.NODE_ENV === 'development') {
    console.log('📝 Security Audit:', JSON.stringify(logData));
  }
  
  next();
}
