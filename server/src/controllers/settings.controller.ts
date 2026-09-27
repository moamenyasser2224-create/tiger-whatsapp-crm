import { Request, Response, NextFunction } from 'express';
import { SettingsService } from '../services/settings.service.js';

const settingsService = new SettingsService();

export class SettingsController {
  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await settingsService.getSettings();
      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orgName } = req.body;
      const settings = await settingsService.updateSettings(orgName);
      res.status(200).json({
        success: true,
        message: 'تم تحديث إعدادات المنظومة بنجاح',
        data: settings,
      });
    } catch (err) {
      next(err);
    }
  }
}
