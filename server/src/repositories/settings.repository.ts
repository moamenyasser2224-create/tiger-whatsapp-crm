import { prisma } from '../config/prisma.js';
import type { Settings } from '@prisma/client';

export class SettingsRepository {
  async get(): Promise<Settings> {
    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          orgName: 'تايجر CRM',
        },
      });
    }
    return settings;
  }

  async update(orgName: string): Promise<Settings> {
    const current = await this.get();
    return prisma.settings.update({
      where: { id: current.id },
      data: { orgName },
    });
  }
}
