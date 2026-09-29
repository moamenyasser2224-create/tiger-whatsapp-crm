import { Request, Response, NextFunction } from 'express';
import { aiService } from '../services/ai.service.js';

export class AIController {
  async chat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { messages } = req.body;
      const user = req.user!;
      const reply = await aiService.chat(user.id, messages, {
        name: user.name,
        role: user.role,
      });

      res.status(200).json({
        success: true,
        data: reply,
      });
    } catch (err) {
      next(err);
    }
  }

  async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = await aiService.getStatus();
      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateKey(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { apiKey } = req.body;
      const user = req.user!;
      const result = await aiService.updateApiKey(user.id, apiKey);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }

  async getAutoReply(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = await aiService.getAutoReplyConfig();
      res.status(200).json({
        success: true,
        data: config,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateAutoReply(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const result = await aiService.updateAutoReplyConfig(user.id, req.body);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }

  async suggestReplies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { customerName, lastMessage } = req.body;
      const result = await aiService.suggestReplies({
        customerName: customerName || 'العميل',
        lastMessage: lastMessage || '',
      });
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
