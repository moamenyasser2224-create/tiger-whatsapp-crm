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
      addToast('تم رفع الاعتراض بنجاح وجاري مراجعته من الإدارة', 'success');
      setDisputeDeduction(null);
      setDisputeReason('');
      queryClient.invalidateQueries({ queryKey: ['deductions'] });
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || 'فشل رفع الاعتراض', 'error');
    },
  });

  const reviewDisputeMutation = useMutation({
    mutationFn: async ({ id, action, reviewNotes }: { id: string; action: 'accept' | 'reject'; reviewNotes?: string }) => {
      const res = await api.post(`/deductions/${id}/review-dispute`, { action, reviewNotes });
      return res.data;
    },
    onSuccess: (data) => {
      addToast(data.message || 'تمت معالجة الاعتراض', 'success');
      setReviewingDispute(null);
      setReviewNotes('');
      queryClient.invalidateQueries({ queryKey: ['deductions'] });
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || 'فشلت معالجة الاعتراض', 'error');
    },
  });

  const batchApproveMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/deductions/admin/batch-approve', { period: selectedMonth });
      return res.data;
    },
    onSuccess: (data) => {
      addToast(data.message || 'تم اعتماد كافة الخصومات المقترحة', 'success');
      queryClient.invalidateQueries({ queryKey: ['deductions'] });
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || 'فشل الاعتماد الجماعي', 'error');
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
      addToast('تم تسجيل التسوية بنجاح', 'success');
      setIsAdjustmentModalOpen(false);
      setAdjustmentAmount('');
      setAdjustmentReason('');
      setAdjustmentUserId('');
      queryClient.invalidateQueries({ queryKey: ['deductions'] });
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || 'فشل تسجيل التسوية', 'error');
    },
  });

  const closePeriodMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/deductions/admin/close-period', { period: selectedMonth });
      return res.data;
    },
    onSuccess: () => {
      addToast(`تم إغلاق وتجميد الشهر المالي ${selectedMonth} بنجاح`, 'success');
      setIsClosePeriodConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ['deductions'] });
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || 'فشل إغلاق الشهر المالي', 'error');
    },
  });

  // Calculate Employee Totals
  const totalApprovedDeductions = myDeductions
    .filter((d) => ['approved', 'closed_in_payroll'].includes(d.status))
    .reduce((sum, d) => sum + Number(d.amount), 0);

  const totalProposedDeductions = myDeductions
    .filter((d) => d.status === 'proposed')
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
        return 'تأخير صباحي';
      case 'early_leave':
        return 'انصراف مبكر';
      case 'unexcused_absence':
        return 'غياب بدون إذن';
      case 'unpaid_leave':
        return 'إجازة غير مدفوعة';
      default:
        return 'خصم إداري';
    }
  };

  const getStatusStampLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'معتمد';
      case 'proposed':
        return 'مقترح';
      case 'disputed':
        return 'محل نزاع';
      case 'cancelled':
        return 'ملغي';
      case 'closed_in_payroll':
        return 'مغلق نهائياً';
      default:
        return status;
    }
  };

  const serialNumber = `${selectedMonth.replace('-', '')}-${(user?.id || '0').slice(-4).toUpperCase()}`;

  return (
    <MotionPage className="space-y-6">
      {/* 1. Header (ترويسة السجل المالي) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-neutral-900 dark:border-neutral-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-500">
            <span>النظام المحاسبي والمالي</span>
            <span>/</span>
            <span>مسير الرواتب والخصومات</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-neutral-950 dark:text-white mt-1 flex items-center gap-2.5">
            <LedgerIcon name="dollar" size={26} />
            <span>دفتر الرواتب والخصومات الرسمية</span>
          </h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 font-ledger">
            معادلات حساب دقيقة، إمكانية الاعتراض، التحقق من السقف التأديبي، وقسائم رواتب مثقوبة ومعتمدة.
          </p>
        </div>

        {/* Month Selector & Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 border-2 border-neutral-900 dark:border-white bg-white dark:bg-black px-2.5 py-1 text-xs font-mono">
            <LedgerIcon name="calendar" size={14} />
            <span className="font-bold">الشهر:</span>
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
              <RubberStamp label="الشهر مغلق" recordId={`period-${selectedMonth}`} subtext="محمي من التعديل" />
            ) : (
              <RubberStamp label="الشهر مفتوح" recordId={`period-${selectedMonth}`} subtext="قيد التسويات" />
            )}
          </div>

          {/* Tab Switcher if Admin */}
          {user?.role === 'admin' && (
            <div className="inline-flex border-2 border-neutral-900 dark:border-white bg-white dark:bg-black p-0.5">
              <button
                type="button"
                onClick={() => setActiveTab('my')}
                className={`px-3 py-1 text-xs font-bold font-ledger transition-colors ${
                  activeTab === 'my'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-black'
                    : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900'
                }`}
              >
                مسير راتبي
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-1 text-xs font-bold font-ledger transition-colors ${
                  activeTab === 'admin'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-black'
                    : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900'
                }`}
              >
                لوحة الرقابة والرواتب
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
            <div className="inline-flex border border-neutral-900 dark:border-white bg-neutral-100 dark:bg-neutral-900 p-0.5 text-xs font-ledger">
              <button
                type="button"
                onClick={() => setEmployeeSubView('receipt')}
                className={`px-3 py-1 font-bold transition-colors ${
                  employeeSubView === 'receipt'
                    ? 'bg-white text-neutral-950 dark:bg-neutral-800 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                قسيمة الراتب المثقوبة (إيصال)
              </button>
              <button
                type="button"
                onClick={() => setEmployeeSubView('table')}
                className={`px-3 py-1 font-bold transition-colors ${
                  employeeSubView === 'table'
                    ? 'bg-white text-neutral-950 dark:bg-neutral-800 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                دفتر تفاصيل الخصومات ({myDeductions.length})
              </button>
            </div>

            <div className="text-xs font-mono text-neutral-500">
              دورة: <span className="font-bold tabular-nums">{selectedMonth}</span>
            </div>
          </div>

          {/* VIEW A: Perforated Payslip Receipt */}
          {employeeSubView === 'receipt' && (
            <div className="py-2">
              <PayslipReceipt
                serialNumber={serialNumber}
                employeeName={user?.name || 'الموظف'}
                employeeEmail={user?.email || ''}
                period={selectedMonth}
                baseSalary={baseSalary}
                dayWage={Number(salaryData?.dayWage || 0)}
                deductions={totalApprovedDeductions + totalManualDeductions}
                bonuses={totalBonuses}
                netPay={netEstimatedPay}
                isClosed={isPeriodClosed}
                currency={salaryData?.currency || 'ر.س'}
                onPrint={() => window.print()}
              />
            </div>
          )}

          {/* VIEW B: Ruled Ledger Table for Deductions */}
          {employeeSubView === 'table' && (
            <div className="space-y-6">
              <LedgerTable>
                <div className="p-3 border-b-2 border-neutral-900 dark:border-neutral-100 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-between">
                  <div className="font-bold font-display text-sm">
                    سجل الخصومات لشهر {selectedMonth}
                  </div>
                  <span className="font-mono text-xs font-bold border border-neutral-900 dark:border-white px-2 py-0.5 bg-white dark:bg-black">
                    {myDeductions.length} قيود
                  </span>
                </div>

                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">
                      <th className="px-4 py-3 font-bold font-mono">تاريخ الخصم</th>
                      <th className="px-4 py-3 font-bold">النوع</th>
                      <th className="px-4 py-3 font-bold">البيان والسبب</th>
                      <th className="px-4 py-3 font-bold font-mono">المعادلة المطبقة</th>
                      <th className="px-4 py-3 font-bold font-mono">المبلغ</th>
                      <th className="px-4 py-3 font-bold text-center">الحالة</th>
                      <th className="px-4 py-3 font-bold text-center">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {myDeductions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-neutral-500 font-mono">
                          لا توجد خصومات مقيدة بحسابك خلال دورة هذا الشهر. سجل ممتاز!
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
                            <td className="px-4 py-3 font-bold text-neutral-950 dark:text-white font-ledger">
                              {getTypeLabel(ded.type)}
                            </td>
                            <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 max-w-xs font-ledger">
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
                              {Number(ded.amount).toFixed(2)} ر.س
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
                                  اعتراض
                                </LedgerButton>
                              ) : ded.dispute ? (
                                <div className="text-[10px] font-mono font-bold">
                                  {ded.dispute.status === 'pending' && <span>قيد المراجعة</span>}
                                  {ded.dispute.status === 'accepted' && <span>تم القبول ✓</span>}
                                  {ded.dispute.status === 'rejected' && <span className="line-through">مرفوض</span>}
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
                  <div className="p-3 border-b-2 border-neutral-900 dark:border-neutral-100 bg-neutral-100 dark:bg-neutral-900 font-bold font-display text-sm">
                    المكافآت والتسويات الإدارية المباشرة
                  </div>
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">
                        <th className="px-4 py-3 font-bold font-mono">التاريخ</th>
                        <th className="px-4 py-3 font-bold">النوع</th>
                        <th className="px-4 py-3 font-bold">البيان</th>
                        <th className="px-4 py-3 font-bold font-mono">المبلغ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono">
                      {myAdjustments.map((adj) => (
                        <tr key={adj.id}>
                          <td className="px-4 py-3 tabular-nums">{format(new Date(adj.createdAt), 'yyyy-MM-dd')}</td>
                          <td className="px-4 py-3 font-bold font-ledger">
                            {adj.type === 'bonus' ? 'مكافأة / حافز' : 'تسوية خصم'}
                          </td>
                          <td className="px-4 py-3 font-ledger text-neutral-700 dark:text-neutral-300">{adj.reason}</td>
                          <td className="px-4 py-3 font-bold tabular-nums">
                            {adj.type === 'bonus' ? '+' : '-'}
                            {Number(adj.amount).toFixed(2)} ر.س
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
              <h3 className="text-sm font-bold font-display text-neutral-950 dark:text-white flex items-center gap-2">
                <LedgerIcon name="shield" size={16} />
                <span>إدارة الدورة المالية لشهر {selectedMonth}</span>
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 font-ledger">
                {isPeriodClosed
                  ? 'الشهر مغلق ومجمد في السجلات المحاسبية الرسمية. لا يمكن قبول تسويات جديدة.'
                  : 'اعتماد الخصومات المقترحة آلياً، مراجعة النزاعات، وإغلاق المسير المالي نهائياً.'}
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
                إضافة مكافأة / تسوية
              </LedgerButton>

              <LedgerButton
                variant="primary"
                size="sm"
                icon="check"
                disabled={isPeriodClosed || proposedDeductions.length === 0 || batchApproveMutation.isPending}
                onClick={() => batchApproveMutation.mutate()}
              >
                اعتماد الكل ({proposedDeductions.length})
              </LedgerButton>

              {!isPeriodClosed && (
                <LedgerButton
                  variant="danger"
                  size="sm"
                  icon="lock"
                  onClick={() => setIsClosePeriodConfirmOpen(true)}
                >
                  إغلاق الشهر نهائياً
                </LedgerButton>
              )}
            </div>
          </div>

          {/* Pending Disputes Queue */}
          {disputedDeductions.length > 0 && (
            <LedgerTable>
              <div className="p-3 border-b-2 border-neutral-900 dark:border-neutral-100 bg-neutral-100 dark:bg-neutral-900 font-bold font-display text-sm flex items-center justify-between">
                <span>طلبات الاعتراض المعلقة من الموظفين ({disputedDeductions.length})</span>
              </div>
              <div className="divide-y divide-neutral-200 dark:divide-neutral-800 p-3 space-y-3">
                {disputedDeductions.map((ded) => (
                  <div key={ded.id} className="border border-neutral-900 dark:border-white p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-black">
                    <div className="space-y-1 font-ledger text-xs">
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-bold text-neutral-950 dark:text-white font-ledger">{ded.user?.name}</span>
                        <span className="text-neutral-500">({ded.user?.email})</span>
                        <span className="border border-neutral-400 px-1">{getTypeLabel(ded.type)}</span>
                        <span className="font-bold tabular-nums">{Number(ded.amount).toFixed(2)} ر.س</span>
                      </div>
                      <p className="text-neutral-700 dark:text-neutral-300">
                        <strong>بيان الاعتراض:</strong> {ded.dispute?.reason || '—'}
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
                        قبول (إلغاء الخصم)
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
                        رفض وتثبيت
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
                <h3 className="font-bold font-display text-sm text-neutral-950 dark:text-white">
                  مسير رواتب الموظفين لشهر {selectedMonth}
                </h3>
                <p className="text-xs text-neutral-500 font-ledger">
                  كشف رواتب تفصيلي مع التدقيق التلقائي على سقف الخصم التأديبي القانوني.
                </p>
              </div>

              <LedgerButton
                variant="secondary"
                size="sm"
                icon="download"
                onClick={() => {
                  const csvRows = [
                    ['اسم الموظف', 'البريد', 'الراتب الأساسي', 'الخصومات', 'المكافآت', 'صافي الراتب'],
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
                تصدير مسير CSV
              </LedgerButton>
            </div>

            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">
                  <th className="px-4 py-3 font-bold">الموظف</th>
                  <th className="px-4 py-3 font-bold font-mono">الأساسي</th>
                  <th className="px-4 py-3 font-bold font-mono">أجر اليوم</th>
                  <th className="px-4 py-3 font-bold font-mono">إجمالي الخصم</th>
                  <th className="px-4 py-3 font-bold text-center">السقف التأديبي</th>
                  <th className="px-4 py-3 font-bold font-mono">المكافآت</th>
                  <th className="px-4 py-3 font-bold font-mono">الصافي المستحق</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono">
                {payrollSummary.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-neutral-500 font-mono">
                      لا توجد بيانات موظفين مسجلة لهذا الشهر.
                    </td>
                  </tr>
                ) : (
                  payrollSummary.map((item) => (
                    <tr key={item.user.id} className="hover:bg-neutral-100/50 dark:hover:bg-neutral-900/50 transition-colors">
                      <td className="px-4 py-3 font-bold font-ledger text-neutral-950 dark:text-white">
                        <div>{item.user.name}</div>
                        <div className="text-[10px] text-neutral-500 font-mono">{item.user.email}</div>
                      </td>
                      <td className="px-4 py-3 tabular-nums">{Number(item.monthlySalary).toFixed(2)} ر.س</td>
                      <td className="px-4 py-3 tabular-nums text-neutral-500">{Number(item.dayWage).toFixed(2)} ر.س</td>
                      <td className="px-4 py-3 tabular-nums font-bold text-neutral-900 dark:text-white">
                        -{Number(item.totalDeductions).toFixed(2)} ر.س
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.capExceeded ? (
                          <span className="border border-neutral-900 dark:border-white px-1 py-0.5 bg-neutral-200 dark:bg-neutral-800 font-bold text-[10px]">
                            بلغ السقف ({Number(item.disciplinaryCapAmount).toFixed(0)} ر.س)
                          </span>
                        ) : (
                          <span className="text-[10px] text-neutral-400">ضمن الحد النظامي</span>
                        )}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-neutral-800 dark:text-neutral-200">
                        +{Number(item.bonuses).toFixed(2)} ر.س
                      </td>
                      <td className="px-4 py-3 tabular-nums font-black text-sm text-neutral-950 dark:text-white border-b-2 border-neutral-900 dark:border-white">
                        {Number(item.netPay).toFixed(2)} ر.س
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
        title="تقديم اعتراض رسمي على الخصم"
      >
        {disputeDeduction && (
          <div className="space-y-4 font-ledger text-xs">
            <div className="border border-neutral-900 dark:border-white p-3 font-mono space-y-1">
              <p>
                <strong>الخصم:</strong> {getTypeLabel(disputeDeduction.type)}
              </p>
              <p>
                <strong>المبلغ:</strong> {Number(disputeDeduction.amount).toFixed(2)} ر.س
              </p>
              <p>
                <strong>تاريخ الخصم:</strong> {format(new Date(disputeDeduction.createdAt), 'yyyy-MM-dd')}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">سبب وظروف الاعتراض (إلزامي للتوثيق):</label>
              <textarea
                rows={4}
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="وضح الظرف الطارئ أو العذر المرفق..."
                className="w-full border-1.5 border-neutral-900 dark:border-white p-2.5 bg-white dark:bg-black outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <LedgerButton variant="secondary" size="sm" onClick={() => setDisputeDeduction(null)}>
                إلغاء
              </LedgerButton>
              <LedgerButton
                variant="primary"
                size="sm"
                disabled={!disputeReason.trim() || disputeMutation.isPending}
                onClick={() => disputeMutation.mutate({ id: disputeDeduction.id, reason: disputeReason.trim() })}
              >
                {disputeMutation.isPending ? 'جاري الإرسال...' : 'إرسال الاعتراض'}
              </LedgerButton>
            </div>
          </div>
        )}
      </LedgerModal>

      {/* Review Dispute Modal */}
      <LedgerModal
        isOpen={Boolean(reviewingDispute)}
        onClose={() => setReviewingDispute(null)}
        title={reviewAction === 'accept' ? 'قرار قبول الاعتراض (إلغاء الخصم)' : 'قرار رفض الاعتراض (تثبيت الخصم)'}
      >
        {reviewingDispute && (
          <div className="space-y-4 font-ledger text-xs">
            <div className="border border-neutral-900 dark:border-white p-3 font-mono space-y-1">
              <p>
                <strong>الموظف:</strong> {reviewingDispute.name}
              </p>
              <p>
                <strong>المبلغ:</strong> {reviewingDispute.amount} ر.س
              </p>
              <p>
                <strong>بيان الموظف:</strong> {reviewingDispute.reason}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">ملاحظات وقرار الإدارة:</label>
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="أدخل ملاحظات القرار الرسمي..."
                className="w-full border-1.5 border-neutral-900 dark:border-white p-2.5 bg-white dark:bg-black outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <LedgerButton variant="secondary" size="sm" onClick={() => setReviewingDispute(null)}>
                إلغاء
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
                {reviewDisputeMutation.isPending ? 'جاري التنفيذ...' : 'تأكيد القرار الدفتري'}
              </LedgerButton>
            </div>
          </div>
        )}
      </LedgerModal>

      {/* Manual Adjustment Modal */}
      <LedgerModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        title={`إضافة تسوية مالية / مكافأة لشهر ${selectedMonth}`}
      >
        <div className="space-y-4 font-ledger text-xs">
          <div>
            <label className="block text-xs font-bold mb-1">الموظف المعني:</label>
            <select
              value={adjustmentUserId}
              onChange={(e) => setAdjustmentUserId(e.target.value)}
              className="w-full border-1.5 border-neutral-900 dark:border-white p-2 bg-white dark:bg-black outline-none font-bold"
            >
              <option value="">اختر موظفاً...</option>
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">نوع الحركة:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType('bonus')}
                className={`py-2 px-3 text-xs font-bold border-2 transition-colors ${
                  adjustmentType === 'bonus'
                    ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-black'
                    : 'border-neutral-400 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                مكافأة / حافز (+)
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('manual_deduction')}
                className={`py-2 px-3 text-xs font-bold border-2 transition-colors ${
                  adjustmentType === 'manual_deduction'
                    ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-black'
                    : 'border-neutral-400 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                خصم يدوي مباشر (-)
              </button>
            </div>
          </div>

          <div>
            <LedgerInput
              label="المبلغ (ر.س):"
              type="number"
              min="0"
              step="0.01"
              value={adjustmentAmount}
              onChange={(e) => setAdjustmentAmount(e.target.value)}
              placeholder="مثال: 250"
              isMono
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">السبب المكتوب (إلزامي للرقابة):</label>
            <textarea
              rows={2}
              value={adjustmentReason}
              onChange={(e) => setAdjustmentReason(e.target.value)}
              placeholder="مثال: تميز في إنجاز المهام الاستثنائية..."
              className="w-full border-1.5 border-neutral-900 dark:border-white p-2.5 bg-white dark:bg-black outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <LedgerButton variant="secondary" size="sm" onClick={() => setIsAdjustmentModalOpen(false)}>
              إلغاء
            </LedgerButton>
            <LedgerButton
              variant="primary"
              size="sm"
              disabled={!adjustmentUserId || !adjustmentAmount || !adjustmentReason.trim() || createAdjustmentMutation.isPending}
              onClick={() => createAdjustmentMutation.mutate()}
            >
              {createAdjustmentMutation.isPending ? 'جاري القيد...' : 'حفظ الحركة المالية'}
            </LedgerButton>
          </div>
        </div>
      </LedgerModal>

      {/* Close Period Confirmation Modal */}
      <LedgerModal
        isOpen={isClosePeriodConfirmOpen}
        onClose={() => setIsClosePeriodConfirmOpen(false)}
        title={`إغلاق مسير الرواتب لشهر ${selectedMonth} نهائياً`}
      >
        <div className="space-y-4 font-ledger text-xs">
          <p className="leading-relaxed border border-neutral-900 dark:border-white p-3 font-mono bg-neutral-100 dark:bg-neutral-900">
            تحذير مالي: إغلاق الشهر المالي إجراء <strong>دائم وغير قابل للتراجع</strong>. سيتم تحويل كافة الخصومات والتسويات إلى حالة <code className="font-bold">closed_in_payroll</code>، ولن يُسمح بأي تعديل إضافي لهذا الشهر.
          </p>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <LedgerButton variant="secondary" size="sm" onClick={() => setIsClosePeriodConfirmOpen(false)}>
              تراجع
            </LedgerButton>
            <LedgerButton
              variant="danger"
              size="sm"
              disabled={closePeriodMutation.isPending}
              onClick={() => closePeriodMutation.mutate()}
            >
              {closePeriodMutation.isPending ? 'جاري الإغلاق...' : 'نعم، إغلاق الشهر نهائياً'}
            </LedgerButton>
          </div>
        </div>
      </LedgerModal>
    </MotionPage>
  );
};

export default DeductionsPage;
