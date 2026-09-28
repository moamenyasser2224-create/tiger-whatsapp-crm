import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { DeductionService } from './deduction.service.js';

const deductionService = new DeductionService();

export class PayslipService {
  /**
   * Generates a tamper-proof HMAC verification token
   */
  generateHmacToken(data: { userId: string; period: string; netPay: number }): string {
    const rawPayload = `${data.userId}:${data.period}:${data.netPay.toFixed(2)}`;
    const signature = crypto
      .createHmac('sha256', env.JWT_ACCESS_SECRET)
      .update(rawPayload)
      .digest('hex');
    
    const combined = JSON.stringify({
      u: data.userId,
      p: data.period,
      n: data.netPay,
      s: signature,
    });

    return Buffer.from(combined).toString('base64url');
  }

  /**
   * Verifies an HMAC token
   */
  async verifyHmacToken(token: string) {
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
      const rawPayload = `${decoded.u}:${decoded.p}:${Number(decoded.n).toFixed(2)}`;
      const expectedSignature = crypto
        .createHmac('sha256', env.JWT_ACCESS_SECRET)
        .update(rawPayload)
        .digest('hex');

      if (expectedSignature !== decoded.s) {
        return { valid: false, error: 'توقيع الإيصال غير صالح أو تم التلاعب به' };
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.u },
        select: { id: true, name: true, email: true, role: true },
      });

      if (!user) {
        return { valid: false, error: 'الموظف غير موجود في السجلات' };
      }

      const period = await prisma.payrollPeriod.findUnique({
        where: { month: decoded.p },
      });

      return {
        valid: true,
        employee: user,
        period: decoded.p,
        netPay: decoded.n,
        isClosed: period?.status === 'closed',
        verifiedAt: new Date().toISOString(),
      };
    } catch {
      return { valid: false, error: 'رمز التحقق غير صالح أو تالف' };
    }
  }

  /**
   * Generates an authentic perforated monochrome payslip PDF document
   */
  async generatePayslipPdf(userId: string, periodMonth: string): Promise<Buffer> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) throw new Error('الموظف غير موجود');

    const summary = await deductionService.listEmployeeDeductions(userId, periodMonth);
    const dayWageData = await deductionService.getEmployeeDayWage(userId);
    const period = await prisma.payrollPeriod.findUnique({
      where: { month: periodMonth },
    });
    const isClosed = period?.status === 'closed';

    const netPay = summary.netSalary;
    const baseSalary = summary.salary;
    const deductions = summary.totalApprovedDeductions + summary.totalManualDeductions;
    const bonuses = summary.totalBonuses;
    const serialNumber = `${periodMonth.replace('-', '')}-${userId.slice(-4).toUpperCase()}`;

    // Generate Verification Token & QR Code
    const hmacToken = this.generateHmacToken({ userId, period: periodMonth, netPay });
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-payslip?token=${hmacToken}`;
    const qrBuffer = await QRCode.toBuffer(verifyUrl, { width: 100, margin: 1 });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A5', margin: 30 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Monochrome Perforated Edge Outline
      doc.rect(20, 20, 380, 555).lineWidth(2).stroke('#111111');
      doc.dash(4, { space: 3 });
      doc.moveTo(20, 48).lineTo(400, 48).stroke('#666666');
      doc.undash();

      // Top Receipt Bar
      doc.fontSize(9).font('Helvetica-Bold').text('OFFICIAL PAYSLIP RECEIPT - COMPANY LEDGER', 30, 30);
      doc.fontSize(9).font('Helvetica').text(`SERIAL: #${serialNumber}`, 280, 30, { align: 'right' });

      // Title & Subtitle
      doc.fontSize(16).font('Helvetica-Bold').text('PAYROLL DISBURSEMENT VOUCHER', 30, 65, { align: 'center' });
      doc.fontSize(10).font('Helvetica').text(`Cycle Month: ${periodMonth}`, 30, 85, { align: 'center' });

      // Employee Info Box
      doc.rect(30, 110, 360, 55).lineWidth(1).stroke('#222222');
      doc.fontSize(9).font('Helvetica-Bold').text(`Employee: ${user.name}`, 40, 120);
      doc.fontSize(8).font('Helvetica').text(`Email: ${user.email}`, 40, 134);
      doc.fontSize(8).font('Helvetica').text(`Daily Wage: ${dayWageData.dayWage.toFixed(2)} ${summary.currency}`, 40, 148);
      doc.fontSize(9).font('Helvetica-Bold').text(`Status: ${isClosed ? 'CLOSED / SETTLED' : 'OPEN / AUDIT'}`, 240, 120, { align: 'right' });

      // Accounting Ledger Table Header
      let y = 185;
      doc.rect(30, y, 360, 22).fillAndStroke('#eeeeee', '#222222');
      doc.fillColor('#111111').fontSize(9).font('Helvetica-Bold').text('ACCOUNTING DESCRIPTION', 40, y + 6);
      doc.text('AMOUNT', 310, y + 6, { align: 'right' });

      // Items
      y += 28;
      doc.font('Helvetica').fontSize(9).text('Approved Base Salary', 40, y);
      doc.text(`${baseSalary.toFixed(2)} ${summary.currency}`, 280, y, { align: 'right' });

      y += 20;
      doc.text('Total Deductions & Absences (-)', 40, y);
      doc.text(`-${deductions.toFixed(2)} ${summary.currency}`, 280, y, { align: 'right' });

      y += 20;
      doc.text('Administrative Bonuses & Incentives (+)', 40, y);
      doc.text(`+${bonuses.toFixed(2)} ${summary.currency}`, 280, y, { align: 'right' });

      // Double-Underline Accounting Rule for Net Pay
      y += 25;
      doc.lineWidth(1.5).moveTo(30, y).lineTo(390, y).stroke('#111111');
      y += 4;
      doc.lineWidth(1.5).moveTo(30, y).lineTo(390, y).stroke('#111111');

      y += 8;
      doc.fontSize(11).font('Helvetica-Bold').text('NET PAYABLE SALARY', 40, y);
      doc.fontSize(12).font('Helvetica-Bold').text(`${netPay.toFixed(2)} ${summary.currency}`, 280, y, { align: 'right' });

      // Perforated Tear-off line
      y += 35;
      doc.dash(3, { space: 3 });
      doc.moveTo(30, y).lineTo(390, y).stroke('#888888');
      doc.undash();

      // Bottom Area: QR Code + Rubber Stamp Box
      y += 15;
      doc.image(qrBuffer, 40, y, { width: 75, height: 75 });
      doc.fontSize(7).font('Helvetica').text('CRYPTOGRAPHIC QR', 40, y + 78);
      doc.text('HMAC-SHA256 SIGNED', 40, y + 87);

      // Official Stamp Box
      const stampX = 230;
      const stampY = y + 10;
      doc.rect(stampX, stampY, 140, 55).lineWidth(2).stroke('#111111');
      doc.rect(stampX - 3, stampY - 3, 146, 61).lineWidth(0.8).stroke('#333333');
      doc.fontSize(10).font('Helvetica-Bold').text(isClosed ? 'OFFICIALLY CLOSED' : 'UNDER REVIEW', stampX, stampY + 14, { width: 140, align: 'center' });
      doc.fontSize(7).font('Helvetica').text('AUTHORIZED DISBURSEMENT', stampX, stampY + 30, { width: 140, align: 'center' });
      doc.fontSize(6).font('Helvetica').text(`HASH: ${hmacToken.slice(0, 16)}`, stampX, stampY + 42, { width: 140, align: 'center' });

      // Footer notice
      doc.fontSize(7).font('Helvetica').text(
        'Generated via Company Ledger System - Verification endpoint matches cryptographic HMAC ledger.',
        30,
        550,
        { align: 'center', width: 360 }
      );

      doc.end();
    });
  }
}

export const payslipService = new PayslipService();
