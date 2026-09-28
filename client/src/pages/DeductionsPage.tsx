import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.js';
import { MotionPage } from '../components/motion/MotionPage.js';
import { CountUp } from '../components/motion/CountUp.js';
import { SpotlightCard } from '../components/motion/SpotlightCard.js';
import { useToast } from '../components/motion/Toast.js';
import type { Deduction, Adjustment, UserPayrollSummary, PayrollPeriod } from '../types/index.js';
import {
  DollarSign,
  TrendingDown,
  Gift,
  AlertTriangle,
  Receipt,
  FileSpreadsheet,
  Lock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Calendar,
  PlusCircle,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { format } from 'date-fns';

export const DeductionsPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [activeTab, setActiveTab] = useState<'my' | 'admin'>('my');

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
  const { data: myDeductions = [], isLoading: isMyDeductionsLoading } = useQuery<Deduction[]>({
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
  const { data: payrollSummary = [], isLoading: isPayrollLoading } = useQuery<UserPayrollSummary[]>({
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

  const approveDeductionMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/deductions/${id}/approve`);
      return res.data;
    },
    onSuccess: () => {
      addToast('تم اعتماد الخصم بنجاح', 'success');
      queryClient.invalidateQueries({ queryKey: ['deductions'] });
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || 'فشل اعتماد الخصم', 'error');
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-neutral-900 bg-neutral-900 text-white px-2.5 py-0.5 text-xs font-bold dark:border-white dark:bg-white dark:text-neutral-900">
            <CheckCircle2 className="h-3 w-3" />
            معتمد
          </span>
        );
      case 'proposed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-neutral-600 bg-neutral-100 text-neutral-800 px-2.5 py-0.5 text-xs font-bold dark:border-neutral-400 dark:bg-neutral-800 dark:text-neutral-200">
            <HelpCircle className="h-3 w-3" />
            مقترح
          </span>
        );
      case 'disputed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border-2 border-neutral-900 bg-transparent text-neutral-900 px-2.5 py-0.5 text-xs font-black dark:border-white dark:text-white">
            <AlertTriangle className="h-3 w-3" />
            محل نزاع
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-neutral-300 bg-neutral-100 text-neutral-400 line-through px-2.5 py-0.5 text-xs font-medium dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-500">
            <XCircle className="h-3 w-3" />
            ملغي
          </span>
        );
      case 'closed_in_payroll':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-neutral-900 bg-neutral-200 text-neutral-900 px-2.5 py-0.5 text-xs font-black dark:border-white dark:bg-neutral-800 dark:text-white">
            <Lock className="h-3 w-3" />
            مغلق نهائياً
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <MotionPage className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            <span>النظام المالي</span>
            <span>/</span>
            <span>الرواتب والخصومات</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white mt-1 flex items-center gap-3">
            <Receipt className="h-8 w-8 text-neutral-900 dark:text-white" />
            <span>نظام الخصومات ومسير الرواتب</span>
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl">
            شفافية كاملة بمعادلة الحساب لكل خصم، إمكانية الاعتراض المباشر، وضمان الحد الأقصى التأديبي القانوني.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector */}
          <div className="flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900">
            <Calendar className="h-4 w-4 text-neutral-500" />
            <span className="text-xs font-bold text-neutral-500">الشهر:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-mono text-sm font-bold text-neutral-900 outline-none dark:text-white"
            />
          </div>

          {/* Period Locked Badge */}
          {isPeriodClosed ? (
            <div className="flex items-center gap-1.5 rounded-xl border border-neutral-900 bg-neutral-900 px-3 py-2 text-xs font-black text-white dark:border-white dark:bg-white dark:text-neutral-900">
              <Lock className="h-3.5 w-3.5" />
              <span>الشهر مغلق نهائياً</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-xl border border-dashed border-neutral-400 bg-neutral-50 px-3 py-2 text-xs font-bold text-neutral-700 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-300">
              <span className="h-2 w-2 rounded-full bg-neutral-900 dark:bg-white animate-pulse" />
              <span>الشهر المالي مفتوح</span>
            </div>
          )}

          {/* Tab Switcher if Admin */}
          {user?.role === 'admin' && (
            <div className="flex rounded-xl border border-neutral-300 bg-neutral-100 p-1 dark:border-neutral-700 dark:bg-neutral-900">
              <button
                onClick={() => setActiveTab('my')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  activeTab === 'my'
                    ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-white'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                خصوماتي
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  activeTab === 'admin'
                    ? 'bg-neutral-900 text-white shadow-xs dark:bg-white dark:text-neutral-900'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                لوحة إدارة الرواتب
              </button>
            </div>
          )}
        </div>
      </div>

      {/* VIEW: EMPLOYEE TAB */}
      {activeTab === 'my' && (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SpotlightCard className="p-5">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-xs font-bold">الراتب الأساسي</span>
                <DollarSign className="h-4 w-4" />
              </div>
              <div className="text-2xl font-black text-neutral-900 dark:text-white font-mono">
                <CountUp end={baseSalary} duration={800} /> {salaryData?.currency || 'ر.س'}
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">
                أجر اليوم المعتمد: {salaryData?.dayWage ? Number(salaryData.dayWage).toFixed(2) : '—'} {salaryData?.currency || 'ر.س'}
              </p>
            </SpotlightCard>

            <SpotlightCard className="p-5">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-xs font-bold">إجمالي الخصومات المعتمدة</span>
                <TrendingDown className="h-4 w-4" />
              </div>
              <div className="text-2xl font-black text-neutral-900 dark:text-white font-mono">
                <CountUp end={totalApprovedDeductions + totalManualDeductions} duration={800} /> {salaryData?.currency || 'ر.س'}
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">
                {totalProposedDeductions > 0 && `(+ ${totalProposedDeductions} ر.س معلقة قيد المراجعة)`}
              </p>
            </SpotlightCard>

            <SpotlightCard className="p-5">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-xs font-bold">المكافآت والتسويات</span>
                <Gift className="h-4 w-4" />
              </div>
              <div className="text-2xl font-black text-neutral-900 dark:text-white font-mono">
                +<CountUp end={totalBonuses} duration={800} /> {salaryData?.currency || 'ر.س'}
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">
                {myAdjustments.length} حركة تسوية هذا الشهر
              </p>
            </SpotlightCard>

            <SpotlightCard className="p-5 border-2 border-neutral-900 dark:border-white">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-xs font-black text-neutral-900 dark:text-white">صافي الراتب المتوقع</span>
                <ShieldCheck className="h-4 w-4 text-neutral-900 dark:text-white" />
              </div>
              <div className="text-2xl font-black text-neutral-900 dark:text-white font-mono">
                <CountUp end={netEstimatedPay} duration={900} /> {salaryData?.currency || 'ر.س'}
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">
                المبلغ النهائي القابل للصرف بنهاية الشهر
              </p>
            </SpotlightCard>
          </div>

          {/* Deductions Table */}
          <div className="rounded-2xl border border-neutral-300 bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
            <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  <span>جدول الخصومات لشهر {selectedMonth}</span>
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  تفصيل كامل لمعادلة حساب الخصم. يمكنك تقديم اعتراض خلال 7 أيام من تاريخ الخصم.
                </p>
              </div>

              <span className="rounded-full border border-neutral-900 bg-neutral-100 dark:border-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono font-bold px-3 py-1 text-xs">
                {myDeductions.length} سجلات
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-neutral-50 text-xs font-bold uppercase text-neutral-500 dark:bg-neutral-800/50 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700">
                  <tr>
                    <th className="px-5 py-3.5">تاريخ الخصم</th>
                    <th className="px-5 py-3.5">نوع الخصم</th>
                    <th className="px-5 py-3.5">السبب والبيان</th>
                    <th className="px-5 py-3.5">معادلة الحساب المطبقة</th>
                    <th className="px-5 py-3.5">المبلغ</th>
                    <th className="px-5 py-3.5">الحالة</th>
                    <th className="px-5 py-3.5 text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {myDeductions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-neutral-400">
                        لا توجد أي خصومات مسجلة عليك خلال هذا الشهر. دمت منتظماً!
                      </td>
                    </tr>
                  ) : (
                    myDeductions.map((ded) => {
                      const canDispute = !isPeriodClosed && ['proposed', 'approved'].includes(ded.status) && !ded.dispute;
                      return (
                        <tr key={ded.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors">
                          <td className="px-5 py-4 font-mono text-xs text-neutral-600 dark:text-neutral-300">
                            {format(new Date(ded.createdAt), 'yyyy-MM-dd')}
                          </td>
                          <td className="px-5 py-4 font-bold text-neutral-900 dark:text-white">
                            {getTypeLabel(ded.type)}
                          </td>
                          <td className="px-5 py-4 text-xs text-neutral-600 dark:text-neutral-300 max-w-xs">
                            {ded.reason}
                          </td>
                          <td className="px-5 py-4 text-xs font-mono text-neutral-700 dark:text-neutral-300">
                            {ded.calculationDetails?.explanation ? (
                              <span className="rounded-md border border-neutral-200 bg-neutral-100 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-800">
                                {ded.calculationDetails.explanation}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-5 py-4 font-mono font-black text-neutral-900 dark:text-white">
                            {Number(ded.amount).toFixed(2)} ر.س
                          </td>
                          <td className="px-5 py-4">{getStatusBadge(ded.status)}</td>
                          <td className="px-5 py-4 text-center">
                            {canDispute ? (
                              <button
                                onClick={() => {
                                  setDisputeDeduction(ded);
                                  setDisputeReason('');
                                }}
                                className="rounded-lg border border-neutral-900 px-2.5 py-1 text-xs font-bold text-neutral-900 hover:bg-neutral-900 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                              >
                                تقديم اعتراض
                              </button>
                            ) : ded.dispute ? (
                              <div className="text-[11px] font-bold">
                                {ded.dispute.status === 'pending' && <span className="text-neutral-500">اعتراض قيد الدراسة</span>}
                                {ded.dispute.status === 'accepted' && <span className="text-neutral-900 dark:text-white">تم قبول الاعتراض</span>}
                                {ded.dispute.status === 'rejected' && <span className="text-neutral-500 line-through">تم رفض الاعتراض</span>}
                              </div>
                            ) : (
                              <span className="text-xs text-neutral-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Adjustments Table */}
          {myAdjustments.length > 0 && (
            <div className="rounded-2xl border border-neutral-300 bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
              <div className="p-5 border-b border-neutral-200 dark:border-neutral-800">
                <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  <span>المكافآت والتسويات الإدارية المباشرة</span>
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-neutral-50 text-xs font-bold text-neutral-500 dark:bg-neutral-800/50 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700">
                    <tr>
                      <th className="px-5 py-3">التاريخ</th>
                      <th className="px-5 py-3">النوع</th>
                      <th className="px-5 py-3">البيان والسبب</th>
                      <th className="px-5 py-3">المبلغ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {myAdjustments.map((adj) => (
                      <tr key={adj.id}>
                        <td className="px-5 py-3 font-mono text-xs text-neutral-500">
                          {format(new Date(adj.createdAt), 'yyyy-MM-dd')}
                        </td>
                        <td className="px-5 py-3 font-bold text-neutral-900 dark:text-white">
                          {adj.type === 'bonus' ? 'مكافأة / حافز' : 'تسوية خصم'}
                        </td>
                        <td className="px-5 py-3 text-xs text-neutral-600 dark:text-neutral-300">{adj.reason}</td>
                        <td className="px-5 py-3 font-mono font-bold">
                          {adj.type === 'bonus' ? '+' : '-'}
                          {Number(adj.amount).toFixed(2)} ر.س
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: ADMIN TAB */}
      {activeTab === 'admin' && user?.role === 'admin' && (
        <div className="space-y-8">
          {/* Admin Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl border border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black flex items-center justify-center">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  إدارة الدورة المالية لشهر {selectedMonth}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {isPeriodClosed
                    ? 'الشهر مغلق ومحمي من التعديل. الرواتب مجمدة في السجلات التاريخية.'
                    : 'يمكنك اعتماد الخصومات المقترحة، معالجة النزاعات، أو إغلاق الشهر نهائياً.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAdjustmentModalOpen(true)}
                disabled={isPeriodClosed}
                className="flex items-center gap-1.5 rounded-xl border border-neutral-900 px-3.5 py-2 text-xs font-bold text-neutral-900 hover:bg-neutral-100 disabled:opacity-50 dark:border-white dark:text-white dark:hover:bg-neutral-800 transition-colors"
              >
                <PlusCircle className="h-4 w-4" />
                <span>إضافة مكافأة / تسوية</span>
              </button>

              <button
                onClick={() => batchApproveMutation.mutate()}
                disabled={isPeriodClosed || proposedDeductions.length === 0 || batchApproveMutation.isPending}
                className="flex items-center gap-1.5 rounded-xl bg-neutral-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-colors"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>اعتماد الكل ({proposedDeductions.length})</span>
              </button>

              {!isPeriodClosed && (
                <button
                  onClick={() => setIsClosePeriodConfirmOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl border-2 border-neutral-900 bg-white px-3.5 py-2 text-xs font-black text-neutral-900 hover:bg-neutral-100 dark:border-white dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800 transition-colors"
                >
                  <Lock className="h-4 w-4" />
                  <span>إغلاق الشهر المالي نهائياً</span>
                </button>
              )}
            </div>
          </div>

          {/* Pending Disputes Queue */}
          {disputedDeductions.length > 0 && (
            <div className="rounded-2xl border-2 border-neutral-900 bg-white shadow-xs dark:border-white dark:bg-neutral-900 overflow-hidden">
              <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-neutral-900 dark:text-white" />
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                    طلبات الاعتراض المعلقة من الموظفين ({disputedDeductions.length})
                  </h3>
                </div>
              </div>

              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {disputedDeductions.map((ded) => (
                  <div key={ded.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-900 dark:text-white">{ded.user?.name}</span>
                        <span className="text-xs text-neutral-400 font-mono">({ded.user?.email})</span>
                        <span className="text-xs font-bold rounded bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800">
                          {getTypeLabel(ded.type)}
                        </span>
                        <span className="text-xs font-black font-mono">{Number(ded.amount).toFixed(2)} ر.س</span>
                      </div>
                      <div className="text-xs text-neutral-600 dark:text-neutral-300">
                        <strong>سبب الاعتراض:</strong> {ded.dispute?.reason || '—'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setReviewingDispute({
                            id: ded.id,
                            name: ded.user?.name || '',
                            amount: Number(ded.amount),
                            reason: ded.dispute?.reason || '',
                          });
                          setReviewAction('accept');
                        }}
                        className="rounded-lg bg-black px-3 py-1.5 text-xs font-bold text-white hover:bg-neutral-800 dark:bg-white dark:text-black transition-colors"
                      >
                        قبول (إلغاء الخصم)
                      </button>
                      <button
                        onClick={() => {
                          setReviewingDispute({
                            id: ded.id,
                            name: ded.user?.name || '',
                            amount: Number(ded.amount),
                            reason: ded.dispute?.reason || '',
                          });
                          setReviewAction('reject');
                        }}
                        className="rounded-lg border border-neutral-900 px-3 py-1.5 text-xs font-bold text-neutral-900 hover:bg-neutral-100 dark:border-white dark:text-white transition-colors"
                      >
                        رفض الاعتراض
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Employees Payroll Summary Table */}
          <div className="rounded-2xl border border-neutral-300 bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
            <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  <span>مسير رواتب الموظفين لشهر {selectedMonth}</span>
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  كشف رواتب تفصيلي متصل مباشرة بقاعدة البيانات مع التدقيق على سقف الخصم التأديبي القانوني.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
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
                  className="flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3 py-1.5 text-xs font-bold text-neutral-800 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>تصدير CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-neutral-50 text-xs font-bold uppercase text-neutral-500 dark:bg-neutral-800/50 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700">
                  <tr>
                    <th className="px-5 py-3.5">الموظف</th>
                    <th className="px-5 py-3.5">الراتب الأساسي</th>
                    <th className="px-5 py-3.5">أجر اليوم</th>
                    <th className="px-5 py-3.5">إجمالي الخصومات</th>
                    <th className="px-5 py-3.5">حالة السقف التأديبي</th>
                    <th className="px-5 py-3.5">المكافآت</th>
                    <th className="px-5 py-3.5">صافي الراتب المستحق</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {payrollSummary.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-neutral-400">
                        لا توجد بيانات موظفين لهذا الشهر.
                      </td>
                    </tr>
                  ) : (
                    payrollSummary.map((item) => (
                      <tr key={item.user.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors">
                        <td className="px-5 py-4 font-bold text-neutral-900 dark:text-white flex items-center gap-2.5">
                          {item.user.photoUrl ? (
                            <img
                              src={item.user.photoUrl}
                              alt={item.user.name}
                              className="h-8 w-8 rounded-full object-cover border border-neutral-300 grayscale"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center font-bold text-xs">
                              {item.user.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div>{item.user.name}</div>
                            <div className="text-xs text-neutral-400 font-normal">{item.user.email}</div>
                          </div>
                        </td>

                        <td className="px-5 py-4 font-mono font-bold text-neutral-900 dark:text-white">
                          {Number(item.monthlySalary).toFixed(2)} ر.س
                        </td>

                        <td className="px-5 py-4 font-mono text-xs text-neutral-500">
                          {Number(item.dayWage).toFixed(2)} ر.س
                        </td>

                        <td className="px-5 py-4 font-mono font-bold text-neutral-900 dark:text-white">
                          {Number(item.totalDeductions).toFixed(2)} ر.س
                        </td>

                        <td className="px-5 py-4">
                          {item.capExceeded ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-neutral-900 bg-neutral-100 px-2 py-0.5 text-xs font-black dark:border-white dark:bg-neutral-800">
                              <AlertTriangle className="h-3 w-3" />
                              بلغ السقف ({Number(item.disciplinaryCapAmount).toFixed(0)} ر.س)
                            </span>
                          ) : (
                            <span className="text-xs text-neutral-400">ضمن الحد المسموح</span>
                          )}
                        </td>

                        <td className="px-5 py-4 font-mono text-xs font-bold text-neutral-900 dark:text-white">
                          +{Number(item.bonuses).toFixed(2)} ر.س
                        </td>

                        <td className="px-5 py-4 font-mono font-black text-base text-neutral-900 dark:text-white">
                          {Number(item.netPay).toFixed(2)} ر.س
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Dispute Submit */}
      {disputeDeduction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-300 bg-white p-6 shadow-2xl dark:border-neutral-700 dark:bg-neutral-900 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-neutral-900 dark:text-white mb-2">
              تقديم اعتراض على الخصم
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
              الخصم: {getTypeLabel(disputeDeduction.type)} بقيمة {Number(disputeDeduction.amount).toFixed(2)} ر.س بتاريخ {format(new Date(disputeDeduction.createdAt), 'yyyy-MM-dd')}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  سبب الاعتراض والتوضيح (إلزامي)
                </label>
                <textarea
                  rows={4}
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="اكتب التوضيح أو الظرف الطارئ الذي أدى إلى هذا الخصم..."
                  className="w-full rounded-xl border border-neutral-300 bg-transparent p-3 text-sm text-neutral-900 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:text-white dark:focus:border-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDisputeDeduction(null)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={!disputeReason.trim() || disputeMutation.isPending}
                  onClick={() => disputeMutation.mutate({ id: disputeDeduction.id, reason: disputeReason.trim() })}
                  className="rounded-xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                >
                  {disputeMutation.isPending ? 'جاري الإرسال...' : 'إرسال الاعتراض للإدارة'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Review Dispute (Admin) */}
      {reviewingDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-300 bg-white p-6 shadow-2xl dark:border-neutral-700 dark:bg-neutral-900 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-neutral-900 dark:text-white mb-2">
              {reviewAction === 'accept' ? 'قبول الاعتراض وإلغاء الخصم' : 'رفض الاعتراض وتثبيت الخصم'}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
              الموظف: {reviewingDispute.name} | القيمة: {reviewingDispute.amount} ر.س <br />
              سبب الموظف: "{reviewingDispute.reason}"
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  ملاحظات الإدارة
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="أدخل ملاحظات القرار للإشعار..."
                  className="w-full rounded-xl border border-neutral-300 bg-transparent p-3 text-sm text-neutral-900 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:text-white dark:focus:border-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewingDispute(null)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={reviewDisputeMutation.isPending}
                  onClick={() =>
                    reviewDisputeMutation.mutate({
                      id: reviewingDispute.id,
                      action: reviewAction,
                      reviewNotes: reviewNotes.trim(),
                    })
                  }
                  className="rounded-xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                >
                  {reviewDisputeMutation.isPending ? 'جاري التنفيذ...' : 'تأكيد القرار'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add Manual Adjustment (Admin) */}
      {isAdjustmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-300 bg-white p-6 shadow-2xl dark:border-neutral-700 dark:bg-neutral-900 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              <span>إضافة تسوية مالية / مكافأة لشهر {selectedMonth}</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  الموظف المستهدف
                </label>
                <select
                  value={adjustmentUserId}
                  onChange={(e) => setAdjustmentUserId(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-transparent p-2.5 text-sm font-bold text-neutral-900 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:text-white dark:bg-neutral-800"
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
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  نوع الحركة
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('bonus')}
                    className={`rounded-xl py-2 px-3 text-xs font-bold border transition-colors ${
                      adjustmentType === 'bonus'
                        ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-black'
                        : 'border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400'
                    }`}
                  >
                    مكافأة / حافز إضافي (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('manual_deduction')}
                    className={`rounded-xl py-2 px-3 text-xs font-bold border transition-colors ${
                      adjustmentType === 'manual_deduction'
                        ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-black'
                        : 'border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400'
                    }`}
                  >
                    خصم يدوي مباشر (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  المبلغ (ر.س)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                  placeholder="مثال: 250"
                  className="w-full rounded-xl border border-neutral-300 bg-transparent p-2.5 text-sm font-mono font-bold text-neutral-900 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  السبب المكتوب (إلزامي للرقابة)
                </label>
                <textarea
                  rows={2}
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="مثال: إنجاز متفوق في إغلاق الصفقات..."
                  className="w-full rounded-xl border border-neutral-300 bg-transparent p-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={!adjustmentUserId || !adjustmentAmount || !adjustmentReason.trim() || createAdjustmentMutation.isPending}
                  onClick={() => createAdjustmentMutation.mutate()}
                  className="rounded-xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                >
                  {createAdjustmentMutation.isPending ? 'جاري الحفظ...' : 'حفظ التسوية'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Close Period Confirmation */}
      {isClosePeriodConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border-2 border-neutral-900 bg-white p-6 shadow-2xl dark:border-white dark:bg-neutral-900 animate-in fade-in zoom-in-95 duration-200">
            <div className="h-12 w-12 rounded-2xl border-2 border-neutral-900 dark:border-white flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-neutral-900 dark:text-white" />
            </div>
            <h3 className="text-lg font-black text-neutral-900 dark:text-white mb-2">
              تأكيد إغلاق مسير الرواتب لشهر {selectedMonth}
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
              تحذير مالي رقابي: إغلاق الشهر المالي إجراء <strong>دائم وغير قابل للتراجع</strong>. سيتم تحويل جميع الخصومات والتسويات إلى حالة <code className="font-bold">closed_in_payroll</code>، ولن يُسمح بعدها بإضافة أو تعديل أي خصومات أو قبول أي اعتراضات لهذا الشهر.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsClosePeriodConfirmOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              >
                تراجع
              </button>
              <button
                type="button"
                disabled={closePeriodMutation.isPending}
                onClick={() => closePeriodMutation.mutate()}
                className="rounded-xl bg-neutral-900 px-4 py-2 text-xs font-black text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
              >
                {closePeriodMutation.isPending ? 'جاري الإغلاق...' : 'نعم، إغلاق الشهر نهائياً'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MotionPage>
  );
};

export default DeductionsPage;
