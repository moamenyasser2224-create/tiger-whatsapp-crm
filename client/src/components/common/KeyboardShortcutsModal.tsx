import React from 'react';
import { LedgerModal } from './LedgerComponents.js';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const shortcuts = [
    { key: 'Ctrl + K / ⌘K', desc: 'Open Command Palette & fast ledger search' },
    { key: '?', desc: 'View keyboard shortcuts guide' },
    { key: 'Alt + 1', desc: 'Navigate to Customers Ledger' },
    { key: 'Alt + 2', desc: 'Navigate to Time Clock & Punch Card' },
    { key: 'Alt + 3', desc: 'Navigate to Payroll & Deductions' },
    { key: 'Alt + 4', desc: 'Navigate to Team Chat' },
    { key: 'Alt + 5', desc: 'Navigate to Tiger Showcase / Home' },
    { key: 'Alt + T', desc: 'Toggle interface theme (Dark / Light)' },
    { key: 'Esc', desc: 'Close any active modal or dialog' },
  ];

  return (
    <LedgerModal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts Reference"
    >
      <div className="space-y-4 font-sans text-xs" dir="ltr">
        <p className="text-neutral-600 dark:text-neutral-400">
          Tiger OS provides mechanical keyboard shortcuts for rapid ledger operations and mouse-free navigation:
        </p>

        <div className="border border-neutral-900 dark:border-white divide-y divide-neutral-200 dark:divide-neutral-800">
          {shortcuts.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between p-2.5 bg-white dark:bg-black font-mono"
            >
              <span className="font-sans text-neutral-800 dark:text-neutral-200 font-bold">
                {s.desc}
              </span>
              <kbd className="border-1.5 border-neutral-900 dark:border-white px-2 py-0.5 text-[11px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 text-center text-[11px] font-mono text-neutral-500">
          Press <kbd className="border px-1">Esc</kbd> to return to workspace
        </div>
      </div>
    </LedgerModal>
  );
};
