import React from 'react';
import type { Customer } from '../types/index.js';
import { LedgerIcon } from './icons/LedgerIcons.js';
import { LedgerButton } from './common/LedgerComponents.js';
import { formatDate, getStatusLabel } from '../lib/utils.js';

interface DuplicatePhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmForce: () => void;
  existingCustomer?: Customer | null;
  attemptedPhone: string;
}

export const DuplicatePhoneModal: React.FC<DuplicatePhoneModalProps> = ({
  isOpen,
  onClose,
  onConfirmForce,
  existingCustomer,
  attemptedPhone,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" dir="ltr">
      <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-lg p-6 select-none text-text">
        <div className="flex items-start justify-between border-b border-border pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg border border-border bg-bg text-muted">
              <LedgerIcon name="alert-triangle" size={18} />
            </span>
            <div>
              <h3 className="text-base font-semibold text-text">
                Duplicate Phone Number Detected
              </h3>
              <p className="text-xs font-mono text-muted tabular-nums">
                Number: <span className="font-semibold text-text">{attemptedPhone}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg border border-border hover:bg-bg text-muted hover:text-text cursor-pointer transition-colors"
          >
            <LedgerIcon name="x" size={16} />
          </button>
        </div>

        <div className="border border-border rounded-lg p-3.5 mb-4 bg-bg text-xs space-y-2">
          <p className="font-medium text-text">
            An existing record with this number already exists:
          </p>
          {existingCustomer && (
            <div className="space-y-1.5 divide-y divide-border/60">
              <div className="flex justify-between py-1">
                <span className="text-muted">Existing Customer:</span>
                <span className="font-semibold text-text">{existingCustomer.name}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted">Pipeline Status:</span>
                <span className="font-semibold text-text">{getStatusLabel(existingCustomer.status)}</span>
              </div>
              {existingCustomer.company && (
                <div className="flex justify-between py-1">
                  <span className="text-muted">Company:</span>
                  <span className="text-text">{existingCustomer.company}</span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-muted">Registered Date:</span>
                <span className="text-text tabular-nums">{formatDate(existingCustomer.createdAt)}</span>
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-muted mb-4 leading-relaxed">
          Tiger system rules allow bypassing duplicate protection if needed, which will be logged to audit history.
        </p>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <LedgerButton type="button" variant="secondary" onClick={onClose} size="sm">
            Cancel
          </LedgerButton>
          <LedgerButton type="button" onClick={onConfirmForce} size="sm">
            <LedgerIcon name="check" size={14} />
            <span>Force Insert Duplicate</span>
          </LedgerButton>
        </div>
      </div>
    </div>
  );
};
