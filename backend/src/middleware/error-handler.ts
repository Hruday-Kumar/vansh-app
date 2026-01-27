/**
 * 🪷 ERROR HANDLER MIDDLEWARE
 */

import type { NextFunction, Request, Response } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: Record<string, unknown>;
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err);
  
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred';
  
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details: err.details,
    },
  });
}

export class AppError extends Error implements ApiError {
  statusCode: number;
  code: string;
  details?: Record<string, unknown>;
  
  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', details?: Record<string, unknown>) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}
