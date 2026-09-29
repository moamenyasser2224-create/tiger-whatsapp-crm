import type { Request, Response, NextFunction } from 'express';
import { TemplateService } from '../services/template.service.js';

const templateService = new TemplateService();

export class TemplateController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const templates = await templateService.getTemplates(req.user!.id);
      res.status(200).json({
        success: true,
        data: templates,
      });
    } catch (error) {
      next(error);
    }
  }

  async getByStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const template = await templateService.getTemplateByStatus(req.user!.id, req.params.status);
      res.status(200).json({
        success: true,
        data: template,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await templateService.updateTemplate(
        req.user!.id,
        req.params.status,
        req.body.body,
        { ipAddress: req.ip, userAgent: req.headers['user-agent'] }
      );

      res.status(200).json({
        success: true,
        message: 'Message template updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async resetDefault(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reset = await templateService.resetTemplateToDefault(
        req.user!.id,
        req.params.status as any,
        { ipAddress: req.ip, userAgent: req.headers['user-agent'] }
      );

      res.status(200).json({
        success: true,
        message: 'Template reset to default successfully',
        data: reset,
      });
    } catch (error) {
      next(error);
    }
  }

  async formatMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, name } = req.query;
      const formatted = await templateService.formatMessage(
        req.user!.id,
        String(status || 'New'),
        String(name || '')
      );

      res.status(200).json({
        success: true,
        data: {
          formattedMessage: formatted,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
