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
}
