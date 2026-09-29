import cron from 'node-cron';
import { prisma } from '../config/prisma.js';
import { AuditRepository } from '../repositories/audit.repository.js';

const auditRepository = new AuditRepository();

/**
 * Automated Biometric Vector Purge Job (Enterprise Defense in Depth & DPIA Compliance)
 *
 * Purge Criteria:
 * 1. Terminated / offboarded employees (deletedAt is set, and >24 hours have elapsed).
 * 2. Active employees who revoked biometric consent (biometricConsent === false, and >24 hours have elapsed since revocation or enrollment).
 *
 * Actions:
 * - Permanently nullifies faceEmbedding mathematical vector.
 * - Nullifies faceEnrolledAt timestamp.
 * - Records an immutable audit log entry for regulatory and GDPR compliance without storing biometric vectors.
 */
export async function runBiometricPurgeJob(): Promise<{
  purgedOffboarded: number;
  purgedConsentRevoked: number;
  totalPurged: number;
}> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  let purgedOffboarded = 0;
  let purgedConsentRevoked = 0;

  // 1. Offboarded/Terminated Employees with lingering biometric embeddings past the 24h grace period
  const offboardedUsers = await prisma.user.findMany({
    where: {
      deletedAt: {
        lte: twentyFourHoursAgo,
      },
      faceEmbedding: {
        not: null,
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      deletedAt: true,
    },
  });

  for (const user of offboardedUsers) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        faceEmbedding: null,
        faceEnrolledAt: null,
      },
    });

    await auditRepository.log({
      userId: user.id,
      action: 'BIOMETRIC_PURGE_AUTOMATED',
      entity: 'USER_BIOMETRICS',
      entityId: user.id,
      details: {
        reason: 'EMPLOYEE_OFFBOARDED_24H_GRACE_EXPIRED',
        offboardedAt: user.deletedAt?.toISOString(),
        purgedAt: new Date().toISOString(),
        compliance: 'DPIA_MANDATORY_PURGE',
      },
    });

    purgedOffboarded++;
  }

  // 2. Employees who revoked biometric consent >24 hours ago
  const consentRevokedUsers = await prisma.user.findMany({
    where: {
      biometricConsent: false,
      faceEmbedding: {
        not: null,
      },
      updatedAt: {
        lte: twentyFourHoursAgo,
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  for (const user of consentRevokedUsers) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        faceEmbedding: null,
        faceEnrolledAt: null,
      },
    });

    await auditRepository.log({
      userId: user.id,
      action: 'BIOMETRIC_PURGE_AUTOMATED',
      entity: 'USER_BIOMETRICS',
      entityId: user.id,
      details: {
        reason: 'BIOMETRIC_CONSENT_REVOKED_24H_GRACE_EXPIRED',
        purgedAt: new Date().toISOString(),
        compliance: 'GDPR_RIGHT_TO_ERASURE',
      },
    });

    purgedConsentRevoked++;
  }

  const totalPurged = purgedOffboarded + purgedConsentRevoked;
  if (totalPurged > 0) {
    console.log(
      `🧹 [Biometric Purge Job] Successfully purged biometric vectors: ${totalPurged} (${purgedOffboarded} offboarded, ${purgedConsentRevoked} consent revoked)`
    );
  }

  return {
    purgedOffboarded,
    purgedConsentRevoked,
    totalPurged,
  };
}

/**
 * Initializes the automated biometric purge schedule:
 * Runs daily at 03:30 AM (server local time)
 */
export function initBiometricPurgeJob(): void {
  cron.schedule('30 3 * * *', async () => {
    try {
      await runBiometricPurgeJob();
    } catch (err) {
      console.error('❌ [Biometric Purge Job] Execution failed:', err);
    }
  });
}

