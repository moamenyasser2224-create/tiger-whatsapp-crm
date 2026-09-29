import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import type { Customer, MessageTemplate } from '../types/index.js';
import { formatDate, isOverdue, generateWhatsAppUrl, getStatusLabel } from '../lib/utils.js';
import { Clock, AlertCircle, MessageCircle, Calendar } from 'lucide-react';
import { StatusBadge } from './common/StatusBadge.js';

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
    refetchInterval: 30000,
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
      <div className="rounded-xl border border-border bg-card p-4 shadow-subtle animate-pulse mb-6">
        <div className="h-4 w-48 bg-border rounded mb-3" />
        <div className="h-16 bg-bg rounded-lg" />
      </div>
    );
  }

  if (dueCustomers.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 shadow-subtle text-text flex items-center justify-between mb-6" dir="ltr">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-bg text-muted">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-text">No Follow-ups Due Today</h3>
            <p className="text-xs text-muted">All client accounts are updated and on schedule.</p>
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
    <div className="rounded-xl border border-border bg-card p-5 shadow-subtle mb-6" dir="ltr">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <AlertCircle className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text">
              Action Required ({dueCustomers.length})
            </h2>
            <p className="text-xs text-muted">
              {overdueList.length > 0 && (
                <span className="text-danger font-medium">
                  {overdueList.length} Overdue &bull;{' '}
                </span>
              )}
              {todayList.length} Due Today
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
              className={`flex flex-col justify-between rounded-lg p-3.5 transition-colors bg-card shadow-subtle ${
                overdue
                  ? 'border border-danger/60'
                  : 'border border-border hover:border-accent'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <button
                    onClick={() => onCustomerClick?.(customer)}
                    className="font-semibold text-xs text-text hover:text-accent text-left transition-colors cursor-pointer truncate"
                  >
                    {customer.name}
                  </button>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      overdue
                        ? 'bg-danger-soft text-danger'
                        : 'bg-accent-soft text-accent'
                    }`}
                  >
                    {overdue ? 'Overdue' : 'Today'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted mb-2">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="tabular-nums">Next: {formatDate(customer.next)}</span>
                </div>

                {customer.company && (
                  <p className="text-xs text-muted line-clamp-1 mb-2">
                    {customer.company}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-border gap-2">
                <StatusBadge label={getStatusLabel(customer.status)} statusKey={customer.status} />

                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-text hover:bg-bg transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5 text-muted" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
