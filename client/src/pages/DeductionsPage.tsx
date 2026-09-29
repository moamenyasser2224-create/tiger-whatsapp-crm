import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.js';
import { MotionPage } from '../components/motion/MotionPage.js';
import { useToast } from '../components/motion/Toast.js';
import type { Deduction, Adjustment, UserPayrollSummary, PayrollPeriod } from '../types/index.js';
import { format } from 'date-fns';
import {
  LedgerButton,
  LedgerInput,
  LedgerTable,
  LedgerModal,
} from '../components/common/LedgerComponents.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { PayslipReceipt } from '../components/common/PayslipReceipt.js';
import {
  DollarSign,
  Calendar,
  Download,
  AlertTriangle,
  Lock,
  Plus,
  FileText,
  ShieldCheck,
} from 'lucide-react';

export const DeductionsPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [activeTab, setActiveTab] = useState<'my' | 'admin'>('my');
  const [employeeSubView, setEmployeeSubView] = useState<'receipt' | 'table'>('receipt');

  // Modals state
  const [disputeDeduction, setDisputeDeduction] = useState<Deduction | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustmentUserId, setAdjustmentUserId] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'bonus' | 'manual_deduction'>('bonus');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  // Close period confirmation
  const [isClosePeriodConfirmOpen, setIsClosePeriodConfirmOpen] = useState(false);

  // Dispute review modal
  const [reviewingDispute, setReviewingDispute] = useState<{ id: string; name: string; amount: number; reason: string } | null>(null);
  const [reviewAction, setReviewAction] = useState<'accept' | 'reject'>('accept');
  const [reviewNotes, setReviewNotes] = useState('');

  // 1. Fetch My Deductions
  const { data: myDeductions = [] } = useQuery<Deduction[]>({
    queryKey: ['deductions', 'my', selectedMonth],
    queryFn: async () => {
      const res = await api.get(`/deductions/my?period=${selectedMonth}`);
      return res.data.data;
    },
  });

  // 2. Fetch My Adjustments
  const { data: myAdjustments = [] } = useQuery<Adjustment[]>({
    queryKey: ['deductions', 'my-adjustments', selectedMonth],
    queryFn: async () => {
      const res = await api.get(`/deductions/my-adjustments?period=${selectedMonth}`);
      return res.data.data;
    },
  });

  // 3. Fetch My Salary
  const { data: salaryData } = useQuery<{ monthlySalary: number; currency: string; dayWage: number }>({
    queryKey: ['deductions', 'salary'],
    queryFn: async () => {
      const res = await api.get('/deductions/salary');
      return res.data.data;
    },
  });

  // 4. Admin: Fetch Payroll Summary
  const { data: payrollSummary = [] } = useQuery<UserPayrollSummary[]>({
    queryKey: ['deductions', 'admin', 'summary', selectedMonth],
    queryFn: async () => {
      const res = await api.get(`/deductions/admin/payroll-summary?period=${selectedMonth}`);
      return res.data.data;
    },
    enabled: user?.role === 'admin' && activeTab === 'admin',
  });

  // 5. Admin: Fetch Proposed Deductions
  const { data: proposedDeductions = [] } = useQuery<Deduction[]>({
    queryKey: ['deductions', 'admin', 'proposed', selectedMonth],
    queryFn: async () => {
      const res = await api.get(`/deductions/admin/all?period=${selectedMonth}&status=proposed`);
      return res.data.data;
    },
    enabled: user?.role === 'admin' && activeTab === 'admin',
  });

  // 6. Admin: Fetch Disputed Deductions
  const { data: disputedDeductions = [] } = useQuery<Deduction[]>({
    queryKey: ['deductions', 'admin', 'disputed', selectedMonth],
    queryFn: async () => {
      const res = await api.get(`/deductions/admin/all?period=${selectedMonth}&status=disputed`);
      return res.data.data;
    },
    enabled: user?.role === 'admin' && activeTab === 'admin',
  });

  // 7. Fetch Period Status
  const { data: periodStatus } = useQuery<PayrollPeriod>({
    queryKey: ['deductions', 'period-status', selectedMonth],
    queryFn: async () => {
      const res = await api.get(`/deductions/period-status?period=${selectedMonth}`);
      return res.data.data;
    },
  });

  // 8. Admin: Fetch Users list for manual adjustments
  const { data: allUsers = [] } = useQuery<{ id: string; name: string; email: string }[]>({
    queryKey: ['users', 'all'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data.data;
    },
    enabled: user?.role === 'admin' && isAdjustmentModalOpen,
  });

  const isPeriodClosed = periodStatus?.status === 'closed';

  // Mutations
  const disputeMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await api.post(`/deductions/${id}/dispute`, { reason });
      return res.data;
    },
    onSuccess: (data) => {
      addToast(data.message || 'Dispute lodged successfully', 'success');
      setDisputeDeduction(null);
      setDisputeReason('');
      queryClient.invalidateQueries({ queryKey: ['deductions'] });
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || 'Failed to lodge dispute', 'error');
    },
  });

  const approveDeductionMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/deductions/${id}/approve`, {});
      return res.data;
    },
    onSuccess: () => {
      addToast('Deduction confirmed and committed to payroll ledger', 'success');
      queryClient.invalidateQueries({ queryKey: ['deductions'] });
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || 'Failed to approve deduction', 'error');
    },
  });

  const reviewDisputeMutation = useMutation({
    mutationFn: async ({ id, action, reviewNotes }: { id: string; action: 'accept' | 'reject'; reviewNotes: string }) => {
      const res = await api.post(`/deductions/${id}/review-dispute`, { action, reviewNotes });
      return res.data;
    },
    onSuccess: (data) => {
      addToast(data.message || 'Dispute reviewed successfully', 'success');
      setReviewingDispute(null);
      setReviewNotes('');
      queryClient.invalidateQueries({ queryKey: ['deductions'] });
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || 'Failed to review dispute', 'error');
    },
  });

  const addAdjustmentMutation = useMutation({
    mutationFn: async (payload: { userId: string; period: string; type: string; amount: number; reason: string }) => {
      const res = await api.post('/deductions/admin/adjustments', payload);
      return res.data;
    },
    onSuccess: () => {
      addToast('Financial adjustment added to ledger', 'success');
      setIsAdjustmentModalOpen(false);
      setAdjustmentAmount('');
      setAdjustmentReason('');
      queryClient.invalidateQueries({ queryKey: ['deductions'] });
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || 'Failed to add adjustment', 'error');
    },
  });

  const closePeriodMutation = useMutation({
    mutationFn: async (period: string) => {
      const res = await api.post('/deductions/admin/close-period', { period });
      return res.data;
    },
    onSuccess: (data) => {
      addToast(data.message || 'Billing cycle officially closed', 'success');
      setIsClosePeriodConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ['deductions'] });
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || 'Failed to close period', 'error');
    },
  });

  // Wage math
  const baseSalary = Number(salaryData?.monthlySalary || 0);
  const totalApprovedDeductions = myDeductions
    .filter((d) => ['approved', 'closed_in_payroll'].includes(d.status))
    .reduce((sum, d) => sum + Number(d.amount), 0);

  const totalBonuses = myAdjustments
    .filter((a) => a.type === 'bonus')
    .reduce((sum, a) => sum + Number(a.amount), 0);

  const totalManualDeductions = myAdjustments
    .filter((a) => a.type === 'manual_deduction')
    .reduce((sum, a) => sum + Number(a.amount), 0);

  const netEstimatedPay = Math.max(0, baseSalary - totalApprovedDeductions - totalManualDeductions + totalBonuses);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'absence':
        return 'Unexcused Absence';
      case 'lateness':
        return 'Cumulative Lateness';
      case 'disciplinary':
        return 'Disciplinary Rule';
      default:
        return type.toUpperCase();
    }
  };

  const getStatusStampLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'APPROVED';
      case 'proposed':
        return 'PROPOSED';
      case 'disputed':
        return 'DISPUTED';
      case 'cancelled':
        return 'CANCELLED';
      case 'closed_in_payroll':
        return 'FINAL CLOSED';
      default:
        return status.toUpperCase();
    }
  };

  const serialNumber = `${selectedMonth.replace('-', '')}-${(user?.id || '0').slice(-4).toUpperCase()}`;

  return (
    <MotionPage className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted font-medium">
            <span>Tiger Finance &amp; Accounting</span>
            <span>/</span>
            <span>Payroll &amp; Deductions</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-text mt-1">
            Payroll, Deductions &amp; Slips
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Transparent wage calculations, dispute workflows, statutory labor cap enforcement, and printable payslip receipts.
          </p>
        </div>

        {/* Month Selector & Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-muted" />
            <span className="font-medium text-text">Period:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-medium tabular-nums outline-none text-text"
            />
          </div>

          {/* Period Status Stamp */}
          <StatusBadge
            label={isPeriodClosed ? 'PERIOD CLOSED' : 'PERIOD OPEN'}
            statusKey={isPeriodClosed ? 'closed' : 'open'}
            tone={isPeriodClosed ? 'muted' : 'accent'}
          />

          {/* Tab Switcher if Admin */}
          {user?.role === 'admin' && (
            <div className="inline-flex rounded-lg border border-border bg-bg p-0.5">
              <button
                type="button"
                onClick={() => setActiveTab('my')}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                  activeTab === 'my'
                    ? 'bg-card text-text font-semibold shadow-subtle'
                    : 'text-muted hover:text-text font-normal'
                }`}
              >
                My Payslip
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-card text-text font-semibold shadow-subtle'
                    : 'text-muted hover:text-text font-normal'
                }`}
              >
                Manager Audit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. EMPLOYEE VIEW */}
      {activeTab === 'my' && (
        <div className="space-y-6">
          {/* Sub-view switcher: Receipt vs Details Table */}
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="inline-flex rounded-lg border border-border bg-bg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setEmployeeSubView('receipt')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                  employeeSubView === 'receipt'
                    ? 'bg-card text-text shadow-subtle'
                    : 'text-muted hover:text-text font-normal'
                }`}
              >
                Official Payslip Voucher
              </button>
              <button
                type="button"
                onClick={() => setEmployeeSubView('table')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                  employeeSubView === 'table'
                    ? 'bg-card text-text shadow-subtle'
                    : 'text-muted hover:text-text font-normal'
                }`}
              >
                Deductions Itemized Log ({myDeductions.length})
              </button>
            </div>

            <div className="text-xs text-muted">
              Period: <span className="font-semibold text-text tabular-nums">{selectedMonth}</span>
            </div>
          </div>

          {/* VIEW A: Payslip Receipt */}
          {employeeSubView === 'receipt' && (
            <div className="py-2">
              <PayslipReceipt
                serialNumber={serialNumber}
                employeeName={user?.name || 'Staff'}
                employeeEmail={user?.email || ''}
                period={selectedMonth}
                baseSalary={baseSalary}
                dayWage={Number(salaryData?.dayWage || 0)}
                deductions={totalApprovedDeductions + totalManualDeductions}
                bonuses={totalBonuses}
                netPay={netEstimatedPay}
                isClosed={isPeriodClosed}
                currency={salaryData?.currency || 'SAR'}
                onPrint={() => window.print()}
              />
            </div>
          )}

          {/* VIEW B: Table for Deductions */}
          {employeeSubView === 'table' && (
            <div className="space-y-6">
              <LedgerTable>
                <div className="p-3.5 border-b border-border bg-bg flex items-center justify-between">
                  <div className="font-semibold text-xs text-text">
                    Itemized Deductions for {selectedMonth}
                  </div>
                  <span className="text-xs text-muted font-medium px-2 py-0.5 rounded bg-card border border-border">
                    {myDeductions.length} entries
                  </span>
                </div>

                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-bg text-muted font-medium text-xs border-b border-border">
                      <th className="px-4 py-3 font-semibold font-mono">Date</th>
                      <th className="px-4 py-3 font-semibold">Category</th>
                      <th className="px-4 py-3 font-semibold">Statement &amp; Reason</th>
                      <th className="px-4 py-3 font-semibold font-mono">Rule Breakdown</th>
                      <th className="px-4 py-3 font-semibold font-mono">Amount</th>
                      <th className="px-4 py-3 font-semibold text-center">Status</th>
                      <th className="px-4 py-3 font-semibold text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {myDeductions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-muted">
                          No deductions recorded against your account during this billing period. Perfect record!
                        </td>
                      </tr>
                    ) : (
                      myDeductions.map((ded) => {
                        const canDispute = !isPeriodClosed && ['proposed', 'approved'].includes(ded.status) && !ded.dispute;

                        return (
                          <tr key={ded.id} className="hover:bg-bg/40 transition-colors">
                            <td className="px-4 py-3 font-mono tabular-nums text-muted">
                              {format(new Date(ded.createdAt), 'yyyy-MM-dd')}
                            </td>
                            <td className="px-4 py-3 font-semibold text-text">
                              {getTypeLabel(ded.type)}
                            </td>
                            <td className="px-4 py-3 text-text max-w-xs">
                              {ded.reason}
                            </td>
                            <td className="px-4 py-3 font-mono text-[11px] text-muted">
                              {ded.calculationDetails?.explanation ? (
                                <span className="border border-border px-1.5 py-0.5 rounded bg-bg">
                                  {ded.calculationDetails.explanation}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="px-4 py-3 font-mono font-semibold tabular-nums text-text">
                              {Number(ded.amount).toFixed(2)} SAR
                            </td>
                            <td className="px-4 py-3 text-center">
                              <StatusBadge
                                label={getStatusStampLabel(ded.status)}
                                statusKey={ded.status}
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              {canDispute ? (
                                <LedgerButton
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => setDisputeDeduction(ded)}
                                >
                                  Dispute
                                </LedgerButton>
                              ) : ded.dispute ? (
                                <span className="text-[11px] text-muted">
                                  Disputed ({ded.dispute.status})
                                </span>
                              ) : (
                                <span className="text-muted">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </LedgerTable>
            </div>
          )}
        </div>
      )}

      {/* 3. MANAGER AUDIT (Admin only) */}
      {activeTab === 'admin' && user?.role === 'admin' && (
        <div className="space-y-8">
          {/* Admin Controls Toolbar */}
          <div className="border border-border bg-card rounded-xl p-4 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-sm text-text">
                Billing Cycle Governance ({selectedMonth})
              </h3>
              <p className="text-xs text-muted">
                Audit pending deductions, resolve disputes, record bonuses, and close financial ledger.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <LedgerButton
                variant="secondary"
                size="sm"
                onClick={() => setIsAdjustmentModalOpen(true)}
              >
                <Plus className="w-3.5 h-3.5 text-muted" />
                <span>Add Adjustment / Bonus</span>
              </LedgerButton>

              {!isPeriodClosed && (
                <LedgerButton
                  variant="primary"
                  size="sm"
                  onClick={() => setIsClosePeriodConfirmOpen(true)}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Close Period Ledger</span>
                </LedgerButton>
              )}
            </div>
          </div>

          {/* All Employees Payroll Summary Table */}
          <LedgerTable>
            <div className="p-3.5 border-b border-border bg-bg flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-xs text-text">
                  Workforce Payroll Roster for {selectedMonth}
                </h3>
                <p className="text-[11px] text-muted">
                  Comprehensive wage overview with automatic statutory labor cap audit.
                </p>
              </div>

              <LedgerButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  const csvRows = [
                    ['Employee Name', 'Email', 'Base Salary', 'Deductions', 'Bonuses', 'Net Pay'],
                    ...payrollSummary.map((p) => [
                      p.user.name,
                      p.user.email,
                      p.monthlySalary,
                      p.totalDeductions,
                      p.bonuses,
                      p.netPay,
                    ]),
                  ];
                  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvRows.map((e) => e.join(',')).join('\n');
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement('a');
                  link.setAttribute('href', encodedUri);
                  link.setAttribute('download', `payroll_${selectedMonth}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                <Download className="w-3.5 h-3.5 text-muted" />
                <span>Export Payroll CSV</span>
              </LedgerButton>
            </div>

            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-bg text-muted font-medium text-xs border-b border-border">
                  <th className="px-4 py-3 font-semibold">Employee</th>
                  <th className="px-4 py-3 font-semibold font-mono">Gross Base</th>
                  <th className="px-4 py-3 font-semibold font-mono">Daily Wage</th>
                  <th className="px-4 py-3 font-semibold font-mono">Total Deductions</th>
                  <th className="px-4 py-3 font-semibold text-center">Disciplinary Cap</th>
                  <th className="px-4 py-3 font-semibold font-mono">Bonuses</th>
                  <th className="px-4 py-3 font-semibold font-mono">Net Payable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono">
                {payrollSummary.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted font-sans">
                      No payroll records found for this billing period.
                    </td>
                  </tr>
                ) : (
                  payrollSummary.map((item) => (
                    <tr key={item.user.id} className="hover:bg-bg/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-text font-sans">
                        <div>{item.user.name}</div>
                        <div className="text-[10px] text-muted font-mono">{item.user.email}</div>
                      </td>
                      <td className="px-4 py-3 tabular-nums">{Number(item.monthlySalary).toFixed(2)} SAR</td>
                      <td className="px-4 py-3 tabular-nums text-muted">{Number(item.dayWage).toFixed(2)} SAR</td>
                      <td className="px-4 py-3 tabular-nums font-semibold text-danger">
                        -{Number(item.totalDeductions).toFixed(2)} SAR
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.capExceeded ? (
                          <span className="border border-danger/40 px-1.5 py-0.5 rounded bg-danger-soft text-danger text-[10px] font-semibold">
                            Cap Reached ({Number(item.disciplinaryCapAmount).toFixed(0)} SAR)
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted font-sans">Within Limit</span>
                        )}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-accent">
                        +{Number(item.bonuses).toFixed(2)} SAR
                      </td>
                      <td className="px-4 py-3 tabular-nums font-semibold text-sm text-text">
                        {Number(item.netPay).toFixed(2)} SAR
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </LedgerTable>
        </div>
      )}

      {/* Dispute Modal */}
      <LedgerModal
        isOpen={Boolean(disputeDeduction)}
        onClose={() => setDisputeDeduction(null)}
        title="Lodge Formal Deduction Dispute"
      >
        {disputeDeduction && (
          <div className="space-y-4 text-xs">
            <div className="border border-border rounded-lg bg-bg p-3 space-y-1">
              <p>
                <strong>Deduction:</strong> {getTypeLabel(disputeDeduction.type)}
              </p>
              <p>
                <strong>Amount:</strong> {Number(disputeDeduction.amount).toFixed(2)} SAR
              </p>
              <p>
                <strong>Date:</strong> {format(new Date(disputeDeduction.createdAt), 'yyyy-MM-dd')}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text mb-1">Dispute Reason &amp; Supporting Circumstances (*):</label>
              <textarea
                rows={4}
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Explain the emergency or attached excuse..."
                className="w-full border border-border rounded-lg p-2.5 bg-card text-text outline-none focus:border-accent shadow-subtle"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <LedgerButton variant="secondary" size="sm" onClick={() => setDisputeDeduction(null)}>
                Cancel
              </LedgerButton>
              <LedgerButton
                variant="primary"
                size="sm"
                disabled={!disputeReason.trim() || disputeMutation.isPending}
                onClick={() => disputeMutation.mutate({ id: disputeDeduction.id, reason: disputeReason.trim() })}
              >
                {disputeMutation.isPending ? 'Submitting...' : 'Send Dispute'}
              </LedgerButton>
            </div>
          </div>
        )}
      </LedgerModal>

      {/* Review Dispute Modal */}
      <LedgerModal
        isOpen={Boolean(reviewingDispute)}
        onClose={() => setReviewingDispute(null)}
        title={reviewAction === 'accept' ? 'Accept Dispute (Cancel Deduction)' : 'Reject Dispute (Enforce Deduction)'}
      >
        {reviewingDispute && (
          <div className="space-y-4 text-xs">
            <div className="border border-border rounded-lg bg-bg p-3 space-y-1">
              <p>
                <strong>Employee:</strong> {reviewingDispute.name}
              </p>
              <p>
                <strong>Amount:</strong> {reviewingDispute.amount} SAR
              </p>
              <p>
                <strong>Employee Statement:</strong> {reviewingDispute.reason}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text mb-1">Official Manager Notes:</label>
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Enter formal rationale..."
                className="w-full border border-border rounded-lg p-2.5 bg-card text-text outline-none focus:border-accent shadow-subtle"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <LedgerButton variant="secondary" size="sm" onClick={() => setReviewingDispute(null)}>
                Cancel
              </LedgerButton>
              <LedgerButton
                variant="primary"
                size="sm"
                disabled={reviewDisputeMutation.isPending}
                onClick={() =>
                  reviewDisputeMutation.mutate({
                    id: reviewingDispute.id,
                    action: reviewAction,
                    reviewNotes: reviewNotes.trim(),
                  })
                }
              >
                {reviewDisputeMutation.isPending ? 'Processing...' : 'Confirm Decision'}
              </LedgerButton>
            </div>
          </div>
        )}
      </LedgerModal>

      {/* Manual Adjustment Modal */}
      <LedgerModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        title={`Add Financial Adjustment / Bonus for ${selectedMonth}`}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-text mb-1">Target Employee:</label>
            <select
              value={adjustmentUserId}
              onChange={(e) => setAdjustmentUserId(e.target.value)}
              className="w-full border border-border rounded-lg p-2 bg-card text-text outline-none focus:border-accent shadow-subtle"
            >
              <option value="">Select Employee...</option>
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1">Adjustment Type:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType('bonus')}
                className={`p-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  adjustmentType === 'bonus'
                    ? 'bg-accent-soft text-accent border-accent'
                    : 'bg-card border-border text-muted'
                }`}
              >
                Performance Bonus (+)
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('manual_deduction')}
                className={`p-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  adjustmentType === 'manual_deduction'
                    ? 'bg-danger-soft text-danger border-danger'
                    : 'bg-card border-border text-muted'
                }`}
              >
                Manual Deduction (-)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1">Amount (SAR):</label>
            <input
              type="number"
              step="0.01"
              value={adjustmentAmount}
              onChange={(e) => setAdjustmentAmount(e.target.value)}
              placeholder="e.g. 500.00"
              className="w-full border border-border rounded-lg p-2 bg-card text-text outline-none focus:border-accent shadow-subtle font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1">Reason / Statement:</label>
            <textarea
              rows={3}
              value={adjustmentReason}
              onChange={(e) => setAdjustmentReason(e.target.value)}
              placeholder="State the justification for this bonus or deduction..."
              className="w-full border border-border rounded-lg p-2 bg-card text-text outline-none focus:border-accent shadow-subtle"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <LedgerButton variant="secondary" size="sm" onClick={() => setIsAdjustmentModalOpen(false)}>
              Cancel
            </LedgerButton>
            <LedgerButton
              variant="primary"
              size="sm"
              disabled={!adjustmentUserId || !adjustmentAmount || !adjustmentReason.trim() || addAdjustmentMutation.isPending}
              onClick={() =>
                addAdjustmentMutation.mutate({
                  userId: adjustmentUserId,
                  period: selectedMonth,
                  type: adjustmentType,
                  amount: parseFloat(adjustmentAmount),
                  reason: adjustmentReason.trim(),
                })
              }
            >
              {addAdjustmentMutation.isPending ? 'Saving...' : 'Commit Adjustment'}
            </LedgerButton>
          </div>
        </div>
      </LedgerModal>

      {/* Close Period Confirmation Modal */}
      <LedgerModal
        isOpen={isClosePeriodConfirmOpen}
        onClose={() => setIsClosePeriodConfirmOpen(false)}
        title={`Confirm Final Close for Period ${selectedMonth}`}
      >
        <div className="space-y-4 text-xs">
          <div className="border border-border rounded-lg bg-bg p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-danger font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Permanent Administrative Action</span>
            </div>
            <p className="text-muted leading-relaxed">
              Closing the period will lock all shift logs and deductions for <strong>{selectedMonth}</strong> from further modifications. Official PDF receipts will be marked as FINAL CLOSED.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <LedgerButton variant="secondary" size="sm" onClick={() => setIsClosePeriodConfirmOpen(false)}>
              Cancel
            </LedgerButton>
            <LedgerButton
              variant="primary"
              size="sm"
              disabled={closePeriodMutation.isPending}
              onClick={() => closePeriodMutation.mutate(selectedMonth)}
            >
              {closePeriodMutation.isPending ? 'Closing Cycle...' : 'Confirm and Close Period'}
            </LedgerButton>
          </div>
        </div>
      </LedgerModal>
    </MotionPage>
  );
};
