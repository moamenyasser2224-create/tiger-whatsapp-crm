import React, { useState } from 'react';
import { LedgerButton, LedgerInput, LedgerTable, LedgerModal, PunchedCard } from '../components/common/LedgerComponents.js';
import { RubberStamp } from '../components/common/RubberStamp.js';
import { PayslipReceipt } from '../components/common/PayslipReceipt.js';
import { HatchedChart } from '../components/common/HatchedChart.js';
import { OdometerClock } from '../components/common/OdometerClock.js';
import { LedgerIcon, LedgerIconName } from '../components/icons/LedgerIcons.js';

export const DesignLabPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [punchState, setPunchState] = useState<'checked-in' | 'checked-out' | 'initial'>('checked-in');
  const [isPunching, setIsPunching] = useState(false);

  const handlePunchDemo = () => {
    setIsPunching(true);
    setTimeout(() => {
      setPunchState(punchState === 'checked-in' ? 'checked-out' : 'checked-in');
      setIsPunching(false);
    }, 400);
  };

  const chartData = [
    { label: 'Sat', value: 8 },
    { label: 'Sun', value: 14, annotation: 'Peak Interaction' },
    { label: 'Mon', value: 11 },
    { label: 'Tue', value: 9 },
    { label: 'Wed', value: 16 },
    { label: 'Thu', value: 12 },
  ];

  const sampleIcons: LedgerIconName[] = [
    'ledger-book',
    'users',
    'clock',
    'receipt',
    'chat',
    'dashboard',
    'punch-card',
    'stamp',
    'plus',
    'check',
    'x',
    'search',
    'filter',
    'printer',
    'download',
    'lock',
    'eye',
    'trash',
    'edit',
    'bell',
    'qr-code',
    'kanban',
    'table',
    'cards',
    'timeline',
    'dollar',
  ];

  return (
    <div className="space-y-12">
      {/* Lab Masthead Notice */}
      <div className="border-b-2 border-neutral-900 dark:border-white pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 border border-neutral-900 dark:border-white">
            Tiger Official Visual System
          </span>
          <span className="text-xs font-mono text-neutral-500">ISO-LEDGER-V2</span>
        </div>
        <h2 className="text-3xl font-display font-bold text-neutral-950 dark:text-white">
          Company Ledger Component Lab
        </h2>
        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-3xl">
          Visual test harness for all Tiger Ledger system primitives: crisp borders, rubber stamps, physical punched time cards, payroll slips, and accounting tables.
        </p>
      </div>

      {/* 1. Typography & Mega Numerals Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-300 dark:border-neutral-700 pb-2">
          <h3 className="font-display font-bold text-lg">1. Typography & Mega Numerals</h3>
          <span className="text-xs font-mono text-neutral-500">Inter + JetBrains Mono + Outfit</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 border-2 border-neutral-900 dark:border-white bg-[#fafafa] dark:bg-[#121212]">
          <div>
            <span className="text-xs font-mono text-neutral-500 block mb-1">Mega Display Metric</span>
            <div className="text-7xl sm:text-8xl font-mono font-black tabular-nums text-neutral-950 dark:text-white">
              98.4%
            </div>
            <span className="text-xs font-bold font-ledger mt-2 block">Monthly Attendance Compliance Rate</span>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono text-neutral-500 block">Display Headline</span>
            <div className="text-2xl font-display font-bold text-neutral-900 dark:text-white">
              Tiger Workflow Automation
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-ledger">
              Clean, high-density typography optimized for precision operations without artificial decorations or gradients.
            </p>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-mono text-neutral-500 block">Mechanical Odometer Clock</span>
            <div>
              <OdometerClock className="text-lg" />
            </div>
            <span className="text-[11px] font-mono text-neutral-500 block">
              Monospaced Tabular Digits
            </span>
          </div>
        </div>
      </section>

      {/* 2. Rubber Stamps */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-300 dark:border-neutral-700 pb-2">
          <h3 className="font-display font-bold text-lg">2. Rubber Stamps & Seals</h3>
          <span className="text-xs font-mono text-neutral-500">Double border + deterministic rotational angle</span>
        </div>

        <div className="p-6 border-2 border-neutral-900 dark:border-white bg-white dark:bg-neutral-950 flex flex-wrap items-center gap-6">
          <RubberStamp label="APPROVED" recordId="rec-appr-01" subtext="BY EXECUTIVE" />
          <RubberStamp label="REJECTED" recordId="rec-rej-02" subtext="OUT OF POLICY" />
          <RubberStamp label="ABSENT" recordId="rec-abs-03" subtext="1.0 DAY DEDUCT" />
          <RubberStamp label="LATE 25M" recordId="rec-late-04" subtext="TIER 2 PENALTY" />
          <RubberStamp label="DISPUTED" recordId="rec-disp-05" subtext="UNDER AUDIT" />
          <RubberStamp label="CLOSED" recordId="rec-close-06" subtext="CYCLE 2026-09" />
        </div>
      </section>

      {/* 3. Hallmark Components: Punched Attendance Card & Payslip Receipt */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-300 dark:border-neutral-700 pb-2">
          <h3 className="font-display font-bold text-lg">3. Hallmark Artifacts (Time Card & Payslip)</h3>
          <span className="text-xs font-mono text-neutral-500">Punched Card & Perforated Receipt</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Punched Card Demo */}
          <div className="space-y-2">
            <span className="text-xs font-mono text-neutral-500 block">A. Physical Punched Time Card with punch audio feedback:</span>
            <PunchedCard
              employeeName="Tiger Operator"
              employeeId="EMP-00918"
              date="2026-09-28"
              punches={[
                {
                  type: 'In',
                  time: '08:58:12',
                  isPunched: true,
                  statusBadge: 'On Time',
                },
                {
                  type: 'Out',
                  time: punchState === 'checked-out' ? '17:02:45' : '',
                  isPunched: punchState === 'checked-out',
                  statusBadge: punchState === 'checked-out' ? 'Completed' : undefined,
                },
              ]}
              onPunchClick={handlePunchDemo}
              isPunching={isPunching}
            />
          </div>

          {/* Payslip Receipt Demo */}
          <div className="space-y-2">
            <span className="text-xs font-mono text-neutral-500 block">B. Cryptographically sealed payslip voucher with QR:</span>
            <PayslipReceipt
              serialNumber="9082-2026-09"
              employeeName="Tiger Operator"
              employeeEmail="operator@tiger.local"
              period="2026-09"
              baseSalary={6000}
              dayWage={200}
              deductions={150}
              disciplinaryCapLimit={600}
              bonuses={500}
              netPay={6350}
              isClosed={true}
              onPrint={() => window.print()}
            />
          </div>
        </div>
      </section>

      {/* 4. Ledger Table & Hatched Chart */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-300 dark:border-neutral-700 pb-2">
          <h3 className="font-display font-bold text-lg">4. Ledger Table & Hatched Chart</h3>
          <span className="text-xs font-mono text-neutral-500">Crisp hairline borders + double accounting underlines</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Ledger Table */}
          <div className="space-y-2">
            <span className="text-xs font-mono text-neutral-500 block">A. Accounting Ledger Table:</span>
            <LedgerTable>
              <thead>
                <tr className="border-b-2 border-neutral-900 dark:border-white font-bold bg-neutral-100 dark:bg-neutral-900">
                  <th className="p-3">Ref ID</th>
                  <th className="p-3">Client / Organization</th>
                  <th className="p-3">Ledger Status</th>
                  <th className="p-3 text-right">Net Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono">
                <tr>
                  <td className="p-3 font-bold">#TR-01</td>
                  <td className="p-3 font-ledger font-semibold">Apex Robotics Corp</td>
                  <td className="p-3">
                    <RubberStamp label="CLOSED" recordId="tr-01" />
                  </td>
                  <td className="p-3 text-right tabular-nums font-bold">25,000.00 SAR</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold">#TR-02</td>
                  <td className="p-3 font-ledger font-semibold">Horizon Logistics Ltd</td>
                  <td className="p-3">
                    <RubberStamp label="INTERESTED" recordId="tr-02" />
                  </td>
                  <td className="p-3 text-right tabular-nums font-bold">12,500.00 SAR</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold">#TR-03</td>
                  <td className="p-3 font-ledger font-semibold">Pioneer Consulting Group</td>
                  <td className="p-3">
                    <RubberStamp label="CONTACTED" recordId="tr-03" />
                  </td>
                  <td className="p-3 text-right tabular-nums font-bold">8,000.00 SAR</td>
                </tr>
                {/* Total Row with Double Underline */}
                <tr className="border-t-2 border-neutral-900 dark:border-white border-double-bottom font-bold text-sm bg-neutral-50 dark:bg-neutral-900/50">
                  <td colSpan={3} className="p-3 font-display">Total Master Ledger Balance</td>
                  <td className="p-3 text-right tabular-nums font-black">45,500.00 SAR</td>
                </tr>
              </tbody>
            </LedgerTable>
          </div>

          {/* Hatched Chart */}
          <div className="space-y-2">
            <span className="text-xs font-mono text-neutral-500 block">B. Monochrome Hatched Bar Chart:</span>
            <HatchedChart
              title="Daily Follow-Up Interactions Recorded This Week"
              data={chartData}
              unit=" events"
              height={220}
            />
          </div>
        </div>
      </section>

      {/* 5. Controls, Buttons & Modals */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-300 dark:border-neutral-700 pb-2">
          <h3 className="font-display font-bold text-lg">5. Action Buttons & Input Primitives</h3>
          <span className="text-xs font-mono text-neutral-500">Solid drop-shadows + 1px tactile click down</span>
        </div>

        <div className="p-6 border-2 border-neutral-900 dark:border-white bg-white dark:bg-neutral-950 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <LedgerButton variant="primary" icon="plus">Primary Solid Button</LedgerButton>
            <LedgerButton variant="secondary" icon="printer">Secondary Outlined</LedgerButton>
            <LedgerButton variant="danger" icon="trash">Critical Action</LedgerButton>
            <LedgerButton variant="ghost" icon="search">Ghost Filter</LedgerButton>
            <LedgerButton variant="primary" disabled icon="lock">Disabled State</LedgerButton>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <LedgerInput label="Client Name or Ledger Subject" placeholder="Enter name..." />
            <LedgerInput label="Phone Number (Deduplication Check)" placeholder="+1234567890" isMono />
            <LedgerInput label="Invalid Field (Error State)" defaultValue="invalid-entry" error="Number is already logged in ledger" isMono />
          </div>

          <div className="pt-2">
            <LedgerButton variant="primary" onClick={() => setIsModalOpen(true)}>
              Launch Sample Modal (Hatched Backdrop)
            </LedgerButton>
          </div>
        </div>
      </section>

      {/* 6. Hand-drawn 24px SVG Icons Showcase */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-300 dark:border-neutral-700 pb-2">
          <h3 className="font-display font-bold text-lg">6. Hand-Crafted 24px Grid Icons</h3>
          <span className="text-xs font-mono text-neutral-500">2px stroke + square caps + zero third-party icons</span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-3 p-5 border-2 border-neutral-900 dark:border-white bg-[#fafafa] dark:bg-[#121212]">
          {sampleIcons.map((iconName) => (
            <div
              key={iconName}
              className="flex flex-col items-center justify-center p-2.5 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 space-y-1 hover:border-neutral-900 dark:hover:border-white transition-colors"
            >
              <LedgerIcon name={iconName} size={22} />
              <span className="text-[9px] font-mono truncate max-w-full opacity-70">
                {iconName}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Demo Modal */}
      <LedgerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Confirm Administrative Ledger Entry"
      >
        <div className="space-y-4 font-ledger text-xs sm:text-sm">
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
            Notice: The backdrop behind this modal is hatched with monochrome fine lines (no blurry glassmorphism), while the modal is encased in an ink border with an offset shadow.
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <LedgerButton variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Dismiss
            </LedgerButton>
            <LedgerButton variant="primary" size="sm" onClick={() => setIsModalOpen(false)}>
              Authorize Entry
            </LedgerButton>
          </div>
        </div>
      </LedgerModal>
    </div>
  );
};

export default DesignLabPage;
