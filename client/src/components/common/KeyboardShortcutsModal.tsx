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
    { key: 'Ctrl + K / ⌘K', desc: 'فتح لوحة الأوامر والبحث الدفتري السريع' },
    { key: '?', desc: 'عرض دليل اختصارات لوحة المفاتيح' },
    { key: 'Alt + 1', desc: 'الانتقال المباشر إلى دفتر العملاء' },
    { key: 'Alt + 2', desc: 'الانتقال المباشر إلى كارت الدوام' },
    { key: 'Alt + 3', desc: 'الانتقال المباشر إلى دفتر الرواتب والخصومات' },
    { key: 'Alt + 4', desc: 'الانتقال المباشر إلى الشات الداخلي' },
    { key: 'Alt + 5', desc: 'الانتقال المباشر إلى مؤشرات النشاط' },
    { key: 'Alt + T', desc: 'تبديل وضع الورقة (داكن / فاتح)' },
    { key: 'Esc', desc: 'إغلاق أي نافذة منبثقة أو إلغاء البحث' },
  ];

  return (
    <LedgerModal
      isOpen={isOpen}
      onClose={onClose}
      title="دليل اختصارات لوحة المفاتيح (Mechanical Shortcuts)"
    >
      <div className="space-y-4 font-ledger text-xs">
        <p className="text-neutral-600 dark:text-neutral-400">
          تم تزويد المنظومة باختصارات ميكانيكية مباشرة لسرعة قيد المعاملات والتنقل بدون استخدام الفأرة:
        </p>

        <div className="border border-neutral-900 dark:border-white divide-y divide-neutral-200 dark:divide-neutral-800">
          {shortcuts.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between p-2.5 bg-white dark:bg-black font-mono"
            >
              <span className="font-ledger text-neutral-800 dark:text-neutral-200 font-bold">
                {s.desc}
              </span>
              <kbd className="border-1.5 border-neutral-900 dark:border-white px-2 py-0.5 text-[11px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 text-center text-[11px] font-mono text-neutral-500">
          اضغط <kbd className="border px-1">Esc</kbd> للرجوع إلى الدفتر
        </div>
      </div>
    </LedgerModal>
  );
};
