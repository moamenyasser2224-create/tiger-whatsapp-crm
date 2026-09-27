import { Request, Response, NextFunction } from 'express';
import { ChatService } from '../services/chat.service.js';

const chatService = new ChatService();

export class ChatController {
  async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const senderId = (req as any).user.id || (req as any).user.userId;
      const { text } = req.body;

      const message = await chatService.sendMessage(senderId, text);

      res.status(201).json({
        success: true,
        data: message,
      });
    } catch (err) {
      next(err);
    }
  }

  async getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const cursor = req.query.cursor as string | undefined;

      const result = await chatService.getMessages(limit, cursor);

      res.status(200).json({
        success: true,
        data: result.messages,
        nextCursor: result.nextCursor,
      });
    } catch (err) {
      next(err);
    }
  }
}
