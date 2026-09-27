import { prisma } from '../config/prisma.js';

export class ChatRepository {
  async createMessage(senderId: string, text: string) {
    return prisma.chatMessage.create({
      data: {
        senderId,
        text,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async getMessages(limit = 50, cursor?: string) {
    const take = Math.min(Math.max(limit, 1), 100);

    const queryOptions: any = {
      take,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    };

    if (cursor) {
      queryOptions.skip = 1;
      queryOptions.cursor = { id: cursor };
    }

    const messages = await prisma.chatMessage.findMany(queryOptions);

    return {
      messages: messages.reverse(), // Return in chronological order (oldest to newest) for client display
      nextCursor: messages.length === take ? messages[0].id : null,
    };
  }
}
