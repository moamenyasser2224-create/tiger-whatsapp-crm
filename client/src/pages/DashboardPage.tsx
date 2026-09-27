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
import { SpotlightCard } from '../components/motion/SpotlightCard.js';
import { CountUp } from '../components/motion/CountUp.js';

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
      link.setAttribute('download', `customers_${new Date().toISOString().split('T')[0]}.csv`);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            لوحة التحكم والإحصائيات
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            نظرة شاملة ومحدثة على أداء المبيعات والمتابعات اليومية لعملاء واتساب
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setSelectedCustomer(null);
              setIsCustomerModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 border border-neutral-900 dark:border-white px-4 py-2.5 text-xs font-bold transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            <span>إضافة عميل جديد</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-xs font-bold text-neutral-800 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
            <span>تصدير CSV</span>
          </button>

          <Link
            to="/templates"
            className="flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-xs font-bold text-neutral-800 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            <MessageSquareQuote className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
            <span>قوالب الرسائل</span>
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

      {/* KPI Cards with Spotlight & CountUp */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <SpotlightCard className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400">إجمالي العملاء</p>
              <h3 className="text-2xl font-black text-neutral-900 dark:text-white mt-1">
                {statsLoading ? '...' : <CountUp end={stats?.totalCustomers || 0} />}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </SpotlightCard>

        {/* Due Today & Overdue */}
        <SpotlightCard className="p-5 border-2 border-neutral-900 dark:border-neutral-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400">متابعات اليوم والمتأخرة</p>
              <h3 className="text-2xl font-black text-black dark:text-white mt-1">
                {statsLoading ? '...' : <CountUp end={stats?.dueTodayCount || 0} />}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white dark:bg-white dark:text-black">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </SpotlightCard>

        {/* Conversion Rate */}
        <SpotlightCard className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400">معدل التحويل (تم البيع)</p>
              <h3 className="text-2xl font-black text-neutral-900 dark:text-white mt-1">
                {statsLoading ? '...' : <><CountUp end={stats?.conversionRate || 0} decimals={1} />%</>}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </SpotlightCard>

        {/* Sold Count */}
        <SpotlightCard className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400">الطلبات المكتملة</p>
              <h3 className="text-2xl font-black text-neutral-900 dark:text-white mt-1">
                {statsLoading ? '...' : <CountUp end={stats?.statusDistribution?.['تم البيع'] || 0} />}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white">
              <CheckCircle className="h-6 w-6" />
            </div>
          </div>
        </SpotlightCard>
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
