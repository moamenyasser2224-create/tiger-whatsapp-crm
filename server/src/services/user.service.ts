import crypto from 'crypto';
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

const BCRYPT_COST = 12;

export class UserService {
  /**
   * Admin-only: Creates an employee account with auto-generated temporary password
   */
  async createEmployee(
    adminId: string,
    data: { name: string; email: string; ipAddress?: string; userAgent?: string }
  ) {
    const normalizedEmail = data.email.toLowerCase().trim();
    const existing = await userRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw new CustomError('Email is already registered in the system', 400);
    }

    // Generate random secure temporary password
    const randPart = crypto.randomBytes(4).toString('hex');
    const temporaryPassword = `Tiger@${randPart}1A!`;

    const hashedPassword = await bcrypt.hash(temporaryPassword, BCRYPT_COST);

    const user = await userRepository.create({
      name: data.name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'employee',
      mustChangePassword: true, // Forces password change on first login
    });

    // Auto-seed default WhatsApp message templates
    await templateRepository.createDefaultTemplates(user.id);

    await auditRepository.log({
      userId: adminId,
      action: 'EMPLOYEE_CREATED',
      entity: 'USER',
      entityId: user.id,
      details: { email: user.email, name: user.name },
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });

    return {
      success: true,
      message: 'Employee account created successfully with a temporary password',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: true,
      },
      temporaryPassword,
    };
  }

  /**
   * Admin-only: Lists all workspace employees and admins
   */
  async listEmployees() {
    const users = await userRepository.listEmployees();
    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      photoUrl: u.photoUrl,
      hasFaceEnrolled: !!u.faceEmbedding,
      faceEnrolledAt: u.faceEnrolledAt,
      biometricConsent: u.biometricConsent,
      mustChangePassword: u.mustChangePassword,
      createdAt: u.createdAt,
    }));
  }

  /**
   * Updates user's personal profile photo URL / Avatar
   */
  async updateProfilePhoto(
    userId: string,
    photoUrl: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const user = await userRepository.findById(userId);
    if (!user) throw new CustomError('User not found', 404);

    await userRepository.update(userId, { photoUrl });

    await auditRepository.log({
      userId,
      action: 'PROFILE_PHOTO_UPDATED',
      entity: 'USER',
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'Profile photo updated successfully',
      photoUrl,
    };
  }

  async exportAllUserData(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new CustomError('User not found', 404);

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
    if (!user) throw new CustomError('User not found', 404);

    const isMatch = await bcrypt.compare(passwordConfirm, user.password);
    if (!isMatch) {
      throw new CustomError('Incorrect password, account deletion cancelled', 400);
    }

    await userRepository.permanentDelete(userId);
  }
}
