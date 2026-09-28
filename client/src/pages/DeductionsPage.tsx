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
import { RubberStamp } from '../components/common/RubberStamp.js';
import { PayslipReceipt } from '../components/common/PayslipReceipt.js';
import { LedgerIcon } from '../components/icons/LedgerIcons.js';

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
  const { data: periodStatus } = useQuery<PayrollPeriod | null>({
    queryKey: ['deductions', 'period-status', selectedMonth],
    queryFn: async () => {
      const res = await api.get(`/deductions/period-status?period=${selectedMonth}`);
      return res.data.data;
    },
  });

  // 8. Fetch Users for Adjustment Modal
  const { data: allUsers = [] } = useQuery<{ id: string; name: string; email: string }[]>({
    queryKey: ['attendance', 'users'],
    queryFn: async () => {
      const res = await api.get('/attendance/users');
      return res.data.data;
    },
    enabled: user?.role === 'admin',
  });

  // Mutations
  const disputeMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await api.post(`/deductions/${id}/dispute`, { reason });
      return res.data;
    },
    onSuccess: () => {
      addToast('Dispute lodged successfully and sent for administrative audit', 'success');
      setDisputeDeduction(null);
      setDisputeReason('');
      queryClient.invalidateQueries({ queryKey: ['deductions'] });
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || 'Failed to file dispute', 'error');
    },
  });

  const reviewDisputeMutation = useMutation({
    mutationFn: async ({ id, action, reviewNotes }: { id: string; action: 'accept' | 'reject'; reviewNotes?: string }) => {
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

  const batchApproveMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/deductions/admin/batch-approve', { period: selectedMonth });
      return res.data;
    },
    onSuccess: (data) => {
      addToast(data.message || 'All proposed deductions approved', 'success');
      queryClient.invalidateQueries({ queryKey: ['deductions'] });
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || 'Batch approval failed', 'error');
    },
  });

  const createAdjustmentMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/deductions/admin/adjustment', {
        userId: adjustmentUserId,
        period: selectedMonth,
        type: adjustmentType,
        amount: parseFloat(adjustmentAmount),
        reason: adjustmentReason,
      });
      return res.data;
    },
    onSuccess: () => {
      addToast('Adjustment recorded successfully', 'success');
      setIsAdjustmentModalOpen(false);
      setAdjustmentAmount('');
      setAdjustmentReason('');
      setAdjustmentUserId('');
      queryClient.invalidateQueries({ queryKey: ['deductions'] });
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || 'Failed to record adjustment', 'error');
    },
  });

  const closePeriodMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/deductions/admin/close-period', { period: selectedMonth });
      return res.data;
    },
    onSuccess: () => {
      addToast(`Billing cycle ${selectedMonth} locked and finalized`, 'success');
      setIsClosePeriodConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ['deductions'] });
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || 'Failed to close billing cycle', 'error');
    },
  });

  const totalApprovedDeductions = myDeductions
    .filter((d) => ['approved', 'closed_in_payroll'].includes(d.status))
    .reduce((sum, d) => sum + Number(d.amount), 0);

  const totalBonuses = myAdjustments
    .filter((a) => a.type === 'bonus')
    .reduce((sum, a) => sum + Number(a.amount), 0);

  const totalManualDeductions = myAdjustments
    .filter((a) => a.type === 'manual_deduction')
    .reduce((sum, a) => sum + Number(a.amount), 0);

  const baseSalary = salaryData?.monthlySalary || 0;
  const netEstimatedPay = Math.max(0, baseSalary - totalApprovedDeductions - totalManualDeductions + totalBonuses);

  const isPeriodClosed = periodStatus?.status === 'closed';

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'late':
        return 'Morning Lateness';
      case 'early_leave':
        return 'Early Departure';
      case 'unexcused_absence':
        return 'Unexcused Absence';
      case 'unpaid_leave':
        return 'Unpaid Leave';
      default:
        return 'Administrative Deduction';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-neutral-900 dark:border-neutral-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-500">
            <span>Tiger Finance &amp; Accounting</span>
            <span>/</span>
            <span>Payroll &amp; Deductions</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 dark:text-white mt-1 flex items-center gap-2.5">
            <LedgerIcon name="dollar" size={26} />
            <span>Payroll, Deductions &amp; Slips</span>
          </h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
            Transparent wage calculations, dispute workflows, statutory labor cap enforcement, and printable payslip receipts.
          </p>
        </div>

        {/* Month Selector & Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 border-2 border-neutral-900 dark:border-white bg-white dark:bg-black px-2.5 py-1 text-xs font-mono">
            <LedgerIcon name="calendar" size={14} />
            <span className="font-bold">Period:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-bold tabular-nums outline-none text-neutral-950 dark:text-white"
            />
          </div>

          {/* Period Status Stamp */}
          <div className="inline-block">
            {isPeriodClosed ? (
              <RubberStamp label="PERIOD CLOSED" recordId={`period-${selectedMonth}`} subtext="LOCKED FROM EDITING" />
            ) : (
              <RubberStamp label="PERIOD OPEN" recordId={`period-${selectedMonth}`} subtext="ACTIVE CYCLE" />
            )}
          </div>

          {/* Tab Switcher if Admin */}
          {user?.role === 'admin' && (
            <div className="inline-flex border-2 border-neutral-900 dark:border-white bg-white dark:bg-black p-0.5">
              <button
                type="button"
                onClick={() => setActiveTab('my')}
                className={`px-3 py-1 text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === 'my'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-black'
                    : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900'
                }`}
              >
                My Payslip
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-1 text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-black'
                    : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900'
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
          <div className="flex items-center justify-between border-b border-dashed border-neutral-300 dark:border-neutral-700 pb-2">
            <div className="inline-flex border border-neutral-900 dark:border-white bg-neutral-100 dark:bg-neutral-900 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setEmployeeSubView('receipt')}
                className={`px-3 py-1 font-bold transition-colors cursor-pointer ${
                  employeeSubView === 'receipt'
                    ? 'bg-white text-neutral-950 dark:bg-neutral-800 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                Official Payslip Voucher
              </button>
              <button
                type="button"
                onClick={() => setEmployeeSubView('table')}
                className={`px-3 py-1 font-bold transition-colors cursor-pointer ${
                  employeeSubView === 'table'
                    ? 'bg-white text-neutral-950 dark:bg-neutral-800 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                Deductions Itemized Log ({myDeductions.length})
              </button>
            </div>

            <div className="text-xs font-mono text-neutral-500">
              Period: <span className="font-bold tabular-nums">{selectedMonth}</span>
            </div>
          </div>

          {/* VIEW A: Perforated Payslip Receipt */}
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

          {/* VIEW B: Ruled Ledger Table for Deductions */}
          {employeeSubView === 'table' && (
            <div className="space-y-6">
              <LedgerTable>
                <div className="p-3 border-b-2 border-neutral-900 dark:border-neutral-100 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-between">
                  <div className="font-bold text-sm">
                    Itemized Deductions for {selectedMonth}
                  </div>
                  <span className="font-mono text-xs font-bold border border-neutral-900 dark:border-white px-2 py-0.5 bg-white dark:bg-black">
                    {myDeductions.length} entries
                  </span>
                </div>

                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">
                      <th className="px-4 py-3 font-bold font-mono">Date</th>
                      <th className="px-4 py-3 font-bold">Category</th>
                      <th className="px-4 py-3 font-bold">Statement &amp; Reason</th>
                      <th className="px-4 py-3 font-bold font-mono">Rule Breakdown</th>
                      <th className="px-4 py-3 font-bold font-mono">Amount</th>
                      <th className="px-4 py-3 font-bold text-center">Status</th>
                      <th className="px-4 py-3 font-bold text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {myDeductions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-neutral-500 font-mono">
                          No deductions recorded against your account during this billing period. Perfect record!
                        </td>
                      </tr>
                    ) : (
                      myDeductions.map((ded) => {
                        const canDispute = !isPeriodClosed && ['proposed', 'approved'].includes(ded.status) && !ded.dispute;

                        return (
                          <tr key={ded.id} className="hover:bg-neutral-100/50 dark:hover:bg-neutral-900/50 transition-colors">
                            <td className="px-4 py-3 font-mono tabular-nums text-neutral-700 dark:text-neutral-300">
                              {format(new Date(ded.createdAt), 'yyyy-MM-dd')}
                            </td>
                            <td className="px-4 py-3 font-bold text-neutral-950 dark:text-white">
                              {getTypeLabel(ded.type)}
                            </td>
                            <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 max-w-xs">
                              {ded.reason}
                            </td>
                            <td className="px-4 py-3 font-mono text-[11px] text-neutral-600 dark:text-neutral-400">
                              {ded.calculationDetails?.explanation ? (
                                <span className="border border-neutral-300 dark:border-neutral-700 px-1 py-0.5 bg-neutral-50 dark:bg-neutral-900">
                                  {ded.calculationDetails.explanation}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="px-4 py-3 font-mono font-bold tabular-nums text-neutral-950 dark:text-white">
                              {Number(ded.amount).toFixed(2)} SAR
                            </td>
                            <td className="px-4 py-3 text-center">
                              <RubberStamp
                                label={getStatusStampLabel(ded.status)}
                                recordId={ded.id}
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              {canDispute ? (
                                <LedgerButton
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    setDisputeDeduction(ded);
                                    setDisputeReason('');
                                  }}
                                >
                                  Dispute
                                </LedgerButton>
                              ) : ded.dispute ? (
                                <div className="text-[10px] font-mono font-bold">
                                  {ded.dispute.status === 'pending' && <span className="text-amber-500">In Review</span>}
                                  {ded.dispute.status === 'accepted' && <span className="text-emerald-500">Accepted ✓</span>}
                                  {ded.dispute.status === 'rejected' && <span className="line-through text-neutral-400">Rejected</span>}
                                </div>
                              ) : (
                                <span className="text-neutral-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </LedgerTable>

              {/* Adjustments Table */}
              {myAdjustments.length > 0 && (
                <LedgerTable>
                  <div className="p-3 border-b-2 border-neutral-900 dark:border-neutral-100 bg-neutral-100 dark:bg-neutral-900 font-bold text-sm">
                    Direct Administrative Bonuses &amp; Adjustments
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">
                        <th className="px-4 py-3 font-bold font-mono">Date</th>
                        <th className="px-4 py-3 font-bold">Category</th>
                        <th className="px-4 py-3 font-bold">Statement</th>
                        <th className="px-4 py-3 font-bold font-mono">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono">
                      {myAdjustments.map((adj) => (
                        <tr key={adj.id}>
                          <td className="px-4 py-3 tabular-nums">{format(new Date(adj.createdAt), 'yyyy-MM-dd')}</td>
                          <td className="px-4 py-3 font-bold">
                            {adj.type === 'bonus' ? 'Bonus / Incentive' : 'Manual Deduction'}
                          </td>
                          <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{adj.reason}</td>
                          <td className="px-4 py-3 font-bold tabular-nums">
                            {adj.type === 'bonus' ? '+' : '-'}
                            {Number(adj.amount).toFixed(2)} SAR
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </LedgerTable>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. ADMIN VIEW */}
      {activeTab === 'admin' && user?.role === 'admin' && (
        <div className="space-y-6">
          {/* Admin Command Bar */}
          <div className="border-2 border-neutral-900 dark:border-white bg-[#faf9f5] dark:bg-[#141414] p-4 shadow-solid-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-950 dark:text-white flex items-center gap-2">
                <LedgerIcon name="shield" size={16} />
                <span>Financial Cycle Management for {selectedMonth}</span>
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                {isPeriodClosed
                  ? 'Billing cycle is locked in certified archives. Modifications are disabled.'
                  : 'Approve proposed deductions, arbitrate employee disputes, and seal monthly ledger.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <LedgerButton
                variant="secondary"
                size="sm"
                icon="plus"
                disabled={isPeriodClosed}
                onClick={() => setIsAdjustmentModalOpen(true)}
              >
                Add Bonus / Adjustment
              </LedgerButton>

              <LedgerButton
                variant="primary"
                size="sm"
                icon="check"
                disabled={isPeriodClosed || proposedDeductions.length === 0 || batchApproveMutation.isPending}
                onClick={() => batchApproveMutation.mutate()}
              >
                Approve All ({proposedDeductions.length})
              </LedgerButton>

              {!isPeriodClosed && (
                <LedgerButton
                  variant="danger"
                  size="sm"
                  icon="lock"
                  onClick={() => setIsClosePeriodConfirmOpen(true)}
                >
                  Finalize &amp; Close Cycle
                </LedgerButton>
              )}
            </div>
          </div>

          {/* Pending Disputes Queue */}
          {disputedDeductions.length > 0 && (
            <LedgerTable>
              <div className="p-3 border-b-2 border-neutral-900 dark:border-neutral-100 bg-neutral-100 dark:bg-neutral-900 font-bold text-sm flex items-center justify-between">
                <span>Pending Employee Dispute Queue ({disputedDeductions.length})</span>
              </div>
              <div className="divide-y divide-neutral-200 dark:divide-neutral-800 p-3 space-y-3">
                {disputedDeductions.map((ded) => (
                  <div key={ded.id} className="border border-neutral-900 dark:border-white p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-black">
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-bold text-neutral-950 dark:text-white">{ded.user?.name}</span>
                        <span className="text-neutral-500">({ded.user?.email})</span>
                        <span className="border border-neutral-400 px-1">{getTypeLabel(ded.type)}</span>
                        <span className="font-bold tabular-nums">{Number(ded.amount).toFixed(2)} SAR</span>
                      </div>
                      <p className="text-neutral-700 dark:text-neutral-300">
                        <strong>Dispute Statement:</strong> {ded.dispute?.reason || '—'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <LedgerButton
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setReviewingDispute({
                            id: ded.id,
                            name: ded.user?.name || '',
                            amount: Number(ded.amount),
                            reason: ded.dispute?.reason || '',
                          });
                          setReviewAction('accept');
                        }}
                      >
                        Accept (Cancel Deduction)
                      </LedgerButton>

                      <LedgerButton
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setReviewingDispute({
                            id: ded.id,
                            name: ded.user?.name || '',
                            amount: Number(ded.amount),
                            reason: ded.dispute?.reason || '',
                          });
                          setReviewAction('reject');
                        }}
                      >
                        Reject &amp; Enforce
                      </LedgerButton>
                    </div>
                  </div>
                ))}
              </div>
            </LedgerTable>
          )}

          {/* All Employees Payroll Summary Table */}
          <LedgerTable>
            <div className="p-3 border-b-2 border-neutral-900 dark:border-neutral-100 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-neutral-950 dark:text-white">
                  Workforce Payroll Roster for {selectedMonth}
                </h3>
                <p className="text-xs text-neutral-500">
                  Comprehensive wage overview with automatic statutory labor cap audit.
                </p>
              </div>

              <LedgerButton
                variant="secondary"
                size="sm"
                icon="download"
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
                Export Payroll CSV
              </LedgerButton>
            </div>

            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">
                  <th className="px-4 py-3 font-bold">Employee</th>
                  <th className="px-4 py-3 font-bold font-mono">Gross Base</th>
                  <th className="px-4 py-3 font-bold font-mono">Daily Wage</th>
                  <th className="px-4 py-3 font-bold font-mono">Total Deductions</th>
                  <th className="px-4 py-3 font-bold text-center">Disciplinary Cap</th>
                  <th className="px-4 py-3 font-bold font-mono">Bonuses</th>
                  <th className="px-4 py-3 font-bold font-mono">Net Payable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono">
                {payrollSummary.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-neutral-500 font-mono">
                      No payroll records found for this billing period.
                    </td>
                  </tr>
                ) : (
                  payrollSummary.map((item) => (
                    <tr key={item.user.id} className="hover:bg-neutral-100/50 dark:hover:bg-neutral-900/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-neutral-950 dark:text-white">
                        <div>{item.user.name}</div>
                        <div className="text-[10px] text-neutral-500 font-mono">{item.user.email}</div>
                      </td>
                      <td className="px-4 py-3 tabular-nums">{Number(item.monthlySalary).toFixed(2)} SAR</td>
                      <td className="px-4 py-3 tabular-nums text-neutral-500">{Number(item.dayWage).toFixed(2)} SAR</td>
                      <td className="px-4 py-3 tabular-nums font-bold text-neutral-900 dark:text-white">
                        -{Number(item.totalDeductions).toFixed(2)} SAR
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.capExceeded ? (
                          <span className="border border-neutral-900 dark:border-white px-1 py-0.5 bg-neutral-200 dark:bg-neutral-800 font-bold text-[10px]">
                            Cap Reached ({Number(item.disciplinaryCapAmount).toFixed(0)} SAR)
                          </span>
                        ) : (
                          <span className="text-[10px] text-neutral-400">Within Limit</span>
                        )}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-neutral-800 dark:text-neutral-200">
                        +{Number(item.bonuses).toFixed(2)} SAR
                      </td>
                      <td className="px-4 py-3 tabular-nums font-black text-sm text-neutral-950 dark:text-white border-b-2 border-neutral-900 dark:border-white">
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

      {/* 4. MODALS */}

      {/* Dispute Modal */}
      <LedgerModal
        isOpen={Boolean(disputeDeduction)}
        onClose={() => setDisputeDeduction(null)}
        title="Lodge Formal Deduction Dispute"
      >
        {disputeDeduction && (
          <div className="space-y-4 text-xs">
            <div className="border border-neutral-900 dark:border-white p-3 font-mono space-y-1">
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
              <label className="block text-xs font-bold mb-1">Dispute Reason &amp; Supporting Circumstances (Required):</label>
              <textarea
                rows={4}
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Explain the emergency or attached excuse..."
                className="w-full border-1.5 border-neutral-900 dark:border-white p-2.5 bg-white dark:bg-black outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
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
            <div className="border border-neutral-900 dark:border-white p-3 font-mono space-y-1">
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
              <label className="block text-xs font-bold mb-1">Official Manager Notes:</label>
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Enter formal rationale..."
                className="w-full border-1.5 border-neutral-900 dark:border-white p-2.5 bg-white dark:bg-black outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
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
            <label className="block text-xs font-bold mb-1">Target Employee:</label>
            <select
              value={adjustmentUserId}
              onChange={(e) => setAdjustmentUserId(e.target.value)}
              className="w-full border-1.5 border-neutral-900 dark:border-white p-2 bg-white dark:bg-black outline-none font-bold"
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
            <label className="block text-xs font-bold mb-1">Adjustment Type:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType('bonus')}
                className={`py-2 px-3 text-xs font-bold border-2 transition-colors cursor-pointer ${
                  adjustmentType === 'bonus'
                    ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-black'
                    : 'border-neutral-400 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                Bonus / Incentive (+)
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('manual_deduction')}
                className={`py-2 px-3 text-xs font-bold border-2 transition-colors cursor-pointer ${
                  adjustmentType === 'manual_deduction'
                    ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-black'
                    : 'border-neutral-400 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                Manual Deduction (-)
              </button>
            </div>
          </div>

          <div>
            <LedgerInput
              label="Amount (SAR):"
              type="number"
              min="0"
              step="0.01"
              value={adjustmentAmount}
              onChange={(e) => setAdjustmentAmount(e.target.value)}
              placeholder="e.g. 250"
              isMono
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Written Justification (Audit Required):</label>
            <textarea
              rows={2}
              value={adjustmentReason}
              onChange={(e) => setAdjustmentReason(e.target.value)}
              placeholder="e.g. Outstanding performance on priority deliverable..."
              className="w-full border-1.5 border-neutral-900 dark:border-white p-2.5 bg-white dark:bg-black outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <LedgerButton variant="secondary" size="sm" onClick={() => setIsAdjustmentModalOpen(false)}>
              Cancel
            </LedgerButton>
            <LedgerButton
              variant="primary"
              size="sm"
              disabled={!adjustmentUserId || !adjustmentAmount || !adjustmentReason.trim() || createAdjustmentMutation.isPending}
              onClick={() => createAdjustmentMutation.mutate()}
            >
              {createAdjustmentMutation.isPending ? 'Recording...' : 'Save Financial Adjustment'}
            </LedgerButton>
          </div>
        </div>
      </LedgerModal>

      {/* Close Period Confirmation Modal */}
      <LedgerModal
        isOpen={isClosePeriodConfirmOpen}
        onClose={() => setIsClosePeriodConfirmOpen(false)}
        title={`Finalize & Lock Payroll for ${selectedMonth}`}
      >
        <div className="space-y-4 text-xs">
          <p className="leading-relaxed border border-neutral-900 dark:border-white p-3 font-mono bg-neutral-100 dark:bg-neutral-900">
            Financial Audit Notice: Closing the cycle is <strong>permanent and irrevocable</strong>. All deductions will be marked <code className="font-bold">closed_in_payroll</code>, and further modifications will be rejected.
          </p>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <LedgerButton variant="secondary" size="sm" onClick={() => setIsClosePeriodConfirmOpen(false)}>
              Go Back
            </LedgerButton>
            <LedgerButton
              variant="danger"
              size="sm"
              disabled={closePeriodMutation.isPending}
              onClick={() => closePeriodMutation.mutate()}
            >
              {closePeriodMutation.isPending ? 'Finalizing...' : 'Yes, Lock & Finalize Cycle'}
            </LedgerButton>
          </div>
        </div>
      </LedgerModal>
    </MotionPage>
  );
};

export default DeductionsPage;
