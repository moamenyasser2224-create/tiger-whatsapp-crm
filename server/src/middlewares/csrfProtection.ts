import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/env.js';

export const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
export const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Middleware that sets the CSRF cookie if not present
 */
export function setCsrfCookie(req: Request, res: Response, next: NextFunction): void {
  if (!req.cookies?.[CSRF_COOKIE_NAME]) {
    const token = crypto.randomBytes(24).toString('hex');
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false, // Must be readable by client JS to send back in header
      secure: env.SECURE_COOKIE,
      sameSite: env.COOKIE_SAME_SITE,
      path: '/',
    });
  }
  next();
}

/**
 * Double-submit cookie verification middleware for state-changing requests
 */
export function verifyCsrf(req: Request, res: Response, next: NextFunction): void {
  // Skip CSRF verification in test mode or for safe HTTP methods (GET, HEAD, OPTIONS)
  if (
    env.NODE_ENV === 'test' ||
    ['GET', 'HEAD', 'OPTIONS'].includes(req.method)
  ) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME] || req.headers['X-CSRF-Token'.toLowerCase()];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    res.status(403).json({
      success: false,
      error: 'فشل التحقق من أمان الجلسة (CSRF Token غير متطابق أو مفقود)',
    });
    return;
  }

  next();
}
