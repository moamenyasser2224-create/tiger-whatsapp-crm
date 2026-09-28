import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { CustomerStatus, CustomerSource } from '../types/index.js';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export const formatDateArabic = formatDate;

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
  const rawMsg = templateBody || 'Hello {name}!';
  const message = rawMsg.replace(/\{name\}/g, customerName || 'Valued Customer');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export const STATUS_TRANSLATIONS: Record<string, string> = {
  'جديد': 'New',
  'تم التواصل': 'Contacted',
  'مهتم': 'Interested',
  'تم البيع': 'Closed Won',
  'غير مهتم': 'Not Interested',
  'New': 'New',
  'Contacted': 'Contacted',
  'Interested': 'Interested',
  'Closed Won': 'Closed Won',
  'Not Interested': 'Not Interested',
};

export const SOURCE_TRANSLATIONS: Record<string, string> = {
  'إعلان': 'Ad Campaign',
  'واتساب': 'WhatsApp',
  'انستغرام': 'Instagram',
  'فيسبوك': 'Facebook',
  'توصية': 'Referral',
  'معرض': 'Exhibition',
  'أخرى': 'Other',
  'Ad Campaign': 'Ad Campaign',
  'WhatsApp': 'WhatsApp',
  'Instagram': 'Instagram',
  'Facebook': 'Facebook',
  'Referral': 'Referral',
  'Exhibition': 'Exhibition',
  'Other': 'Other',
};

export function getStatusLabel(status: string): string {
  return STATUS_TRANSLATIONS[status] || status;
}

export function getSourceLabel(source: string): string {
  return SOURCE_TRANSLATIONS[source] || source;
}

export const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'جديد': {
    bg: 'bg-neutral-100 dark:bg-neutral-900',
    text: 'text-neutral-900 dark:text-neutral-100 font-bold',
    border: 'border-neutral-900 dark:border-neutral-300',
  },
  'New': {
    bg: 'bg-neutral-100 dark:bg-neutral-900',
    text: 'text-neutral-900 dark:text-neutral-100 font-bold',
    border: 'border-neutral-900 dark:border-neutral-300',
  },
  'تم التواصل': {
    bg: 'bg-neutral-200 dark:bg-neutral-800',
    text: 'text-neutral-800 dark:text-neutral-200 font-medium',
    border: 'border-neutral-400 dark:border-neutral-600',
  },
  'Contacted': {
    bg: 'bg-neutral-200 dark:bg-neutral-800',
    text: 'text-neutral-800 dark:text-neutral-200 font-medium',
    border: 'border-neutral-400 dark:border-neutral-600',
  },
  'مهتم': {
    bg: 'bg-neutral-800 dark:bg-neutral-200',
    text: 'text-white dark:text-neutral-900 font-bold',
    border: 'border-neutral-800 dark:border-neutral-200',
  },
  'Interested': {
    bg: 'bg-neutral-800 dark:bg-neutral-200',
    text: 'text-white dark:text-neutral-900 font-bold',
    border: 'border-neutral-800 dark:border-neutral-200',
  },
  'تم البيع': {
    bg: 'bg-black dark:bg-white',
    text: 'text-white dark:text-black font-black',
    border: 'border-black dark:border-white shadow-sm',
  },
  'Closed Won': {
    bg: 'bg-black dark:bg-white',
    text: 'text-white dark:text-black font-black',
    border: 'border-black dark:border-white shadow-sm',
  },
  'غير مهتم': {
    bg: 'bg-neutral-100 dark:bg-neutral-950',
    text: 'text-neutral-500 dark:text-neutral-500 line-through',
    border: 'border-neutral-300 dark:border-neutral-800',
  },
  'Not Interested': {
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
  'Ad Campaign': '#171717',
  'WhatsApp': '#404040',
  'Instagram': '#737373',
  'Facebook': '#a3a3a3',
  'Referral': '#525252',
  'Exhibition': '#262626',
  'Other': '#d4d4d4',
};

/**
 * Normalizes text for smart invariant search
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0656-\u065F\u0670]/g, '')
    .replace(/\u0640/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي');
}

export function matchesArabicSearch(target: string, query: string): boolean {
  if (!query) return true;
  if (!target) return false;
  return (
    target.toLowerCase().includes(query.toLowerCase()) ||
    normalizeArabic(target).includes(normalizeArabic(query))
  );
}
