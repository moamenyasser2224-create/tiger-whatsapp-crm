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
  '\u062C\u062F\u064A\u062F': 'New',
  '\u062A\u0645 \u0627\u0644\u062A\u0648\u0627\u0635\u0644': 'Contacted',
  '\u0645\u0647\u062A\u0645': 'Interested',
  '\u062A\u0645 \u0627\u0644\u0628\u064A\u0639': 'Closed Won',
  '\u063A\u064A\u0631 \u0645\u0647\u062A\u0645': 'Not Interested',
  'New': 'New',
  'Contacted': 'Contacted',
  'Interested': 'Interested',
  'Closed Won': 'Closed Won',
  'Not Interested': 'Not Interested',
};

export const SOURCE_TRANSLATIONS: Record<string, string> = {
  '\u0625\u0639\u0644\u0627\u0646': 'Ad Campaign',
  '\u0648\u0627\u062A\u0633\u0627\u0628': 'WhatsApp',
  '\u0627\u0646\u0633\u062A\u063A\u0631\u0627\u0645': 'Instagram',
  '\u0641\u064A\u0633\u0628\u0648\u0643': 'Facebook',
  '\u062A\u0648\u0635\u064A\u0629': 'Referral',
  '\u0645\u0639\u0631\u0638': 'Exhibition',
  '\u0623\u062E\u0631\u0649': 'Other',
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
  '\u062C\u062F\u064A\u062F': {
    bg: 'bg-neutral-100 dark:bg-neutral-900',
    text: 'text-neutral-900 dark:text-neutral-100 font-bold',
    border: 'border-neutral-900 dark:border-neutral-300',
  },
  'New': {
    bg: 'bg-neutral-100 dark:bg-neutral-900',
    text: 'text-neutral-900 dark:text-neutral-100 font-bold',
    border: 'border-neutral-900 dark:border-neutral-300',
  },
  '\u062A\u0645 \u0627\u0644\u062A\u0648\u0627\u0635\u0644': {
    bg: 'bg-neutral-200 dark:bg-neutral-800',
    text: 'text-neutral-800 dark:text-neutral-200 font-medium',
    border: 'border-neutral-400 dark:border-neutral-600',
  },
  'Contacted': {
    bg: 'bg-neutral-200 dark:bg-neutral-800',
    text: 'text-neutral-800 dark:text-neutral-200 font-medium',
    border: 'border-neutral-400 dark:border-neutral-600',
  },
  '\u0645\u0647\u062A\u0645': {
    bg: 'bg-neutral-800 dark:bg-neutral-200',
    text: 'text-white dark:text-neutral-900 font-bold',
    border: 'border-neutral-800 dark:border-neutral-200',
  },
  'Interested': {
    bg: 'bg-neutral-800 dark:bg-neutral-200',
    text: 'text-white dark:text-neutral-900 font-bold',
    border: 'border-neutral-800 dark:border-neutral-200',
  },
  '\u062A\u0645 \u0627\u0644\u0628\u064A\u0639': {
    bg: 'bg-black dark:bg-white',
    text: 'text-white dark:text-black font-black',
    border: 'border-black dark:border-white shadow-sm',
  },
  'Closed Won': {
    bg: 'bg-black dark:bg-white',
    text: 'text-white dark:text-black font-black',
    border: 'border-black dark:border-white shadow-sm',
  },
  '\u063A\u064A\u0631 \u0645\u0647\u062A\u0645': {
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
  '\u0625\u0639\u0644\u0627\u0646': '#171717',
  '\u0648\u0627\u062A\u0633\u0627\u0628': '#404040',
  '\u0627\u0646\u0633\u062A\u063A\u0631\u0627\u0645': '#737373',
  '\u0641\u064A\u0633\u0628\u0648\u0643': '#a3a3a3',
  '\u062A\u0648\u0635\u064A\u0629': '#525252',
  '\u0645\u0639\u0631\u0638': '#262626',
  '\u0623\u062E\u0631\u0649': '#d4d4d4',
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
    .replace(/[\u0623\u0625\u0622\u0671]/g, '\u0627')
    .replace(/\u0629/g, '\u0647')
    .replace(/\u0649/g, '\u064A');
}

export function matchesArabicSearch(target: string, query: string): boolean {
  if (!query) return true;
  if (!target) return false;
  return (
    target.toLowerCase().includes(query.toLowerCase()) ||
    normalizeArabic(target).includes(normalizeArabic(query))
  );
}
