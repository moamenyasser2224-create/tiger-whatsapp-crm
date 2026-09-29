import { prisma } from '../config/prisma.js';
import { decryptSalary } from '../utils/crypto.js';
import { CustomError } from '../middlewares/errorHandler.js';

export class PayrollService {
  async getPayrollSummary(monthStr: string) {
    let period = await prisma.payrollPeriod.findUnique({
      where: { month: monthStr },
    });

    if (!period) {
      period = await prisma.payrollPeriod.create({
        data: { month: monthStr, status: 'open' },
      });
    }

    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        monthlySalary: true,
        photoUrl: true,
      },
    });

    const settings = await prisma.settings.findFirst();
    const currency = settings?.currency || 'EGP';

    const deductions = await prisma.deduction.findMany({
      where: { payrollPeriodId: period.id },
    });

    const adjustments = await prisma.adjustment.findMany({
      where: { payrollPeriodId: period.id },
    });

    const employeeReports = users.map((u) => {
      const salary = decryptSalary(u.monthlySalary);
      const userDeductions = deductions.filter((d) => d.userId === u.id);
      const userAdjustments = adjustments.filter((a) => a.userId === u.id);

      const approvedDeductionsTotal = userDeductions
        .filter((d) => ['approved', 'closed_in_payroll'].includes(d.status))
        .reduce((sum, d) => sum + Number(d.amount), 0);

      const proposedDeductionsTotal = userDeductions
        .filter((d) => d.status === 'proposed')
        .reduce((sum, d) => sum + Number(d.amount), 0);

      const bonusesTotal = userAdjustments
        .filter((a) => a.type === 'bonus')
        .reduce((sum, a) => sum + Number(a.amount), 0);

      const manualDeductionsTotal = userAdjustments
        .filter((a) => a.type === 'manual_deduction')
        .reduce((sum, a) => sum + Number(a.amount), 0);

      const netSalary = Math.max(0, salary - (approvedDeductionsTotal + manualDeductionsTotal) + bonusesTotal);

      return {
        userId: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        photoUrl: u.photoUrl,
        monthlySalary: salary,
        approvedDeductionsTotal,
        proposedDeductionsTotal,
        bonusesTotal,
        manualDeductionsTotal,
        netSalary,
        currency,
      };
    });

    return {
      period,
      currency,
      employees: employeeReports,
    };
  }

  async closePayrollPeriod(adminId: string, monthStr: string) {
    const period = await prisma.payrollPeriod.findUnique({
      where: { month: monthStr },
    });

    if (!period) throw new CustomError('Payroll period not found', 404);
    if (period.status === 'closed') {
      throw new CustomError('This payroll period is already closed', 400);
    }

    // 1. Lock all approved deductions to closed_in_payroll
    await prisma.deduction.updateMany({
      where: {
        payrollPeriodId: period.id,
        status: 'approved',
      },
      data: {
        status: 'closed_in_payroll',
      },
    });

    // 2. Mark period as closed
    const closedPeriod = await prisma.payrollPeriod.update({
      where: { id: period.id },
      data: {
        status: 'closed',
        closedAt: new Date(),
        closedBy: adminId,
      },
    });

    // 3. Log Audit
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'PAYROLL_PERIOD_CLOSED',
        entity: 'PAYROLL',
        entityId: period.id,
        details: JSON.stringify({ month: monthStr, closedAt: new Date() }),
      },
    });

    return closedPeriod;
  }
}
