import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import bcrypt from 'bcrypt';
import { generateAccessToken } from '../src/utils/tokens.js';
import { AttendanceCalcService, IClock } from '../src/services/attendanceCalc.service.js';
import { DeductionService } from '../src/services/deduction.service.js';
import { runAbsenceDetectionJob } from '../src/jobs/absence.job.js';
import { encryptSalary, decryptSalary } from '../src/utils/crypto.js';
import { Prisma } from '@prisma/client';

const app = createApp();

class MockClock implements IClock {
  private currentTime: Date;
  constructor(initialTime: Date) {
    this.currentTime = initialTime;
  }
  now(): Date {
    return new Date(this.currentTime);
  }
  setTime(time: Date) {
    this.currentTime = time;
  }
}

describe('Attendance, Shifts, Deductions and Payroll System Tests', () => {
  let adminUser: any;
  let employeeA: any;
  let employeeB: any;
  let adminToken: string;
  let employeeAToken: string;
  let employeeBToken: string;
  let activePeriod: any;

  beforeAll(async () => {
    // Cleanup existing test records
    await prisma.deductionDispute.deleteMany();
    await prisma.adjustment.deleteMany();
    await prisma.deduction.deleteMany();
    await prisma.attendanceCorrection.deleteMany();
    await prisma.leaveRequest.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.workSchedule.deleteMany();
    await prisma.shift.deleteMany();
    await prisma.holiday.deleteMany();
    await prisma.payrollPeriod.deleteMany();
    await prisma.deductionRule.deleteMany();
    await prisma.user.deleteMany({
      where: {
        email: { in: ['admin_payroll@test.com', 'emp_a@test.com', 'emp_b@test.com'] },
      },
    });

    const hashedPassword = await bcrypt.hash('Password@123', 10);

    // Create Admin
    adminUser = await prisma.user.create({
      data: {
        email: 'admin_payroll@test.com',
        name: 'مدير النظام',
        password: hashedPassword,
        role: 'admin',
        monthlySalary: encryptSalary(15000),
      },
    });
    adminToken = generateAccessToken({ userId: adminUser.id, email: adminUser.email });

    // Create Employee A
    employeeA = await prisma.user.create({
      data: {
        email: 'emp_a@test.com',
        name: 'موظف أ',
        password: hashedPassword,
        role: 'employee',
        monthlySalary: encryptSalary(6000),
      },
    });
    employeeAToken = generateAccessToken({ userId: employeeA.id, email: employeeA.email });

    // Create Employee B
    employeeB = await prisma.user.create({
      data: {
        email: 'emp_b@test.com',
        name: 'موظف ب',
        password: hashedPassword,
        role: 'employee',
        monthlySalary: encryptSalary(8000),
      },
    });
    employeeBToken = generateAccessToken({ userId: employeeB.id, email: employeeB.email });

    // Seed default settings
    await prisma.settings.deleteMany();
    await prisma.settings.create({
      data: {
        id: 'default',
        orgName: 'شركة النمر CRM',
        disciplinaryMonthlyCapPercent: new Prisma.Decimal(10),
        dayWageCalculation: 'fixed_30',
        disputeWindowDays: 7,
      },
    });

    // Create active payroll period
    const month = new Date().toISOString().substring(0, 7);
    activePeriod = await prisma.payrollPeriod.upsert({
      where: { month },
      create: { month, status: 'open' },
      update: { status: 'open' },
    });
  });

  afterAll(async () => {
    await prisma.deductionDispute.deleteMany();
    await prisma.adjustment.deleteMany();
    await prisma.deduction.deleteMany();
    await prisma.attendanceCorrection.deleteMany();
    await prisma.leaveRequest.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.workSchedule.deleteMany();
    await prisma.shift.deleteMany();
    await prisma.holiday.deleteMany();
    await prisma.payrollPeriod.deleteMany();
    await prisma.user.deleteMany({
      where: {
        email: { in: ['admin_payroll@test.com', 'emp_a@test.com', 'emp_b@test.com'] },
      },
    });
    await prisma.$disconnect();
  });

  describe('1. AttendanceCalcService Unit Tests (Grace period, late brackets, early departure)', () => {
    const shift = {
      startTime: '09:00',
      endTime: '17:00',
      graceMinutes: 15,
      breakMinutes: 60,
    };

    it('should grant grace period: check-in at 09:10 produces 0 late minutes', () => {
      const clock = new MockClock(new Date('2026-09-28T09:10:00Z'));
      const calcService = new AttendanceCalcService(clock);

      const checkInTime = new Date('2026-09-28T09:10:00Z');
      const checkOutTime = new Date('2026-09-28T17:00:00Z');

      const metrics = calcService.calculateMetrics(checkInTime, checkOutTime, shift, 'UTC');
      expect(metrics.lateMinutes).toBe(0);
      expect(metrics.status).toBe('present');
    });

    it('should calculate late minutes when check-in is past grace period: 09:35 produces 35 late minutes', () => {
      const clock = new MockClock(new Date('2026-09-28T09:35:00Z'));
      const calcService = new AttendanceCalcService(clock);

      const checkInTime = new Date('2026-09-28T09:35:00Z');
      const checkOutTime = new Date('2026-09-28T17:00:00Z');

      const metrics = calcService.calculateMetrics(checkInTime, checkOutTime, shift, 'UTC');
      expect(metrics.lateMinutes).toBe(35);
      expect(metrics.status).toBe('late');
    });

    it('should calculate early departure minutes when employee leaves at 16:30', () => {
      const clock = new MockClock(new Date('2026-09-28T16:30:00Z'));
      const calcService = new AttendanceCalcService(clock);

      const checkInTime = new Date('2026-09-28T09:00:00Z');
      const checkOutTime = new Date('2026-09-28T16:30:00Z');

      const metrics = calcService.calculateMetrics(checkInTime, checkOutTime, shift, 'UTC');
      expect(metrics.earlyLeaveMinutes).toBe(30);
    });
  });

  describe('2. Absence Detection Job & Idempotency', () => {
    it('should not record absence if the employee has approved leave on that date', async () => {
      const testDate = '2026-10-15';

      // Create approved leave for employee A
      await prisma.leaveRequest.create({
        data: {
          userId: employeeA.id,
          type: 'annual',
          fromDate: testDate,
          toDate: testDate,
          status: 'approved',
          reason: 'إجازة سنوية مجدولة',
        },
      });

      // Run absence job
      const result = await runAbsenceDetectionJob(testDate);
      expect(result).toBeDefined();

      // Verify excused absence was recorded with status absent_excused and no deduction
      const attendance = await prisma.attendance.findUnique({
        where: {
          userId_date: {
            userId: employeeA.id,
            date: testDate,
          },
        },
      });
      expect(attendance).toBeDefined();
      expect(attendance?.status).toBe('absent_excused');

      const deductions = await prisma.deduction.findMany({
        where: { userId: employeeA.id, attendanceId: attendance?.id },
      });
      expect(deductions.length).toBe(0);
    });

    it('should be idempotent: running absence job twice does not create duplicate attendance or deductions', async () => {
      const testDate = '2026-10-18'; // Sunday

      // Create a shift and schedule for employee B
      const shift = await prisma.shift.create({
        data: {
          name: 'دوام صباحي للاختبار',
          startTime: '09:00',
          endTime: '17:00',
          graceMinutes: 15,
        },
      });

      await prisma.workSchedule.create({
        data: {
          userId: employeeB.id,
          shiftId: shift.id,
          dayOfWeek: 0, // Sunday
          isWeekend: false,
        },
      });

      // First run: detects absence
      const run1 = await runAbsenceDetectionJob(testDate);
      const count1 = await prisma.attendance.count({
        where: { userId: employeeB.id, date: testDate },
      });
      expect(count1).toBe(1);

      // Second run: should NOT create duplicate record or error
      const run2 = await runAbsenceDetectionJob(testDate);
      const count2 = await prisma.attendance.count({
        where: { userId: employeeB.id, date: testDate },
      });
      expect(count2).toBe(1);
    });
  });

  describe('3. Deduction Service & Monthly Cap Enforcement', () => {
    it('should calculate correct day wage: 6000 / 30 = 200', async () => {
      const deductionService = new DeductionService();
      const { dayWage } = await deductionService.getEmployeeDayWage(employeeA.id);
      expect(dayWage).toBe(200);
    });

    it('should enforce monthly cap (10% of 6000 = 600) on disciplinary deductions', async () => {
      const deductionService = new DeductionService();
      const period = await deductionService.getOrCreatePayrollPeriod('2026-11');

      // Create deductions totaling 500
      await prisma.deduction.create({
        data: {
          userId: employeeA.id,
          payrollPeriodId: period.id,
          type: 'absence',
          amount: new Prisma.Decimal(200),
          calculationDetails: JSON.stringify({ explanation: 'غياب 1' }),
          status: 'approved',
        },
      });
      await prisma.deduction.create({
        data: {
          userId: employeeA.id,
          payrollPeriodId: period.id,
          type: 'absence',
          amount: new Prisma.Decimal(200),
          calculationDetails: JSON.stringify({ explanation: 'غياب 2' }),
          status: 'approved',
        },
      });

      // Third deduction of 300 (total would be 700, exceeding cap of 600)
      const allowedAmount = await deductionService.enforceCap(employeeA.id, 300, 6000, period.id);

      // The allowed amount should be capped to 200 so total doesn't exceed 600
      expect(allowedAmount).toBe(200);

      // Save deduction of 200 to reach 600 cap
      await prisma.deduction.create({
        data: {
          userId: employeeA.id,
          payrollPeriodId: period.id,
          type: 'absence',
          amount: new Prisma.Decimal(allowedAmount),
          calculationDetails: JSON.stringify({ explanation: 'غياب 3' }),
          status: 'approved',
        },
      });

      // Any further disciplinary deduction in that month should be capped to 0
      const nextAllowance = await deductionService.enforceCap(employeeA.id, 50, 6000, period.id);
      expect(nextAllowance).toBe(0);
    });
  });

  describe('4. Dispute Workflow (Employee dispute & Admin review)', () => {
    let testDeduction: any;

    beforeAll(async () => {
      testDeduction = await prisma.deduction.create({
        data: {
          userId: employeeA.id,
          payrollPeriodId: activePeriod.id,
          type: 'late',
          amount: new Prisma.Decimal(100),
          calculationDetails: JSON.stringify({ explanation: 'تأخير صباحي 40 دقيقة' }),
          status: 'proposed',
        },
      });
    });

    it('employee can submit a dispute on proposed/approved deduction', async () => {
      const res = await request(app)
        .post(`/api/deductions/${testDeduction.id}/dispute`)
        .set('Authorization', `Bearer ${employeeAToken}`)
        .send({
          reason: 'حادث مروري في الطريق الدائري تسبب في التأخير',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      // Verify deduction status changed to 'disputed'
      const updated = await prisma.deduction.findUnique({
        where: { id: testDeduction.id },
        include: { disputes: true },
      });
      expect(updated?.status).toBe('disputed');
      expect(updated?.disputes[0]?.reason).toContain('حادث مروري');
    });

    it('admin accepts dispute -> deduction is cancelled', async () => {
      const res = await request(app)
        .post(`/api/deductions/${testDeduction.id}/review-dispute`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'accept',
          reviewNotes: 'تم قبول العذر الطارئ',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await prisma.deduction.findUnique({ where: { id: testDeduction.id } });
      expect(check?.status).toBe('cancelled');
    });
  });

  describe('5. Payroll Period Close & Lock', () => {
    const periodMonth = '2026-08';

    it('admin can close a payroll period and lock deductions', async () => {
      const period = await prisma.payrollPeriod.create({
        data: {
          month: periodMonth,
          status: 'open',
        },
      });

      // Create a deduction in that period
      const ded = await prisma.deduction.create({
        data: {
          userId: employeeA.id,
          payrollPeriodId: period.id,
          type: 'late',
          amount: new Prisma.Decimal(50),
          calculationDetails: JSON.stringify({ explanation: 'تأخير' }),
          status: 'approved',
        },
      });

      // Close period
      const res = await request(app)
        .post('/api/deductions/admin/close-period')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ period: periodMonth });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify deduction status changed to 'closed_in_payroll'
      const updatedDed = await prisma.deduction.findUnique({ where: { id: ded.id } });
      expect(updatedDed?.status).toBe('closed_in_payroll');

      // Attempting to dispute in closed period must be rejected
      const disputeRes = await request(app)
        .post(`/api/deductions/${ded.id}/dispute`)
        .set('Authorization', `Bearer ${employeeAToken}`)
        .send({ reason: 'اعتراض متأخر' });

      expect(disputeRes.status).toBe(400);
      expect(disputeRes.body.error).toContain('مُغلق');
    });
  });

  describe('6. IDOR / Data Isolation & Security Verification', () => {
    it('Employee A cannot access Employee B deductions', async () => {
      const dedB = await prisma.deduction.create({
        data: {
          userId: employeeB.id,
          payrollPeriodId: activePeriod.id,
          type: 'late',
          amount: new Prisma.Decimal(80),
          calculationDetails: JSON.stringify({ explanation: 'تأخير خاص بموظف ب' }),
          status: 'approved',
        },
      });

      // Employee A tries to dispute Employee B's deduction
      const res = await request(app)
        .post(`/api/deductions/${dedB.id}/dispute`)
        .set('Authorization', `Bearer ${employeeAToken}`)
        .send({ reason: 'محاولة تعديل غير مصرح بها' });

      expect(res.status).toBe(403);
    });

    it('Employee cannot access admin payroll summary', async () => {
      const res = await request(app)
        .get(`/api/deductions/admin/payroll-summary?period=${activePeriod.month}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(403);
    });

    it('Salary encryption: monthlySalary is stored encrypted in database', async () => {
      const rawUser = await prisma.user.findUnique({
        where: { id: employeeA.id },
      });

      expect(rawUser?.monthlySalary).toBeDefined();
      // Should not be raw "6000"
      expect(rawUser?.monthlySalary).not.toBe('6000');
      // Should be decodable via decryptSalary
      const decrypted = decryptSalary(rawUser?.monthlySalary!);
      expect(decrypted).toBe(6000);
    });
  });
});
