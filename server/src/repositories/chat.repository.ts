import { prisma } from '../config/prisma.js';

export class ChatRepository {
  async createMessage(data: {
    senderId: string;
    text: string;
    channelId?: string | null;
    parentId?: string | null;
    attachmentUrl?: string | null;
    attachmentType?: string | null;
    attachmentSize?: number | null;
  }) {
    return prisma.chatMessage.create({
      data: {
        senderId: data.senderId,
        text: data.text,
        channelId: data.channelId || null,
        parentId: data.parentId || null,
        attachmentUrl: data.attachmentUrl || null,
        attachmentType: data.attachmentType || null,
        attachmentSize: data.attachmentSize || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            photoUrl: true,
          },
        },
        parent: {
          select: {
            id: true,
            text: true,
            sender: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  async getMessages(channelId?: string | null, limit = 50, cursor?: string) {
    const take = Math.min(Math.max(limit, 1), 100);

    const queryOptions: any = {
      where: channelId ? { channelId } : { channelId: null },
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
            photoUrl: true,
          },
        },
        parent: {
          select: {
            id: true,
            text: true,
            sender: { select: { id: true, name: true } },
          },
        },
        _count: {
          select: { replies: true },
        },
      },
    };

    if (cursor) {
      queryOptions.skip = 1;
      queryOptions.cursor = { id: cursor };
    }

    const messages = await prisma.chatMessage.findMany(queryOptions);

    return {
      messages: messages.reverse(),
      nextCursor: messages.length === take ? messages[0].id : null,
    };
  }

  async getChannels(userId: string) {
    // Return all public channels, and department/private channels where user is a member
    return prisma.channel.findMany({
      where: {
        OR: [
          { type: 'public' },
          { members: { some: { userId } } },
        ],
      },
      include: {
        _count: {
          select: { members: true, messages: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createChannel(name: string, type = 'public', departmentId?: string | null, creatorId?: string) {
    const channel = await prisma.channel.create({
      data: {
        name,
        type,
        departmentId: departmentId || null,
        members: creatorId
          ? {
              create: {
                userId: creatorId,
                role: 'admin',
              },
            }
          : undefined,
      },
      include: {
        _count: {
          select: { members: true, messages: true },
        },
      },
    });

    return channel;
  }
}
