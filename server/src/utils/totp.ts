import { authenticator } from 'otplib';
import QRCode from 'qrcode';

// Configure authenticator
authenticator.options = {
  window: 1, // Allow 1 step backward/forward for slight clock drift
};

/**
 * Generates a new TOTP secret for a user
 */
export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

/**
 * Generates an otpauth URL for Google Authenticator / 1Password / Authy
 */
export function generateTotpUri(userEmail: string, secret: string, appName = 'Tiger'): string {
  return authenticator.keyuri(userEmail, appName, secret);
}

/**
 * Generates a Data URL QR Code image from TOTP URI
 */
export async function generateQrCodeDataUrl(otpAuthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpAuthUrl, {
    margin: 2,
    width: 256,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}

/**
 * Verifies a TOTP code against the secret
 */
export function verifyTotpToken(token: string, secret: string): boolean {
  return authenticator.verify({
    token,
    secret,
  });
}
