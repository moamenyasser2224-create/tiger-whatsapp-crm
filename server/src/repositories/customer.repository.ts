import { prisma } from '../config/prisma.js';
import type { Prisma, Customer } from '@prisma/client';

export interface CustomerQueryOptions {
  search?: string;
  status?: string;
  source?: string;
  city?: string;
  sortBy?: 'name' | 'createdAt' | 'next' | 'last' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export class CustomerRepository {
  async create(data: Prisma.CustomerUncheckedCreateInput): Promise<Customer> {
    return prisma.customer.create({
      data,
    });
  }

  async findById(id: string, userId: string): Promise<Customer | null> {
    return prisma.customer.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });
  }

  async findByPhoneHash(userId: string, phoneHash: string): Promise<Customer | null> {
    return prisma.customer.findFirst({
      where: {
        userId,
        phoneHash,
        deletedAt: null,
      },
    });
  }

  async findMany(userId: string, options: CustomerQueryOptions) {
    const {
      search,
      status,
      source,
      city,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = options;

    const where: Prisma.CustomerWhereInput = {
      userId,
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(source ? { source } : {}),
      ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await prisma.$transaction([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Returns customers whose next follow-up is <= today (or overdue),
   * and status is NOT in ['تم البيع', 'غير مهتم'],
   * ordered ascending by next follow-up date.
   */
  async findDueToday(userId: string, endOfToday: Date): Promise<Customer[]> {
    return prisma.customer.findMany({
      where: {
        userId,
        deletedAt: null,
        next: {
          lte: endOfToday,
          not: null,
        },
        status: {
          notIn: ['تم البيع', 'غير مهتم'],
        },
      },
      orderBy: {
        next: 'asc',
      },
    });
  }

  async update(id: string, userId: string, data: Prisma.CustomerUncheckedUpdateInput): Promise<Customer> {
    return prisma.customer.update({
      where: {
        id,
        userId,
      },
      data,
    });
  }

  async softDelete(id: string, userId: string): Promise<Customer> {
    return prisma.customer.update({
      where: {
        id,
        userId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async getAllForExport(userId: string): Promise<Customer[]> {
    return prisma.customer.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getStatusDistribution(userId: string): Promise<Record<string, number>> {
    const counts = await prisma.customer.groupBy({
      by: ['status'],
      where: {
        userId,
        deletedAt: null,
      },
      _count: {
        id: true,
      },
    });

    const result: Record<string, number> = {
      'جديد': 0,
      'تم التواصل': 0,
      'مهتم': 0,
      'تم البيع': 0,
      'غير مهتم': 0,
    };

    counts.forEach((item) => {
      result[item.status] = item._count.id;
    });

    return result;
  }

  async getSourceDistribution(userId: string): Promise<Record<string, number>> {
    const counts = await prisma.customer.groupBy({
      by: ['source'],
      where: {
        userId,
        deletedAt: null,
      },
      _count: {
        id: true,
      },
    });

    const result: Record<string, number> = {};
    counts.forEach((item) => {
      result[item.source] = item._count.id;
    });

    return result;
  }
}
