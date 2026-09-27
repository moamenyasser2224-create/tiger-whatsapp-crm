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
          error: 'الاسم والبريد الإلكتروني مطلوبان لإنشاء حساب الموظف',
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
          error: 'رابط أو بيانات الصورة مطلوبة',
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
          error: 'يرجى إدخال كلمة المرور لتأكيد حذف الحساب نهائياً',
        });
        return;
      }

      await userService.deleteAccount(req.user!.id, password);

      res.clearCookie('refreshToken', { path: '/api/auth' });

      res.status(200).json({
        success: true,
        message: 'تم حذف حسابك وجميع بياناتك نهائياً من النظام',
      });
    } catch (error) {
      next(error);
    }
  }
}
