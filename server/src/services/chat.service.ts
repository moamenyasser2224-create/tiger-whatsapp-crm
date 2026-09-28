import { ChatRepository } from '../repositories/chat.repository.js';
import { sanitizeText } from '../utils/sanitize.js';
import { broadcastChatMessage } from '../socket.js';
import { notificationService } from './notification.service.js';

const chatRepository = new ChatRepository();

export class ChatService {
  async sendMessage(params: {
    senderId: string;
    text: string;
    channelId?: string | null;
    parentId?: string | null;
    attachmentUrl?: string | null;
    attachmentType?: string | null;
    attachmentSize?: number | null;
  }) {
    if (!params.text && !params.attachmentUrl) {
      throw new Error('محتوى الرسالة أو المرفق مطلوب');
    }

    // Sanitize text against XSS attacks
    const sanitizedText = params.text ? sanitizeText(params.text) : '';

    // Persist message
    const message = await chatRepository.createMessage({
      senderId: params.senderId,
      text: sanitizedText,
      channelId: params.channelId,
      parentId: params.parentId,
      attachmentUrl: params.attachmentUrl,
      attachmentType: params.attachmentType,
      attachmentSize: params.attachmentSize,
    });

    // Real-time broadcast to connected clients
    broadcastChatMessage(message);

    // If this is a thread reply, notify the author of the parent message
    if (params.parentId && message.parent?.sender?.id && message.parent.sender.id !== params.senderId) {
      notificationService.createNotification({
        userId: message.parent.sender.id,
        type: 'chat',
        title: 'رد جديد على رسالتك',
        body: `${message.sender.name}: ${sanitizedText.slice(0, 60)}...`,
        payload: { messageId: message.id, channelId: params.channelId },
      }).catch(console.error);
    }

    return message;
  }

  async getMessages(channelId?: string | null, limit = 50, cursor?: string) {
    return chatRepository.getMessages(channelId, limit, cursor);
  }

  async getChannels(userId: string) {
    return chatRepository.getChannels(userId);
  }

  async createChannel(name: string, type = 'public', departmentId?: string | null, creatorId?: string) {
    return chatRepository.createChannel(name, type, departmentId, creatorId);
  }
}

export const chatService = new ChatService();
