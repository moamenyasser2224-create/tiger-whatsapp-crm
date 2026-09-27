import type { Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';
import { env } from '../config/env.js';

export interface AppError extends Error {
  statusCode?: number;
  details?: unknown;
}

import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  if (err instanceof ZodError) {
    const message = err.errors.map((e) => e.message).join('، ');
    res.status(400).json({
      success: false,
      error: message,
      details: err.errors,
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'حدث خطأ داخلي في الخادم';

  if (env.SENTRY_DSN && env.NODE_ENV === 'production' && statusCode >= 500) {
    Sentry.captureException(err);
  }

  if (env.NODE_ENV !== 'test' && statusCode >= 500) {
    console.error('💥 Unhandled Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(err.details ? { details: err.details } : {}),
    ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}

export class CustomError extends Error implements AppError {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}
