import React from 'react';

interface DataPoint {
  label: string;
  value: number;
  annotation?: string;
}

interface HatchedChartProps {
  title: string;
  data: DataPoint[];
  height?: number;
  unit?: string;
  className?: string;
}

export const HatchedChart: React.FC<HatchedChartProps> = ({
  title,
  data,
  height = 200,
  unit = '',
  className = '',
}) => {
  const maxValue = Math.max(...data.map((d) => d.value), 10);
  const chartHeight = height - 50;

  return (
    <div className={`border-2 border-neutral-900 dark:border-white bg-white dark:bg-neutral-950 p-5 shadow-solid ${className}`}>
      {/* Chart Title & Ledger Header */}
      <div className="flex items-center justify-between border-b-2 border-neutral-900 dark:border-white pb-2.5 mb-4">
        <h4 className="font-display font-bold text-sm text-neutral-950 dark:text-white">
          {title}
        </h4>
        <span className="text-[10px] font-mono text-neutral-500 uppercase">
          Monochrome Hatched Chart
        </span>
      </div>

      <svg width="100%" height={height} className="overflow-visible font-mono text-xs select-none">
        <defs>
          {/* Diagonal Hatching Pattern */}
          <pattern id="diagHatch" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" strokeWidth="1.5" />
          </pattern>
          {/* Cross Hatching Pattern */}
          <pattern id="crossHatch" width="8" height="8" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="8" y2="8" stroke="currentColor" strokeWidth="1.2" />
            <line x1="8" y1="0" x2="0" y2="8" stroke="currentColor" strokeWidth="1.2" />
          </pattern>
          {/* Halftone Dots Pattern */}
          <pattern id="dotsPattern" width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="4" cy="4" r="1.5" fill="currentColor" />
          </pattern>
        </defs>

        {/* Baseline & Thin Axis */}
        <line
          x1="30"
          y1={chartHeight}
          x2="98%"
          y2={chartHeight}
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-neutral-900 dark:text-neutral-100"
        />

        {/* Bars with Hatchings */}
        {data.map((item, index) => {
          const barWidth = 36;
          const spacing = 58;
          const x = 45 + index * spacing;
          const barHeight = (item.value / maxValue) * (chartHeight - 40);
          const y = chartHeight - barHeight;

          // Alternate patterns
          const patternId = index % 3 === 0 ? 'url(#diagHatch)' : index % 3 === 1 ? 'url(#crossHatch)' : 'url(#dotsPattern)';

          return (
            <g key={index} className="text-neutral-900 dark:text-white">
              {/* The Hatched Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={patternId}
                stroke="currentColor"
                strokeWidth="1.5"
              />

              {/* Direct Value Label on Top (No Legend Needed) */}
              <text
                x={x + barWidth / 2}
                y={y - 6}
                textAnchor="middle"
                fontSize="11"
                fontWeight="bold"
                fill="currentColor"
                className="tabular-nums"
              >
                {item.value}
                {unit}
              </text>

              {/* X-axis Label */}
              <text
                x={x + barWidth / 2}
                y={chartHeight + 18}
                textAnchor="middle"
                fontSize="10"
                fill="currentColor"
                className="opacity-75 font-ledger"
              >
                {item.label}
              </text>

              {/* Anomaly Callout if exists */}
              {item.annotation && (
                <g>
                  <line
                    x1={x + barWidth / 2}
                    y1={y - 20}
                    x2={x + barWidth / 2}
                    y2={y - 35}
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />
                  <rect
                    x={x + barWidth / 2 - 40}
                    y={y - 50}
                    width="80"
                    height="16"
                    fill="white"
                    stroke="currentColor"
                    strokeWidth="1"
                    className="dark:fill-black"
                  />
                  <text
                    x={x + barWidth / 2}
                    y={y - 38}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="bold"
                    fill="currentColor"
                  >
                    {item.annotation}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
