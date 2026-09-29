import { SettingsRepository } from '../repositories/settings.repository.js';
import { CustomError } from '../middlewares/errorHandler.js';

const settingsRepository = new SettingsRepository();

export class SettingsService {
  async getSettings() {
    return settingsRepository.get();
  }

  async updateSettings(orgName: string) {
    const trimmed = (orgName || '').trim();
    if (!trimmed) {
      throw new CustomError('Organization name cannot be empty', 400);
    }
    return settingsRepository.update(trimmed);
  }
}
