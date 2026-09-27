import type { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service.js';

const userService = new UserService();

export class UserController {
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
