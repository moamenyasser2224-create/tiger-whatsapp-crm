import rateLimit from 'express-rate-limit';

/**
 * Strict rate limiter for Authentication endpoints (5 requests per minute per IP)
 */
export const authRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // 5 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'تم تجاوز الحد الأقصى لمحاولات تسجيل الدخول، يرجى المحاولة بعد دقيقة واحدة.',
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
  message: {
    success: false,
    error: 'تم تجاوز الحد المسموح من الطلبات، يرجى المحاولة لاحقاً.',
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
  keyGenerator: (req) => (req as any).user?.id || (req as any).user?.userId || req.ip || 'anonymous',
  message: {
    success: false,
    error: 'تم تجاوز الحد المسموح لإرسال الرسائل (10 رسائل في الدقيقة). يرجى الانتظار قليلاً.',
  },
});

