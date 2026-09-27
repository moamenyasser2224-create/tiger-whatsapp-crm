import { z } from 'zod';
import { CUSTOMER_SOURCES, CUSTOMER_STATUSES, PHONE_REGEX } from '../config/constants.js';

export const createCustomerSchema = z.object({
  name: z
    .string({ required_error: 'اسم العميل مطلوب' })
    .min(2, 'اسم العميل يجب أن لا يقل عن حرفين')
    .max(120, 'اسم العميل يجب أن لا يتجاوز 120 حرف')
    .trim(),
  company: z.string().max(120, 'اسم الشركة يجب أن لا يتجاوز 120 حرف').optional().nullable(),
  phone: z
    .string({ required_error: 'رقم الجوال مطلوب' })
    .trim()
    .transform((val) => val.replace(/\D/g, ''))
    .refine((val) => PHONE_REGEX.test(val), {
      message: 'رقم الجوال يجب أن يتكون من أرقام فقط بصيغة دولية بدون + (8 إلى 15 رقم)',
    }),
  city: z.string().max(100, 'المدينة يجب أن لا تتجاوز 100 حرف').optional().nullable(),
  source: z
    .enum(CUSTOMER_SOURCES, {
      errorMap: () => ({ message: 'المصدر المحدد غير صالح' }),
    })
    .default('واتساب'),
  status: z
    .enum(CUSTOMER_STATUSES, {
      errorMap: () => ({ message: 'الحالة المحددة غير صالحة' }),
    })
    .default('جديد'),
  last: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
  next: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
  notes: z.string().max(2000, 'الملاحظات يجب أن لا تتجاوز 2000 حرف').optional().nullable(),
  consent: z
    .boolean({ required_error: 'الموافقة الصريحة للعميل مطلوبة قبل الحفظ' })
    .refine((val) => val === true, {
      message: 'يجب تأكيد موافقة العميل على التواصل قبل الحفظ',
    }),
  force: z.boolean().optional().default(false),
});

export const updateCustomerSchema = z.object({
  name: z
    .string()
    .min(2, 'اسم العميل يجب أن لا يقل عن حرفين')
    .max(120, 'اسم العميل يجب أن لا يتجاوز 120 حرف')
    .trim()
    .optional(),
  company: z.string().max(120, 'اسم الشركة يجب أن لا يتجاوز 120 حرف').optional().nullable(),
  phone: z
    .string()
    .trim()
    .transform((val) => val.replace(/\D/g, ''))
    .refine((val) => PHONE_REGEX.test(val), {
      message: 'رقم الجوال يجب أن يتكون من أرقام فقط بصيغة دولية بدون + (8 إلى 15 رقم)',
    })
    .optional(),
  city: z.string().max(100, 'المدينة يجب أن لا تتجاوز 100 حرف').optional().nullable(),
  source: z
    .enum(CUSTOMER_SOURCES, {
      errorMap: () => ({ message: 'المصدر المحدد غير صالح' }),
    })
    .optional(),
  status: z
    .enum(CUSTOMER_STATUSES, {
      errorMap: () => ({ message: 'الحالة المحددة غير صالحة' }),
    })
    .optional(),
  last: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
  next: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
  notes: z.string().max(2000, 'الملاحظات يجب أن لا تتجاوز 2000 حرف').optional().nullable(),
  consent: z.boolean().optional(),
});

export const customerQuerySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  source: z.string().optional(),
  city: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'next', 'last', 'status']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.string().optional().transform((v) => (v ? Math.max(1, parseInt(v, 10)) : 1)),
  limit: z.string().optional().transform((v) => (v ? Math.min(100, Math.max(1, parseInt(v, 10))) : 20)),
});

export const importCsvSchema = z.object({
  csvText: z.string({ required_error: 'نص CSV مطلوب' }).min(1, 'ملف CSV فارغ'),
});
