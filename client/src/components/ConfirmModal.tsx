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
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm select-none" dir="ltr">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-lg p-5 text-text">
        <div className="flex items-start justify-between border-b border-border pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className={`p-1.5 rounded-lg border ${danger ? 'border-danger/30 text-danger bg-danger-soft' : 'border-border text-muted bg-bg'}`}>
              <LedgerIcon name={danger ? 'alert-triangle' : 'help'} size={18} />
            </span>
            <h3 className="text-base font-semibold text-text">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg border border-border hover:bg-bg text-muted hover:text-text cursor-pointer transition-colors"
          >
            <LedgerIcon name="x" size={16} />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-muted mb-6 leading-relaxed">
          {message}
        </p>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
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
