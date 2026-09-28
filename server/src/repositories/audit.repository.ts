import { prisma } from '../config/prisma.js';
import type { Prisma, AuditLog } from '@prisma/client';

export class AuditRepository {
  async log(data: {
    userId: string;
    action: string;
    entity: string;
    entityId?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditLog | null> {
    try {
      let detailsVal: string | null = null;
      if (data.details !== undefined && data.details !== null) {
        try {
          detailsVal = typeof data.details === 'string' ? data.details : JSON.stringify(data.details);
        } catch {
          detailsVal = String(data.details);
        }
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
