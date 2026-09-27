import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Customer, CustomerSource, CustomerStatus } from '../types/index.js';
import { CUSTOMER_SOURCES, CUSTOMER_STATUSES } from '../types/index.js';
import { X, CheckCircle2, User, Phone, Building, MapPin, Calendar, FileText, ShieldCheck } from 'lucide-react';
import { DuplicatePhoneModal } from './DuplicatePhoneModal.js';
import { formatDateArabic } from '../lib/utils.js';

const customerFormSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن لا يقل عن حرفين').max(120, 'الاسم طويل جداً'),
  company: z.string().max(120).optional().nullable(),
  phone: z
    .string()
    .min(1, 'رقم الجوال مطلوب')
    .transform((v) => v.replace(/\D/g, ''))
    .refine((v) => /^[0-9]{8,15}$/.test(v), {
      message: 'رقم الجوال يجب أن يتكون من أرقام فقط بالصيغة الدولية بدون + (8 إلى 15 رقم)',
    }),
  city: z.string().max(100).optional().nullable(),
  source: z.string().default('واتساب'),
  status: z.string().default('جديد'),
  last: z.string().optional().nullable(),
  next: z.string().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  consent: z.boolean().refine((val) => val === true, {
    message: 'الموافقة الصريحة للعميل على التواصل إلزامية قبل الحفظ',
  }),
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerFormData, force?: boolean) => Promise<any>;
  initialData?: Customer | null;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [duplicateWarning, setDuplicateWarning] = useState<{
    existingCustomer: Customer | null;
    attemptedPhone: string;
    pendingData: CustomerFormData | null;
  } | null>(null);

  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: '',
      company: '',
      phone: '',
      city: '',
      source: 'واتساب',
      status: 'جديد',
      last: '',
      next: '',
      notes: '',
      consent: true,
    },
  });

  const consentValue = watch('consent');

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        company: initialData.company || '',
        phone: initialData.phone,
        city: initialData.city || '',
        source: initialData.source,
        status: initialData.status,
        last: initialData.last ? initialData.last.split('T')[0] : '',
        next: initialData.next ? initialData.next.split('T')[0] : '',
        notes: initialData.notes || '',
        consent: initialData.consent,
      });
    } else {
      reset({
        name: '',
        company: '',
        phone: '',
        city: '',
        source: 'واتساب',
        status: 'جديد',
        last: '',
        next: '',
        notes: '',
        consent: true,
      });
    }
    setServerError(null);
    setDuplicateWarning(null);
  }, [initialData, reset, isOpen]);

  if (!isOpen) return null;

  const handleFormSubmit = async (data: CustomerFormData) => {
    setServerError(null);
    setSubmitting(true);
    try {
      await onSubmit(data, false);
      onClose();
    } catch (err: any) {
      if (err.response?.status === 409 && err.response?.data?.details?.duplicate) {
        setDuplicateWarning({
          existingCustomer: err.response.data.details.existingCustomer,
          attemptedPhone: data.phone,
          pendingData: data,
        });
      } else {
        setServerError(err.response?.data?.error || err.message || 'حدث خطأ أثناء الحفظ');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleForceConfirm = async () => {
    if (!duplicateWarning?.pendingData) return;
    setSubmitting(true);
    try {
      await onSubmit(duplicateWarning.pendingData, true);
      setDuplicateWarning(null);
      onClose();
    } catch (err: any) {
      setServerError(err.response?.data?.error || 'فشلت عملية الإضافة');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
        <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800 my-8">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {initialData ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {serverError && (
            <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  اسم العميل <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    {...register('name')}
                    type="text"
                    placeholder="مثال: عبدالله الشمري"
                    className="w-full rounded-xl border border-gray-300 pr-9 pl-3 py-2 text-sm focus:border-whatsapp focus:outline-none focus:ring-1 focus:ring-whatsapp dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  رقم الجوال (دولي بدون +) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    {...register('phone')}
                    type="text"
                    dir="ltr"
                    placeholder="966501234567"
                    className="w-full rounded-xl border border-gray-300 pr-9 pl-3 py-2 text-sm text-left font-mono focus:border-whatsapp focus:outline-none focus:ring-1 focus:ring-whatsapp dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
              </div>

              {/* Company */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  الشركة / المنشأة
                </label>
                <div className="relative">
                  <Building className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    {...register('company')}
                    type="text"
                    placeholder="اختياري"
                    className="w-full rounded-xl border border-gray-300 pr-9 pl-3 py-2 text-sm focus:border-whatsapp focus:outline-none focus:ring-1 focus:ring-whatsapp dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  المدينة
                </label>
                <div className="relative">
                  <MapPin className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    {...register('city')}
                    type="text"
                    placeholder="مثال: الرياض، جدة، دبي"
                    className="w-full rounded-xl border border-gray-300 pr-9 pl-3 py-2 text-sm focus:border-whatsapp focus:outline-none focus:ring-1 focus:ring-whatsapp dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Source */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  مصدر العميل
                </label>
                <select
                  {...register('source')}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-whatsapp focus:outline-none focus:ring-1 focus:ring-whatsapp dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  {['إعلان', 'واتساب', 'انستغرام', 'فيسبوك', 'توصية', 'معرض', 'أخرى'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  حالة العميل
                </label>
                <select
                  {...register('status')}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-whatsapp focus:outline-none focus:ring-1 focus:ring-whatsapp dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  {['جديد', 'تم التواصل', 'مهتم', 'تم البيع', 'غير مهتم'].map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {/* Last Contact */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  تاريخ آخر تواصل
                </label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    {...register('last')}
                    type="date"
                    className="w-full rounded-xl border border-gray-300 pr-9 pl-3 py-2 text-sm focus:border-whatsapp focus:outline-none focus:ring-1 focus:ring-whatsapp dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Next Followup */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  تاريخ المتابعة القادمة
                </label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    {...register('next')}
                    type="date"
                    className="w-full rounded-xl border border-gray-300 pr-9 pl-3 py-2 text-sm focus:border-whatsapp focus:outline-none focus:ring-1 focus:ring-whatsapp dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                الملاحظات وتفاصيل العميل
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                placeholder="أضف أي تفاصيل أو تفضيلات خاصة بالعميل..."
                className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-whatsapp focus:outline-none focus:ring-1 focus:ring-whatsapp dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* Mandatory Consent Box */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('consent')}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-whatsapp focus:ring-whatsapp"
                />
                <div className="text-xs">
                  <div className="flex items-center gap-1 font-bold text-emerald-900 dark:text-emerald-300">
                    <ShieldCheck className="h-4 w-4 text-whatsapp" />
                    <span>موافقة العميل الإلزامية على التواصل (Consent)</span>
                  </div>
                  <p className="mt-0.5 text-emerald-800/90 dark:text-emerald-400">
                    أقر بأن العميل قد أبدى موافقته الصريحة على التواصل معه عبر واتساب، وسيتم حفظ تاريخ الموافقة تلقائياً.
                  </p>
                  <p className="mt-1 text-[11px] font-mono text-gray-500 dark:text-gray-400">
                    تاريخ الموافقة المسجل: {formatDateArabic(initialData?.consentDate || new Date().toISOString())}
                  </p>
                </div>
              </label>
              {errors.consent && (
                <p className="mt-2 text-xs font-bold text-red-600">{errors.consent.message}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={submitting || !consentValue}
                className="flex items-center gap-2 rounded-xl bg-whatsapp px-6 py-2 text-sm font-bold text-white hover:bg-whatsapp-dark shadow-md shadow-whatsapp/20 disabled:opacity-50 transition-colors"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{submitting ? 'جاري الحفظ...' : initialData ? 'تحديث البيانات' : 'حفظ العميل'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <DuplicatePhoneModal
        isOpen={Boolean(duplicateWarning)}
        onClose={() => setDuplicateWarning(null)}
        onConfirmForce={handleForceConfirm}
        existingCustomer={duplicateWarning?.existingCustomer}
        attemptedPhone={duplicateWarning?.attemptedPhone || ''}
      />
    </>
  );
};
