import * as Sentry from '@sentry/node';
import { env } from './env.js';
import type { Express } from 'express';

export const initSentry = (app: Express): void => {
  if (env.SENTRY_DSN && env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.NODE_ENV,
      tracesSampleRate: 1.0,
    });
    console.log('🛡️ Sentry initialized successfully.');
  }
};
