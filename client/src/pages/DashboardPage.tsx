import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import type { DashboardStats, Customer } from '../types/index.js';
import { DueTodayBanner } from '../components/DueTodayBanner.js';
import { StatsCharts } from '../components/StatsCharts.js';
import { CustomerModal } from '../components/CustomerModal.js';
import {
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  UserPlus,
  FileSpreadsheet,
  MessageSquareQuote,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MotionPage } from '../components/motion/MotionPage.js';
import { CountUp } from '../components/motion/CountUp.js';
import { LedgerButton } from '../components/common/LedgerComponents.js';

export const DashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['customers', 'stats'],
    queryFn: async () => {
      const { data } = await api.get('/customers/stats');
      return data.data;
    },
  });

  const handleCustomerModalSubmit = async (formData: any, force = false) => {
    if (selectedCustomer) {
      await api.put(`/customers/${selectedCustomer.id}`, formData);
    } else {
      await api.post('/customers', { ...formData, force });
    }
    queryClient.invalidateQueries({ queryKey: ['customers'] });
  };

  const handleExportCsv = async () => {
    try {
      const response = await api.get('/customers/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tiger_customers_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error('Export error:', e);
    }
  };

  return (
    <MotionPage className="space-y-6">
      {/* Top Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted font-medium">
            <span>Executive Overview</span>
            <span>/</span>
            <span>Metrics &amp; KPIs</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-text mt-1">
            Performance KPIs &amp; Executive Analytics
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Real-time tracking of sales pipeline conversion, customer accounts, and scheduled follow-ups.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <LedgerButton
            variant="primary"
            size="sm"
            onClick={() => {
              setSelectedCustomer(null);
              setIsCustomerModalOpen(true);
            }}
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Customer</span>
          </LedgerButton>

          <LedgerButton
            variant="secondary"
            size="sm"
            onClick={handleExportCsv}
          >
            <FileSpreadsheet className="h-4 w-4 text-muted" />
            <span>Export CSV</span>
          </LedgerButton>

          <Link
            to="/templates"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-text hover:bg-bg transition-colors shadow-subtle"
          >
            <MessageSquareQuote className="h-4 w-4 text-muted" />
            <span>WhatsApp Templates</span>
          </Link>
        </div>
      </div>

      {/* Dynamic Due Today & Overdue Banner */}
      <DueTodayBanner
        onCustomerClick={(cust) => {
          setSelectedCustomer(cust);
          setIsCustomerModalOpen(true);
        }}
      />

      {/* KPI Cards with Quiet Professionalism */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-subtle hover:border-accent transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted">Total Customers</p>
              <h3 className="text-2xl font-semibold text-text mt-1 tabular-nums">
                {statsLoading ? '...' : <CountUp end={stats?.totalCustomers || 0} />}
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <Users className="h-5 w-5 stroke-[1.5]" />
            </div>
          </div>
        </div>

        {/* Due Today & Overdue */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-subtle hover:border-accent transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted">Action Required Today</p>
              <h3 className="text-2xl font-semibold text-text mt-1 tabular-nums">
                {statsLoading ? '...' : <CountUp end={stats?.dueTodayCount || 0} />}
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <Clock className="h-5 w-5 stroke-[1.5]" />
            </div>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-subtle hover:border-accent transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted">Pipeline Conversion</p>
              <h3 className="text-2xl font-semibold text-text mt-1 tabular-nums">
                {statsLoading ? '...' : <><CountUp end={stats?.conversionRate || 0} decimals={1} />%</>}
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <TrendingUp className="h-5 w-5 stroke-[1.5]" />
            </div>
          </div>
        </div>

        {/* Sold Count */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-subtle hover:border-accent transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted">Closed Won Deals</p>
              <h3 className="text-2xl font-semibold text-text mt-1 tabular-nums">
                {statsLoading ? '...' : <CountUp end={(stats?.statusDistribution as any)?.['Closed Won'] || 0} />}
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <CheckCircle className="h-5 w-5 stroke-[1.5]" />
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      {stats && <StatsCharts stats={stats} />}

      {/* Add / Edit Customer Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setSelectedCustomer(null);
        }}
        onSubmit={handleCustomerModalSubmit}
        initialData={selectedCustomer}
      />
    </MotionPage>
  );
};
