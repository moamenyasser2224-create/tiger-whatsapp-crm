import { prisma } from '../config/prisma.js';
import { emitNotification } from '../socket.js';

export interface CreateNotificationParams {
  userId: string;
  type: 'deduction' | 'dispute' | 'attendance' | 'chat' | 'crm_deal' | 'system';
  title: string;
  body: string;
  payload?: any;
}

export class NotificationService {
  async createNotification(params: CreateNotificationParams) {
    const payloadStr = params.payload ? (typeof params.payload === 'string' ? params.payload : JSON.stringify(params.payload)) : null;

    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        payload: payloadStr,
      },
    });

    // Real-time Socket.io delivery to connected user
    emitNotification(params.userId, notification);

    return notification;
  }

  async getUserNotifications(userId: string, limit = 50) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async markAsRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}

export const notificationService = new NotificationService();
