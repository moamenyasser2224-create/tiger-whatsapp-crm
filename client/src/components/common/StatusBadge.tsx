import React from 'react';

export type StatusTone = 'muted' | 'accent' | 'danger';

export interface StatusBadgeProps {
  label: string;
  tone?: StatusTone;
  variant?: 'muted' | 'positive' | 'negative' | 'accent' | 'danger';
  statusKey?: string;
  className?: string;
}

export function resolveTone(statusKey?: string, label?: string): StatusTone {
  const normalized = (statusKey || label || '').toLowerCase().trim();

  // Positive: Interested, Closed Won, Approved, On Time, Present, Verified
  if (
    normalized.includes('interested') ||
    normalized.includes('won') ||
    normalized.includes('closed won') ||
    normalized.includes('approved') ||
    normalized.includes('present') ||
    normalized.includes('on_time') ||
    normalized.includes('on duty') ||
    normalized.includes('verified') ||
    normalized.includes('active') ||
    normalized.includes('enrolled')
  ) {
    return 'accent';
  }

  // Negative: Lost, Not Interested, Disputed, Cancelled, Late, Absent, Rejected, Reset Required
  if (
    normalized.includes('lost') ||
    normalized.includes('not interested') ||
    normalized.includes('disputed') ||
    normalized.includes('cancelled') ||
    normalized.includes('canceled') ||
    normalized.includes('late') ||
    normalized.includes('absent') ||
    normalized.includes('rejected') ||
    normalized.includes('reset required')
  ) {
    return 'danger';
  }

  // In-progress / Pending / Neutral: New, Contacted, Proposed, Open, Clocked Out, Not Enrolled
  return 'muted';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  tone,
  variant,
  statusKey,
  className = '',
}) => {
  let finalTone = tone;
  if (!finalTone && variant) {
    if (variant === 'positive') finalTone = 'accent';
    else if (variant === 'negative') finalTone = 'danger';
    else finalTone = variant as StatusTone;
  }
  const resolvedTone = finalTone || resolveTone(statusKey, label);

  const dotColorClass = {
    muted: 'bg-muted',
    accent: 'bg-accent',
    danger: 'bg-danger',
  }[resolvedTone] || 'bg-muted';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-card border border-border text-text shadow-subtle shrink-0 ${className}`}
    >
      <span className={`w-[7px] h-[7px] rounded-full shrink-0 ${dotColorClass}`} />
      <span className="truncate">{label}</span>
    </span>
  );
};
