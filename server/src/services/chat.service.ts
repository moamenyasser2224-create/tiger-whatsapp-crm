import { ChatRepository } from '../repositories/chat.repository.js';
import { sanitizeText } from '../utils/sanitize.js';
import { createChatMessageSchema } from '../validators/chat.validator.js';
import { broadcastChatMessage } from '../socket.js';

const chatRepository = new ChatRepository();

export class ChatService {
  async sendMessage(senderId: string, text: string) {
    // Validate
    const parsed = createChatMessageSchema.parse({ text });

    // Sanitize against XSS attacks
    const sanitizedText = sanitizeText(parsed.text);

    // Persist
    const message = await chatRepository.createMessage(senderId, sanitizedText);

    // Real-time broadcast to all connected team members
    broadcastChatMessage(message);

    return message;
  }

  async getMessages(limit = 50, cursor?: string) {
    return chatRepository.getMessages(limit, cursor);
  }
}
