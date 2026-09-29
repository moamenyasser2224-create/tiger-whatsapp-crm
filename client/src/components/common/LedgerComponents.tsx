import React from 'react';
import { LedgerIcon, LedgerIconName } from '../icons/LedgerIcons.js';

/* --------------------------------------------------------------------------
   1. Ledger Button
   Sharp edges, 2px border, 1px depression on active
   -------------------------------------------------------------------------- */
interface LedgerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: LedgerIconName;
}

export const LedgerButton: React.FC<LedgerButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 font-bold font-sans rounded-none select-none border-2 transition-all btn-mechanical cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none';

  const sizeStyles = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-4 py-2 text-xs sm:text-sm',
    lg: 'px-6 py-2.5 text-sm sm:text-base',
  }[size];

  const variantStyles = {
    primary:
      'bg-neutral-900 text-white border-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-950 dark:border-neutral-100 dark:hover:bg-neutral-200 shadow-solid-sm',
    secondary:
      'bg-white text-neutral-900 border-neutral-900 hover:bg-neutral-100 dark:bg-neutral-900 dark:text-white dark:border-white dark:hover:bg-neutral-800 shadow-solid-sm',
    danger:
      'bg-white text-neutral-950 border-2 border-neutral-950 hover:bg-neutral-200 dark:bg-neutral-950 dark:text-white dark:border-white shadow-solid-sm line-through-hover',
    ghost:
      'bg-transparent text-neutral-900 border-transparent hover:border-neutral-900 dark:text-white dark:hover:border-white',
  }[variant];

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <LedgerIcon name={icon} size={size === 'sm' ? 14 : 16} />}
      <span>{children}</span>
    </button>
  );
};

/* --------------------------------------------------------------------------
   2. Ledger Input & Select
   -------------------------------------------------------------------------- */
interface LedgerInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  isMono?: boolean;
}

export const LedgerInput: React.FC<LedgerInputProps> = ({
  label,
  error,
  isMono = false,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined);

  return (
    <div className="space-y-1 text-left">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full bg-white dark:bg-neutral-900 border-1.5 border-neutral-900 dark:border-neutral-100 rounded-[2px] px-3 py-2 text-xs sm:text-sm text-neutral-950 dark:text-white outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white transition-shadow ${
          isMono ? 'font-mono tabular-nums' : 'font-sans'
        } ${error ? 'border-2 border-dashed' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-[11px] font-mono text-neutral-900 dark:text-neutral-200 font-bold">{error}</p>}
    </div>
  );
};

/* --------------------------------------------------------------------------
   3. Ledger Table Wrapper
   -------------------------------------------------------------------------- */
interface LedgerTableProps {
  children: React.ReactNode;
  className?: string;
}

export const LedgerTable: React.FC<LedgerTableProps> = ({ children, className = '' }) => {
  return (
    <div className={`w-full overflow-x-auto border-2 border-neutral-900 dark:border-neutral-100 bg-white dark:bg-neutral-950 ${className}`}>
      <table className="w-full text-left text-xs sm:text-sm border-collapse">
        {children}
      </table>
    </div>
  );
};

/* --------------------------------------------------------------------------
   4. Ledger Modal
   -------------------------------------------------------------------------- */
interface LedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const LedgerModal: React.FC<LedgerModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-diagonal-hatch" dir="ltr">
      <div
        className={`w-full max-w-lg bg-white dark:bg-neutral-950 border-2 border-neutral-900 dark:border-white shadow-solid sm:shadow-solid-lg rounded-none p-5 animate-in fade-in zoom-in-95 duration-100 ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-neutral-900 dark:border-neutral-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-neutral-900 dark:bg-white" />
            <h3 className="font-bold text-base sm:text-lg text-neutral-950 dark:text-white">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 border border-neutral-900 dark:border-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <LedgerIcon name="x" size={16} />
          </button>
        </div>

        {/* Body */}
        <div>{children}</div>
      </div>
    </div>
  );
};

/* --------------------------------------------------------------------------
   5. Punched Attendance Card
   -------------------------------------------------------------------------- */
interface PunchedCardProps {
  employeeName: string;
  employeeId: string;
  date: string;
  shiftHours?: string;
  punches: Array<{
    type: 'Clock In' | 'Clock Out' | string;
    time: string;
    isPunched: boolean;
    statusBadge?: string;
  }>;
  onPunchClick?: () => void;
  isPunching?: boolean;
}

export const PunchedCard: React.FC<PunchedCardProps> = ({
  employeeName,
  employeeId,
  date,
  shiftHours = '09:00 - 17:00',
  punches,
  onPunchClick,
  isPunching = false,
}) => {
  const formatPunchType = (t: string) => {
    if (t === 'Clock In' || t === '\u062D\u0636\u0648\u0631') return 'Clock In';
    if (t === 'Clock Out' || t === '\u0627\u0646\u0635\u0631\u0627\u0641') return 'Clock Out';
    return t;
  };

  return (
    <div className="w-full max-w-sm border-2 border-neutral-900 dark:border-white bg-[#fffef9] dark:bg-[#151515] p-5 shadow-solid relative select-none" dir="ltr">
      {/* Hole punch strip on side */}
      <div className="absolute top-0 bottom-0 left-2 w-4 flex flex-col justify-around items-center pointer-events-none">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <span key={i} className="punch-hole" />
        ))}
      </div>

      <div className="ml-6 space-y-4">
        {/* Card Header */}
        <div className="border-b-2 border-neutral-900 dark:border-white pb-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest border border-current px-1.5 py-0.5">
              OFFICIAL TIME CARD
            </span>
            <span className="text-xs font-mono text-neutral-500">#{employeeId.slice(0, 8)}</span>
          </div>
          <div className="font-bold text-lg text-neutral-950 dark:text-white">
            {employeeName}
          </div>
          <div className="flex items-center justify-between text-xs font-mono text-neutral-600 dark:text-neutral-400">
            <span>Date: {date}</span>
            <span>Shift: {shiftHours}</span>
          </div>
        </div>

        {/* Recorded Punches */}
        <div className="space-y-3 font-mono">
          {punches.map((p, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between border-b border-dashed border-neutral-300 dark:border-neutral-700 pb-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full border border-current flex items-center justify-center ${
                    p.isPunched ? 'bg-neutral-900 dark:bg-white' : 'bg-transparent'
                  }`}
                />
                <span className="text-xs font-bold">{formatPunchType(p.type)}:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tabular-nums">
                  {p.time || '—:—:—'}
                </span>
                {p.statusBadge && (
                  <span className="text-[10px] font-bold border border-current px-1 uppercase">
                    {p.statusBadge}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Punch Action Button */}
        {onPunchClick && (
          <div className="pt-2">
            <LedgerButton
              onClick={onPunchClick}
              disabled={isPunching}
              className="w-full text-center"
              size="md"
            >
              <LedgerIcon name="stamp" size={16} />
              <span>{isPunching ? 'Stamping Time Card...' : 'Punch & Record Now'}</span>
            </LedgerButton>
          </div>
        )}

        {/* Footer Card Notes */}
        <div className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 border-t border-neutral-200 dark:border-neutral-800 pt-2 text-center">
          Tiger Official Time Record &bull; Tamper-Proof Electronic Seal
        </div>
      </div>
    </div>
  );
};
