import { Request, Response, NextFunction } from 'express';
import { DeductionService } from '../services/deduction.service.js';
import { PayrollService } from '../services/payroll.service.js';
import { prisma } from '../config/prisma.js';

const deductionService = new DeductionService();
const payrollService = new PayrollService();

export class DeductionController {
  // Employee view: "خصوماتي"
  async getMyDeductions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id || (req as any).user.userId;
      const month = req.query.month as string;
      const data = await deductionService.listEmployeeDeductions(userId, month);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // Employee dispute
  async createDispute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id || (req as any).user.userId;
      const { id } = req.params;
      const { reason, attachmentUrl } = req.body;
      const dispute = await deductionService.createDispute(userId, id, reason, attachmentUrl);
      res.status(201).json({
        success: true,
        message: 'تم إرسال الاعتراض على الخصم بنجاح للمراجعة الإدارية',
        data: dispute,
      });
    } catch (err) {
      next(err);
    }
  }

  // Admin: Payroll Summary
  async getPayrollSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const month = (req.query.month as string) || new Date().toISOString().substring(0, 7);
      const summary = await payrollService.getPayrollSummary(month);
      res.status(200).json({ success: true, data: summary });
    } catch (err) {
      next(err);
    }
  }

  // Admin: Approve proposed deductions
  async approveDeductions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as any).user.id || (req as any).user.userId;
      const { deductionIds } = req.body;
      await deductionService.approveDeductions(adminId, deductionIds || []);
      res.status(200).json({
        success: true,
        message: 'تم اعتماد الخصومات بنجاح',
      });
    } catch (err) {
      next(err);
    }
  }

  // Employee Salary Info
  async getMySalary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id || (req as any).user.userId;
      const { salary, dayWage, currency } = await deductionService.getEmployeeDayWage(userId);
      res.status(200).json({
        success: true,
        data: { monthlySalary: salary, dayWage, currency },
      });
    } catch (err) {
      next(err);
    }
  }

  // Employee Adjustments
  async getMyAdjustments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id || (req as any).user.userId;
      const month = (req.query.period as string) || (req.query.month as string) || new Date().toISOString().substring(0, 7);
      const period = await prisma.payrollPeriod.findUnique({ where: { month } });
      const adjustments = await prisma.adjustment.findMany({
        where: {
          userId,
          ...(period ? { payrollPeriodId: period.id } : {}),
        },
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json({ success: true, data: adjustments });
    } catch (err) {
      next(err);
    }
  }

  // Period Status
  async getPeriodStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const month = (req.query.period as string) || (req.query.month as string) || new Date().toISOString().substring(0, 7);
      const period = await prisma.payrollPeriod.findUnique({ where: { month } });
      res.status(200).json({ success: true, data: period });
    } catch (err) {
      next(err);
    }
  }

  // Admin: List all deductions for a month and status
  async getAllDeductions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const month = (req.query.period as string) || (req.query.month as string);
      const status = req.query.status as string;
      const period = month ? await prisma.payrollPeriod.findUnique({ where: { month } }) : null;

      const deductions = await prisma.deduction.findMany({
        where: {
          ...(period ? { payrollPeriodId: period.id } : {}),
          ...(status ? { status } : {}),
        },
        include: {
          user: { select: { id: true, name: true, email: true, photoUrl: true } },
          disputes: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
      });

      const formatted = deductions.map((d) => ({
        ...d,
        calculationDetails: typeof d.calculationDetails === 'string'
          ? JSON.parse(d.calculationDetails || '{}')
          : d.calculationDetails,
        dispute: d.disputes[0] || null,
      }));

      res.status(200).json({ success: true, data: formatted });
    } catch (err) {
      next(err);
    }
  }

  // Admin: Review Dispute
  async reviewDispute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as any).user.id || (req as any).user.userId;
      const { id } = req.params;
      const rawDecision = req.body.decision || req.body.action;
      const decision = rawDecision === 'accept' ? 'accepted' : rawDecision === 'reject' ? 'rejected' : rawDecision;
      const notes = req.body.notes || req.body.reviewNotes;
      const result = await deductionService.reviewDispute(adminId, id, decision, notes);
      res.status(200).json({
        success: true,
        message: decision === 'accepted' ? 'تم قبول الاعتراض وإلغاء الخصم' : 'تم رفض الاعتراض وتأكيد الخصم',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  // Admin: Manual Adjustment (Bonus or Penalty with mandatory written reason)
  async createAdjustment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as any).user.id || (req as any).user.userId;
      const adjustment = await deductionService.createAdjustment(adminId, req.body);
      res.status(201).json({
        success: true,
        message: 'تم إضافة التعديل المالي بنجاح وتوثيقه مع السبب',
        data: adjustment,
      });
    } catch (err) {
      next(err);
    }
  }

  // Admin: Permanently Close Payroll Period
  async closePayrollPeriod(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as any).user.id || (req as any).user.userId;
      const month = req.body.month || req.body.period;
      const closed = await payrollService.closePayrollPeriod(adminId, month);
      res.status(200).json({
        success: true,
        message: `تم إغلاق شهر الرواتب ${month} نهائياً وتجميد الخصومات`,
        data: closed,
      });
    } catch (err) {
      next(err);
    }
  }

  // Deduction Rules CRUD (Admin)
  async listRules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rules = await prisma.deductionRule.findMany({ orderBy: { order: 'asc' } });
      res.status(200).json({ success: true, data: rules });
    } catch (err) {
      next(err);
    }
  }

  async createRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ruleType, name, minMinutes, maxMinutes, deductionType, value, order, isActive } = req.body;
      const rule = await prisma.deductionRule.create({
        data: {
          ruleType,
          name,
          minMinutes: minMinutes !== undefined ? Number(minMinutes) : undefined,
          maxMinutes: maxMinutes !== undefined ? Number(maxMinutes) : undefined,
          deductionType,
          value,
          order: Number(order) || 0,
          isActive: isActive !== undefined ? Boolean(isActive) : true,
        },
      });
      res.status(201).json({ success: true, data: rule });
    } catch (err) {
      next(err);
    }
  }

  async updateRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { name, minMinutes, maxMinutes, deductionType, value, order, isActive } = req.body;
      const rule = await prisma.deductionRule.update({
        where: { id },
        data: {
          name,
          minMinutes: minMinutes !== undefined ? Number(minMinutes) : undefined,
          maxMinutes: maxMinutes !== undefined ? Number(maxMinutes) : undefined,
          deductionType,
          value,
          order: order !== undefined ? Number(order) : undefined,
          isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        },
      });
      res.status(200).json({ success: true, data: rule });
    } catch (err) {
      next(err);
    }
  }

  async deleteRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await prisma.deductionRule.delete({ where: { id } });
      res.status(200).json({ success: true, message: 'تم حذف القاعدة بنجاح' });
    } catch (err) {
      next(err);
    }
  }
}
