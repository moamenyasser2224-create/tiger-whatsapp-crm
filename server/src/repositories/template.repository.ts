import { prisma } from '../config/prisma.js';
import type { MessageTemplate } from '@prisma/client';
import { DEFAULT_MESSAGE_TEMPLATES, type CustomerStatus } from '../config/constants.js';

export class TemplateRepository {
  async findAllByUserId(userId: string): Promise<MessageTemplate[]> {
    return prisma.messageTemplate.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findByStatus(userId: string, status: string): Promise<MessageTemplate | null> {
    return prisma.messageTemplate.findUnique({
      where: {
        userId_status: {
          userId,
          status,
        },
      },
    });
  }

  async upsert(userId: string, status: string, body: string): Promise<MessageTemplate> {
    return prisma.messageTemplate.upsert({
      where: {
        userId_status: {
          userId,
          status,
        },
      },
      update: {
        body,
      },
      create: {
        userId,
        status,
        body,
      },
    });
  }

  async createDefaultTemplates(userId: string): Promise<void> {
    const entries = Object.entries(DEFAULT_MESSAGE_TEMPLATES) as [CustomerStatus, string][];
    
    for (const [status, body] of entries) {
      await prisma.messageTemplate.upsert({
        where: {
          userId_status: {
            userId,
            status,
          },
        },
        update: {},
        create: {
          userId,
          status,
          body,
        },
      });
    }
  }
}
