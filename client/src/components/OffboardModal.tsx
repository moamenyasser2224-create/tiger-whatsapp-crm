import React, { useState } from 'react';
import { api } from '../lib/api.js';
import { X, UserMinus, AlertTriangle, ArrowRight, ShieldAlert, Check } from 'lucide-react';

interface OffboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (summary: string) => void;
  employee: {
    id: string;
    name: string;
    email: string;
  } | null;
  activeEmployees: Array<{
    id: string;
    name: string;
    email: string;
  }>;
}

export const OffboardModal: React.FC<OffboardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  employee,
  activeEmployees,
}) => {
  const [successorUserId, setSuccessorUserId] = useState('');
  const [reason, setReason] = useState('Standard Offboarding / Contract Completion');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !employee) return null;

  // Filter out the employee being offboarded from successor options
  const candidateSuccessors = activeEmployees.filter((e) => e.id !== employee.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!successorUserId) {
      setError('Please select a successor team member to receive assigned customer leads.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.post(`/users/${employee.id}/offboard`, {
        successorUserId,
        reason,
        note,
      });

      onSuccess(res.data.message);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to complete offboarding.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-subtle overflow-hidden text-text flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4 bg-card">
          <div className="flex items-center gap-2 text-danger">
            <UserMinus className="w-4 h-4" />
            <h2 className="text-sm font-semibold text-text">Employee Offboarding & Lead Handover</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted hover:bg-bg hover:text-text transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          <div className="p-3 rounded-lg border border-border bg-bg/50">
            <span className="text-[11px] text-muted block uppercase tracking-wider font-semibold">Employee to Offboard</span>
            <div className="font-semibold text-sm text-text mt-0.5">{employee.name}</div>
            <div className="text-xs text-muted font-mono">{employee.email}</div>
          </div>

          {error && (
            <div className="p-3 rounded-lg border border-danger/30 bg-danger-soft text-danger text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Successor Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text flex items-center gap-1.5">
              <span>Customer Lead Reassignment</span>
              <span className="text-danger">*</span>
            </label>
            <p className="text-[11px] text-muted">
              Select an active colleague who will inherit all active customer records and follow-ups.
            </p>
            <select
              value={successorUserId}
              onChange={(e) => setSuccessorUserId(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text focus:border-accent focus:outline-none"
            >
              <option value="">-- Select Successor Employee --</option>
              {candidateSuccessors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.email})
                </option>
              ))}
            </select>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text">Offboarding Reason</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. End of Contract, Resignation, Transition"
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text focus:border-accent focus:outline-none"
            />
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text">Administrative Handover Note</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional handover details or instructions for audit record..."
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text focus:border-accent focus:outline-none resize-none"
            />
          </div>

          {/* Impact Warning Checklist */}
          <div className="rounded-lg border border-border bg-card p-3 space-y-2 text-[11px] text-muted">
            <div className="font-semibold text-text flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-accent" />
              <span>Automated Execution Checklist:</span>
            </div>
            <ul className="space-y-1 list-disc list-inside text-muted">
              <li>All customer records reassigned atomically to the chosen successor.</li>
              <li>Active JWT refresh tokens revoked immediately (instant session kill).</li>
              <li>User account marked inactive in database.</li>
              <li>Biometric facial geometry queued for automated purge in 24 hours.</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="border-t border-border pt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-border bg-bg px-4 py-2 text-xs font-medium text-text hover:bg-card transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-danger px-4 py-2 text-xs font-medium text-white hover:bg-danger/90 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <UserMinus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Processing Offboarding...' : 'Confirm Offboarding'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
