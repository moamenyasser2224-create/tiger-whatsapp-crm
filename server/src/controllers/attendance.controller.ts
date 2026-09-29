import { Request, Response, NextFunction } from 'express';
import { AttendanceService } from '../services/attendance.service.js';
import { runAbsenceDetectionJob } from '../jobs/absence.job.js';
import { prisma } from '../config/prisma.js';

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
        message: 'Clocked in successfully',
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
        message: 'Clocked out successfully',
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

  async getMonthly(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const currentUserId = (req as any).user.id || (req as any).user.userId;
      const targetUserId = (req.query.userId as string) && (req as any).user.role === 'admin'
        ? (req.query.userId as string)
        : currentUserId;
      const month = req.query.month as string;

      const records = await attendanceService.getEmployeeMonthlyAttendance(targetUserId, month);
      res.status(200).json({
        success: true,
        data: records,
      });
    } catch (err) {
      next(err);
    }
  }

  // Attendance Corrections
  async requestCorrection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id || (req as any).user.userId;
      const correction = await attendanceService.requestCorrection(userId, req.body);
      res.status(201).json({
        success: true,
        message: 'Attendance correction request submitted for review',
        data: correction,
      });
    } catch (err) {
      next(err);
    }
  }

  async reviewCorrection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as any).user.id || (req as any).user.userId;
      const { id } = req.params;
      const { decision } = req.body; // 'approved' | 'rejected'
      const updated = await attendanceService.reviewCorrection(adminId, id, decision);
      res.status(200).json({
        success: true,
        message: decision === 'approved' ? 'Correction request approved and ledger record updated' : 'Correction request rejected',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async listCorrections(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const corrections = await attendanceService.listCorrectionRequests(user.id, user.role === 'admin');
      res.status(200).json({
        success: true,
        data: corrections,
      });
    } catch (err) {
      next(err);
    }
  }

  // Leave Requests
  async createLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id || (req as any).user.userId;
      const leave = await attendanceService.createLeaveRequest(userId, req.body);
      res.status(201).json({
        success: true,
        message: 'Leave request submitted for review',
        data: leave,
      });
    } catch (err) {
      next(err);
    }
  }

  async reviewLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as any).user.id || (req as any).user.userId;
      const { id } = req.params;
      const { decision, adminComment } = req.body;
      const updated = await attendanceService.reviewLeaveRequest(adminId, id, decision, adminComment);
      res.status(200).json({
        success: true,
        message: decision === 'approved' ? 'Leave request approved' : 'Leave request rejected',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async listLeaves(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const leaves = await attendanceService.listLeaveRequests(user.id, user.role === 'admin');
      res.status(200).json({
        success: true,
        data: leaves,
      });
    } catch (err) {
      next(err);
    }
  }

  // Shifts CRUD
  async listShifts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const shifts = await prisma.shift.findMany({ orderBy: { createdAt: 'asc' } });
      res.status(200).json({ success: true, data: shifts });
    } catch (err) {
      next(err);
    }
  }

  async createShift(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, startTime, endTime, graceMinutes, breakMinutes } = req.body;
      const shift = await prisma.shift.create({
        data: {
          name,
          startTime,
          endTime,
          graceMinutes: Number(graceMinutes) || 15,
          breakMinutes: Number(breakMinutes) || 60,
        },
      });
      res.status(201).json({ success: true, data: shift });
    } catch (err) {
      next(err);
    }
  }

  // Holidays CRUD
  async listHolidays(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const holidays = await prisma.holiday.findMany({ orderBy: { date: 'asc' } });
      res.status(200).json({ success: true, data: holidays });
    } catch (err) {
      next(err);
    }
  }

  async createHoliday(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { date, name } = req.body;
      const holiday = await prisma.holiday.upsert({
        where: { date },
        create: { date, name },
        update: { name },
      });
      res.status(201).json({ success: true, data: holiday });
    } catch (err) {
      next(err);
    }
  }

  async deleteHoliday(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await prisma.holiday.delete({ where: { id } });
      res.status(200).json({ success: true, message: 'Holiday deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  // Trigger absence job manually (Admin only)
  async triggerAbsenceJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { date } = req.body;
      const result = await runAbsenceDetectionJob(date);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
