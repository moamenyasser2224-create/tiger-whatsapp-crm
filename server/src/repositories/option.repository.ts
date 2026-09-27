import { prisma } from '../config/prisma.js';
import type { ListOption } from '@prisma/client';

export class OptionRepository {
  async findAll(type?: string): Promise<ListOption[]> {
    return prisma.listOption.findMany({
      where: type ? { type } : undefined,
      orderBy: { order: 'asc' },
    });
  }

  async findById(id: string): Promise<ListOption | null> {
    return prisma.listOption.findUnique({
      where: { id },
    });
  }

  async create(data: {
    type: string;
    label: string;
    order?: number;
    isDefault?: boolean;
  }): Promise<ListOption> {
    const maxOrder = await prisma.listOption.aggregate({
      where: { type: data.type },
      _max: { order: true },
    });

    const nextOrder = data.order !== undefined ? data.order : (maxOrder._max.order ?? -1) + 1;

    return prisma.listOption.create({
      data: {
        type: data.type,
        label: data.label,
        order: nextOrder,
        isDefault: data.isDefault ?? false,
      },
    });
  }

  async update(id: string, data: { label?: string; order?: number }): Promise<ListOption> {
    return prisma.listOption.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<ListOption> {
    return prisma.listOption.delete({
      where: { id },
    });
  }
}
