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
  }): Promise<AuditLog> {
    return prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        details: data.details as any,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }

  async getRecentLogs(userId: string, limit = 50): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
