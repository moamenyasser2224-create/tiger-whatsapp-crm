import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'الاسم مطلوب' })
    .min(2, 'الاسم يجب أن لا يقل عن حرفين')
    .max(100, 'الاسم يجب أن لا يتجاوز 100 حرف'),
  email: z
    .string({ required_error: 'البريد الإلكتروني مطلوب' })
    .email('صيغة البريد الإلكتروني غير صحيحة')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'كلمة المرور مطلوبة' })
    .min(8, 'كلمة المرور يجب أن لا تقل عن 8 أحرف')
    .regex(/[A-Z]/, 'كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل')
    .regex(/[a-z]/, 'كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل')
    .regex(/[0-9]/, 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل'),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'البريد الإلكتروني مطلوب' })
    .email('صيغة البريد الإلكتروني غير صحيحة')
    .toLowerCase()
    .trim(),
  password: z.string({ required_error: 'كلمة المرور مطلوبة' }),
  twoFactorCode: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'البريد الإلكتروني مطلوب' })
    .email('صيغة البريد الإلكتروني غير صحيحة')
    .toLowerCase()
    .trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string({ required_error: 'رمز إعادة التعيين مطلوب' }),
  password: z
    .string({ required_error: 'كلمة المرور الجديدة مطلوبة' })
    .min(8, 'كلمة المرور يجب أن لا تقل عن 8 أحرف')
    .regex(/[A-Z]/, 'كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل')
    .regex(/[a-z]/, 'كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل')
    .regex(/[0-9]/, 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل'),
});

export const verifyTwoFactorSchema = z.object({
  code: z
    .string({ required_error: 'رمز التحقق مطلوب' })
    .length(6, 'رمز التحقق يجب أن يتكون من 6 أرقام')
    .regex(/^[0-9]{6}$/, 'رمز التحقق يجب أن يحتوي على أرقام فقط'),
});

export const disableTwoFactorSchema = z.object({
  password: z.string({ required_error: 'كلمة المرور مطلوبة لتعطيل التحقق الثنائي' }),
});
