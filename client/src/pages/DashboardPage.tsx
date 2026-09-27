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
    <div className="space-y-6">
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
            className="flex items-center gap-2 rounded-xl bg-whatsapp px-4 py-2.5 text-xs font-bold text-white hover:bg-whatsapp-dark shadow-md shadow-whatsapp/20 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            <span>إضافة عميل جديد</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>تصدير CSV</span>
          </button>

          <Link
            to="/templates"
            className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <MessageSquareQuote className="h-4 w-4 text-whatsapp" />
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400">إجمالي العملاء</p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                {statsLoading ? '...' : stats?.totalCustomers || 0}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Due Today & Overdue */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400">متابعات اليوم والمتأخرة</p>
              <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {statsLoading ? '...' : stats?.dueTodayCount || 0}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400">معدل التحويل (تم البيع)</p>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {statsLoading ? '...' : `${stats?.conversionRate || 0}%`}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Sold Count */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400">الطلبات المكتملة</p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                {statsLoading ? '...' : stats?.statusDistribution?.['تم البيع'] || 0}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
              <CheckCircle className="h-6 w-6" />
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
    </div>
  );
};
