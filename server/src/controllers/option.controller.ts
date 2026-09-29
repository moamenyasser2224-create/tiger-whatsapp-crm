import { Request, Response, NextFunction } from 'express';
import { OptionService } from '../services/option.service.js';

const optionService = new OptionService();

export class OptionController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const type = req.query.type as string | undefined;
      const options = await optionService.getAll(type);
      res.status(200).json({
        success: true,
        data: options,
      });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type, label, order } = req.body;
      const option = await optionService.create({ type, label, order });
      res.status(201).json({
        success: true,
        data: option,
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { label, order } = req.body;
      const option = await optionService.update(id, { label, order });
      res.status(200).json({
        success: true,
        data: option,
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await optionService.delete(id);
      res.status(200).json({
        success: true,
        message: 'Option deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }
}
