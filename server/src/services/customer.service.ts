import { CustomerRepository, type CustomerQueryOptions } from '../repositories/customer.repository.js';
import { AuditRepository } from '../repositories/audit.repository.js';
import {
  encryptPhone,
  decryptPhone,
  hashPhone,
  normalizePhone,
} from '../utils/crypto.js';
import { generateCustomersCsv, parseCustomersCsv } from '../utils/csv.js';
import { CustomError } from '../middlewares/errorHandler.js';
import type { Customer } from '@prisma/client';

const customerRepository = new CustomerRepository();
const auditRepository = new AuditRepository();

import { prisma } from '../config/prisma.js';
import { crmService } from './crm.service.js';

export interface FormattedCustomer {
  id: string;
  userId: string;
  name: string;
  company: string | null;
  phone: string;
  city: string | null;
  source: string;
  status: string;
  sourceId: string | null;
  statusId: string | null;
  sourceOption?: any;
  statusOption?: any;
  last: Date | null;
  next: Date | null;
  notes: string | null;
  consent: boolean;
  consentDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

function formatCustomer(customer: any): FormattedCustomer {
  return {
    id: customer.id,
    userId: customer.userId,
    name: customer.name,
    company: customer.company,
    phone: decryptPhone(customer.phone),
    city: customer.city,
    source: customer.sourceOption?.label || customer.source || 'واتساب',
    status: customer.statusOption?.label || customer.status || 'جديد',
    sourceId: customer.sourceId || null,
    statusId: customer.statusId || null,
    sourceOption: customer.sourceOption || null,
    statusOption: customer.statusOption || null,
    last: customer.last,
    next: customer.next,
    notes: customer.notes,
    consent: customer.consent,
    consentDate: customer.consentDate,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
}

export class CustomerService {
  async createCustomer(
    userId: string,
    data: {
      name: string;
      company?: string | null;
      phone: string;
      city?: string | null;
      source?: string;
      status?: string;
      sourceId?: string | null;
      statusId?: string | null;
      last?: Date | null;
      next?: Date | null;
      notes?: string | null;
      consent: boolean;
      force?: boolean;
    },
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    const cleanPhone = normalizePhone(data.phone);
    const phoneHash = hashPhone(cleanPhone);

    // Duplicate check
    const existing = await customerRepository.findByPhoneHash(userId, phoneHash);
    if (existing && !data.force) {
      const formattedExisting = formatCustomer(existing);
      throw new CustomError('رقم الجوال مسجل مسبقاً لعميل آخر في حسابك', 409, {
        duplicate: true,
        existingCustomer: formattedExisting,
      });
    }

    const encryptedPhone = encryptPhone(cleanPhone);

    // Resolve source & sourceId
    let sourceId = data.sourceId || null;
    let source = data.source || 'واتساب';
    if (sourceId) {
      const opt = await prisma.listOption.findUnique({ where: { id: sourceId } });
      if (opt) source = opt.label;
    } else if (source) {
      const opt = await prisma.listOption.findFirst({ where: { type: 'source', label: source } });
      if (opt) sourceId = opt.id;
    }

    // Resolve status & statusId
    let statusId = data.statusId || null;
    let status = data.status || 'جديد';
    if (statusId) {
      const opt = await prisma.listOption.findUnique({ where: { id: statusId } });
      if (opt) status = opt.label;
    } else if (status) {
      const opt = await prisma.listOption.findFirst({ where: { type: 'status', label: status } });
      if (opt) statusId = opt.id;
    }

    const customer = await customerRepository.create({
      userId,
      name: data.name.trim(),
      company: data.company?.trim() || null,
      phone: encryptedPhone,
      phoneHash,
      city: data.city?.trim() || null,
      source,
      status,
      sourceId,
      statusId,
      last: data.last || null,
      next: data.next || null,
      notes: data.notes || null,
      consent: true,
      consentDate: new Date(),
    });

    await auditRepository.log({
      userId,
      action: 'CREATE_CUSTOMER',
      entity: 'CUSTOMER',
      entityId: customer.id,
      details: { name: customer.name, status: customer.status },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return formatCustomer(customer);
  }

  async getCustomers(userId: string, options: CustomerQueryOptions) {
    const result = await customerRepository.findMany(userId, options);
    return {
      items: result.items.map(formatCustomer),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  async getCustomerById(id: string, userId: string): Promise<FormattedCustomer> {
    const customer = await customerRepository.findById(id, userId);
    if (!customer) {
      throw new CustomError('العميل غير موجود', 404);
    }
    return formatCustomer(customer);
  }

  async getDueToday(userId: string): Promise<FormattedCustomer[]> {
    const now = new Date();
    // End of today in UTC / local time
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const customers = await customerRepository.findDueToday(userId, endOfToday);
    return customers.map(formatCustomer);
  }

  async updateCustomer(
    id: string,
    userId: string,
    data: {
      name?: string;
      company?: string | null;
      phone?: string;
      city?: string | null;
      source?: string;
      status?: string;
      sourceId?: string | null;
      statusId?: string | null;
      last?: Date | null;
      next?: Date | null;
      notes?: string | null;
      consent?: boolean;
    },
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<FormattedCustomer> {
    const existing = await customerRepository.findById(id, userId);
    if (!existing) {
      throw new CustomError('العميل غير موجود', 404);
    }

    const updatePayload: Record<string, unknown> = {};

    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.company !== undefined) updatePayload.company = data.company?.trim() || null;
    if (data.city !== undefined) updatePayload.city = data.city?.trim() || null;
    if (data.last !== undefined) updatePayload.last = data.last;
    if (data.next !== undefined) updatePayload.next = data.next;
    if (data.notes !== undefined) updatePayload.notes = data.notes;
    if (data.consent !== undefined) updatePayload.consent = data.consent;

    if (data.sourceId !== undefined) {
      updatePayload.sourceId = data.sourceId;
      if (data.sourceId) {
        const opt = await prisma.listOption.findUnique({ where: { id: data.sourceId } });
        if (opt) updatePayload.source = opt.label;
      }
    } else if (data.source !== undefined) {
      updatePayload.source = data.source;
      const opt = await prisma.listOption.findFirst({ where: { type: 'source', label: data.source } });
      if (opt) updatePayload.sourceId = opt.id;
    }

    if (data.statusId !== undefined) {
      updatePayload.statusId = data.statusId;
      if (data.statusId) {
        const opt = await prisma.listOption.findUnique({ where: { id: data.statusId } });
        if (opt) updatePayload.status = opt.label;
      }
    } else if (data.status !== undefined) {
      updatePayload.status = data.status;
      const opt = await prisma.listOption.findFirst({ where: { type: 'status', label: data.status } });
      if (opt) updatePayload.statusId = opt.id;
    }

    if (data.phone) {
      const cleanPhone = normalizePhone(data.phone);
      updatePayload.phone = encryptPhone(cleanPhone);
      updatePayload.phoneHash = hashPhone(cleanPhone);
    }

    const updated = await customerRepository.update(id, userId, updatePayload);

    // Automated CRM: record status change activity and commission on 'تم البيع'
    if (updatePayload.status && updatePayload.status !== existing.status) {
      crmService.createActivity({
        customerId: id,
        userId,
        type: 'status_change',
        content: `تم تغيير حالة القيد من "${existing.status}" إلى "${updatePayload.status}"`,
      }).catch(() => {});

      if (updatePayload.status === 'تم البيع') {
        const dealVal = Number((data as any).dealValue || (existing as any).dealValue || 1000);
        crmService.handleDealWon(id, userId, dealVal).catch((err) => console.error('Commission error:', err));
      }
    }

    await auditRepository.log({
      userId,
      action: 'UPDATE_CUSTOMER',
      entity: 'CUSTOMER',
      entityId: id,
      details: { updatedFields: Object.keys(updatePayload) },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return formatCustomer(updated);
  }

  async deleteCustomer(id: string, userId: string, meta?: { ipAddress?: string; userAgent?: string }): Promise<void> {
    const existing = await customerRepository.findById(id, userId);
    if (!existing) {
      throw new CustomError('العميل غير موجود', 404);
    }

    await customerRepository.softDelete(id, userId);

    await auditRepository.log({
      userId,
      action: 'DELETE_CUSTOMER',
      entity: 'CUSTOMER',
      entityId: id,
      details: { name: existing.name },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });
  }

  async exportCustomersCsv(userId: string): Promise<string> {
    const customers = await customerRepository.getAllForExport(userId);
    const decryptedList = customers.map(formatCustomer);

    await auditRepository.log({
      userId,
      action: 'EXPORT_CUSTOMERS_CSV',
      entity: 'CUSTOMER',
      details: { totalExported: decryptedList.length },
    });

    return generateCustomersCsv(decryptedList);
  }

  async importCustomersCsv(
    userId: string,
    csvText: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<{ importedCount: number; skippedCount: number }> {
    const rows = parseCustomersCsv(csvText);
    let importedCount = 0;
    let skippedCount = 0;

    for (const row of rows) {
      const cleanPhone = normalizePhone(row.phone);
      if (!cleanPhone || cleanPhone.length < 8 || cleanPhone.length > 15) {
        skippedCount++;
        continue;
      }

      const phoneHash = hashPhone(cleanPhone);
      const existing = await customerRepository.findByPhoneHash(userId, phoneHash);

      if (existing) {
        skippedCount++;
        continue;
      }

      const encryptedPhone = encryptPhone(cleanPhone);

      await customerRepository.create({
        userId,
        name: row.name,
        company: row.company || null,
        phone: encryptedPhone,
        phoneHash,
        city: row.city || null,
        source: row.source || 'واتساب',
        status: row.status || 'جديد',
        last: row.last ? new Date(row.last) : null,
        next: row.next ? new Date(row.next) : null,
        notes: row.notes || null,
        consent: true,
        consentDate: new Date(),
      });

      importedCount++;
    }

    await auditRepository.log({
      userId,
      action: 'IMPORT_CUSTOMERS_CSV',
      entity: 'CUSTOMER',
      details: { importedCount, skippedCount },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return { importedCount, skippedCount };
  }

  async getDashboardStats(userId: string) {
    const statusDistribution = await customerRepository.getStatusDistribution(userId);
    const sourceDistribution = await customerRepository.getSourceDistribution(userId);

    const totalCustomers = Object.values(statusDistribution).reduce((acc, curr) => acc + curr, 0);
    const soldCount = statusDistribution['تم البيع'] || 0;
    const conversionRate = totalCustomers > 0 ? Number(((soldCount / totalCustomers) * 100).toFixed(1)) : 0;

    const now = new Date();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const dueTodayCustomers = await customerRepository.findDueToday(userId, endOfToday);

    return {
      totalCustomers,
      conversionRate,
      dueTodayCount: dueTodayCustomers.length,
      statusDistribution,
      sourceDistribution,
    };
  }
}
