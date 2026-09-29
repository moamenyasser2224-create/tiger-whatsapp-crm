import React from 'react';
import { LedgerIcon, LedgerIconName } from '../icons/LedgerIcons.js';
import { StatusBadge } from './StatusBadge.js';

/* --------------------------------------------------------------------------
   1. Button (Quiet Professionalism)
   - Primary: Filled accent background, white text, hover to accent-hover
   - Secondary: Card background, border, text color
   - Low-impact / Ghost: Muted text without borders
   - Danger: Subdued danger border and text, hover to danger-soft
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
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg select-none transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-xs sm:text-sm',
    lg: 'px-5 py-2.5 text-sm sm:text-base',
  }[size];

  const variantStyles = {
    primary: 'bg-accent text-white hover:bg-accent-hover shadow-subtle',
    secondary: 'bg-card border border-border text-text hover:bg-bg shadow-subtle',
    danger: 'text-danger border border-danger hover:bg-danger-soft',
    ghost: 'text-muted hover:text-text hover:bg-bg/50',
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
   2. Input & Form Field (Quiet Professionalism)
   - Background card, 1px border, 8px radius, focus border accent without ring
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
        <label htmlFor={inputId} className="block text-xs font-semibold text-text">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full bg-card border border-border rounded-lg px-3 py-2 text-xs sm:text-sm text-text placeholder:text-muted outline-none focus:border-accent focus:ring-0 shadow-subtle transition-colors ${
          isMono ? 'font-mono tabular-nums' : 'font-sans'
        } ${error ? 'border-danger' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-danger font-normal mt-1">{error}</p>}
    </div>
  );
};

/* --------------------------------------------------------------------------
   3. Table Wrapper (Quiet Professionalism)
   - Card surface, 1px border, 12px radius, subtle shadow
   -------------------------------------------------------------------------- */
interface LedgerTableProps {
  children: React.ReactNode;
  className?: string;
}

export const LedgerTable: React.FC<LedgerTableProps> = ({ children, className = '' }) => {
  return (
    <div className={`w-full overflow-x-auto bg-card border border-border rounded-xl shadow-subtle ${className}`}>
      <table className="w-full text-left text-xs sm:text-sm border-collapse divide-y divide-border">
        {children}
      </table>
    </div>
  );
};

/* --------------------------------------------------------------------------
   4. Modal (Quiet Professionalism)
   - Calm backdrop, card surface, 1px border, 12px radius, subtle shadow
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" dir="ltr">
      <div
        className={`w-full max-w-lg bg-card border border-border shadow-subtle rounded-xl p-6 animate-in fade-in zoom-in-95 duration-150 ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
          <h3 className="font-semibold text-base sm:text-lg text-text">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-bg transition-colors cursor-pointer"
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
   5. Time Clock Card (Quiet Professionalism)
   - Clean financial surface, calm contrast, zero punch holes
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
  return (
    <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-subtle p-6 select-none" dir="ltr">
      {/* Card Header */}
      <div className="border-b border-border pb-4 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-accent uppercase tracking-wider">
            Time &amp; Attendance Record
          </span>
          <span className="text-xs font-mono text-muted tabular-nums">#{employeeId.slice(0, 8)}</span>
        </div>
        <div className="font-semibold text-lg text-text">
          {employeeName}
        </div>
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Date: <strong className="text-text font-medium">{date}</strong></span>
          <span>Shift: <strong className="text-text font-medium">{shiftHours}</strong></span>
        </div>
      </div>

      {/* Recorded Punches */}
      <div className="space-y-3 py-4">
        {punches.map((p, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between border-b border-border/60 pb-2.5 last:border-b-0"
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  p.isPunched ? 'bg-accent' : 'bg-muted'
                }`}
              />
              <span className="text-xs font-medium text-text">{p.type}:</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-sm tabular-nums text-text">
                {p.time || '—:—:—'}
              </span>
              {p.statusBadge && (
                <StatusBadge label={p.statusBadge} statusKey={p.statusBadge} />
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
            className="w-full"
            variant="primary"
            size="md"
          >
            <LedgerIcon name="clock" size={16} />
            <span>{isPunching ? 'Recording Attendance...' : 'Clock In / Out'}</span>
          </LedgerButton>
        </div>
      )}

      {/* Footer Notes */}
      <div className="text-xs text-muted border-t border-border pt-3 mt-4 text-center">
        Tiger Automated Shift Verification &bull; Timestamp Verified
      </div>
    </div>
  );
};
