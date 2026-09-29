import { prisma } from '../config/prisma.js';
import { notificationService } from './notification.service.js';

export class CrmService {
  // Activities (Timeline)
  async getActivities(customerId: string) {
    return prisma.customerActivity.findMany({
      where: { customerId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createActivity(params: {
    customerId: string;
    userId: string;
    type: string;
    content: string;
    metadata?: any;
  }) {
    const metaStr = params.metadata
      ? typeof params.metadata === 'string'
        ? params.metadata
        : JSON.stringify(params.metadata)
      : null;

    return prisma.customerActivity.create({
      data: {
        customerId: params.customerId,
        userId: params.userId,
        type: params.type,
        content: params.content,
        metadata: metaStr,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  }

  // Tasks
  async getTasks(customerId: string) {
    return prisma.customerTask.findMany({
      where: { customerId },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
      orderBy: { dueAt: 'asc' },
    });
  }

  async createTask(params: {
    customerId: string;
    assigneeId: string;
    title: string;
    dueAt: Date;
  }) {
    const task = await prisma.customerTask.create({
      data: {
        customerId: params.customerId,
        assigneeId: params.assigneeId,
        title: params.title,
        dueAt: params.dueAt,
      },
      include: {
        customer: { select: { id: true, name: true } },
      },
    });

    // Notify assignee
    await notificationService.createNotification({
      userId: params.assigneeId,
      type: 'crm_deal',
      title: 'New customer follow-up task',
      body: `Task "${params.title}" assigned for customer ${task.customer.name}`,
      payload: { customerId: params.customerId, taskId: task.id },
    });

    return task;
  }

  async updateTask(taskId: string, done: boolean) {
    return prisma.customerTask.update({
      where: { id: taskId },
      data: {
        doneAt: done ? new Date() : null,
      },
    });
  }

  // Pipeline Metrics
  async getPipeline() {
    const customers = await prisma.customer.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        status: true,
        dealValue: true,
        currency: true,
        expectedCloseDate: true,
        updatedAt: true,
      },
    });

    const stageSummary: Record<string, { count: number; totalValue: number }> = {};
    let grandTotalValue = 0;

    customers.forEach((c) => {
      const stage = c.status || 'New';
      const val = Number(c.dealValue || 0);

      if (!stageSummary[stage]) {
        stageSummary[stage] = { count: 0, totalValue: 0 };
      }
      stageSummary[stage].count += 1;
      stageSummary[stage].totalValue += val;
      grandTotalValue += val;
    });

    return {
      stages: stageSummary,
      totalCustomers: customers.length,
      grandTotalValue,
    };
  }

  // Handle Deal Won: Commission calculation & auto-booking into open payroll
  async handleDealWon(customerId: string, sellerId: string, dealValue: number) {
    if (dealValue <= 0) return null;

    // Get seller role
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      select: { id: true, role: true, name: true },
    });

    if (!seller) return null;

    // Find active commission rule for role or 'all'
    const rule = await prisma.commissionRule.findFirst({
      where: {
        isActive: true,
        role: { in: [seller.role, 'all'] },
      },
      orderBy: { percent: 'desc' },
    });

    if (!rule) return null;

    const commissionPercent = Number(rule.percent);
    const commissionAmount = (dealValue * commissionPercent) / 100;

    if (commissionAmount <= 0) return null;

    // Find currently open payroll period
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    let period = await prisma.payrollPeriod.findUnique({
      where: { month: currentMonth },
    });

    if (!period) {
      period = await prisma.payrollPeriod.create({
        data: { month: currentMonth, status: 'open' },
      });
    }

    if (period.status !== 'open') return null;

    // Create bonus adjustment for seller
    const adjustment = await prisma.adjustment.create({
      data: {
        userId: sellerId,
        payrollPeriodId: period.id,
        type: 'bonus',
        amount: commissionAmount,
        reason: `Deal closed won commission: ${commissionPercent}% of deal value (${dealValue})`,
        createdBy: 'SYSTEM_CRM_AUTOMATION',
      },
    });

    // Notify seller
    await notificationService.createNotification({
      userId: sellerId,
      type: 'crm_deal',
      title: 'Congratulations! New sales commission approved',
      body: `Sales commission of ${commissionAmount.toFixed(2)} calculated and added to your payroll for ${currentMonth}`,
      payload: { adjustmentId: adjustment.id, dealValue, commissionAmount },
    });

    return adjustment;
  }
}

export const crmService = new CrmService();
