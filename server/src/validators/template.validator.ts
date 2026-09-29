import { z } from 'zod';

export const updateTemplateSchema = z.object({
  body: z
    .string({ required_error: 'Template content is required' })
    .min(5, 'Template must be at least 5 characters long')
    .max(2000, 'Template cannot exceed 2000 characters')
    .refine((val) => val.includes('{name}'), {
      message: 'Template must contain the {name} placeholder to interpolate customer names',
    }),
});

export const templateStatusParamSchema = z.object({
  status: z.string({ required_error: 'Template stage parameter is required' }).min(1),
});
