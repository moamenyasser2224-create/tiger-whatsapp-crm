import { prisma } from '../config/prisma.js';
import { decryptSalary } from '../utils/crypto.js';
import { CustomError } from '../middlewares/errorHandler.js';
import { Prisma } from '@prisma/client';

export class DeductionService {
  /**
   * Helper to get or create current active payroll period YYYY-MM
   */
  async getOrCreatePayrollPeriod(monthStr?: string): Promise<{ id: string; month: string; status: string }> {
    const currentMonth = monthStr || new Date().toISOString().substring(0, 7); // YYYY-MM

    let period = await prisma.payrollPeriod.findUnique({
      where: { month: currentMonth },
    });

    if (!period) {
      period = await prisma.payrollPeriod.create({
        data: {
          month: currentMonth,
          status: 'open',
        },
      });
    }

    return period;
  }

  /**
   * Computes daily wage from monthly salary and organization settings
   */
  async getEmployeeDayWage(userId: string): Promise<{ salary: number; dayWage: number; currency: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { monthlySalary: true },
    });

    const settings = await prisma.settings.findFirst();
    const currency = settings?.currency || 'EGP';
    const dayWageCalc = settings?.dayWageCalculation || 'fixed_30';

    const salary = decryptSalary(user?.monthlySalary);
    if (salary <= 0) {
      return { salary: 0, dayWage: 0, currency };
    }

    let divisor = 30;
    if (dayWageCalc === 'working_days') {
      divisor = 22; // Average business working days per month
    }

    const dayWage = salary / divisor;
    return { salary, dayWage, currency };
  }

  /**
   * Enforces monthly disciplinary deductions cap (e.g. max 20% of salary)
   */
  async enforceCap(userId: string, requestedAmount: number, salary: number, payrollPeriodId: string): Promise<number> {
    if (requestedAmount <= 0 || salary <= 0) return 0;

    const settings = await prisma.settings.findFirst();
    const capPercent = settings?.disciplinaryMonthlyCapPercent
      ? Number(settings.disciplinaryMonthlyCapPercent)
      : 20;

    const maxMonthlyCap = (capPercent / 100) * salary;

    // Sum all approved / closed disciplinary deductions for this user in current period
    const existingDeductions = await prisma.deduction.findMany({
      where: {
        userId,
        payrollPeriodId,
        status: { in: ['approved', 'closed_in_payroll'] },
      },
      select: { amount: true },
    });

    const totalDeducted = existingDeductions.reduce((sum, d) => sum + Number(d.amount), 0);
    const remainingAllowance = Math.max(0, maxMonthlyCap - totalDeducted);

    return Math.min(requestedAmount, remainingAllowance);
  }

  /**
   * Evaluates late minutes against active DeductionRules and creates a proposed deduction
   */
  async evaluateLateDeduction(userId: string, lateMinutes: number, attendanceId: string): Promise<any | null> {
    if (lateMinutes <= 0) return null;

    // Check if deduction already exists for this attendance record
    const existing = await prisma.deduction.findFirst({
      where: { attendanceId, type: 'late' },
    });
    if (existing) return existing;

    const rules = await prisma.deductionRule.findMany({
      where: { ruleType: 'late', isActive: true },
      orderBy: { order: 'asc' },
    });

    const matchingRule = rules.find((r) => {
      const min = r.minMinutes ?? 0;
      const max = r.maxMinutes ?? Infinity;
      return lateMinutes >= min && lateMinutes <= max;
    });

    if (!matchingRule) return null;

    const { salary, dayWage, currency } = await this.getEmployeeDayWage(userId);
    if (dayWage <= 0) return null;

    let rawAmount = 0;
    const ruleVal = Number(matchingRule.value);

    if (matchingRule.deductionType === 'fixed_amount') {
      rawAmount = ruleVal;
    } else if (matchingRule.deductionType === 'percentage_day_wage') {
      rawAmount = (ruleVal / 100) * dayWage;
    } else if (matchingRule.deductionType === 'multiplier_day_wage') {
      rawAmount = ruleVal * dayWage;
    } else if (matchingRule.deductionType === 'per_minute') {
      rawAmount = ruleVal * lateMinutes;
    }

    const period = await this.getOrCreatePayrollPeriod();
    const finalAmount = await this.enforceCap(userId, rawAmount, salary, period.id);

    const calculationDetails = JSON.stringify({
      ruleName: matchingRule.name,
      lateMinutes,
      bracket: `${matchingRule.minMinutes || 0} - ${matchingRule.maxMinutes || '∞'} minutes`,
      formula: `${matchingRule.deductionType} = ${ruleVal}`,
      dayWage: Math.round(dayWage * 100) / 100,
      currency,
      rawAmount: Math.round(rawAmount * 100) / 100,
      cappedAmount: Math.round(finalAmount * 100) / 100,
      explanation: `Late by ${lateMinutes} minutes in bracket (${matchingRule.name}) with amount ${Math.round(finalAmount)} ${currency}`,
    });

    return prisma.deduction.create({
      data: {
        userId,
        attendanceId,
        ruleId: matchingRule.id,
        payrollPeriodId: period.id,
        type: 'late',
        amount: new Prisma.Decimal(Math.round(finalAmount * 100) / 100),
        calculationDetails,
        status: 'proposed',
      },
    });
  }

  /**
   * Evaluates unexcused absence deduction (idempotent)
   */
  async evaluateAbsenceDeduction(userId: string, attendanceId: string): Promise<any | null> {
    const existing = await prisma.deduction.findFirst({
      where: { attendanceId, type: 'absence' },
    });
    if (existing) return existing;

    const rule = await prisma.deductionRule.findFirst({
      where: { ruleType: 'unexcused_absence', isActive: true },
    });

    const { salary, dayWage, currency } = await this.getEmployeeDayWage(userId);
    if (dayWage <= 0) return null;

    const multiplier = rule ? Number(rule.value) : 1.0;
    const rawAmount = multiplier * dayWage;

    const period = await this.getOrCreatePayrollPeriod();
    const finalAmount = await this.enforceCap(userId, rawAmount, salary, period.id);

    const calculationDetails = JSON.stringify({
      ruleName: rule?.name || 'Unexcused Absence',
      multiplier,
      dayWage: Math.round(dayWage * 100) / 100,
      currency,
      rawAmount: Math.round(rawAmount * 100) / 100,
      cappedAmount: Math.round(finalAmount * 100) / 100,
      explanation: `Unexcused absence deduction with multiplier ${multiplier}x day wage = ${Math.round(finalAmount)} ${currency}`,
    });

    return prisma.deduction.create({
      data: {
        userId,
        attendanceId,
        ruleId: rule?.id,
        payrollPeriodId: period.id,
        type: 'absence',
        amount: new Prisma.Decimal(Math.round(finalAmount * 100) / 100),
        calculationDetails,
        status: 'proposed',
      },
    });
  }

  /**
   * List employee's deductions for current or requested month
   */
  async listEmployeeDeductions(userId: string, monthStr?: string) {
    const period = await this.getOrCreatePayrollPeriod(monthStr);

    const deductions = await prisma.deduction.findMany({
      where: {
        userId,
        payrollPeriodId: period.id,
      },
      include: {
        attendance: true,
        rule: true,
        disputes: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const adjustments = await prisma.adjustment.findMany({
      where: {
        userId,
        payrollPeriodId: period.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    const { salary, currency } = await this.getEmployeeDayWage(userId);

    const totalApprovedDeductions = deductions
      .filter((d) => ['approved', 'closed_in_payroll'].includes(d.status))
      .reduce((sum, d) => sum + Number(d.amount), 0);

    const totalProposedDeductions = deductions
      .filter((d) => d.status === 'proposed')
      .reduce((sum, d) => sum + Number(d.amount), 0);

    const totalBonuses = adjustments
      .filter((a) => a.type === 'bonus')
      .reduce((sum, a) => sum + Number(a.amount), 0);

    const totalManualDeductions = adjustments
      .filter((a) => a.type === 'manual_deduction')
      .reduce((sum, a) => sum + Number(a.amount), 0);

    const netSalary = Math.max(
      0,
      salary - (totalApprovedDeductions + totalManualDeductions) + totalBonuses
    );

    return {
      period,
      salary,
      currency,
      totalApprovedDeductions,
      totalProposedDeductions,
      totalBonuses,
      totalManualDeductions,
      netSalary,
      deductions,
      adjustments,
    };
  }

  /**
   * Employee creates a dispute on a deduction
   */
  async createDispute(userId: string, deductionId: string, reason: string, attachmentUrl?: string) {
    const deduction = await prisma.deduction.findUnique({
      where: { id: deductionId },
      include: { payrollPeriod: true },
    });

    if (!deduction) throw new CustomError('Deduction not found', 404);
    if (deduction.userId !== userId) throw new CustomError('Unauthorized to dispute this deduction', 403);
    if (deduction.payrollPeriod?.status === 'closed') {
      throw new CustomError('Cannot dispute a deduction in a permanently closed payroll period', 400);
    }
    if (deduction.status === 'closed_in_payroll') {
      throw new CustomError('Deduction is closed in payroll and cannot be disputed', 400);
    }

    const dispute = await prisma.deductionDispute.create({
      data: {
        deductionId,
        userId,
        reason,
        attachmentUrl,
        status: 'pending',
      },
    });

    await prisma.deduction.update({
      where: { id: deductionId },
      data: { status: 'disputed' },
    });

    return dispute;
  }

  /**
   * Admin reviews a dispute (accept or reject)
   */
  async reviewDispute(adminId: string, disputeOrDeductionId: string, decision: 'accepted' | 'rejected', notes?: string) {
    let dispute = await prisma.deductionDispute.findUnique({
      where: { id: disputeOrDeductionId },
      include: {
        deduction: {
          include: { payrollPeriod: true },
        },
      },
    });

    if (!dispute) {
      dispute = await prisma.deductionDispute.findFirst({
        where: { deductionId: disputeOrDeductionId },
        include: {
          deduction: {
            include: { payrollPeriod: true },
          },
        },
      });
    }

    if (!dispute) throw new CustomError('Dispute request not found', 404);
    if (dispute.deduction.payrollPeriod?.status === 'closed') {
      throw new CustomError('Payroll period is closed and deductions cannot be modified', 400);
    }

    const updatedDispute = await prisma.deductionDispute.update({
      where: { id: dispute.id },
      data: {
        status: decision,
        reviewedBy: adminId,
        reviewNotes: notes || (decision === 'accepted' ? 'Dispute accepted and deduction cancelled' : 'Dispute rejected'),
        reviewedAt: new Date(),
      },
    });

    // If accepted, cancel the deduction. If rejected, restore to approved.
    await prisma.deduction.update({
      where: { id: dispute.deductionId },
      data: {
        status: decision === 'accepted' ? 'cancelled' : 'approved',
      },
    });

    return updatedDispute;
  }

  /**
   * Admin approves proposed deduction(s)
   */
  async approveDeductions(adminId: string, deductionIds: string[]) {
    return prisma.deduction.updateMany({
      where: {
        id: { in: deductionIds },
        status: { in: ['proposed', 'disputed'] },
        payrollPeriod: { status: 'open' },
      },
      data: { status: 'approved' },
    });
  }

  /**
   * Admin adds a manual adjustment (bonus or penalty) with mandatory written reason
   */
  async createAdjustment(adminId: string, payload: { userId: string; type: 'bonus' | 'manual_deduction'; amount: number; reason: string; monthStr?: string }) {
    if (!payload.reason || payload.reason.trim().length < 5) {
      throw new CustomError('A detailed written reason is required for financial adjustments', 400);
    }
    if (payload.amount <= 0) {
      throw new CustomError('Amount must be greater than zero', 400);
    }

    const period = await this.getOrCreatePayrollPeriod(payload.monthStr);
    if (period.status === 'closed') {
      throw new CustomError('Cannot add adjustments to a closed payroll period', 400);
    }

    return prisma.adjustment.create({
      data: {
        userId: payload.userId,
        payrollPeriodId: period.id,
        type: payload.type,
        amount: new Prisma.Decimal(payload.amount),
        reason: payload.reason.trim(),
        createdBy: adminId,
      },
    });
  }
}
