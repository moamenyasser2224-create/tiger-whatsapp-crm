import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import type { Customer, ListOption } from '../types/index.js';
import { X, CheckSquare, Square, User, Phone, Building, MapPin, Calendar, FileText, AlertCircle } from 'lucide-react';
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
  sourceId: z.string().optional().nullable(),
  statusId: z.string().optional().nullable(),
  source: z.string().optional(),
  status: z.string().optional(),
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

  // Fetch dynamic list options from database (No hardcoding)
  const { data: listOptions = [] } = useQuery<ListOption[]>({
    queryKey: ['options'],
    queryFn: async () => {
      const res = await api.get('/options');
      return res.data.data;
    },
    staleTime: 60000,
  });

  const sources = listOptions.filter((o) => o.type === 'source');
  const statuses = listOptions.filter((o) => o.type === 'status');

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
      sourceId: sources[0]?.id || '',
      statusId: statuses[0]?.id || '',
      source: 'واتساب',
      status: 'جديد',
      last: '',
      next: '',
      notes: '',
      consent: false,
    },
  });

  const consentValue = watch('consent');

  useEffect(() => {
    if (initialData) {
      const matchedSource = sources.find((s) => s.id === initialData.sourceId || s.label === initialData.source);
      const matchedStatus = statuses.find((s) => s.id === initialData.statusId || s.label === initialData.status);

      reset({
        name: initialData.name,
        company: initialData.company || '',
        phone: initialData.phone,
        city: initialData.city || '',
        sourceId: matchedSource?.id || initialData.sourceId || '',
        statusId: matchedStatus?.id || initialData.statusId || '',
        source: initialData.source,
        status: initialData.status,
        last: initialData.last ? new Date(initialData.last).toISOString().split('T')[0] : '',
        next: initialData.next ? new Date(initialData.next).toISOString().split('T')[0] : '',
        notes: initialData.notes || '',
        consent: initialData.consent,
      });
    } else {
      reset({
        name: '',
        company: '',
        phone: '',
        city: '',
        sourceId: sources[0]?.id || '',
        statusId: statuses[0]?.id || '',
        source: sources[0]?.label || 'واتساب',
        status: statuses[0]?.label || 'جديد',
        last: '',
        next: '',
        notes: '',
        consent: false,
      });
    }
    setServerError(null);
    setDuplicateWarning(null);
  }, [initialData, reset, isOpen, listOptions.length]);

  if (!isOpen) return null;

  const handleFormSubmit = async (data: CustomerFormData) => {
    setServerError(null);
    setSubmitting(true);

    try {
      // Sync labels with IDs
      const selectedSource = sources.find((s) => s.id === data.sourceId);
      const selectedStatus = statuses.find((s) => s.id === data.statusId);
      if (selectedSource) data.source = selectedSource.label;
      if (selectedStatus) data.status = selectedStatus.label;

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
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs overflow-y-auto">
        <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 my-8">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-4 dark:border-neutral-800">
            <h2 className="text-xl font-black text-neutral-900 dark:text-white">
              {initialData ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {serverError && (
            <div className="mt-4 rounded-xl border-2 border-neutral-900 bg-neutral-100 p-3 text-sm font-bold text-neutral-900 dark:border-white dark:bg-neutral-800 dark:text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-neutral-900 dark:text-neutral-200 mb-1">
                  اسم العميل <span className="font-mono text-xs font-black">(*)</span>
                </label>
                <div className="relative">
                  <User className="absolute right-3 top-2.5 h-4 w-4 text-neutral-400" />
                  <input
                    {...register('name')}
                    type="text"
                    placeholder="مثال: عبدالله الشمري"
                    className="w-full rounded-xl border border-neutral-300 pr-9 pl-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-white dark:focus:ring-white"
                  />
                </div>
                {errors.name && <p className="mt-1 text-xs font-bold text-neutral-900 dark:text-neutral-200 underline">{errors.name.message}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-neutral-900 dark:text-neutral-200 mb-1">
                  رقم الجوال (دولي بدون +) <span className="font-mono text-xs font-black">(*)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute right-3 top-2.5 h-4 w-4 text-neutral-400" />
                  <input
                    {...register('phone')}
                    type="text"
                    dir="ltr"
                    placeholder="966501234567"
                    className="w-full rounded-xl border border-neutral-300 pr-9 pl-3 py-2 text-sm text-left font-mono focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-white dark:focus:ring-white"
                  />
                </div>
                {errors.phone && <p className="mt-1 text-xs font-bold text-neutral-900 dark:text-neutral-200 underline">{errors.phone.message}</p>}
              </div>

              {/* Company */}
              <div>
                <label className="block text-xs font-bold text-neutral-900 dark:text-neutral-200 mb-1">
                  الشركة / المنشأة
                </label>
                <div className="relative">
                  <Building className="absolute right-3 top-2.5 h-4 w-4 text-neutral-400" />
                  <input
                    {...register('company')}
                    type="text"
                    placeholder="اختياري"
                    className="w-full rounded-xl border border-neutral-300 pr-9 pl-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-white dark:focus:ring-white"
                  />
                </div>
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-bold text-neutral-900 dark:text-neutral-200 mb-1">
                  المدينة
                </label>
                <div className="relative">
                  <MapPin className="absolute right-3 top-2.5 h-4 w-4 text-neutral-400" />
                  <input
                    {...register('city')}
                    type="text"
                    placeholder="مثال: الرياض"
                    className="w-full rounded-xl border border-neutral-300 pr-9 pl-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-white dark:focus:ring-white"
                  />
                </div>
              </div>

              {/* Source (Dynamic from ListOption) */}
              <div>
                <label className="block text-xs font-bold text-neutral-900 dark:text-neutral-200 mb-1">
                  المصدر
                </label>
                <select
                  {...register('sourceId')}
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-white dark:focus:ring-white"
                >
                  {sources.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status (Dynamic from ListOption) */}
              <div>
                <label className="block text-xs font-bold text-neutral-900 dark:text-neutral-200 mb-1">
                  حالة العميل
                </label>
                <select
                  {...register('statusId')}
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-white dark:focus:ring-white"
                >
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Last Follow-up */}
              <div>
                <label className="block text-xs font-bold text-neutral-900 dark:text-neutral-200 mb-1">
                  تاريخ آخر تواصل
                </label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-neutral-400" />
                  <input
                    {...register('last')}
                    type="date"
                    className="w-full rounded-xl border border-neutral-300 pr-9 pl-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-white dark:focus:ring-white"
                  />
                </div>
              </div>

              {/* Next Follow-up */}
              <div>
                <label className="block text-xs font-bold text-neutral-900 dark:text-neutral-200 mb-1">
                  تاريخ المتابعة القادمة
                </label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-neutral-400" />
                  <input
                    {...register('next')}
                    type="date"
                    className="w-full rounded-xl border border-neutral-300 pr-9 pl-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-white dark:focus:ring-white"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-neutral-900 dark:text-neutral-200 mb-1">
                ملاحظات وتفاصيل المتابعة
              </label>
              <div className="relative">
                <FileText className="absolute right-3 top-2.5 h-4 w-4 text-neutral-400" />
                <textarea
                  {...register('notes')}
                  rows={3}
                  placeholder="أدخل أي ملاحظات حول المحادثة أو متطلبات العميل..."
                  className="w-full rounded-xl border border-neutral-300 pr-9 pl-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-white dark:focus:ring-white"
                />
              </div>
            </div>

            {/* Consent Checkbox - Mandatory */}
            <div className="rounded-xl border-2 border-neutral-900 dark:border-neutral-100 p-4 bg-neutral-50 dark:bg-neutral-950">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register('consent')}
                  className="sr-only"
                />
                <div className="mt-0.5">
                  {consentValue ? (
                    <CheckSquare className="h-5 w-5 text-neutral-900 dark:text-white fill-neutral-900 dark:fill-white text-white dark:text-black" />
                  ) : (
                    <Square className="h-5 w-5 text-neutral-400" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-black text-neutral-900 dark:text-white">
                    أقر بموافقة العميل الصريحة على التواصل معه عبر واتساب (إلزامي)
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    يتم تسجيل الطابع الزمني للموافقة تلقائياً في سجلات النظام.
                    {initialData?.consentDate && (
                      <span className="block mt-1 font-mono text-[11px] font-bold">
                        تاريخ توثيق الموافقة الأصلي: {formatDateArabic(initialData.consentDate)}
                      </span>
                    )}
                  </div>
                </div>
              </label>
              {errors.consent && (
                <p className="mt-2 text-xs font-bold text-neutral-900 dark:text-white underline">
                  {errors.consent.message}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-bold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-neutral-900 px-6 py-2.5 text-sm font-black text-white hover:bg-black active:scale-95 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 transition-all border border-neutral-900 dark:border-white"
              >
                {submitting ? 'جاري الحفظ...' : initialData ? 'تحديث البيانات' : 'حفظ العميل'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Duplicate Phone Warning Modal */}
      {duplicateWarning && (
        <DuplicatePhoneModal
          isOpen={true}
          onClose={() => setDuplicateWarning(null)}
          onConfirmForce={handleForceConfirm}
          attemptedPhone={duplicateWarning.attemptedPhone}
          existingCustomer={duplicateWarning.existingCustomer}
        />
      )}
    </>
  );
};
