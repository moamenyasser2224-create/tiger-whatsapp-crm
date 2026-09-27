import { prisma } from '../config/prisma.js';
import type { MessageTemplate } from '@prisma/client';
import { DEFAULT_MESSAGE_TEMPLATES, type CustomerStatus } from '../config/constants.js';

export class TemplateRepository {
  async findAllByUserId(userId: string): Promise<MessageTemplate[]> {
    return prisma.messageTemplate.findMany({
      where: { userId },
      include: { statusOption: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findByStatus(userId: string, status: string): Promise<MessageTemplate | null> {
    return prisma.messageTemplate.findFirst({
      where: {
        userId,
        OR: [
          { status },
          { statusOption: { label: status } },
        ],
      },
      include: {
        statusOption: true,
      },
    });
  }

  async upsert(userId: string, status: string, body: string, statusId?: string): Promise<MessageTemplate> {
    const existing = await prisma.messageTemplate.findFirst({
      where: {
        userId,
        OR: [
          { status },
          ...(statusId ? [{ statusId }] : []),
        ],
      },
    });

    if (existing) {
      return prisma.messageTemplate.update({
        where: { id: existing.id },
        data: {
          body,
          status,
          statusId: statusId || existing.statusId,
        },
        include: {
          statusOption: true,
        },
      });
    }

    return prisma.messageTemplate.create({
      data: {
        userId,
        status,
        statusId: statusId || null,
        body,
      },
      include: {
        statusOption: true,
      },
    });
  }

  async createDefaultTemplates(userId: string): Promise<void> {
    const entries = Object.entries(DEFAULT_MESSAGE_TEMPLATES) as [CustomerStatus, string][];
    
    for (const [status, body] of entries) {
      const opt = await prisma.listOption.findFirst({ where: { type: 'status', label: status } });
      const existing = await prisma.messageTemplate.findFirst({
        where: { userId, status },
      });

      if (!existing) {
        await prisma.messageTemplate.create({
          data: {
            userId,
            status,
            statusId: opt?.id || null,
            body,
          },
        });
      }
    }
  }
}
