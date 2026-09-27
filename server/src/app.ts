import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { initSentry } from './config/sentry.js';
import { apiRateLimiter } from './middlewares/rateLimiter.js';
import { setCsrfCookie, verifyCsrf } from './middlewares/csrfProtection.js';
import { errorHandler } from './middlewares/errorHandler.js';
import routes from './routes/index.js';

export function createApp(): Express {
  const app = express();

  // Initialize Sentry
  initSentry(app);

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Handled per requirements or client config
      crossOriginEmbedderPolicy: false,
    })
  );

  // Strict CORS policy (No wildcards)
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token', 'X-Requested-With'],
    })
  );

  // Body Parsing (Strict 1MB limit)
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Cookie Parser
  app.use(cookieParser());

  // General API Rate Limiting
  app.use('/api', apiRateLimiter);

  // CSRF Protection
  app.use(setCsrfCookie);
  app.use('/api', verifyCsrf);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    });
  });

  // Main API Routes
  app.use('/api', routes);

  // 404 Handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: 'المسار المطلوب غير موجود',
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
