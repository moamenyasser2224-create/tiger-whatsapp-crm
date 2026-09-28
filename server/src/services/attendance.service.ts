import { prisma } from '../config/prisma.js';
import { AttendanceRepository } from '../repositories/attendance.repository.js';
import { AuditRepository } from '../repositories/audit.repository.js';
import { CustomError } from '../middlewares/errorHandler.js';
import { broadcastAttendanceUpdate } from '../socket.js';
import { AttendanceCalcService, ShiftInfo, IClock, SystemClock } from './attendanceCalc.service.js';
import { DeductionService } from './deduction.service.js';

const attendanceRepository = new AttendanceRepository();
const auditRepository = new AuditRepository();
const deductionService = new DeductionService();

export class AttendanceService {
  private calcService: AttendanceCalcService;

  constructor(clock: IClock = new SystemClock()) {
    this.calcService = new AttendanceCalcService(clock);
  }

  /**
   * Helper to get organization timezone and today's date string YYYY-MM-DD
   */
  async getTodayDate(now = new Date()): Promise<{ dateStr: string; timezone: string }> {
    const settings = await prisma.settings.findFirst();
    const timezone = settings?.orgTimezone || 'Africa/Cairo';
    const dateStr = this.calcService.getDateStringInTimezone(now, timezone);
    return { dateStr, timezone };
  }

  /**
   * Gets employee's assigned shift or falls back to system default shift (09:00 - 17:00, grace 15m)
   */
  async getEmployeeShift(userId: string, dayOfWeek: number): Promise<ShiftInfo & { id?: string }> {
    const schedule = await prisma.workSchedule.findUnique({
      where: { userId_dayOfWeek: { userId, dayOfWeek } },
      include: { shift: true },
    });

    if (schedule?.shift) {
      return {
        id: schedule.shift.id,
        startTime: schedule.shift.startTime,
        endTime: schedule.shift.endTime,
        graceMinutes: schedule.shift.graceMinutes,
        breakMinutes: schedule.shift.breakMinutes,
      };
    }

    // Check if there is any shift in DB, or use standard default
    const firstShift = await prisma.shift.findFirst();
    if (firstShift) {
      return {
        id: firstShift.id,
        startTime: firstShift.startTime,
        endTime: firstShift.endTime,
        graceMinutes: firstShift.graceMinutes,
        breakMinutes: firstShift.breakMinutes,
      };
    }

    return {
      startTime: '09:00',
      endTime: '17:00',
      graceMinutes: 15,
      breakMinutes: 60,
    };
  }

  /**
   * Records Check-In for user with late detection and automatic deduction evaluation
   */
  async checkIn(userId: string, ipAddress?: string, userAgent?: string, source: 'manual' | 'face' | 'admin_correction' = 'manual') {
    const now = new Date();
    const { dateStr, timezone } = await this.getTodayDate(now);
    const dayOfWeek = now.getUTCDay();

    const existing = await attendanceRepository.findByUserAndDate(userId, dateStr);
    if (existing && existing.checkIn) {
      throw new CustomError('تم تسجيل حضورك اليوم بالفعل', 400);
    }

    const shift = await this.getEmployeeShift(userId, dayOfWeek);
    const metrics = this.calcService.calculateMetrics(now, null, shift, timezone);

    let record: any;
    if (existing) {
      record = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkIn: now,
          status: metrics.status,
          lateMinutes: metrics.lateMinutes,
          source,
          shiftId: shift.id,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true, photoUrl: true },
          },
        },
      });
    } else {
      record = await prisma.attendance.create({
        data: {
          userId,
          date: dateStr,
          checkIn: now,
          status: metrics.status,
          lateMinutes: metrics.lateMinutes,
          source,
          shiftId: shift.id,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true, photoUrl: true },
          },
        },
      });
    }

    // If employee is late, evaluate and create proposed deduction automatically
    if (metrics.lateMinutes > 0) {
      try {
        await deductionService.evaluateLateDeduction(userId, metrics.lateMinutes, record.id);
      } catch (err) {
        console.error('Failed to auto-evaluate late deduction:', err);
      }
    }

    // Audit Log
    await auditRepository.log({
      userId,
      action: 'ATTENDANCE_CHECK_IN',
      entity: 'ATTENDANCE',
      entityId: record.id,
      details: {
        date: dateStr,
        checkIn: now.toISOString(),
        lateMinutes: metrics.lateMinutes,
        source,
      },
      ipAddress,
      userAgent,
    });

    // Real-time broadcast
    broadcastAttendanceUpdate({
      action: 'check_in',
      record,
    });

    return record;
  }

  /**
   * Records Check-Out for user with early leave and worked minutes calculation
   */
  async checkOut(userId: string, ipAddress?: string, userAgent?: string) {
    const now = new Date();
    const { dateStr, timezone } = await this.getTodayDate(now);
    const dayOfWeek = now.getUTCDay();

    const existing = await attendanceRepository.findByUserAndDate(userId, dateStr);
    if (!existing || !existing.checkIn) {
      throw new CustomError('لم يتم تسجيل حضورك لليوم بعد', 400);
    }
    if (existing.checkOut) {
      throw new CustomError('تم تسجيل انصرافك اليوم بالفعل', 400);
    }

    const shift = await this.getEmployeeShift(userId, dayOfWeek);
    const metrics = this.calcService.calculateMetrics(existing.checkIn, now, shift, timezone);

    const record = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        checkOut: now,
        status: metrics.status,
        earlyLeaveMinutes: metrics.earlyLeaveMinutes,
        workedMinutes: metrics.workedMinutes,
        overtimeMinutes: metrics.overtimeMinutes,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, photoUrl: true },
        },
      },
    });

    // Audit Log
    await auditRepository.log({
      userId,
      action: 'ATTENDANCE_CHECK_OUT',
      entity: 'ATTENDANCE',
      entityId: record.id,
      details: {
        date: dateStr,
        checkOut: now.toISOString(),
        workedMinutes: metrics.workedMinutes,
        earlyLeaveMinutes: metrics.earlyLeaveMinutes,
      },
      ipAddress,
      userAgent,
    });

    // Real-time broadcast
    broadcastAttendanceUpdate({
      action: 'check_out',
      record,
    });

    return record;
  }

  /**
   * Fetches today's team attendance list
   */
  async getTodayTeamAttendance() {
    const { dateStr } = await this.getTodayDate();
    return attendanceRepository.getTodayRecords(dateStr);
  }

  async getTodayAttendance() {
    return this.getTodayTeamAttendance();
  }

  async getMyStatus(userId: string) {
    const { dateStr } = await this.getTodayDate();
    return attendanceRepository.findByUserAndDate(userId, dateStr);
  }

  /**
   * Fetches monthly attendance for an employee (e.g. for heatmap calendar)
   */
  async getEmployeeMonthlyAttendance(userId: string, monthStr?: string) {
    const currentMonth = monthStr || new Date().toISOString().substring(0, 7); // YYYY-MM
    return prisma.attendance.findMany({
      where: {
        userId,
        date: { startsWith: currentMonth },
      },
      orderBy: { date: 'asc' },
    });
  }

  /**
   * Employee creates an attendance correction request
   */
  async requestCorrection(userId: string, payload: { attendanceId?: string; date: string; requestedCheckIn?: string; requestedCheckOut?: string; reason: string }) {
    if (!payload.reason || payload.reason.trim().length < 5) {
      throw new CustomError('يرجى تقديم سبب واضح ومفصل لطلب التصحيح', 400);
    }

    return prisma.attendanceCorrection.create({
      data: {
        userId,
        attendanceId: payload.attendanceId,
        date: payload.date,
        requestedCheckIn: payload.requestedCheckIn ? new Date(payload.requestedCheckIn) : undefined,
        requestedCheckOut: payload.requestedCheckOut ? new Date(payload.requestedCheckOut) : undefined,
        reason: payload.reason.trim(),
        status: 'pending',
      },
    });
  }

  /**
   * Admin reviews an attendance correction request
   */
  async reviewCorrection(adminId: string, correctionId: string, decision: 'approved' | 'rejected') {
    const correction = await prisma.attendanceCorrection.findUnique({
      where: { id: correctionId },
    });
    if (!correction) throw new CustomError('طلب التصحيح غير موجود', 404);

    const updated = await prisma.attendanceCorrection.update({
      where: { id: correctionId },
      data: {
        status: decision,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });

    // If approved, update or create the attendance record
    if (decision === 'approved') {
      await prisma.attendance.upsert({
        where: { userId_date: { userId: correction.userId, date: correction.date } },
        create: {
          userId: correction.userId,
          date: correction.date,
          checkIn: correction.requestedCheckIn || undefined,
          checkOut: correction.requestedCheckOut || undefined,
          status: 'present',
          source: 'admin_correction',
        },
        update: {
          checkIn: correction.requestedCheckIn || undefined,
          checkOut: correction.requestedCheckOut || undefined,
          status: 'present',
          source: 'admin_correction',
        },
      });
    }

    return updated;
  }

  /**
   * Employee creates a Leave Request
   */
  async createLeaveRequest(userId: string, payload: { type: string; fromDate: string; toDate: string; reason: string }) {
    if (!payload.reason || payload.reason.trim().length < 5) {
      throw new CustomError('يرجى كتابة سبب طلب الإجازة بوضوح', 400);
    }
    if (payload.fromDate > payload.toDate) {
      throw new CustomError('تاريخ بداية الإجازة يجب أن يكون قبل تاريخ النهاية', 400);
    }

    return prisma.leaveRequest.create({
      data: {
        userId,
        type: payload.type,
        fromDate: payload.fromDate,
        toDate: payload.toDate,
        reason: payload.reason.trim(),
        status: 'pending',
      },
    });
  }

  /**
   * Admin reviews a Leave Request
   */
  async reviewLeaveRequest(adminId: string, leaveId: string, decision: 'approved' | 'rejected', adminComment?: string) {
    const leave = await prisma.leaveRequest.findUnique({ where: { id: leaveId } });
    if (!leave) throw new CustomError('طلب الإجازة غير موجود', 404);

    return prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status: decision,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        adminComment,
      },
    });
  }

  /**
   * Lists leave requests
   */
  async listLeaveRequests(userId: string, isAdmin: boolean) {
    const where = isAdmin ? {} : { userId };
    return prisma.leaveRequest.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, photoUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Lists correction requests
   */
  async listCorrectionRequests(userId: string, isAdmin: boolean) {
    const where = isAdmin ? {} : { userId };
    return prisma.attendanceCorrection.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, photoUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
