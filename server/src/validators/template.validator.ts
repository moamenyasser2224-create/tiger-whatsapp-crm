import { z } from 'zod';
import { CUSTOMER_STATUSES } from '../config/constants.js';

export const updateTemplateSchema = z.object({
  body: z
    .string({ required_error: 'نص القالب مطلوب' })
    .min(5, 'نص القالب يجب أن لا يقل عن 5 أحرف')
    .max(2000, 'نص القالب يجب أن لا يتجاوز 2000 حرف')
    .refine((val) => val.includes('{name}'), {
      message: 'يجب أن يحتوي نص القالب على المتغير {name} لاستبداله باسم العميل',
    }),
});

export const templateStatusParamSchema = z.object({
  status: z.enum(CUSTOMER_STATUSES, {
    errorMap: () => ({ message: 'الحالة المحددة للقالب غير صالحة' }),
  }),
});
