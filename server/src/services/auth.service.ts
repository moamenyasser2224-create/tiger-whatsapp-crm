import bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/user.repository.js';
import { TokenRepository } from '../repositories/token.repository.js';
import { TemplateRepository } from '../repositories/template.repository.js';
import { AuditRepository } from '../repositories/audit.repository.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  generatePasswordResetToken,
} from '../utils/tokens.js';
import {
  generateTotpSecret,
  generateTotpUri,
  generateQrCodeDataUrl,
  verifyTotpToken,
} from '../utils/totp.js';
import { CustomError } from '../middlewares/errorHandler.js';
import {
  REFRESH_TOKEN_EXPIRY_DAYS,
  PASSWORD_RESET_EXPIRY_MINUTES,
} from '../config/constants.js';
import { env } from '../config/env.js';

const userRepository = new UserRepository();
const tokenRepository = new TokenRepository();
const templateRepository = new TemplateRepository();
const auditRepository = new AuditRepository();

const BCRYPT_COST = 12;

interface FailedAttempt {
  count: number;
  lockedUntil?: Date;
}
const failedLogins = new Map<string, FailedAttempt>();

export class AuthService {
  async register(data: { name: string; email: string; password: string; ipAddress?: string; userAgent?: string }) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new CustomError('البريد الإلكتروني مسجل مسبقاً في النظام', 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, BCRYPT_COST);

    const user = await userRepository.create({
      name: data.name,
      email: data.email.toLowerCase().trim(),
      password: hashedPassword,
    });

    // Auto-seed the 5 default customizable message templates for this user
    await templateRepository.createDefaultTemplates(user.id);

    // Create Refresh Token
    const { token: rawRefreshToken, hash: tokenHash } = generateRefreshToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await tokenRepository.createRefreshToken(user.id, tokenHash, expiresAt);

    const accessToken = generateAccessToken({ userId: user.id, email: user.email });

    await auditRepository.log({
      userId: user.id,
      action: 'REGISTER',
      entity: 'USER',
      entityId: user.id,
      details: { email: user.email },
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
      },
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  async login(data: { email: string; password: string; twoFactorCode?: string; ipAddress?: string; userAgent?: string }) {
    const normalizedEmail = data.email.toLowerCase().trim();
    const attemptKey = `${normalizedEmail}_${data.ipAddress || 'unknown'}`;
    const record = failedLogins.get(attemptKey);

    if (record?.lockedUntil && new Date() < record.lockedUntil) {
      const remainingMins = Math.ceil((record.lockedUntil.getTime() - Date.now()) / (60 * 1000));
      throw new CustomError(
        `تم تجميد الحساب مؤقتاً لمدة ${remainingMins} دقيقة لحماية الأمان بعد محاولات فاشلة متكررة (حماية سحابية)`,
        429
      );
    }

    const user = await userRepository.findByEmail(normalizedEmail);
    if (!user) {
      this.recordFailedLogin(attemptKey, normalizedEmail, data.ipAddress, data.userAgent);
      throw new CustomError('البريد الإلكتروني أو كلمة المرور غير صحيحة', 401);
    }

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      this.recordFailedLogin(attemptKey, normalizedEmail, data.ipAddress, data.userAgent, user.id);
      throw new CustomError('البريد الإلكتروني أو كلمة المرور غير صحيحة', 401);
    }

    // Reset failed login counter on success
    failedLogins.delete(attemptKey);

    // Check 2FA
    if (user.isTwoFactorEnabled) {
      if (!data.twoFactorCode) {
        return {
          requires2FA: true,
          userId: user.id,
        };
      }

      if (!user.twoFactorSecret) {
        throw new CustomError('فشل في إعدادات التحقق الثنائي', 500);
      }

      const isValidTotp = verifyTotpToken(data.twoFactorCode, user.twoFactorSecret);
      if (!isValidTotp) {
        throw new CustomError('رمز التحقق الثنائي غير صحيح أو انتهت صلاحيته', 401);
      }
    }

    // Generate tokens
    const { token: rawRefreshToken, hash: tokenHash } = generateRefreshToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await tokenRepository.createRefreshToken(user.id, tokenHash, expiresAt);

    const accessToken = generateAccessToken({ userId: user.id, email: user.email });

    await auditRepository.log({
      userId: user.id,
      action: 'LOGIN',
      entity: 'AUTH',
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });

    return {
      requires2FA: false,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
      },
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  private recordFailedLogin(attemptKey: string, email: string, ipAddress?: string, userAgent?: string, userId?: string) {
    const record = failedLogins.get(attemptKey);
    const count = (record?.count || 0) + 1;

    if (count >= 5) {
      failedLogins.set(attemptKey, {
        count,
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000), // 15 mins lockout
      });
    } else {
      failedLogins.set(attemptKey, { count });
    }

    if (userId) {
      auditRepository
        .log({
          userId,
          action: 'LOGIN_FAILED' as any,
          entity: 'AUTH',
          ipAddress,
          userAgent,
          details: { email, attemptCount: count },
        })
        .catch(() => {});
    }
  }

  async refreshToken(rawRefreshToken: string) {
    if (!rawRefreshToken) {
      throw new CustomError('رمز التحديث غير موجود', 401);
    }

    const tokenHash = hashToken(rawRefreshToken);
    const tokenRecord = await tokenRepository.findRefreshToken(tokenHash);

    if (!tokenRecord || tokenRecord.revoked || new Date() > tokenRecord.expiresAt) {
      throw new CustomError('انتهت صلاحية جلسة العمل، يرجى تسجيل الدخول مجددًا', 401);
    }

    const user = await userRepository.findById(tokenRecord.userId);
    if (!user) {
      throw new CustomError('المستخدم غير موجود', 401);
    }

    // Rotate refresh token
    await tokenRepository.revokeRefreshToken(tokenHash);

    const { token: newRawRefreshToken, hash: newTokenHash } = generateRefreshToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await tokenRepository.createRefreshToken(user.id, newTokenHash, expiresAt);
    const accessToken = generateAccessToken({ userId: user.id, email: user.email });

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
      },
    };
  }

  async logout(rawRefreshToken?: string, userId?: string) {
    if (rawRefreshToken) {
      const tokenHash = hashToken(rawRefreshToken);
      await tokenRepository.revokeRefreshToken(tokenHash);
    }
    if (userId) {
      await auditRepository.log({
        userId,
        action: 'LOGOUT',
        entity: 'AUTH',
      });
    }
  }

  async forgotPassword(email: string) {
    const user = await userRepository.findByEmail(email);
    // Silent return to prevent user enumeration
    if (!user) {
      return { success: true, message: 'إذا كان البريد مسجلاً، فقد تم إرسال رابط استعادة كلمة المرور' };
    }

    const { token: rawToken, hash: tokenHash } = generatePasswordResetToken();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + PASSWORD_RESET_EXPIRY_MINUTES);

    await tokenRepository.createPasswordResetToken(user.id, tokenHash, expiresAt);

    const resetLink = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`;

    await auditRepository.log({
      userId: user.id,
      action: 'FORGOT_PASSWORD_REQUEST',
      entity: 'AUTH',
    });

    return {
      success: true,
      message: 'إذا كان البريد مسجلاً، فقد تم إرسال رابط استعادة كلمة المرور',
      resetLink: env.NODE_ENV !== 'production' ? resetLink : undefined, // Exposed in dev/test for convenience
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = hashToken(token);
    const resetRecord = await tokenRepository.findPasswordResetToken(tokenHash);

    if (!resetRecord || resetRecord.used || new Date() > resetRecord.expiresAt) {
      throw new CustomError('رابط إعادة التعيين غير صالح أو انتهت صلاحيته (صالح لـ 15 دقيقة فقط)', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_COST);

    await userRepository.update(resetRecord.userId, {
      password: hashedPassword,
    });

    await tokenRepository.markPasswordResetTokenUsed(tokenHash);
    // Revoke all existing sessions for security
    await tokenRepository.revokeAllUserRefreshTokens(resetRecord.userId);

    await auditRepository.log({
      userId: resetRecord.userId,
      action: 'RESET_PASSWORD_SUCCESS',
      entity: 'AUTH',
    });

    return { success: true, message: 'تم تغيير كلمة المرور بنجاح. يرجى تسجيل الدخول.' };
  }

  async generate2FASetup(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new CustomError('المستخدم غير موجود', 404);

    const secret = generateTotpSecret();
    const otpAuthUrl = generateTotpUri(user.email, secret);
    const qrCodeDataUrl = await generateQrCodeDataUrl(otpAuthUrl);

    return {
      secret,
      qrCodeDataUrl,
    };
  }

  async enable2FA(userId: string, code: string, secret: string) {
    const isValid = verifyTotpToken(code, secret);
    if (!isValid) {
      throw new CustomError('رمز التحقق غير صحيح، يرجى إعادة المحاولة', 400);
    }

    await userRepository.update(userId, {
      twoFactorSecret: secret,
      isTwoFactorEnabled: true,
    });

    await auditRepository.log({
      userId,
      action: 'ENABLE_2FA',
      entity: 'USER',
    });

    return { success: true, message: 'تم تفعيل التحقق الثنائي بنجاح' };
  }

  async disable2FA(userId: string, password: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new CustomError('المستخدم غير موجود', 404);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new CustomError('كلمة المرور غير صحيحة', 400);
    }

    await userRepository.update(userId, {
      twoFactorSecret: null,
      isTwoFactorEnabled: false,
    });

    await auditRepository.log({
      userId,
      action: 'DISABLE_2FA',
      entity: 'USER',
    });

    return { success: true, message: 'تم إلغاء تفعيل التحقق الثنائي' };
  }
}
