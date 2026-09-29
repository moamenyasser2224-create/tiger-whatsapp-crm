import React, { useState } from 'react';
import {
  LedgerButton,
  LedgerInput,
  LedgerTable,
  LedgerModal,
  PunchedCard,
} from '../components/common/LedgerComponents.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { PayslipReceipt } from '../components/common/PayslipReceipt.js';
import {
  Users,
  Clock,
  Receipt,
  MessageSquare,
  BarChart3,
  Settings,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Search,
  Check,
  AlertCircle,
} from 'lucide-react';

export const DesignLabPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [testInput, setTestInput] = useState('');

  const tokens = [
    { name: 'bg', light: '#f6f6f4', dark: '#121212', desc: 'Main canvas background' },
    { name: 'card', light: '#ffffff', dark: '#1b1b1b', desc: 'Surfaces, modals & cards' },
    { name: 'text', light: '#1c1c1e', dark: '#f0f0ee', desc: 'Primary typography' },
    { name: 'muted', light: '#6b6b6f', dark: '#9d9d9d', desc: 'Secondary & metadata copy' },
    { name: 'border', light: '#e5e4e1', dark: '#2d2d2c', desc: '1px structural dividers' },
    { name: 'accent', light: '#15503f', dark: '#4fae8e', desc: 'Single primary accent' },
    { name: 'accent-hover', light: '#0f3d30', dark: '#6bc2a4', desc: 'Interactive accent state' },
    { name: 'accent-soft', light: '#e8efec', dark: '#1b2925', desc: 'Active tabs & subtle pills' },
    { name: 'danger', light: '#8a3b32', dark: '#c98a80', desc: 'Subdued danger text/border' },
    { name: 'danger-soft', light: '#f5eae8', dark: '#2a1e1c', desc: 'Danger background hover' },
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted font-medium">
          <span>Design System</span>
          <span>/</span>
          <span>Design Tokens &amp; Primitives</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-text mt-1">
          Quiet Professionalism (احترافية هادئة) Design Lab
        </h1>
        <p className="text-xs text-muted mt-0.5 max-w-3xl">
          Living reference for the approved visual system: generous white space, single disciplined accent hue, uniform status pills, and financial-grade typography.
        </p>
      </div>

      {/* 1. Design Tokens Table */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-text">1. Strict Color Tokens</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {tokens.map((t) => (
            <div
              key={t.name}
              className="bg-card border border-border rounded-xl p-3.5 shadow-subtle space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-text">{t.name}</span>
                <span
                  className="w-4 h-4 rounded-full border border-border shrink-0"
                  style={{ backgroundColor: t.light }}
                />
              </div>
              <div className="text-[11px] font-mono text-muted space-y-0.5">
                <div>L: {t.light}</div>
                <div>D: {t.dark}</div>
              </div>
              <p className="text-[11px] text-muted">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Buttons Spec */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-text">2. Buttons (Four Strict Variants)</h2>
        <div className="bg-card border border-border rounded-xl p-5 shadow-subtle flex flex-wrap items-center gap-3">
          <LedgerButton variant="primary">
            <Plus className="w-4 h-4" />
            <span>Primary Action</span>
          </LedgerButton>

          <LedgerButton variant="secondary">
            <span>Secondary Action</span>
          </LedgerButton>

          <LedgerButton variant="ghost">
            <span>Low-Impact Ghost</span>
          </LedgerButton>

          <LedgerButton variant="danger">
            <Trash2 className="w-4 h-4" />
            <span>Subdued Danger</span>
          </LedgerButton>
        </div>
      </section>

      {/* 3. Status Badges Spec */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-text">3. Status Badges (Uniform Pill + 7px Dot)</h2>
        <div className="bg-card border border-border rounded-xl p-5 shadow-subtle flex flex-wrap items-center gap-4">
          <div className="space-y-1">
            <span className="text-[11px] text-muted block">In-Progress (muted):</span>
            <div className="flex gap-2">
              <StatusBadge label="New Account" statusKey="new" tone="muted" />
              <StatusBadge label="Contacted" statusKey="contacted" tone="muted" />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-muted block">Positive (accent):</span>
            <div className="flex gap-2">
              <StatusBadge label="Interested" statusKey="interested" tone="accent" />
              <StatusBadge label="Closed Won" statusKey="closed_won" tone="accent" />
              <StatusBadge label="Approved" statusKey="approved" tone="accent" />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-muted block">Negative (danger):</span>
            <div className="flex gap-2">
              <StatusBadge label="Lost Lead" statusKey="lost" tone="danger" />
              <StatusBadge label="Disputed" statusKey="disputed" tone="danger" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. Form Fields */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-text">4. Form Fields (8px Radius, Border Accent on Focus)</h2>
        <div className="bg-card border border-border rounded-xl p-5 shadow-subtle max-w-md space-y-3">
          <LedgerInput
            label="Client Reference Name"
            placeholder="e.g. Morgan Financial Advisory"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
          />
          <LedgerButton
            variant="secondary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
          >
            Open Test Modal
          </LedgerButton>
        </div>
      </section>

      {/* 5. Chat Bubbles Spec */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-text">5. Chat Stream Bubbles</h2>
        <div className="bg-card border border-border rounded-xl p-6 shadow-subtle space-y-4 max-w-2xl">
          {/* Outbound */}
          <div className="flex flex-col items-end">
            <div className="max-w-md bg-accent text-white rounded-xl rounded-tr-sm p-3.5 shadow-subtle">
              <div className="text-white/80 border-b border-white/20 pb-1.5 mb-1.5 text-xs flex justify-between gap-4">
                <span className="font-semibold text-white">You</span>
                <span className="tabular-nums">10:45 AM</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed">
                The updated financial ledger has been generated and all statutory deduction caps are enforced.
              </p>
            </div>
          </div>

          {/* Inbound */}
          <div className="flex flex-col items-start">
            <div className="max-w-md bg-bg border border-border text-text rounded-xl rounded-tl-sm p-3.5 shadow-subtle">
              <div className="text-muted border-b border-border pb-1.5 mb-1.5 text-xs flex justify-between gap-4">
                <span className="font-semibold text-text">Operations Manager</span>
                <span className="tabular-nums">10:48 AM</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed">
                Confirmed. Monthly attendance calculations match certified check-in records.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Payslip Voucher Component */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-text">6. Official Payslip Voucher</h2>
        <PayslipReceipt
          serialNumber="202609-0042"
          employeeName="Alexander Vance"
          employeeEmail="alexander@tiger.internal"
          period="2026-09"
          baseSalary={8500}
          dayWage={283.33}
          deductions={350}
          disciplinaryCapLimit={850}
          bonuses={600}
          netPay={8750}
          isClosed={true}
        />
      </section>

      {/* Test Modal */}
      <LedgerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Quiet Professionalism Modal Container"
      >
        <div className="space-y-4 text-xs text-text">
          <p className="text-muted leading-relaxed">
            Modals feature a 12px rounded container, subtle border, and quiet backdrop. No heavy dropshadows or decorative hatch patterns.
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <LedgerButton variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Close
            </LedgerButton>
            <LedgerButton variant="primary" size="sm" onClick={() => setIsModalOpen(false)}>
              Acknowledge
            </LedgerButton>
          </div>
        </div>
      </LedgerModal>
    </div>
  );
};
