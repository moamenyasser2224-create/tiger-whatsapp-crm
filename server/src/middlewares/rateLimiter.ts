import rateLimit from 'express-rate-limit';

/**
 * Helper to extract accurate client IP resolved from Cloudflare/CDN headers
 */
const getClientIp = (req: any): string => req.clientIp || req.ip || 'anonymous';

/**
 * Strict rate limiter for Authentication endpoints (5 requests per minute per IP)
 */
export const authRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // 5 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  message: {
    success: false,
    error: 'Maximum sign-in attempts exceeded. Please try again in 1 minute.',
  },
});

/**
 * General API rate limiter (120 requests per minute per IP)
 */
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
  },
});

/**
 * Strict chat rate limiter (10 messages per minute per user)
 */
export const chatRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 messages per minute
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true,
  keyGenerator: (req: any) => req.user?.id || req.user?.userId || getClientIp(req),
  message: {
    success: false,
    error: 'Message rate limit exceeded (maximum 10 messages per minute). Please wait a moment.',
  },
});

/**
 * Strict rate limiter for Password Reset requests (3 per 15 minutes)
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  message: {
    success: false,
    error: 'Password recovery limit reached. Please wait 15 minutes before requesting another reset.',
  },
});

/**
 * Strict rate limiter for sensitive Data Export (5 per 10 minutes)
 */
export const exportRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => req.user?.id || getClientIp(req),
  message: {
    success: false,
    error: 'Data export rate limit reached. Please try again later.',
  },
});

/**
 * Rate limiter for Face Verification attempts (10 attempts per minute)
 */
export const faceRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  message: {
    success: false,
    error: 'Facial verification rate limit exceeded. Please wait 1 minute before retrying.',
  },
});
