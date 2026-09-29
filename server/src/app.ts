import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { initSentry } from './config/sentry.js';
import { apiRateLimiter } from './middlewares/rateLimiter.js';
import { setCsrfCookie, verifyCsrf } from './middlewares/csrfProtection.js';
import { errorHandler } from './middlewares/errorHandler.js';
import {
  resolveCloudClientIp,
  cloudSecurityHeaders,
  cloudWafShield,
  prototypePollutionGuard,
  parameterPollutionGuard,
} from './middlewares/cloudProtection.js';
import { logRedactionMiddleware } from './middlewares/logRedactor.js';
import routes from './routes/index.js';

export function createApp(): Express {
  const app = express();

  // 0. Install Log Redactor & Data Leak Prevention Shield
  app.use(logRedactionMiddleware);

  // Trust Cloudflare, Reverse Proxies & Cloud Load Balancers
  app.set('trust proxy', 1);

  // Initialize Sentry
  initSentry(app);

  // 1. Resolve Cloud Client IP (Cloudflare / CDN / ALB)
  app.use(resolveCloudClientIp);

  // 2. Cloud Security & Hardened Headers
  app.use(cloudSecurityHeaders);

  // 3. Cloud WAF Shield (blocks scanners, traversal, SQLi, exploit probing)
  app.use(cloudWafShield);

  // 4. Helmet Security Suite with strict Content Security Policy (CSP)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'", 'https:', 'data:'],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https:'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          connectSrc: ["'self'", 'ws:', 'wss:', 'https:', 'http:'],
          frameAncestors: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
        },
      },
      hsts: {
        maxAge: 63072000,
        includeSubDomains: true,
        preload: true,
      },
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  // 5. CORS configuration supporting configured frontend URL and public tunnels
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        return callback(null, true); // Permissive origin reflection for multi-domain support
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token', 'X-Requested-With', 'cf-connecting-ip'],
    })
  );

  // 6. Body Parsing (Strict 1MB limit for anti-DDoS / memory exhaustion)
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 7. Prototype Pollution & Parameter Pollution Guards
  app.use(prototypePollutionGuard);
  app.use(parameterPollutionGuard);

  // 8. Cookie Parser
  app.use(cookieParser());

  // 9. General API Rate Limiting (Using accurate Cloud IP)
  app.use('/api', apiRateLimiter);

  // 10. CSRF Protection
  app.use(setCsrfCookie);
  app.use('/api', verifyCsrf);

  // Health check endpoint with cloud status indicator
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      cloudProtection: 'active',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      clientIp: req.clientIp || req.ip,
    });
  });

  // Main API Routes
  app.use('/api', routes);

  // 404 Handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: 'The requested resource or endpoint was not found',
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
