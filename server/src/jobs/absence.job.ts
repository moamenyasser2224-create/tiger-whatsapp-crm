import cron from 'node-cron';
import { prisma } from '../config/prisma.js';
import { AttendanceCalcService, IClock, SystemClock } from '../services/attendanceCalc.service.js';
import { DeductionService } from '../services/deduction.service.js';

const deductionService = new DeductionService();

/**
 * Idempotent absence detection job:
 * Checks all active employees scheduled to work on targetDate who did not check in,
 * and creates unexcused absence records and proposed deductions.
 */
export async function runAbsenceDetectionJob(
  targetDateStr?: string,
  clock: IClock = new SystemClock()
): Promise<{ processed: number; absencesCreated: number; excusedCreated: number }> {
  const calcService = new AttendanceCalcService(clock);
  const settings = await prisma.settings.findFirst();
  const timezone = settings?.orgTimezone || 'Africa/Cairo';

  const dateStr = targetDateStr || calcService.getDateStringInTimezone(clock.now(), timezone);
  const targetDateObj = new Date(`${dateStr}T12:00:00Z`);
  const dayOfWeek = targetDateObj.getUTCDay(); // 0..6

  // 1. Check if date is a public Holiday
  const holiday = await prisma.holiday.findUnique({
    where: { date: dateStr },
  });
  if (holiday) {
    return { processed: 0, absencesCreated: 0, excusedCreated: 0 };
  }

  // 2. Fetch all active employees
  const employees = await prisma.user.findMany({
    where: { deletedAt: null },
    include: {
      workSchedules: {
        where: { dayOfWeek },
      },
    },
  });

  let absencesCreated = 0;
  let excusedCreated = 0;

  for (const emp of employees) {
    // Check if day is weekend in employee's work schedule
    const schedule = emp.workSchedules[0];
    if (schedule && schedule.isWeekend) {
      continue;
    }

    // Check if employee has an approved leave request covering dateStr
    const approvedLeave = await prisma.leaveRequest.findFirst({
      where: {
        userId: emp.id,
        status: 'approved',
        fromDate: { lte: dateStr },
        toDate: { gte: dateStr },
      },
    });

    if (approvedLeave) {
      // Idempotently upsert attendance with status: 'absent_excused'
      await prisma.attendance.upsert({
        where: { userId_date: { userId: emp.id, date: dateStr } },
        create: {
          userId: emp.id,
          date: dateStr,
          status: 'absent_excused',
          source: 'admin_correction',
        },
        update: {
          status: 'absent_excused',
        },
      });
      excusedCreated++;
      continue;
    }

    // Check if employee has an attendance record already
    const existingAttendance = await prisma.attendance.findUnique({
      where: { userId_date: { userId: emp.id, date: dateStr } },
    });

    if (!existingAttendance || !existingAttendance.checkIn) {
      // Create or update record as unexcused absence
      const attendance = await prisma.attendance.upsert({
        where: { userId_date: { userId: emp.id, date: dateStr } },
        create: {
          userId: emp.id,
          date: dateStr,
          status: 'absent_unexcused',
          source: 'admin_correction',
        },
        update: {
          status: 'absent_unexcused',
        },
      });

      // Idempotently create proposed absence deduction
      await deductionService.evaluateAbsenceDeduction(emp.id, attendance.id);
      absencesCreated++;
    }
  }

  return {
    processed: employees.length,
    absencesCreated,
    excusedCreated,
  };
}

/**
 * Initializes daily automated node-cron task running at 23:55 every night
 */
export function startAbsenceCronJob(): void {
  cron.schedule('55 23 * * *', async () => {
    try {
      console.log('⏰ Running daily automated absence detection job...');
      const result = await runAbsenceDetectionJob();
      console.log(`✅ Absence job finished: ${result.absencesCreated} absences recorded.`);
    } catch (err) {
      console.error('❌ Error in absence cron job:', err);
    }
  });
}
