import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import type { Customer, MessageTemplate } from '../types/index.js';
import { formatDateArabic, isOverdue, generateWhatsAppUrl } from '../lib/utils.js';
import { Clock, AlertCircle, MessageCircle, Calendar } from 'lucide-react';

interface DueTodayBannerProps {
  onCustomerClick?: (customer: Customer) => void;
}

export const DueTodayBanner: React.FC<DueTodayBannerProps> = ({ onCustomerClick }) => {
  const { data: dueCustomers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['customers', 'due-today'],
    queryFn: async () => {
      const { data } = await api.get('/customers/due-today');
      return data.data || [];
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  const { data: templates = [] } = useQuery<MessageTemplate[]>({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data } = await api.get('/templates');
      return data.data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 animate-pulse">
        <div className="h-5 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-3" />
        <div className="h-16 bg-gray-100 dark:bg-gray-800/50 rounded-xl" />
      </div>
    );
  }

  if (dueCustomers.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold">لا توجد متابعات مستحقة اليوم أو متأخرة 🎉</h3>
            <p className="text-xs opacity-90">جميع العملاء في حالة متابعة منتظمة ومحدثة.</p>
          </div>
        </div>
      </div>
    );
  }

  const overdueList = dueCustomers.filter((c) => isOverdue(c.next));
  const todayList = dueCustomers.filter((c) => !isOverdue(c.next));

  const getTemplateForCustomer = (customer: Customer) => {
    const tpl = templates.find((t) => t.status === customer.status);
    return tpl ? tpl.body : undefined;
  };

  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5 shadow-sm dark:border-amber-900/40 dark:from-amber-950/20 dark:to-orange-950/20 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm shadow-amber-500/30">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              متابعات اليوم والمتأخرة ({dueCustomers.length})
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {overdueList.length > 0 && (
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                  {overdueList.length} متأخرة •{' '}
                </span>
              )}
              {todayList.length} مستحقة اليوم
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {dueCustomers.map((customer) => {
          const overdue = isOverdue(customer.next);
          const tplBody = getTemplateForCustomer(customer);
          const waUrl = generateWhatsAppUrl(customer.phone, tplBody, customer.name);

          return (
            <div
              key={customer.id}
              className={`flex flex-col justify-between rounded-xl border p-3.5 transition-all bg-white dark:bg-gray-900 shadow-sm ${
                overdue
                  ? 'border-rose-200 dark:border-rose-900/60 hover:border-rose-300'
                  : 'border-amber-200 dark:border-amber-900/60 hover:border-amber-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <button
                    onClick={() => onCustomerClick?.(customer)}
                    className="font-bold text-sm text-gray-900 dark:text-gray-100 hover:text-whatsapp dark:hover:text-whatsapp text-right transition-colors"
                  >
                    {customer.name}
                  </button>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      overdue
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                    }`}
                  >
                    {overdue ? 'متأخرة' : 'اليوم'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>المتابعة: {formatDateArabic(customer.next)}</span>
                </div>

                {customer.company && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mb-2">
                    {customer.company}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800 gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  الحالة: <span className="font-semibold text-gray-700 dark:text-gray-200">{customer.status}</span>
                </span>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-whatsapp px-3 py-1.5 text-xs font-bold text-white hover:bg-whatsapp-dark shadow-sm shadow-whatsapp/20 transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>مراسلة واتساب</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
