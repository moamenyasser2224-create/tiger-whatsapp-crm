import React, { useMemo } from 'react';

export type StampVariant = 'approved' | 'rejected' | 'absent' | 'late' | 'excused' | 'closed' | 'proposed' | 'custom';

interface RubberStampProps {
  label: string;
  variant?: StampVariant;
  recordId?: string;
  subtext?: string;
  className?: string;
  isAnimated?: boolean;
}

/**
 * Deterministically derives a slight rotation angle (-2.5° to +2.5°) based on a record ID string.
 * This guarantees the stamp looks authentically stamped by hand while staying 100% stable across rerenders.
 */
function getDeterministicAngle(id?: string): number {
  if (!id) return -1.5;
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  // Map hash to range between -2.8 and +2.8 degrees
  const angle = ((Math.abs(hash) % 56) - 28) / 10;
  return angle === 0 ? 1.2 : angle;
}

export const RubberStamp: React.FC<RubberStampProps> = ({
  label,
  variant = 'approved',
  recordId,
  subtext,
  className = '',
  isAnimated = false,
}) => {
  const angle = useMemo(() => getDeterministicAngle(recordId), [recordId]);

  return (
    <span
      style={{
        transform: `rotate(${angle}deg)`,
      }}
      className={`inline-flex flex-col items-center justify-center border-2 border-current px-2.5 py-0.5 text-center font-mono select-none uppercase tracking-wider relative transition-transform duration-150 ${
        isAnimated ? 'animate-[stamp_180ms_cubic-bezier(0.2,0,0.1,1)]' : ''
      } ${className}`}
    >
      {/* Outer framing double rule */}
      <span className="absolute -inset-[3px] border border-current pointer-events-none opacity-80" />
      
      <span className="text-[11px] font-black leading-tight tracking-wider">
        {label}
      </span>
      {subtext && (
        <span className="text-[9px] font-semibold opacity-85 leading-none mt-0.5 tracking-normal">
          {subtext}
        </span>
      )}
    </span>
  );
};
