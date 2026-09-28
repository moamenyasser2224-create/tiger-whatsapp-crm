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

export const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'جديد': {
    bg: 'bg-neutral-100 dark:bg-neutral-900',
    text: 'text-neutral-900 dark:text-neutral-100 font-bold',
    border: 'border-neutral-900 dark:border-neutral-300',
  },
  'تم التواصل': {
    bg: 'bg-neutral-200 dark:bg-neutral-800',
    text: 'text-neutral-800 dark:text-neutral-200 font-medium',
    border: 'border-neutral-400 dark:border-neutral-600',
  },
  'مهتم': {
    bg: 'bg-neutral-800 dark:bg-neutral-200',
    text: 'text-white dark:text-neutral-900 font-bold',
    border: 'border-neutral-800 dark:border-neutral-200',
  },
  'تم البيع': {
    bg: 'bg-black dark:bg-white',
    text: 'text-white dark:text-black font-black',
    border: 'border-black dark:border-white shadow-sm',
  },
  'غير مهتم': {
    bg: 'bg-neutral-100 dark:bg-neutral-950',
    text: 'text-neutral-500 dark:text-neutral-500 line-through',
    border: 'border-neutral-300 dark:border-neutral-800',
  },
};

export const SOURCE_COLORS: Record<string, string> = {
  'إعلان': '#171717',
  'واتساب': '#404040',
  'انستغرام': '#737373',
  'فيسبوك': '#a3a3a3',
  'توصية': '#525252',
  'معرض': '#262626',
  'أخرى': '#d4d4d4',
};

/**
 * Normalizes Arabic text for smart invariant search:
 * - Strips tashkeel (diacritics)
 * - Strips tatweel (kashida)
 * - Normalizes alifs (أ إ آ ٱ -> ا)
 * - Normalizes taa marbuta (ة -> ه)
 * - Normalizes yaa and alif maqsura (ى -> ي)
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    // Strip diacritics
    .replace(/[\u064B-\u0652\u0656-\u065F\u0670]/g, '')
    // Strip tatweel
    .replace(/\u0640/g, '')
    // Unify alifs
    .replace(/[أإآٱ]/g, 'ا')
    // Unify taa marbuta
    .replace(/ة/g, 'ه')
    // Unify yaa / alif maqsura
    .replace(/ى/g, 'ي');
}

/**
 * Checks if search query matches target text using normalized Arabic
 */
export function matchesArabicSearch(target: string, query: string): boolean {
  if (!query) return true;
  if (!target) return false;
  return normalizeArabic(target).includes(normalizeArabic(query));
}

