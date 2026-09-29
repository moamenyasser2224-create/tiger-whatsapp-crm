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
import { getStatusLabel, getSourceLabel } from '../lib/utils.js';

interface StatsChartsProps {
  stats: DashboardStats;
}

// Quiet Professionalism palette: Accent, Muted, Danger, and Subtle Tones
const FINANCIAL_CHART_TONES = [
  '#15503f', // accent
  '#6b6b6f', // muted
  '#0f3d30', // accent-hover
  '#8a3b32', // danger
  '#9d9d9d', // dark muted
  '#4fae8e', // dark accent
];

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
      <div className="rounded-xl border border-border bg-card p-6 shadow-subtle transition-colors">
        <h3 className="text-sm font-semibold text-text mb-4">
          Customer Pipeline Distribution
        </h3>
        <div className="h-64 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#6b6b6f' }}
                interval={0}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6b6b6f' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-card)',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                  fontSize: '12px',
                  boxShadow: 'var(--shadow-subtle)',
                }}
                formatter={(value: any) => [`${value} accounts`, 'Count']}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {statusData.map((entry, idx) => (
                  <Cell
                    key={`cell-${entry.name}`}
                    fill={idx === 0 ? '#15503f' : idx % 2 === 0 ? '#6b6b6f' : '#0f3d30'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Customer Source Distribution Donut Chart */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-subtle transition-colors">
        <h3 className="text-sm font-semibold text-text mb-4">
          Lead Acquisition Sources
        </h3>
        <div className="h-64 w-full" dir="ltr">
          {sourceData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-muted">
              No lead source records captured yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {sourceData.map((entry, index) => (
                    <Cell
                      key={`source-cell-${entry.name}`}
                      fill={FINANCIAL_CHART_TONES[index % FINANCIAL_CHART_TONES.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                    fontSize: '12px',
                    boxShadow: 'var(--shadow-subtle)',
                  }}
                  formatter={(value: any) => [`${value} leads`, 'Count']}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', color: '#6b6b6f' }}
                  layout="horizontal"
                  verticalAlign="bottom"
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
