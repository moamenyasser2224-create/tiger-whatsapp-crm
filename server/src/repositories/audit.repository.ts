import { prisma } from '../config/prisma.js';
import type { Prisma, AuditLog } from '@prisma/client';

export class AuditRepository {
  async log(data: {
    userId: string;
    action: string;
    entity: string;
    entityId?: string;
    details?: Prisma.InputJsonValue;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditLog | null> {
    try {
      const isPostgres = Boolean(process.env.DATABASE_URL?.startsWith('postgres'));
      let detailsVal: any = data.details;

      if (detailsVal !== undefined && detailsVal !== null) {
        if (!isPostgres && typeof detailsVal === 'object') {
          detailsVal = JSON.stringify(detailsVal);
        }
      } else {
        detailsVal = null;
      }

      return await prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          details: detailsVal,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (err) {
      console.error('AuditLog error (non-fatal):', err);
      return null;
    }
  }

  async getRecentLogs(userId: string, limit = 50): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
