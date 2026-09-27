import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import type { DashboardStats, CustomerStatus } from '../types/index.js';
import { STATUS_COLORS, SOURCE_COLORS } from '../lib/utils.js';

interface StatsChartsProps {
  stats: DashboardStats;
}

const statusHexColors: Record<CustomerStatus, string> = {
  'جديد': '#3b82f6',
  'تم التواصل': '#f59e0b',
  'مهتم': '#8b5cf6',
  'تم البيع': '#10b981',
  'غير مهتم': '#f43f5e',
};

export const StatsCharts: React.FC<StatsChartsProps> = ({ stats }) => {
  const statusData = Object.entries(stats.statusDistribution || {}).map(([name, count]) => ({
    name,
    count,
  }));

  const sourceData = Object.entries(stats.sourceDistribution || {}).map(([name, count]) => ({
    name,
    count,
  })).filter((item) => item.count > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Customer Status Distribution Bar Chart */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 transition-colors">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">
          توزيع العملاء حسب الحالة
        </h3>
        <div className="h-64 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#888888' }}
                interval={0}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#888888' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#fff',
                  direction: 'rtl',
                }}
                formatter={(value: any) => [`${value} عميل`, 'العدد']}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {statusData.map((entry) => (
                  <Cell
                    key={`cell-${entry.name}`}
                    fill={statusHexColors[entry.name as CustomerStatus] || '#128C7E'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Customer Source Distribution Donut Chart */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 transition-colors">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">
          توزيع العملاء حسب المصدر
        </h3>
        <div className="h-64 w-full" dir="ltr">
          {sourceData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              لا توجد بيانات مسجلة لمصادر العملاء حتى الآن
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {sourceData.map((entry) => (
                    <Cell
                      key={`source-${entry.name}`}
                      fill={(SOURCE_COLORS as any)[entry.name] || '#64748b'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    direction: 'rtl',
                  }}
                  formatter={(value: any) => [`${value} عميل`, 'العدد']}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-xs text-gray-700 dark:text-gray-300 mr-2">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
