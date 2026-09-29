import type { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service.js';

const userService = new UserService();

export class UserController {
  async createEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email } = req.body;
      if (!name || !email) {
        res.status(400).json({
          success: false,
          error: 'Name and email are required to create employee account',
        });
        return;
      }

      const result = await userService.createEmployee(req.user!.id, {
        name,
        email,
        ipAddress: req.clientIp || req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async listEmployees(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employees = await userService.listEmployees();
      res.status(200).json({
        success: true,
        data: employees,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfilePhoto(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { photoUrl } = req.body;
      if (!photoUrl) {
        res.status(400).json({
          success: false,
          error: 'Photo URL or image data is required',
        });
        return;
      }

      const result = await userService.updateProfilePhoto(
        req.user!.id,
        photoUrl,
        req.clientIp || req.ip,
        req.headers['user-agent']
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async exportData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await userService.exportAllUserData(req.user!.id);
      const filename = `my_data_export_${new Date().toISOString().split('T')[0]}.json`;

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(JSON.stringify(data, null, 2));
    } catch (error) {
      next(error);
    }
  }

  async deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { password } = req.body;
      if (!password) {
        res.status(400).json({
          success: false,
          error: 'Please enter your password to confirm permanent account deletion',
        });
        return;
      }

      await userService.deleteAccount(req.user!.id, password);

      res.clearCookie('refreshToken', { path: '/api/auth' });

      res.status(200).json({
        success: true,
        message: 'Your account and all associated data have been permanently deleted',
      });
    } catch (error) {
      next(error);
    }
  }

  async getOnboardingStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const status = await userService.getOnboardingStatus(id);
      res.status(200).json(status);
    } catch (error) {
      next(error);
    }
  }

  async offboardEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { successorUserId, reason, note } = req.body;

      if (!successorUserId) {
        res.status(400).json({
          success: false,
          error: 'A successor employee is required to reassign active customer leads.',
        });
        return;
      }

      const result = await userService.offboardEmployee(req.user!.id, id, {
        successorUserId,
        reason,
        note,
        ipAddress: req.clientIp || req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
