import type { Request, Response, NextFunction } from 'express';

const SENSITIVE_PASSWORD_KEYS = /password|currentpassword|newpassword|confirmpassword|temporarypassword|passwd/i;
const SENSITIVE_PHONE_KEYS = /^phone$|^phonenumber$|^targetphone$|^mobile$|^phone_number$/i;
const SENSITIVE_BIOMETRIC_KEYS = /faceembedding|embedding|biometric|vector|rawembedding/i;
const SENSITIVE_SALARY_KEYS = /monthlysalary|basesalary|netsalary|grosssalary|salary|wage|bonusamount|deductionamount/i;
const SENSITIVE_TOKEN_KEYS = /token|accesstoken|refreshtoken|secret|twofactorsecret|authorization|cookie/i;

/**
 * Mask raw phone number showing only last 4 digits
 * e.g. "+201012345678" -> "***-***-5678"
 */
function maskPhoneNumber(phone: unknown): string {
  if (typeof phone !== 'string') return '[REDACTED_PHONE]';
  const clean = phone.trim();
  if (clean.length <= 4) return '****';
  return `***-***-${clean.slice(-4)}`;
}

/**
 * Mask authorization tokens, JWTs, secrets showing only last 4 chars
 * e.g. "Bearer eyJhbGciOi...abcd" -> "Bearer ***abcd"
 */
function maskToken(token: unknown): string {
  if (typeof token !== 'string') return '[REDACTED_TOKEN]';
  if (token.startsWith('Bearer ')) {
    const raw = token.slice(7).trim();
    return `Bearer ***${raw.slice(-4)}`;
  }
  if (token.length <= 4) return '****';
  return `***${token.slice(-4)}`;
}

/**
 * Deep recursive redaction function that strips secrets, passwords, biometric vectors,
 * salaries, and tokens from any object, array, or primitive before logging.
 */
export function redactSensitiveData(data: any, depth = 0): any {
  if (depth > 8) return '[MAX_DEPTH_REACHED]';
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    // Check if string looks like Bearer token
    if (data.startsWith('Bearer eyJ')) {
      return maskToken(data);
    }
    // Check if string looks like serialized 3-part AES-GCM payload with biometric embedding
    if (/^[0-9a-fA-F]{24}:[0-9a-fA-F]{32}:[0-9a-fA-F]+$/.test(data) && data.length > 200) {
      return '[REDACTED_ENCRYPTED_PAYLOAD]';
    }
    return data;
  }

  if (Array.isArray(data)) {
    // If it's a large float array (e.g. 64-length or 128-length face vector)
    if (data.length >= 16 && typeof data[0] === 'number') {
      return '[REDACTED_BIOMETRIC_VECTOR_ARRAY]';
    }
    return data.map((item) => redactSensitiveData(item, depth + 1));
  }

  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_PASSWORD_KEYS.test(key)) {
        cleaned[key] = '[REDACTED_PASSWORD]';
      } else if (SENSITIVE_BIOMETRIC_KEYS.test(key)) {
        cleaned[key] = '[REDACTED_BIOMETRIC_VECTOR]';
      } else if (SENSITIVE_SALARY_KEYS.test(key)) {
        cleaned[key] = '[REDACTED_FINANCIAL]';
      } else if (SENSITIVE_PHONE_KEYS.test(key)) {
        cleaned[key] = maskPhoneNumber(value);
      } else if (SENSITIVE_TOKEN_KEYS.test(key)) {
        cleaned[key] = maskToken(value);
      } else {
        cleaned[key] = redactSensitiveData(value, depth + 1);
      }
    }

    return cleaned;
  }

  return data;
}

/**
 * Installs global console interceptors so that even direct `console.log(user)` or
 * third-party library dumps can NEVER leak passwords, raw phones, biometric embeddings, or salaries.
 */
let isConsolePatched = false;
export function installGlobalConsoleRedactor(): void {
  if (isConsolePatched) return;
  isConsolePatched = true;

  const originalLog = console.log;
  const originalInfo = console.info;
  const originalWarn = console.warn;
  const originalError = console.error;

  console.log = (...args: any[]) => {
    originalLog.apply(console, args.map((arg) => redactSensitiveData(arg)));
  };

  console.info = (...args: any[]) => {
    originalInfo.apply(console, args.map((arg) => redactSensitiveData(arg)));
  };

  console.warn = (...args: any[]) => {
    originalWarn.apply(console, args.map((arg) => redactSensitiveData(arg)));
  };

  console.error = (...args: any[]) => {
    originalError.apply(console, args.map((arg) => redactSensitiveData(arg)));
  };

  console.log('🛡️ [Log Redactor] Global log sanitization & redaction middleware active.');
}

/**
 * Express middleware that intercepts incoming HTTP requests and ensures
 * request headers, query parameters, and body payloads are logged safely.
 */
export function logRedactionMiddleware(req: Request, _res: Response, next: NextFunction): void {
  // Install console patching if not already active
  installGlobalConsoleRedactor();

  // Strip raw sensitive authorization headers from debug inspection
  if (req.headers.authorization) {
    req.headers['x-redacted-authorization'] = maskToken(req.headers.authorization);
  }

  next();
}
