import { TemplateRepository } from '../repositories/template.repository.js';
import { AuditRepository } from '../repositories/audit.repository.js';
import { DEFAULT_MESSAGE_TEMPLATES, type CustomerStatus } from '../config/constants.js';
import { CustomError } from '../middlewares/errorHandler.js';

const templateRepository = new TemplateRepository();
const auditRepository = new AuditRepository();

export class TemplateService {
  async getTemplates(userId: string) {
    let templates = await templateRepository.findAllByUserId(userId);

    // If for any reason user has no templates, auto-seed defaults
    if (templates.length === 0) {
      await templateRepository.createDefaultTemplates(userId);
      templates = await templateRepository.findAllByUserId(userId);
    }

    return templates;
  }

  async getTemplateByStatus(userId: string, status: string) {
    let template = await templateRepository.findByStatus(userId, status);

    if (!template) {
      const defaultBody = DEFAULT_MESSAGE_TEMPLATES[status as CustomerStatus] || 'Hello {name}!';
      template = await templateRepository.upsert(userId, status, defaultBody);
    }

    return template;
  }

  async updateTemplate(
    userId: string,
    status: string,
    body: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    if (!body.includes('{name}')) {
      throw new CustomError('The message body must include the {name} placeholder', 400);
    }

    const updated = await templateRepository.upsert(userId, status, body.trim());

    await auditRepository.log({
      userId,
      action: 'UPDATE_TEMPLATE',
      entity: 'TEMPLATE',
      entityId: updated.id,
      details: { status, body: updated.body },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return updated;
  }

  async resetTemplateToDefault(
    userId: string,
    status: CustomerStatus,
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    const defaultBody = DEFAULT_MESSAGE_TEMPLATES[status];
    if (!defaultBody) {
      throw new CustomError('Invalid status specified', 400);
    }

    const reset = await templateRepository.upsert(userId, status, defaultBody);

    await auditRepository.log({
      userId,
      action: 'RESET_TEMPLATE_DEFAULT',
      entity: 'TEMPLATE',
      entityId: reset.id,
      details: { status },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return reset;
  }

  /**
   * Helper to format a template by replacing {name} placeholder with customer name
   */
  async formatMessage(userId: string, status: string, customerName: string): Promise<string> {
    const template = await this.getTemplateByStatus(userId, status);
    return template.body.replace(/\{name\}/g, customerName || 'Customer');
  }
}
