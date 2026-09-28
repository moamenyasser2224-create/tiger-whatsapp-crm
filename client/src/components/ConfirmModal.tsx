import React from 'react';
import { LedgerIcon } from './icons/LedgerIcons.js';
import { LedgerButton } from './common/LedgerComponents.js';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  danger = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-diagonal-hatch select-none">
      <div className="w-full max-w-md bg-white dark:bg-neutral-950 border-2 border-neutral-900 dark:border-white shadow-solid p-5">
        <div className="flex items-start justify-between border-b-2 border-neutral-900 dark:border-white pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1 border border-neutral-900 dark:border-white">
              <LedgerIcon name={danger ? 'alert-triangle' : 'help'} size={18} />
            </span>
            <h3 className="text-base font-bold text-neutral-950 dark:text-white font-display">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 border border-neutral-900 dark:border-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <LedgerIcon name="x" size={16} />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 font-ledger mb-6 leading-relaxed">
          {message}
        </p>

        <div className="flex items-center justify-end gap-2 pt-3 border-t-2 border-neutral-900 dark:border-white">
          <LedgerButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            {cancelText}
          </LedgerButton>
          <LedgerButton
            type="button"
            variant={danger ? 'danger' : 'primary'}
            size="sm"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </LedgerButton>
        </div>
      </div>
    </div>
  );
};
