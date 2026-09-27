import crypto from 'crypto';
import { env } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKeyBuffer(): Buffer {
  const key = env.PHONE_ENCRYPTION_KEY;
  if (/^[0-9a-fA-F]{64}$/.test(key)) {
    return Buffer.from(key, 'hex');
  }
  return crypto.createHash('sha256').update(key).digest();
}

/**
 * Calculates Cosine Similarity between two mathematical face vectors.
 * Returns a value between -1.0 and 1.0 (identical vectors yield ~1.0).
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Calculates Euclidean Distance between two vectors.
 */
export function euclideanDistance(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
    return Infinity;
  }

  let sum = 0;
  for (let i = 0; i < vecA.length; i++) {
    const diff = vecA[i] - vecB[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Encrypts a float array embedding using AES-256-GCM.
 * Never stores raw faces or unencrypted biometric data.
 */
export function encryptFaceEmbedding(embedding: number[]): string {
  const jsonStr = JSON.stringify(embedding);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKeyBuffer();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  let encrypted = cipher.update(jsonStr, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts AES-256-GCM encrypted face embedding back into a float array.
 */
export function decryptFaceEmbedding(payload: string): number[] {
  if (!payload) return [];

  const parts = payload.split(':');
  if (parts.length !== 3) {
    try {
      return JSON.parse(payload);
    } catch {
      return [];
    }
  }

  const [ivHex, tagHex, encryptedText] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const key = getKeyBuffer();

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted);
}

const LIVENESS_ACTIONS = [
  'TURN_HEAD_RIGHT',
  'TURN_HEAD_LEFT',
  'BLINK_EYES',
  'NOD_HEAD',
  'SMILE',
] as const;

export type LivenessAction = (typeof LIVENESS_ACTIONS)[number];

const livenessChallenges = new Map<string, { action: LivenessAction; expiresAt: number }>();

/**
 * Generates an unpredictable cryptographic liveness challenge for client-side capture.
 */
export function createLivenessChallenge(): { challengeId: string; action: LivenessAction } {
  const challengeId = crypto.randomBytes(16).toString('hex');
  const randomIndex = Math.floor(Math.random() * LIVENESS_ACTIONS.length);
  const action = LIVENESS_ACTIONS[randomIndex];

  livenessChallenges.set(challengeId, {
    action,
    expiresAt: Date.now() + 2 * 60 * 1000, // 2 minutes expiry
  });

  return { challengeId, action };
}

/**
 * Validates the liveness challenge nonce.
 */
export function verifyLivenessChallenge(challengeId: string): boolean {
  if (!challengeId) return false;
  const challenge = livenessChallenges.get(challengeId);
  if (!challenge) return false;

  livenessChallenges.delete(challengeId);
  return Date.now() <= challenge.expiresAt;
}
