import { startAbsenceCronJob } from './absence.job.js';
import { initBiometricPurgeJob } from './biometricPurge.job.js';

export function initBackgroundJobs(): void {
  // 1. Daily absence and unexcused penalty detection job (Runs 23:55)
  startAbsenceCronJob();

  // 2. Daily automated biometric purge job (Runs 03:30)
  initBiometricPurgeJob();

  console.log('⏳ [Background Tasks] Automated Absence and Biometric Purge jobs active.');
}
