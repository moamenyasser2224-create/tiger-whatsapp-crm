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
        message: 'Organization settings updated successfully',
        data: settings,
      });
    } catch (err) {
      next(err);
    }
  }

  async testEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const recipient = req.body.email || req.user!.email;
      const { emailService } = await import('../services/email.service.js');
      const verify = await emailService.verifyConnection();
      if (!verify.success) {
        res.status(200).json({
          success: false,
          configured: false,
          message: verify.message,
        });
        return;
      }

      await emailService.sendMail({
        to: recipient,
        subject: 'Tiger Workspace — SMTP Test Verification',
        html: `<p>Hello ${req.user!.name},</p><p>This is a test notification confirming that your SMTP server configuration on Tiger Workspace is operational.</p>`,
      });

      res.status(200).json({
        success: true,
        configured: true,
        message: `Test email dispatched successfully to ${recipient}`,
      });
    } catch (err: any) {
      res.status(200).json({
        success: false,
        configured: false,
        message: `Failed to dispatch test email: ${err.message}`,
      });
    }
  }
}
