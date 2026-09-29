import { z } from 'zod';
import { PHONE_REGEX } from '../config/constants.js';

export const createCustomerSchema = z.object({
  name: z
    .string({ required_error: 'Customer name is required' })
    .min(2, 'Customer name must be at least 2 characters')
    .max(120, 'Customer name must not exceed 120 characters')
    .trim(),
  company: z.string().max(120, 'Company name must not exceed 120 characters').optional().nullable(),
  phone: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .transform((val) => val.replace(/\D/g, ''))
    .refine((val) => PHONE_REGEX.test(val), {
      message: 'Phone number must consist of 8 to 15 digits in international format without +',
    }),
  city: z.string().max(100, 'City must not exceed 100 characters').optional().nullable(),
  source: z.string().optional().default('WhatsApp'),
  status: z.string().optional().default('New'),
  sourceId: z.string().uuid().optional().nullable(),
  statusId: z.string().uuid().optional().nullable(),
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
  notes: z.string().max(2000, 'Notes must not exceed 2000 characters').optional().nullable(),
  consent: z
    .boolean({ required_error: 'Explicit client communication consent is required' })
    .refine((val) => val === true, {
      message: 'Client communication consent must be confirmed before saving',
    }),
  force: z.boolean().optional().default(false),
});

export const updateCustomerSchema = z.object({
  name: z
    .string()
    .min(2, 'Customer name must be at least 2 characters')
    .max(120, 'Customer name must not exceed 120 characters')
    .trim()
    .optional(),
  company: z.string().max(120, 'Company name must not exceed 120 characters').optional().nullable(),
  phone: z
    .string()
    .trim()
    .transform((val) => val.replace(/\D/g, ''))
    .refine((val) => PHONE_REGEX.test(val), {
      message: 'Phone number must consist of 8 to 15 digits in international format without +',
    })
    .optional(),
  city: z.string().max(100, 'City must not exceed 100 characters').optional().nullable(),
  source: z.string().optional(),
  status: z.string().optional(),
  sourceId: z.string().uuid().optional().nullable(),
  statusId: z.string().uuid().optional().nullable(),
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
  notes: z.string().max(2000, 'Notes must not exceed 2000 characters').optional().nullable(),
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
  csvText: z.string({ required_error: 'CSV content is required' }).min(1, 'CSV file cannot be empty'),
});
