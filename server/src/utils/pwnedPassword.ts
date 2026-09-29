import crypto from 'crypto';
import https from 'https';

export interface PwnedCheckResult {
  isPwned: boolean;
  count: number;
}

/**
 * Checks a candidate password against the Have I Been Pwned (HIBP) database
 * using mathematical k-Anonymity.
 *
 * Privacy Guarantee:
 * - The plaintext password is NEVER sent over the network.
 * - Only the first 5 characters of the SHA-1 hash (prefix) are queried.
 * - The server returns candidate suffix hashes; matching occurs locally in memory.
 */
export async function checkPwnedPassword(password: string): Promise<PwnedCheckResult> {
  if (!password) {
    return { isPwned: false, count: 0 };
  }

  // Calculate SHA-1 hash in uppercase hex
  const sha1Hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
  const prefix = sha1Hash.substring(0, 5);
  const suffix = sha1Hash.substring(5);

  return new Promise((resolve) => {
    const url = `https://api.pwnedpasswords.com/range/${prefix}`;

    const request = https.get(
      url,
      {
        headers: {
          'User-Agent': 'Tiger-CRM-Enterprise-Security-Checker/2.0',
        },
        timeout: 2500, // 2.5 seconds timeout
      },
      (res) => {
        if (res.statusCode !== 200) {
          // If HIBP is degraded, fail open so legitimate users aren't locked out
          console.warn(`[HIBP] Upstream API returned status ${res.statusCode}, failing open.`);
          return resolve({ isPwned: false, count: 0 });
        }

        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });

        res.on('end', () => {
          try {
            const lines = rawData.split('\r\n');
            for (const line of lines) {
              const [lineSuffix, countStr] = line.split(':');
              if (lineSuffix && lineSuffix.trim() === suffix) {
                const count = parseInt(countStr.trim(), 10) || 1;
                return resolve({ isPwned: true, count });
              }
            }
            resolve({ isPwned: false, count: 0 });
          } catch (err) {
            console.warn('[HIBP] Error parsing response:', err);
            resolve({ isPwned: false, count: 0 });
          }
        });
      }
    );

    request.on('timeout', () => {
      request.destroy();
      console.warn('[HIBP] Request timed out. Failing open to allow operation.');
      resolve({ isPwned: false, count: 0 });
    });

    request.on('error', (err) => {
      console.warn('[HIBP] Network unreachable or offline:', err.message);
      // Fail open in disconnected/local dev environment
      resolve({ isPwned: false, count: 0 });
    });
  });
}
