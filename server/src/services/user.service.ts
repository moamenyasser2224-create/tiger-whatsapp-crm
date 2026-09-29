import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/user.repository.js';
import { CustomerRepository } from '../repositories/customer.repository.js';
import { TemplateRepository } from '../repositories/template.repository.js';
import { AuditRepository } from '../repositories/audit.repository.js';
import { decryptPhone } from '../utils/crypto.js';
import { CustomError } from '../middlewares/errorHandler.js';
import { prisma } from '../config/prisma.js';
import { emailService } from './email.service.js';

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

    // Dispatch temporary credentials email (with mock/dev fallback)
    emailService.sendTemporaryCredentials(user.email, temporaryPassword, user.name)
      .catch((err) => console.error('Failed to dispatch welcome email:', err.message));

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

  /**
   * Admin-only: Retrieves comprehensive employee onboarding progress
   */
  async getOnboardingStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        workSchedules: true,
        messageTemplates: true,
      },
    });
    if (!user) throw new CustomError('Employee not found', 404);

    const checklist = [
      {
        id: 'account_created',
        title: 'User Account Provisioned',
        completed: true,
        description: 'Account created with secure hashed credentials and individual tenant ID',
      },
      {
        id: 'templates_seeded',
        title: 'WhatsApp Message Templates',
        completed: user.messageTemplates.length >= 5,
        description: `${user.messageTemplates.length} default WhatsApp message templates configured`,
      },
      {
        id: 'shifts_assigned',
        title: 'Work Schedule & Shifts',
        completed: user.workSchedules.length > 0,
        description: user.workSchedules.length > 0 ? `${user.workSchedules.length} working days scheduled` : 'No shifts assigned yet',
      },
      {
        id: 'biometric_consent',
        title: 'Voluntary Biometric Declaration',
        completed: user.biometricConsent || !!user.faceEmbedding,
        status: user.faceEmbedding ? 'enrolled' : (user.biometricConsent ? 'consented_pending_scan' : 'opted_out_or_pending'),
        description: user.faceEmbedding ? 'Facial geometry enrolled and encrypted' : (user.biometricConsent ? 'Consent recorded, pending first scan' : 'Non-biometric alternative active (100% voluntary)'),
      },
      {
        id: 'password_reset_on_login',
        title: 'Initial Security Password Change',
        completed: !user.mustChangePassword,
        description: user.mustChangePassword ? 'Pending first login password change' : 'Temporary password rotated by employee',
      },
      {
        id: 'two_factor_auth',
        title: 'Two-Factor Authentication (2FA)',
        completed: user.isTwoFactorEnabled,
        description: user.isTwoFactorEnabled ? 'TOTP authenticator active' : 'Recommended for privileged staff',
      },
    ];

    const completedCount = checklist.filter((item) => item.completed).length;

    return {
      success: true,
      employee: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      progressPercent: Math.round((completedCount / checklist.length) * 100),
      checklist,
    };
  }

  /**
   * Admin-only: Offboards an employee, reassigns their active leads/customers to a successor,
   * invalidates all active sessions immediately, and schedules biometric purge after 24h grace period.
   */
  async offboardEmployee(
    adminId: string,
    employeeId: string,
    data: { successorUserId: string; reason?: string; note?: string; ipAddress?: string; userAgent?: string }
  ) {
    if (adminId === employeeId) {
      throw new CustomError('Administrators cannot offboard their own active account', 400);
    }

    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
    });
    if (!employee || employee.deletedAt) {
      throw new CustomError('Employee not found or already offboarded', 404);
    }

    const successor = await prisma.user.findUnique({
      where: { id: data.successorUserId },
    });
    if (!successor || successor.deletedAt || successor.id === employeeId) {
      throw new CustomError('Invalid successor: successor must be an active team member', 400);
    }

    // Atomic transaction: Reassign all customer leads, kill sessions, and soft-delete user
    const result = await prisma.$transaction(async (tx) => {
      // 1. Count customers before update
      const customerCount = await tx.customer.count({
        where: { userId: employeeId, deletedAt: null },
      });

      // 2. Reassign all customers to successor
      if (customerCount > 0) {
        await tx.customer.updateMany({
          where: { userId: employeeId },
          data: { userId: data.successorUserId },
        });
      }

      // 3. Immediately invalidate all active refresh tokens (Session Kill)
      await tx.refreshToken.updateMany({
        where: { userId: employeeId, revoked: false },
        data: { revoked: true },
      });

      // 4. Mark employee as deleted (triggers 24h biometric purge job)
      const updatedUser = await tx.user.update({
        where: { id: employeeId },
        data: {
          deletedAt: new Date(),
        },
      });

      // 5. Audit log entry
      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: 'EMPLOYEE_OFFBOARDED',
          entity: 'USER',
          entityId: employeeId,
          details: JSON.stringify({
            offboardedEmail: employee.email,
            offboardedName: employee.name,
            successorUserId: successor.id,
            successorName: successor.name,
            customersReassigned: customerCount,
            reason: data.reason || 'Standard offboarding',
            note: data.note || '',
            biometricPurgeScheduled: true,
          }),
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });

      return { customerCount, updatedUser };
    });

    // Notify successor via email if SMTP is configured
    emailService.sendOffboardingNotice(successor.email, {
      employeeName: employee.name,
      reassignedCount: result.customerCount,
      successorName: successor.name,
    }).catch((err) => console.error('Failed to dispatch offboarding email:', err.message));

    return {
      success: true,
      message: `Employee ${employee.name} offboarded successfully. ${result.customerCount} customers reassigned to ${successor.name}. Sessions revoked immediately; biometrics queued for purge.`,
      offboardedUser: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
      },
      successor: {
        id: successor.id,
        name: successor.name,
        email: successor.email,
      },
      customersReassigned: result.customerCount,
    };
  }
}
