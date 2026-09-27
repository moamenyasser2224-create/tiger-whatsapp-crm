import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

export const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

/**
 * Sets PostgreSQL session variable `app.current_user_id` for Row-Level Security (RLS)
 */
export async function setRlsUserContext(userId: string): Promise<void> {
  if (env.ENABLE_RLS) {
    await prisma.$executeRawUnsafe(`SET LOCAL app.current_user_id = '${userId.replace(/'/g, "''")}';`);
  }
}

/**
 * Clears PostgreSQL session variable `app.current_user_id`
 */
export async function clearRlsUserContext(): Promise<void> {
  if (env.ENABLE_RLS) {
    await prisma.$executeRawUnsafe(`SET LOCAL app.current_user_id = '';`);
  }
}
