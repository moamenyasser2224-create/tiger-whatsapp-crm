import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { StatusBadge } from './common/StatusBadge.js';
import { X, CheckCircle2, Clock, ShieldCheck, UserCheck } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  employee,
}) => {
  const { data, isLoading } = useQuery({
    queryKey: ['onboarding', employee?.id],
    queryFn: async () => {
      if (!employee?.id) return null;
      const res = await api.get(`/users/${employee.id}/onboarding`);
      return res.data;
    },
    enabled: isOpen && !!employee?.id,
  });

  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-subtle overflow-hidden text-text flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4 bg-card">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-semibold text-text">Employee Onboarding Checklist</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted hover:bg-bg hover:text-text transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="font-semibold text-sm text-text">{employee.name}</h3>
              <p className="text-xs text-muted font-mono">{employee.email}</p>
            </div>
            <StatusBadge
              label={employee.role === 'admin' ? 'Administrator' : 'Staff'}
              variant={employee.role === 'admin' ? 'positive' : 'muted'}
            />
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-xs text-muted">
              Loading onboarding progress...
            </div>
          ) : data ? (
            <div className="space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-text">Completion Progress</span>
                  <span className="font-mono text-muted tabular-nums">{data.progressPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-300"
                    style={{ width: `${data.progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Checklist Items */}
              <div className="space-y-2.5 pt-2">
                {data.checklist.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border bg-bg/50"
                  >
                    <div className="mt-0.5 shrink-0">
                      {item.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-accent" />
                      ) : (
                        <Clock className="w-4 h-4 text-muted" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-text">{item.title}</span>
                        <StatusBadge
                          label={item.completed ? 'Completed' : 'Pending'}
                          variant={item.completed ? 'positive' : 'muted'}
                        />
                      </div>
                      <p className="text-[11px] text-muted mt-0.5 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 bg-card flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-bg px-4 py-2 text-xs font-medium text-text hover:bg-card transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
