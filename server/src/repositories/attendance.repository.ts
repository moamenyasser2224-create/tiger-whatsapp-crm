import { prisma } from '../config/prisma.js';
import type { Attendance } from '@prisma/client';

export class AttendanceRepository {
  async findByUserAndDate(userId: string, date: string): Promise<Attendance | null> {
    return prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId,
          date,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async createCheckIn(userId: string, date: string, checkIn: Date): Promise<Attendance> {
    return prisma.attendance.create({
      data: {
        userId,
        date,
        checkIn,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async updateCheckOut(id: string, checkOut: Date): Promise<Attendance> {
    return prisma.attendance.update({
      where: { id },
      data: {
        checkOut,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async getTodayRecords(date: string): Promise<Attendance[]> {
    return prisma.attendance.findMany({
      where: { date },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getUserHistory(userId: string, limit = 30): Promise<Attendance[]> {
    return prisma.attendance.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: limit,
    });
  }
}
