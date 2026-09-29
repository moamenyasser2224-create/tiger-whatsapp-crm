import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  email: z
    .string({ required_error: 'Email address is required' })
    .email('Invalid email address format')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit'),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email address is required' })
    .email('Invalid email address format')
    .toLowerCase()
    .trim(),
  password: z.string({ required_error: 'Password is required' }),
  twoFactorCode: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email address is required' })
    .email('Invalid email address format')
    .toLowerCase()
    .trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string({ required_error: 'Reset token is required' }),
  password: z
    .string({ required_error: 'New password is required' })
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit'),
});

export const verifyTwoFactorSchema = z.object({
  code: z
    .string({ required_error: 'Verification code is required' })
    .length(6, 'Verification code must be exactly 6 digits')
    .regex(/^[0-9]{6}$/, 'Verification code must contain digits only'),
});

export const disableTwoFactorSchema = z.object({
  password: z.string({ required_error: 'Password is required to disable two-factor authentication' }),
});
