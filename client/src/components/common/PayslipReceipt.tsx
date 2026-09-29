import React from 'react';
import { StatusBadge } from './StatusBadge.js';
import { Printer } from 'lucide-react';
import { LedgerButton } from './LedgerComponents.js';

interface PayslipReceiptProps {
  serialNumber: string;
  employeeName: string;
  employeeEmail: string;
  period: string; // YYYY-MM
  baseSalary: number;
  dayWage: number;
  deductions: number;
  disciplinaryCapLimit?: number;
  bonuses: number;
  netPay: number;
  isClosed?: boolean;
  qrPayload?: string;
  currency?: string;
  onPrint?: () => void;
}

export const PayslipReceipt: React.FC<PayslipReceiptProps> = ({
  serialNumber,
  employeeName,
  employeeEmail,
  period,
  baseSalary,
  dayWage,
  deductions,
  disciplinaryCapLimit,
  bonuses,
  netPay,
  isClosed = false,
  currency = 'SAR',
  onPrint,
}) => {
  return (
    <div className="w-full max-w-lg mx-auto bg-card border border-border rounded-xl shadow-subtle p-6 sm:p-8 select-none" dir="ltr">
      {/* Top Header */}
      <div className="border-b border-border pb-4 mb-6 flex items-center justify-between text-xs">
        <div>
          <span className="font-semibold text-accent uppercase tracking-wider text-xs block">
            Tiger Official Payslip
          </span>
          <span className="text-[11px] text-muted">Financial &amp; Payroll Services</span>
        </div>
        <div className="text-right">
          <span className="text-muted font-mono tabular-nums text-xs">REF #{serialNumber}</span>
          <div className="mt-1">
            <StatusBadge
              label={isClosed ? 'Payroll Closed' : 'In Review'}
              tone={isClosed ? 'accent' : 'muted'}
            />
          </div>
        </div>
      </div>

      {/* Title & Billing Period */}
      <div className="mb-6 space-y-1">
        <h3 className="font-semibold text-lg text-text">
          Statement of Earnings &amp; Deductions
        </h3>
        <p className="text-xs text-muted">
          Accounting Cycle: <strong className="text-text font-medium tabular-nums">{period}</strong>
        </p>
      </div>

      {/* Employee Details Box */}
      <div className="bg-bg border border-border rounded-lg p-4 mb-6 text-xs space-y-2">
        <div className="flex justify-between">
          <span className="text-muted">Employee:</span>
          <span className="font-semibold text-text">{employeeName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Email:</span>
          <span className="text-text font-mono">{employeeEmail}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Daily Wage Base:</span>
          <span className="tabular-nums font-medium text-text">{dayWage.toFixed(2)} {currency}</span>
        </div>
      </div>

      {/* Ledger Line Items Table */}
      <div className="space-y-3 text-xs mb-6">
        <div className="flex justify-between border-b border-border pb-2 font-semibold text-muted text-[11px] uppercase tracking-wider">
          <span>Accounting Item</span>
          <span>Amount</span>
        </div>

        <div className="flex justify-between py-1 border-b border-border/50">
          <span className="text-text">Gross Base Salary</span>
          <span className="tabular-nums font-medium text-text">{baseSalary.toFixed(2)} {currency}</span>
        </div>

        <div className="flex justify-between py-1 border-b border-border/50 text-danger">
          <span>Total Deductions &amp; Lateness (-)</span>
          <span className="tabular-nums font-semibold">-{deductions.toFixed(2)} {currency}</span>
        </div>

        {disciplinaryCapLimit !== undefined && disciplinaryCapLimit > 0 && (
          <div className="text-[11px] text-muted flex justify-between pl-3">
            <span>Statutory Disciplinary Cap</span>
            <span className="tabular-nums">Max {disciplinaryCapLimit.toFixed(0)} {currency}</span>
          </div>
        )}

        <div className="flex justify-between py-1 border-b border-border/50 text-accent">
          <span>Bonuses &amp; Incentives (+)</span>
          <span className="tabular-nums font-semibold">+{bonuses.toFixed(2)} {currency}</span>
        </div>

        {/* Net Pay Total Box */}
        <div className="bg-accent-soft border border-accent/20 rounded-lg p-3.5 flex justify-between items-center text-sm font-semibold text-accent mt-4">
          <span>Net Payable Wage</span>
          <span className="tabular-nums text-base font-bold">{netPay.toFixed(2)} {currency}</span>
        </div>
      </div>

      {/* Print Action */}
      {onPrint && (
        <div className="pt-4 border-t border-border print:hidden text-center">
          <LedgerButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={onPrint}
            className="w-full sm:w-auto"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Payslip</span>
          </LedgerButton>
        </div>
      )}
    </div>
  );
};
