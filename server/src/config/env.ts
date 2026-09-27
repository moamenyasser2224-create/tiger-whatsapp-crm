import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env file
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_RESET_PASSWORD_SECRET: z.string().min(32, 'JWT_RESET_PASSWORD_SECRET must be at least 32 characters'),
  PHONE_ENCRYPTION_KEY: z.string().min(32, 'PHONE_ENCRYPTION_KEY must be at least 32 characters (or 64 hex chars)'),
  SECURE_COOKIE: z.string().default('false').transform((val) => val === 'true'),
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  SENTRY_DSN: z.string().optional().default(''),
  ENABLE_RLS: z.string().default('false').transform((val) => val === 'true'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(parsedEnv.error.format(), null, 2));
  // In test mode or when running without configured DB initially, provide fallback if needed
  if (process.env.NODE_ENV !== 'test') {
    process.exit(1);
  }
}

export const env = parsedEnv.success ? parsedEnv.data : {
  PORT: 5000,
  NODE_ENV: 'test' as const,
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/whatsapp_crm?schema=public',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'test_jwt_access_secret_key_minimum_32_characters_123',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'test_jwt_refresh_secret_key_minimum_32_characters_456',
  JWT_RESET_PASSWORD_SECRET: process.env.JWT_RESET_PASSWORD_SECRET || 'test_jwt_reset_secret_key_minimum_32_characters_789',
  PHONE_ENCRYPTION_KEY: process.env.PHONE_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  SECURE_COOKIE: false,
  COOKIE_SAME_SITE: 'lax' as const,
  SENTRY_DSN: '',
  ENABLE_RLS: false,
};
