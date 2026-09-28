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
import type { DashboardStats } from '../types/index.js';
import { getStatusLabel, getSourceLabel, SOURCE_COLORS } from '../lib/utils.js';

interface StatsChartsProps {
  stats: DashboardStats;
}

const MONOCHROME_GRAYS = ['#171717', '#404040', '#737373', '#a3a3a3', '#d4d4d4', '#525252'];

const statusHexColors: Record<string, string> = {
  'New': '#737373',
  'Contacted': '#525252',
  'Interested': '#404040',
  'Closed Won': '#171717',
  'Lost': '#a3a3a3',
  'جديد': '#737373',
  'تم التواصل': '#525252',
  'مهتم': '#404040',
  'تم البيع': '#171717',
  'غير مهتم': '#a3a3a3',
};

export const StatsCharts: React.FC<StatsChartsProps> = ({ stats }) => {
  const statusData = Object.entries(stats.statusDistribution || {}).map(([name, count]) => ({
    name: getStatusLabel(name),
    rawName: name,
    count,
  }));

  const sourceData = Object.entries(stats.sourceDistribution || {})
    .map(([name, count]) => ({
      name: getSourceLabel(name),
      rawName: name,
      count,
    }))
    .filter((item) => item.count > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Customer Status Distribution Bar Chart */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 transition-colors">
        <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-4">
          Customer Pipeline Distribution
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
                  backgroundColor: '#171717',
                  borderRadius: '12px',
                  border: '1px solid #404040',
                  color: '#fff',
                  direction: 'ltr',
                }}
                formatter={(value: any) => [`${value} leads`, 'Count']}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {statusData.map((entry, idx) => (
                  <Cell
                    key={`cell-${entry.name}`}
                    fill={statusHexColors[entry.rawName] || statusHexColors[entry.name] || MONOCHROME_GRAYS[idx % MONOCHROME_GRAYS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Customer Source Distribution Donut Chart */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 transition-colors">
        <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-4">
          Lead Acquisition Sources
        </h3>
        <div className="h-64 w-full" dir="ltr">
          {sourceData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-neutral-400">
              No lead source records captured yet
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
                  {sourceData.map((entry, idx) => (
                    <Cell
                      key={`source-${entry.name}`}
                      fill={(SOURCE_COLORS as any)[entry.rawName] || MONOCHROME_GRAYS[idx % MONOCHROME_GRAYS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171717',
                    borderRadius: '12px',
                    border: '1px solid #404040',
                    color: '#fff',
                    direction: 'ltr',
                  }}
                  formatter={(value: any) => [`${value} leads`, 'Count']}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-xs text-neutral-700 dark:text-neutral-300 ml-2">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
