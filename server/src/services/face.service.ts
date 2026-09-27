import { UserRepository } from '../repositories/user.repository.js';
import { AuditRepository } from '../repositories/audit.repository.js';
import { AttendanceService } from './attendance.service.js';
import { CustomError } from '../middlewares/errorHandler.js';
import {
  cosineSimilarity,
  encryptFaceEmbedding,
  decryptFaceEmbedding,
  createLivenessChallenge,
  verifyLivenessChallenge,
} from '../utils/faceMath.js';

const userRepository = new UserRepository();
const auditRepository = new AuditRepository();
const attendanceService = new AttendanceService();

const MATCH_THRESHOLD = 0.85; // 85% cosine similarity required

export class FaceService {
  /**
   * Issues a random liveness challenge for client-side capture
   */
  getLivenessChallenge() {
    return createLivenessChallenge();
  }

  /**
   * Enrolls a user's face embedding after explicit legal biometric consent
   */
  async enrollFace(
    userId: string,
    data: {
      embedding: number[];
      biometricConsent: boolean;
      ipAddress?: string;
      userAgent?: string;
    }
  ) {
    if (!data.biometricConsent) {
      throw new CustomError(
        'الموافقة البيومترية القانونية الصريحة إلزامية قبل تسجيل بصمة الوجه',
        400
      );
    }

    if (!Array.isArray(data.embedding) || data.embedding.length < 16) {
      throw new CustomError('بيانات متجه الوجه غير صالحة أو غير مكتملة', 400);
    }

    const user = await userRepository.findById(userId);
    if (!user) throw new CustomError('المستخدم غير موجود', 404);

    // Encrypt the mathematical vector with AES-256-GCM. Raw image is NEVER stored.
    const encryptedEmbedding = encryptFaceEmbedding(data.embedding);

    const now = new Date();
    await userRepository.update(userId, {
      faceEmbedding: encryptedEmbedding,
      faceEnrolledAt: now,
      biometricConsent: true,
      biometricConsentDate: now,
    });

    await auditRepository.log({
      userId,
      action: 'FACE_ENROLL_SUCCESS',
      entity: 'BIOMETRICS',
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      details: { dimensions: data.embedding.length },
    });

    return {
      success: true,
      message: 'تم تسجيل بصمة الوجه بنجاح وحفظها مشفرة وفق أعلى معايير الأمان',
      enrolledAt: now,
    };
  }

  /**
   * Verifies face against stored embedding for 2FA or Kiosk Attendance
   */
  async verifyFace(data: {
    userId?: string;
    email?: string;
    embedding: number[];
    challengeId?: string;
    isKioskAttendance?: boolean;
    ipAddress?: string;
    userAgent?: string;
  }) {
    if (!Array.isArray(data.embedding) || data.embedding.length < 16) {
      throw new CustomError('بيانات متجه الوجه غير صالحة', 400);
    }

    let user = null;
    if (data.userId) {
      user = await userRepository.findById(data.userId);
    } else if (data.email) {
      user = await userRepository.findByEmail(data.email);
    }

    if (!user) {
      throw new CustomError('المستخدم غير موجود', 404);
    }

    if (!user.faceEmbedding || !user.biometricConsent) {
      throw new CustomError(
        'لم يتم تسجيل بصمة الوجه لهذا الحساب مسبقاً أو تم إلغاء الموافقة البيومترية',
        400
      );
    }

    // Optional challenge verification
    if (data.challengeId) {
      const isChallengeValid = verifyLivenessChallenge(data.challengeId);
      if (!isChallengeValid) {
        throw new CustomError('تحدي كشف الحيوية منتهي الصلاحية أو غير صالح', 400);
      }
    }

    // Decrypt stored mathematical vector
    const storedVector = decryptFaceEmbedding(user.faceEmbedding);
    const similarity = cosineSimilarity(storedVector, data.embedding);

    if (similarity < MATCH_THRESHOLD) {
      await auditRepository.log({
        userId: user.id,
        action: 'FACE_VERIFY_FAILED',
        entity: 'BIOMETRICS',
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        details: { score: Math.round(similarity * 100) },
      });

      throw new CustomError(
        'فشل التحقق من تطابق بصمة الوجه، درجة التطابق غير كافية',
        401
      );
    }

    // Match confirmed on server
    await auditRepository.log({
      userId: user.id,
      action: 'FACE_VERIFY_SUCCESS',
      entity: 'BIOMETRICS',
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      details: {
        score: Math.round(similarity * 100),
        isKioskAttendance: !!data.isKioskAttendance,
      },
    });

    let attendanceResult = null;
    if (data.isKioskAttendance) {
      // Toggle attendance (check in or check out automatically)
      try {
        const todayAttendance = await attendanceService.getMyStatus(user.id);
        if (!todayAttendance || !todayAttendance.checkIn) {
          attendanceResult = await attendanceService.checkIn(user.id, data.ipAddress, data.userAgent);
        } else if (!todayAttendance.checkOut) {
          attendanceResult = await attendanceService.checkOut(user.id, data.ipAddress, data.userAgent);
        } else {
          attendanceResult = { message: 'تم تسجيل الحضور والانصراف مسبقاً لهذا اليوم' };
        }
      } catch (err: any) {
        attendanceResult = { error: err.message };
      }
    }

    return {
      success: true,
      verified: true,
      matchScore: Math.round(similarity * 100),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        photoUrl: user.photoUrl,
        role: user.role,
      },
      attendance: attendanceResult,
    };
  }

  /**
   * Deletes face embedding and revokes biometric consent permanently
   */
  async deleteFaceData(userId: string, ipAddress?: string, userAgent?: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new CustomError('المستخدم غير موجود', 404);

    await userRepository.update(userId, {
      faceEmbedding: null,
      faceEnrolledAt: null,
      biometricConsent: false,
      biometricConsentDate: null,
    });

    await auditRepository.log({
      userId,
      action: 'FACE_DATA_DELETED',
      entity: 'BIOMETRICS',
      ipAddress,
      userAgent,
      details: { consentRevoked: true },
    });

    return {
      success: true,
      message: 'تم حذف بيانات بصمة الوجه وإلغاء الموافقة البيومترية نهائياً من قاعدة البيانات',
    };
  }
}
