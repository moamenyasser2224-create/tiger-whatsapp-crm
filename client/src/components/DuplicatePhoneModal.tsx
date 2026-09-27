import React from 'react';
import type { Customer } from '../types/index.js';
import { AlertTriangle, UserCheck, X } from 'lucide-react';
import { formatDateArabic } from '../lib/utils.js';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-neutral-300 dark:border-neutral-700">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                تنبيه: رقم الجوال مسجل مسبقاً!
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                الرقم: <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{attemptedPhone}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6 rounded-xl border border-neutral-300 bg-neutral-100/60 p-4 dark:border-neutral-700 dark:bg-neutral-800/40">
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-200 mb-2">
            يوجد بالفعل عميل مسجل بهذا الرقم في حسابك:
          </p>
          {existingCustomer && (
            <div className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
              <div className="flex justify-between py-1 border-b border-neutral-200 dark:border-neutral-700">
                <span className="text-gray-500 dark:text-gray-400">اسم العميل الحالي:</span>
                <span className="font-bold">{existingCustomer.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-200 dark:border-neutral-700">
                <span className="text-gray-500 dark:text-gray-400">الحالة:</span>
                <span className="font-bold">{existingCustomer.status}</span>
              </div>
              {existingCustomer.company && (
                <div className="flex justify-between py-1 border-b border-neutral-200 dark:border-neutral-700">
                  <span className="text-gray-500 dark:text-gray-400">الشركة:</span>
                  <span>{existingCustomer.company}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-neutral-200 dark:border-neutral-700">
                <span className="text-gray-500 dark:text-gray-400">تاريخ الإنشاء:</span>
                <span>{formatDateArabic(existingCustomer.createdAt)}</span>
              </div>
              {existingCustomer.notes && (
                <div className="pt-1">
                  <span className="text-gray-500 dark:text-gray-400 block mb-0.5">الملاحظات:</span>
                  <p className="bg-white/80 dark:bg-gray-900/80 p-2 rounded text-xs">{existingCustomer.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
          النظام لا يمنعك من الإضافة إذا كنت ترغب في تسجيل عميل جديد بنفس الرقم، ولكن نطلب منك التأكيد لتفادي التكرار غير المقصود.
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onConfirmForce}
            className="flex items-center gap-2 rounded-xl bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 border border-neutral-900 dark:border-white px-5 py-2.5 text-sm font-bold transition-colors"
          >
            <UserCheck className="h-4 w-4" />
            <span>تأكيد الإضافة رغم التكرار</span>
          </button>
        </div>
      </div>
    </div>
  );
};
