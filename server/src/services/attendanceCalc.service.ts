export interface IClock {
  now(): Date;
}

export class SystemClock implements IClock {
  now(): Date {
    return new Date();
  }
}

export interface ShiftInfo {
  startTime: string; // HH:mm (e.g. "09:00")
  endTime: string;   // HH:mm (e.g. "17:00")
  graceMinutes: number; // e.g. 15
  breakMinutes: number; // e.g. 60
}

export interface AttendanceCalculationResult {
  status: string;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  workedMinutes: number;
  overtimeMinutes: number;
}

export class AttendanceCalcService {
  constructor(private clock: IClock = new SystemClock()) {}

  /**
   * Returns YYYY-MM-DD for a date according to an IANA timezone (e.g. "Africa/Cairo")
   */
  getDateStringInTimezone(date: Date, timezone = 'Africa/Cairo'): string {
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return formatter.format(date); // YYYY-MM-DD
    } catch {
      return date.toISOString().split('T')[0];
    }
  }

  /**
   * Helper to parse HH:mm into minute of day (0..1439)
   */
  timeStringToMinutes(timeStr: string): number {
    const [h, m] = timeStr.split(':').map((x) => parseInt(x, 10) || 0);
    return h * 60 + m;
  }

  /**
   * Gets the minute of day (0..1439) for a Date object in a given timezone
   */
  getMinuteOfDayInTimezone(date: Date, timezone = 'Africa/Cairo'): number {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      }).formatToParts(date);

      let hour = 0;
      let minute = 0;
      for (const part of parts) {
        if (part.type === 'hour') hour = parseInt(part.value, 10) || 0;
        if (part.type === 'minute') minute = parseInt(part.value, 10) || 0;
      }
      if (hour === 24) hour = 0;
      return hour * 60 + minute;
    } catch {
      return date.getUTCHours() * 60 + date.getUTCMinutes();
    }
  }

  /**
   * Calculates late minutes, early leave, worked minutes, overtime, and status
   */
  calculateMetrics(
    checkIn: Date,
    checkOut: Date | null,
    shift: ShiftInfo,
    timezone = 'Africa/Cairo'
  ): AttendanceCalculationResult {
    const checkInMin = this.getMinuteOfDayInTimezone(checkIn, timezone);
    const shiftStartMin = this.timeStringToMinutes(shift.startTime);
    const shiftEndMin = this.timeStringToMinutes(shift.endTime);
    const graceLimitMin = shiftStartMin + (shift.graceMinutes || 0);

    // 1. Late Minutes
    let lateMinutes = 0;
    if (checkInMin > graceLimitMin) {
      lateMinutes = checkInMin - shiftStartMin;
    }

    // 2. Early Leave & Overtime & Worked Minutes (if checkOut exists)
    let earlyLeaveMinutes = 0;
    let overtimeMinutes = 0;
    let workedMinutes = 0;

    if (checkOut) {
      const checkOutMin = this.getMinuteOfDayInTimezone(checkOut, timezone);

      if (checkOutMin < shiftEndMin) {
        earlyLeaveMinutes = shiftEndMin - checkOutMin;
      } else if (checkOutMin > shiftEndMin) {
        overtimeMinutes = checkOutMin - shiftEndMin;
      }

      const totalDiffMinutes = Math.max(0, Math.floor((checkOut.getTime() - checkIn.getTime()) / 60000));
      workedMinutes = Math.max(0, totalDiffMinutes - (shift.breakMinutes || 0));
    }

    // 3. Status determination
    let status = 'present';
    if (!checkOut) {
      status = lateMinutes > 0 ? 'late' : 'present';
    } else {
      if (lateMinutes > 0) {
        status = 'late';
      } else if (earlyLeaveMinutes > 0) {
        status = 'early_leave';
      } else {
        status = 'present';
      }
    }

    return {
      status,
      lateMinutes,
      earlyLeaveMinutes,
      workedMinutes,
      overtimeMinutes,
    };
  }
}
