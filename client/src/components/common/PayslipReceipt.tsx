import React from 'react';
import { RubberStamp } from './RubberStamp.js';
import { LedgerIcon } from '../icons/LedgerIcons.js';

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
    <div className="w-full max-w-md mx-auto border-2 border-neutral-900 dark:border-white bg-[#ffffff] dark:bg-[#121212] p-6 shadow-solid font-mono select-none relative perforated-edge-b" dir="ltr">
      {/* Top Receipt Cut Line */}
      <div className="border-b-2 border-dashed border-neutral-400 dark:border-neutral-600 pb-3 mb-4 flex items-center justify-between text-xs">
        <span className="font-bold">OFFICIAL PAYSLIP VOUCHER</span>
        <span className="tabular-nums">SERIAL: #{serialNumber}</span>
      </div>

      {/* Header Info */}
      <div className="text-center space-y-1 mb-6">
        <h3 className="font-bold text-xl text-neutral-950 dark:text-white">
          Tiger Certified Payroll Receipt
        </h3>
        <p className="text-xs text-neutral-500">
          Billing Period: <span className="font-bold tabular-nums">{period}</span>
        </p>
      </div>

      {/* Employee Details Box */}
      <div className="border border-neutral-900 dark:border-white p-3 mb-5 text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-neutral-500">Employee:</span>
          <span className="font-bold text-neutral-900 dark:text-white">{employeeName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Email:</span>
          <span>{employeeEmail}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Daily Wage Base:</span>
          <span className="tabular-nums font-bold">{dayWage.toFixed(2)} {currency}</span>
        </div>
      </div>

      {/* Ledger Line Items Table */}
      <div className="space-y-2.5 text-xs mb-6">
        <div className="flex justify-between border-b border-neutral-200 dark:border-neutral-800 pb-1.5 font-bold">
          <span>Accounting Item</span>
          <span>Amount</span>
        </div>

        <div className="flex justify-between">
          <span>Gross Base Salary</span>
          <span className="tabular-nums">{baseSalary.toFixed(2)} {currency}</span>
        </div>

        <div className="flex justify-between text-neutral-800 dark:text-neutral-200">
          <span>Total Deductions &amp; Lateness (-)</span>
          <span className="tabular-nums font-bold">-{deductions.toFixed(2)} {currency}</span>
        </div>

        {disciplinaryCapLimit !== undefined && disciplinaryCapLimit > 0 && (
          <div className="text-[10px] text-neutral-500 flex justify-between pl-2">
            <span>Statutory Disciplinary Cap</span>
            <span>Max {disciplinaryCapLimit.toFixed(0)} {currency}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span>Bonuses &amp; Incentives (+)</span>
          <span className="tabular-nums font-bold">+{bonuses.toFixed(2)} {currency}</span>
        </div>

        {/* Double Underline for Net Pay */}
        <div className="border-t-2 border-neutral-900 dark:border-white border-double-bottom pt-3 pb-1 flex justify-between text-sm sm:text-base font-black">
          <span>Net Payable Wage</span>
          <span className="tabular-nums">{netPay.toFixed(2)} {currency}</span>
        </div>
      </div>

      {/* QR Code & Stamp Area */}
      <div className="flex items-center justify-between border-t border-dashed border-neutral-300 dark:border-neutral-700 pt-4 mt-6">
        {/* Verification QR Code Mockup / Visual */}
        <div className="border border-neutral-900 dark:border-white p-2 text-center bg-white dark:bg-black">
          <div className="w-16 h-16 border-2 border-neutral-900 dark:border-white flex flex-col justify-around p-1 text-[8px] font-mono">
            <div className="flex justify-between">
              <span className="w-3 h-3 bg-neutral-900 dark:bg-white" />
              <span className="w-3 h-3 bg-neutral-900 dark:bg-white" />
            </div>
            <div className="text-center font-bold">QR-HMAC</div>
            <div className="flex justify-between">
              <span className="w-3 h-3 bg-neutral-900 dark:bg-white" />
              <span className="w-2 h-2 bg-neutral-900 dark:bg-white" />
            </div>
          </div>
          <span className="text-[9px] block mt-1">VERIFIED</span>
        </div>

        {/* Rubber Stamp Status */}
        <div className="text-center">
          {isClosed ? (
            <RubberStamp label="FINAL CLOSED" recordId={serialNumber} subtext="APPROVED FOR PAYOUT" />
          ) : (
            <RubberStamp label="IN REVIEW" recordId={serialNumber} subtext="OPEN AUDIT CYCLE" />
          )}
        </div>
      </div>

      {/* Print Button */}
      {onPrint && (
        <div className="mt-5 pt-3 border-t border-neutral-200 dark:border-neutral-800 print:hidden text-center">
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border-2 border-neutral-900 dark:border-white hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
          >
            <LedgerIcon name="printer" size={14} />
            <span>Print Official Payslip</span>
          </button>
        </div>
      )}
    </div>
  );
};
