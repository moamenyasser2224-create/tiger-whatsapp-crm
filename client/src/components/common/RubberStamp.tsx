import React from 'react';
import { StatusBadge } from './StatusBadge.js';

export type StampVariant =
  | 'approved'
  | 'rejected'
  | 'absent'
  | 'late'
  | 'excused'
  | 'closed'
  | 'proposed'
  | 'custom';

interface RubberStampProps {
  label: string;
  variant?: StampVariant;
  recordId?: string;
  subtext?: string;
  className?: string;
  isAnimated?: boolean;
}

/**
 * Replaces old rubber stamps with Quiet Professionalism StatusBadge (7px dot + neutral pill).
 */
export const RubberStamp: React.FC<RubberStampProps> = ({
  label,
  variant,
  className = '',
}) => {
  return (
    <StatusBadge
      label={label}
      statusKey={variant || label}
      className={className}
    />
  );
};
