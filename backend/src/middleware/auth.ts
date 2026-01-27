/**
 * 🪷 AUTH MIDDLEWARE - JWT Token Verification
 */

import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error-handler';

export interface AuthPayload {
  userId: string;
  memberId: string;
  familyId: string;
  email: string;
  role: 'admin' | 'elder' | 'member' | 'viewer';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401, 'UNAUTHORIZED');
    }
    
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'vansh_secret';
    
    const decoded = jwt.verify(token, secret) as AuthPayload;
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401, 'INVALID_TOKEN'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expired', 401, 'TOKEN_EXPIRED'));
    } else {
      next(error);
    }
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const secret = process.env.JWT_SECRET || 'vansh_secret';
      const decoded = jwt.verify(token, secret) as AuthPayload;
      req.user = decoded;
    }
    
    next();
  } catch {
    // Continue without auth
    next();
  }
}

export function requireRole(...roles: Array<'admin' | 'elder' | 'member' | 'viewer'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403, 'FORBIDDEN'));
    }
    
    next();
  };
}
