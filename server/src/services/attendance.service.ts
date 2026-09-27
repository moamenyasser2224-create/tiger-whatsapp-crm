import { AttendanceRepository } from '../repositories/attendance.repository.js';
import { AuditRepository } from '../repositories/audit.repository.js';
import { CustomError } from '../middlewares/errorHandler.js';
import { broadcastAttendanceUpdate } from '../socket.js';

const attendanceRepository = new AttendanceRepository();
const auditRepository = new AuditRepository();

function getTodayDateString(): string {
  // Use YYYY-MM-DD format
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export class AttendanceService {
  async checkIn(userId: string, ipAddress?: string, userAgent?: string) {
    const today = getTodayDateString();
    const existing = await attendanceRepository.findByUserAndDate(userId, today);

    if (existing && existing.checkIn) {
      throw new CustomError('تم تسجيل حضورك اليوم بالفعل', 400);
    }

    const checkInTime = new Date();
    const record = await attendanceRepository.createCheckIn(userId, today, checkInTime);

    // Audit Log
    await auditRepository.log({
      userId,
      action: 'ATTENDANCE_CHECK_IN',
      entity: 'ATTENDANCE',
      entityId: record.id,
      details: { date: today, checkIn: checkInTime.toISOString() },
      ipAddress,
      userAgent,
    });

    // Real-time broadcast to all connected clients
    broadcastAttendanceUpdate({
      action: 'check_in',
      record,
    });

    return record;
  }

  async checkOut(userId: string, ipAddress?: string, userAgent?: string) {
    const today = getTodayDateString();
    const existing = await attendanceRepository.findByUserAndDate(userId, today);

    if (!existing || !existing.checkIn) {
      throw new CustomError('لم يتم تسجيل حضورك لليوم بعد', 400);
    }

    if (existing.checkOut) {
      throw new CustomError('تم تسجيل انصرافك اليوم بالفعل', 400);
    }

    const checkOutTime = new Date();
    const record = await attendanceRepository.updateCheckOut(existing.id, checkOutTime);

    // Audit Log
    await auditRepository.log({
      userId,
      action: 'ATTENDANCE_CHECK_OUT',
      entity: 'ATTENDANCE',
      entityId: record.id,
      details: { date: today, checkOut: checkOutTime.toISOString() },
      ipAddress,
      userAgent,
    });

    // Real-time broadcast to all connected clients
    broadcastAttendanceUpdate({
      action: 'check_out',
      record,
    });

    return record;
  }

  async getTodayAttendance() {
    const today = getTodayDateString();
    return attendanceRepository.getTodayRecords(today);
  }

  async getMyStatus(userId: string) {
    const today = getTodayDateString();
    return attendanceRepository.findByUserAndDate(userId, today);
  }
}
