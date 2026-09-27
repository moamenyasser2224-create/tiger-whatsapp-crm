import { OptionRepository } from '../repositories/option.repository.js';
import { CustomError } from '../middlewares/errorHandler.js';

const optionRepository = new OptionRepository();

export class OptionService {
  async getAll(type?: string) {
    return optionRepository.findAll(type);
  }

  async create(data: { type: string; label: string; order?: number }) {
    if (!['source', 'status'].includes(data.type)) {
      throw new CustomError('نوع القائمة غير صالح (يجب أن يكون source أو status)', 400);
    }
    const trimmed = (data.label || '').trim();
    if (!trimmed) {
      throw new CustomError('اسم الخيار مطلوب', 400);
    }

    return optionRepository.create({
      type: data.type,
      label: trimmed,
      order: data.order,
    });
  }

  async update(id: string, data: { label?: string; order?: number }) {
    const existing = await optionRepository.findById(id);
    if (!existing) {
      throw new CustomError('الخيار المطلوب غير موجود', 404);
    }

    return optionRepository.update(id, {
      label: data.label?.trim(),
      order: data.order,
    });
  }

  async delete(id: string) {
    const existing = await optionRepository.findById(id);
    if (!existing) {
      throw new CustomError('الخيار المطلوب غير موجود', 404);
    }

    return optionRepository.delete(id);
  }
}
