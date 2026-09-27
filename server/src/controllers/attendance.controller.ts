import { Request, Response, NextFunction } from 'express';
import { AttendanceService } from '../services/attendance.service.js';

const attendanceService = new AttendanceService();

export class AttendanceController {
  async checkIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id || (req as any).user.userId;
      const record = await attendanceService.checkIn(
        userId,
        req.ip,
        req.headers['user-agent']
      );

      res.status(200).json({
        success: true,
        message: 'تم تسجيل حضورك بنجاح',
        data: record,
      });
    } catch (err) {
      next(err);
    }
  }

  async checkOut(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id || (req as any).user.userId;
      const record = await attendanceService.checkOut(
        userId,
        req.ip,
        req.headers['user-agent']
      );

      res.status(200).json({
        success: true,
        message: 'تم تسجيل انصرافك بنجاح',
        data: record,
      });
    } catch (err) {
      next(err);
    }
  }

  async getToday(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const records = await attendanceService.getTodayAttendance();
      res.status(200).json({
        success: true,
        data: records,
      });
    } catch (err) {
      next(err);
    }
  }

  async getMyStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id || (req as any).user.userId;
      const record = await attendanceService.getMyStatus(userId);
      res.status(200).json({
        success: true,
        data: record,
      });
    } catch (err) {
      next(err);
    }
  }
}
