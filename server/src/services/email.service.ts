import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env.js';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initTransporter();
  }

  private initTransporter(): void {
    if (env.SMTP_HOST && env.SMTP_USER) {
      try {
        this.transporter = nodemailer.createTransport({
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          secure: env.SMTP_SECURE, // true for 465, false for other ports
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          },
        });
        this.isConfigured = true;
      } catch (err) {
        console.error('⚠️ [EmailService] Failed to initialize SMTP transporter:', err);
        this.transporter = null;
        this.isConfigured = false;
      }
    } else {
      this.isConfigured = false;
    }
  }

  /**
   * Core send method with fallback to structured console logging when SMTP is unconfigured.
   */
  async sendMail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; simulated?: boolean }> {
    const from = env.SMTP_FROM || 'Tiger Workspace <noreply@tigerworkspace.com>';

    if (this.isConfigured && this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from,
          to: options.to,
          subject: options.subject,
          text: options.text || options.html.replace(/<[^>]*>?/gm, ''),
          html: options.html,
        });
        console.log(`✉️ [EmailService] Message sent to ${options.to} (ID: ${info.messageId})`);
        return { success: true, messageId: info.messageId };
      } catch (error: any) {
        console.error(`❌ [EmailService] Failed to deliver email to ${options.to}:`, error.message);
        throw error;
      }
    } else {
      // Graceful dev/mock simulation
      console.log('─────────────────────────────────────────────────────────────');
      console.log(`✉️ [EmailService - Mock/Dev Transport] To: ${options.to}`);
      console.log(`   Subject: ${options.subject}`);
      console.log(`   From:    ${from}`);
      console.log('─────────────────────────────────────────────────────────────');
      return { success: true, simulated: true, messageId: `simulated-${Date.now()}` };
    }
  }

  /**
   * Verifies live SMTP credentials.
   */
  async verifyConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured || !this.transporter) {
      return {
        success: false,
        message: 'SMTP settings are not configured in environment variables or system settings.',
      };
    }
    try {
      await this.transporter.verify();
      return {
        success: true,
        message: 'SMTP connection established and verified successfully.',
      };
    } catch (error: any) {
      return {
        success: false,
        message: `SMTP verification failed: ${error.message}`,
      };
    }
  }

  /**
   * Password Reset Email
   */
  async sendPasswordReset(to: string, resetLink: string, userName: string): Promise<void> {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #111827; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div style="margin-bottom: 24px;">
          <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #111827;">Password Reset Request</h2>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">Tiger Workspace Enterprise Security</p>
        </div>
        <p style="font-size: 14px; line-height: 1.6; color: #374151;">Hello ${userName},</p>
        <p style="font-size: 14px; line-height: 1.6; color: #374151;">We received a request to reset your password. Click the secure link below to choose a new password. This link is valid for 15 minutes only.</p>
        <div style="margin: 28px 0;">
          <a href="${resetLink}" style="background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 12px; line-height: 1.5; color: #6b7280;">If you did not request this password reset, please contact your workspace administrator immediately.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 11px; color: #9ca3af; margin: 0;">Tiger Workspace Security &bullet; Defense in Depth</p>
      </div>
    `;

    await this.sendMail({
      to,
      subject: 'Reset Your Tiger Workspace Password',
      html,
    });
  }

  /**
   * New Employee Temporary Credentials Email
   */
  async sendTemporaryCredentials(to: string, tempPassword: string, userName: string): Promise<void> {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #111827; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div style="margin-bottom: 24px;">
          <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #111827;">Welcome to Tiger Workspace</h2>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">Your Enterprise Account Credentials</p>
        </div>
        <p style="font-size: 14px; line-height: 1.6; color: #374151;">Hello ${userName},</p>
        <p style="font-size: 14px; line-height: 1.6; color: #374151;">Your workspace administrator has created your account. Use the temporary credentials below to log in. You will be required to change your password immediately upon first sign-in.</p>
        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #4b5563;"><strong>Email:</strong> ${to}</p>
          <p style="margin: 0; font-size: 13px; color: #4b5563;"><strong>Temporary Password:</strong> <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${tempPassword}</code></p>
        </div>
        <div style="margin: 24px 0;">
          <a href="${env.FRONTEND_URL}/login" style="background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500; display: inline-block;">Log In to Tiger Workspace</a>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 11px; color: #9ca3af; margin: 0;">Tiger Workspace &bullet; Automated Onboarding Provisioning</p>
      </div>
    `;

    await this.sendMail({
      to,
      subject: 'Welcome to Tiger Workspace — Your Temporary Credentials',
      html,
    });
  }

  /**
   * Privileged Account Security Alert Email
   */
  async sendPrivilegedLoginAlert(
    to: string,
    details: { ip: string; userAgent?: string; time: string; name: string }
  ): Promise<void> {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #111827; background-color: #ffffff; border: 1px solid #fecaca; border-radius: 8px;">
        <div style="margin-bottom: 20px;">
          <span style="background-color: #fee2e2; color: #991b1b; font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 4px; text-transform: uppercase;">Security Alert</span>
          <h2 style="margin: 12px 0 6px 0; font-size: 18px; font-weight: 600; color: #111827;">New Device / IP Sign-In on Privileged Account</h2>
        </div>
        <p style="font-size: 14px; line-height: 1.6; color: #374151;">Hello ${details.name},</p>
        <p style="font-size: 14px; line-height: 1.6; color: #374151;">A login to your administrative account was detected from an unrecognized IP address or device:</p>
        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 14px; margin: 16px 0; font-size: 13px;">
          <p style="margin: 0 0 6px 0;"><strong>IP Address:</strong> ${details.ip}</p>
          <p style="margin: 0 0 6px 0;"><strong>Timestamp:</strong> ${details.time}</p>
          <p style="margin: 0;"><strong>Client:</strong> ${details.userAgent || 'Unknown Device'}</p>
        </div>
        <p style="font-size: 13px; color: #b91c1c;">If this was NOT you, please lock down your account and contact SecOps immediately.</p>
      </div>
    `;

    await this.sendMail({
      to,
      subject: 'Security Alert: New Sign-In on Your Privileged Account',
      html,
    });
  }

  /**
   * Offboarding Handover Confirmation Email
   */
  async sendOffboardingNotice(
    to: string,
    details: { employeeName: string; reassignedCount: number; successorName: string }
  ): Promise<void> {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #111827; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">Employee Offboarding & Customer Handover Notice</h2>
        <p style="font-size: 14px; color: #374151; line-height: 1.6;">The offboarding process for <strong>${details.employeeName}</strong> has been completed successfully.</p>
        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin: 16px 0; font-size: 13px;">
          <p style="margin: 0 0 6px 0;"><strong>Offboarded Staff:</strong> ${details.employeeName}</p>
          <p style="margin: 0 0 6px 0;"><strong>Reassigned Customers:</strong> ${details.reassignedCount} records</p>
          <p style="margin: 0 0 6px 0;"><strong>Successor:</strong> ${details.successorName}</p>
          <p style="margin: 0;"><strong>Biometric Vectors:</strong> Scheduled for permanent purge in 24 hours.</p>
        </div>
      </div>
    `;

    await this.sendMail({
      to,
      subject: `Offboarding Completed: ${details.employeeName} (${details.reassignedCount} leads reassigned)`,
      html,
    });
  }
}

export const emailService = new EmailService();
