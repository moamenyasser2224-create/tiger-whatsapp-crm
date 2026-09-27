import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { CustomerStatus, CustomerSource } from '../types/index.js';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateArabic(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function isOverdue(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < today;
}

export function isDueToday(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date.getTime() === today.getTime();
}

/**
 * Builds a direct WhatsApp click-to-chat URL with replaced name in template
 */
export function generateWhatsAppUrl(
  rawPhone: string,
  templateBody?: string,
  customerName?: string
): string {
  const cleanPhone = rawPhone.replace(/\D/g, '');
  const rawMsg = templateBody || 'مرحباً {name}!';
  const message = rawMsg.replace(/\{name\}/g, customerName || 'عزيزي العميل');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export const STATUS_COLORS: Record<CustomerStatus, { bg: string; text: string; border: string }> = {
  'جديد': {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
  },
  'تم التواصل': {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
  },
  'مهتم': {
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-700 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
  },
  'تم البيع': {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  'غير مهتم': {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800',
  },
};

export const SOURCE_COLORS: Record<CustomerSource, string> = {
  'إعلان': '#3b82f6',
  'واتساب': '#22c55e',
  'انستغرام': '#ec4899',
  'فيسبوك': '#1d4ed8',
  'توصية': '#8b5cf6',
  'معرض': '#f59e0b',
  'أخرى': '#64748b',
};
