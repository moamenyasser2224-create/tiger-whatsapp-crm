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
  // Cryptographic Key Separation (Defense in Depth)
  PHONE_ENCRYPTION_KEY: z.string().min(32, 'PHONE_ENCRYPTION_KEY must be at least 32 characters (or 64 hex chars)'),
  SALARY_ENCRYPTION_KEY: z.string().min(32, 'SALARY_ENCRYPTION_KEY must be at least 32 characters').default(
    process.env.SALARY_ENCRYPTION_KEY || process.env.PHONE_ENCRYPTION_KEY || 'f1e2d3c4b5a69788f1e2d3c4b5a69788f1e2d3c4b5a69788f1e2d3c4b5a69788'
  ),
  FACE_EMBEDDING_ENCRYPTION_KEY: z.string().min(32, 'FACE_EMBEDDING_ENCRYPTION_KEY must be at least 32 characters').default(
    process.env.FACE_EMBEDDING_ENCRYPTION_KEY || process.env.PHONE_ENCRYPTION_KEY || '99887766554433221100aabbccddeeff99887766554433221100aabbccddeeff'
  ),
  BACKUP_ENCRYPTION_KEY: z.string().min(32, 'BACKUP_ENCRYPTION_KEY must be at least 32 characters').default(
    process.env.BACKUP_ENCRYPTION_KEY || '7766554433221100aabbccddeeff00117766554433221100aabbccddeeff0011'
  ),
  SECURE_COOKIE: z.string().default('false').transform((val) => val === 'true'),
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  SENTRY_DSN: z.string().optional().default(''),
  ENABLE_RLS: z.string().default('false').transform((val) => val === 'true'),

  // SMTP Email Server Settings
  SMTP_HOST: z.string().optional().default(process.env.SMTP_HOST || ''),
  SMTP_PORT: z.string().default(process.env.SMTP_PORT || '587').transform((val) => parseInt(val, 10)),
  SMTP_USER: z.string().optional().default(process.env.SMTP_USER || ''),
  SMTP_PASS: z.string().optional().default(process.env.SMTP_PASS || ''),
  SMTP_FROM: z.string().default(process.env.SMTP_FROM || 'Tiger Workspace <noreply@tigerworkspace.com>'),
  SMTP_SECURE: z.string().default(process.env.SMTP_SECURE || 'false').transform((val) => val === 'true'),

  // Meta WhatsApp Cloud API Settings
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional().default(process.env.WHATSAPP_PHONE_NUMBER_ID || ''),
  WHATSAPP_ACCESS_TOKEN: z.string().optional().default(process.env.WHATSAPP_ACCESS_TOKEN || ''),
  WHATSAPP_VERIFY_TOKEN: z.string().default(process.env.WHATSAPP_VERIFY_TOKEN || 'tiger_webhook_verify_token_2026'),
  WHATSAPP_WABA_ID: z.string().optional().default(process.env.WHATSAPP_WABA_ID || ''),
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
  SALARY_ENCRYPTION_KEY: process.env.SALARY_ENCRYPTION_KEY || 'f1e2d3c4b5a69788f1e2d3c4b5a69788f1e2d3c4b5a69788f1e2d3c4b5a69788',
  FACE_EMBEDDING_ENCRYPTION_KEY: process.env.FACE_EMBEDDING_ENCRYPTION_KEY || '99887766554433221100aabbccddeeff99887766554433221100aabbccddeeff',
  BACKUP_ENCRYPTION_KEY: process.env.BACKUP_ENCRYPTION_KEY || '7766554433221100aabbccddeeff00117766554433221100aabbccddeeff0011',
  SECURE_COOKIE: false,
  COOKIE_SAME_SITE: 'lax' as const,
  SENTRY_DSN: '',
  ENABLE_RLS: false,
  SMTP_HOST: '',
  SMTP_PORT: 587,
  SMTP_USER: '',
  SMTP_PASS: '',
  SMTP_FROM: 'Tiger Workspace <noreply@tigerworkspace.com>',
  SMTP_SECURE: false,
  WHATSAPP_PHONE_NUMBER_ID: '',
  WHATSAPP_ACCESS_TOKEN: '',
  WHATSAPP_VERIFY_TOKEN: 'tiger_webhook_verify_token_2026',
  WHATSAPP_WABA_ID: '',
};
