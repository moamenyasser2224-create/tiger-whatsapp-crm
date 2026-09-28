import crypto from 'crypto';
import { env } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 12 bytes for GCM
const AUTH_TAG_LENGTH = 16;

/**
 * Derives a 32-byte Buffer from the PHONE_ENCRYPTION_KEY env string
 */
function getKeyBuffer(): Buffer {
  const key = env.PHONE_ENCRYPTION_KEY;
  if (/^[0-9a-fA-F]{64}$/.test(key)) {
    return Buffer.from(key, 'hex');
  }
  return crypto.createHash('sha256').update(key).digest();
}

/**
 * Normalizes phone numbers: removes '+', spaces, dashes, parentheses
 */
export function normalizePhone(rawPhone: string): string {
  if (!rawPhone) return '';
  return rawPhone.replace(/\D/g, '');
}

/**
 * Generates a SHA-256 hash of the normalized phone number
 * Used for database indexing and fast duplicate lookups without decrypting the whole table
 */
export function hashPhone(phone: string): string {
  const normalized = normalizePhone(phone);
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Encrypts phone number with AES-256-GCM
 * Output format: `iv:tag:encrypted` (hex encoded)
 */
export function encryptPhone(phone: string): string {
  const normalized = normalizePhone(phone);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKeyBuffer();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  let encrypted = cipher.update(normalized, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts phone number encrypted with AES-256-GCM
 */
export function decryptPhone(encryptedPayload: string): string {
  if (!encryptedPayload) return '';

  const parts = encryptedPayload.split(':');
  if (parts.length !== 3) {
    // If not encrypted in new format, return as is (fallback for plain text if any)
    return encryptedPayload;
  }

  const [ivHex, tagHex, encryptedText] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const key = getKeyBuffer();

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Encrypts employee monthly salary with AES-256-GCM
 */
export function encryptSalary(salary: string | number): string {
  const str = String(salary);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKeyBuffer();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  let encrypted = cipher.update(str, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts employee monthly salary
 */
export function decryptSalary(encryptedPayload: string | null | undefined): number {
  if (!encryptedPayload) return 0;

  try {
    const parts = encryptedPayload.split(':');
    if (parts.length !== 3) return 0;

    const [ivHex, tagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const key = getKeyBuffer();

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    const val = parseFloat(decrypted);
    return isNaN(val) ? 0 : val;
  } catch {
    return 0;
  }
}
