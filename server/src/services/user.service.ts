import bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/user.repository.js';
import { CustomerRepository } from '../repositories/customer.repository.js';
import { TemplateRepository } from '../repositories/template.repository.js';
import { AuditRepository } from '../repositories/audit.repository.js';
import { decryptPhone } from '../utils/crypto.js';
import { CustomError } from '../middlewares/errorHandler.js';

const userRepository = new UserRepository();
const customerRepository = new CustomerRepository();
const templateRepository = new TemplateRepository();
const auditRepository = new AuditRepository();

export class UserService {
  async exportAllUserData(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new CustomError('المستخدم غير موجود', 404);

    const rawCustomers = await customerRepository.getAllForExport(userId);
    const customers = rawCustomers.map((c) => ({
      ...c,
      phone: decryptPhone(c.phone),
    }));

    const templates = await templateRepository.findAllByUserId(userId);
    const auditLogs = await auditRepository.getRecentLogs(userId, 500);

    await auditRepository.log({
      userId,
      action: 'EXPORT_ALL_USER_DATA',
      entity: 'USER',
      entityId: userId,
    });

    return {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      customers,
      templates,
      auditLogs,
    };
  }

  async deleteAccount(userId: string, passwordConfirm: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new CustomError('المستخدم غير موجود', 404);

    const isMatch = await bcrypt.compare(passwordConfirm, user.password);
    if (!isMatch) {
      throw new CustomError('كلمة المرور غير صحيحة، تم إلغاء عملية حذف الحساب', 400);
    }

    await userRepository.permanentDelete(userId);
  }
}
