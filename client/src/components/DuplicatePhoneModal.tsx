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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-diagonal-hatch" dir="ltr">
      <div className="w-full max-w-lg bg-white dark:bg-neutral-950 border-2 border-neutral-900 dark:border-white shadow-solid p-5 select-none">
        <div className="flex items-start justify-between border-b-2 border-neutral-900 dark:border-white pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1 border border-neutral-900 dark:border-white">
              <LedgerIcon name="alert-triangle" size={18} />
            </span>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Warning: Duplicate Phone Number Detected
              </h3>
              <p className="text-xs font-mono text-neutral-600 dark:text-neutral-400">
                Number: <span className="font-bold underline">{attemptedPhone}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 border border-neutral-900 dark:border-white hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
          >
            <LedgerIcon name="x" size={16} />
          </button>
        </div>

        <div className="border border-neutral-900 dark:border-neutral-100 p-3 mb-4 bg-[#fafafa] dark:bg-[#111111] font-mono text-xs space-y-2">
          <p className="font-bold text-neutral-900 dark:text-white">
            An existing record with this number already exists:
          </p>
          {existingCustomer && (
            <div className="space-y-1.5 divide-y divide-dashed divide-neutral-300 dark:divide-neutral-700">
              <div className="flex justify-between py-1">
                <span className="text-neutral-500">Existing Customer:</span>
                <span className="font-bold">{existingCustomer.name}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-500">Pipeline Status:</span>
                <span className="font-bold">{getStatusLabel(existingCustomer.status)}</span>
              </div>
              {existingCustomer.company && (
                <div className="flex justify-between py-1">
                  <span className="text-neutral-500">Company:</span>
                  <span>{existingCustomer.company}</span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-neutral-500">Registered Date:</span>
                <span>{formatDate(existingCustomer.createdAt)}</span>
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-neutral-500 font-mono mb-4 leading-relaxed">
          Tiger system rules allow bypassing duplicate protection if needed, which will be logged to audit history.
        </p>

        <div className="flex items-center justify-end gap-2 pt-3 border-t-2 border-neutral-900 dark:border-white">
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
