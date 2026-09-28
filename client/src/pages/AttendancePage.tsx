import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useSocket } from '../contexts/SocketContext.js';
import { useAuth } from '../contexts/AuthContext.js';
import { MotionPage } from '../components/motion/MotionPage.js';
import { FlipClock } from '../components/motion/FlipClock.js';
import { SpotlightCard } from '../components/motion/SpotlightCard.js';
import { CountUp } from '../components/motion/CountUp.js';
import { useToast } from '../components/motion/Toast.js';
import { FaceBiometricsModal } from '../components/FaceBiometricsModal.js';
import type { Attendance, LeaveRequest, AttendanceCorrection } from '../types/index.js';
import {
  Clock,
  LogOut,
  LogIn,
  AlertCircle,
  Users,
  Calendar,
  Briefcase,
  ScanFace,
  CheckCircle2,
  XCircle,
  FileText,
  CalendarDays,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ar } from 'date-fns/locale';

export const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'attendance' | 'requests' | 'admin'>('attendance');
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);

  // Leave Modal State
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState<'annual' | 'sick' | 'unpaid' | 'emergency'>('annual');
  const [leaveStartDate, setLeaveStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [leaveEndDate, setLeaveEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [leaveReason, setLeaveReason] = useState('');

  // Correction Modal State
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionDate, setCorrectionDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [correctionCheckIn, setCorrectionCheckIn] = useState('');
  const [correctionCheckOut, setCorrectionCheckOut] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');

  // 1. My status today
  const { data: myStatus, isLoading: isMyStatusLoading } = useQuery<Attendance | null>({
    queryKey: ['attendance', 'my-status'],
    queryFn: async () => {
      const res = await api.get('/attendance/my-status');
      return res.data.data;
    },
  });

  // 2. Today's team attendance
  const { data: teamAttendance = [] } = useQuery<Attendance[]>({
    queryKey: ['attendance', 'today'],
    queryFn: async () => {
      const res = await api.get('/attendance/today');
      return res.data.data;
    },
  });

  // 3. My monthly attendance records (for calendar heatmap)
  const { data: monthlyRecords = [] } = useQuery<Attendance[]>({
    queryKey: ['attendance', 'monthly', selectedMonth],
    queryFn: async () => {
      const res = await api.get(`/attendance/monthly?month=${selectedMonth}`);
      return res.data.data;
    },
  });

  // 4. Leaves List (My / Admin)
  const { data: leaves = [] } = useQuery<LeaveRequest[]>({
    queryKey: ['attendance', 'leaves'],
    queryFn: async () => {
      const res = await api.get('/attendance/leaves');
      return res.data.data;
    },
  });

  // 5. Corrections List (My / Admin)
  const { data: corrections = [] } = useQuery<AttendanceCorrection[]>({
    queryKey: ['attendance', 'corrections'],
    queryFn: async () => {
      const res = await api.get('/attendance/corrections');
      return res.data.data;
    },
  });

  // Socket.io Real-time listener
  useEffect(() => {
    if (!socket) return;
    const handleAttendanceUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    };
    socket.on('attendance_update', handleAttendanceUpdate);
    return () => {
      socket.off('attendance_update', handleAttendanceUpdate);
    };
  }, [socket, queryClient]);

  // Check-In Mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/attendance/check-in');
      return res.data;
    },
    onSuccess: (data) => {
      addToast(data.message || 'تم تسجيل حضورك بنجاح!', 'success');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || 'فشل في تسجيل الحضور', 'error');
    },
  });

  // Check-Out Mutation
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/attendance/check-out');
      return res.data;
    },
    onSuccess: (data) => {
      addToast(data.message || 'تم تسجيل انصرافك بنجاح!', 'success');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || 'فشل في تسجيل الانصراف', 'error');
    },
  });

  // Leave Request Mutation
  const leaveMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/attendance/leaves', {
        type: leaveType,
        startDate: leaveStartDate,
        endDate: leaveEndDate,
        reason: leaveReason,
      });
      return res.data;
    },
    onSuccess: () => {
      addToast('تم تقديم طلب الإجازة بنجاح وهو قيد المراجعة', 'success');
      setIsLeaveModalOpen(false);
      setLeaveReason('');
      queryClient.invalidateQueries({ queryKey: ['attendance', 'leaves'] });
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || 'فشل تقديم طلب الإجازة', 'error');
    },
  });

  // Correction Request Mutation
  const correctionMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/attendance/corrections', {
        date: correctionDate,
        requestedCheckIn: correctionCheckIn ? `${correctionDate}T${correctionCheckIn}:00` : undefined,
        requestedCheckOut: correctionCheckOut ? `${correctionDate}T${correctionCheckOut}:00` : undefined,
        reason: correctionReason,
      });
      return res.data;
    },
    onSuccess: () => {
      addToast('تم إرسال طلب تصحيح البصمة بنجاح', 'success');
      setIsCorrectionModalOpen(false);
      setCorrectionReason('');
      queryClient.invalidateQueries({ queryKey: ['attendance', 'corrections'] });
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || 'فشل تقديم طلب التصحيح', 'error');
    },
  });

  // Admin: Review Leave Mutation
  const reviewLeaveMutation = useMutation({
    mutationFn: async ({ id, decision }: { id: string; decision: 'approved' | 'rejected' }) => {
      const res = await api.put(`/attendance/leaves/${id}/review`, { decision });
      return res.data;
    },
    onSuccess: (data) => {
      addToast(data.message || 'تم تحديث حالة طلب الإجازة', 'success');
      queryClient.invalidateQueries({ queryKey: ['attendance', 'leaves'] });
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || 'فشلت معالجة الطلب', 'error');
    },
  });

  // Admin: Review Correction Mutation
  const reviewCorrectionMutation = useMutation({
    mutationFn: async ({ id, decision }: { id: string; decision: 'approved' | 'rejected' }) => {
      const res = await api.put(`/attendance/corrections/${id}/review`, { decision });
      return res.data;
    },
    onSuccess: (data) => {
      addToast(data.message || 'تمت معالجة طلب التصحيح', 'success');
      queryClient.invalidateQueries({ queryKey: ['attendance', 'corrections'] });
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || 'فشلت معالجة الطلب', 'error');
    },
  });

  // Admin: Trigger Absence Job
  const triggerAbsenceJobMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/attendance/trigger-absence-job', {
        date: format(new Date(), 'yyyy-MM-dd'),
      });
      return res.data;
    },
    onSuccess: (data) => {
      addToast(`اكتمل فحص الغياب! تم تسجيل ${data.data?.absencesRecorded || 0} غياب`, 'success');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || 'فشل تنفيذ فحص الغياب', 'error');
    },
  });

  const hasCheckedIn = Boolean(myStatus?.checkIn);
  const hasCheckedOut = Boolean(myStatus?.checkOut);

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  // Calendar Heatmap Days Calculation
  const currentMonthDate = new Date(`${selectedMonth}-01`);
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonthDate),
    end: endOfMonth(currentMonthDate),
  });

  // Metrics summary
  const totalDaysPresent = monthlyRecords.filter((r) => r.checkIn).length;
  const totalWorkedMinutes = monthlyRecords.reduce((sum: number, r: any) => sum + (r.workedMinutes || 0), 0);
  const totalLateMinutes = monthlyRecords.reduce((sum: number, r: any) => sum + (r.lateMinutes || 0), 0);

  return (
    <MotionPage className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            <span>العمليات والدوام</span>
            <span>/</span>
            <span>الحضور والانصراف</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white mt-1 flex items-center gap-3">
            <Clock className="h-8 w-8 text-neutral-900 dark:text-white" />
            <span>نظام الحضور والانصراف المتقدم</span>
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl">
            ساعة رقمية حية، تقويم الحضور الشهري، تقديم الإجازات وتصحيح البصمة، مع كشف الحضور المباشر للفريق.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Live Flip Clock */}
          <div className="rounded-2xl border border-neutral-300 bg-white p-2 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs">
            <FlipClock />
          </div>

          {/* Tab Switcher */}
          <div className="flex rounded-xl border border-neutral-300 bg-neutral-100 p-1 dark:border-neutral-700 dark:bg-neutral-900">
            <button
              onClick={() => setActiveTab('attendance')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'attendance'
                  ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-white'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              تسجيل الحضور
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'requests'
                  ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-white'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              طلباتي ({leaves.length + corrections.length})
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  activeTab === 'admin'
                    ? 'bg-neutral-900 text-white shadow-xs dark:bg-white dark:text-neutral-900'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                لوحة المشرف
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TAB 1: ATTENDANCE & HEATMAP */}
      {activeTab === 'attendance' && (
        <div className="space-y-8">
          {/* Main Action Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions Card */}
            <div className="lg:col-span-1 rounded-2xl border border-neutral-300 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 flex flex-col justify-between">
              <div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  <span>إجراءات الدوام</span>
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6">
                  سجل حضورك اليومي بنقرة زر أو عبر التعرف على الوجه، وقدم طلبات الإجازات والتصحيح.
                </p>

                <div className="space-y-3">
                  {/* Check-In Button */}
                  <button
                    onClick={() => checkInMutation.mutate()}
                    disabled={hasCheckedIn || checkInMutation.isPending || isMyStatusLoading}
                    className={`w-full flex items-center justify-center gap-3 rounded-xl py-3.5 px-4 text-sm font-bold transition-all ${
                      hasCheckedIn
                        ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-300 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-500'
                        : 'bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 border border-neutral-900 dark:border-white'
                    }`}
                  >
                    <LogIn className="h-5 w-5" />
                    <span>
                      {checkInMutation.isPending
                        ? 'جاري التسجيل...'
                        : hasCheckedIn
                        ? 'تم تسجيل الحضور اليوم'
                        : 'تسجيل حضور الآن'}
                    </span>
                  </button>

                  {/* Check-Out Button */}
                  <button
                    onClick={() => checkOutMutation.mutate()}
                    disabled={!hasCheckedIn || hasCheckedOut || checkOutMutation.isPending || isMyStatusLoading}
                    className={`w-full flex items-center justify-center gap-3 rounded-xl py-3.5 px-4 text-sm font-bold transition-all ${
                      !hasCheckedIn || hasCheckedOut
                        ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-300 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-500'
                        : 'bg-white text-neutral-900 border-2 border-neutral-900 hover:bg-neutral-100 dark:bg-neutral-900 dark:text-white dark:border-white dark:hover:bg-neutral-800'
                    }`}
                  >
                    <LogOut className="h-5 w-5" />
                    <span>
                      {checkOutMutation.isPending
                        ? 'جاري التسجيل...'
                        : hasCheckedOut
                        ? 'تم تسجيل الانصراف اليوم'
                        : 'تسجيل انصراف الآن'}
                    </span>
                  </button>

                  {/* Face Biometrics Modal Button */}
                  <button
                    type="button"
                    onClick={() => setIsFaceModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-black uppercase tracking-wider border-2 border-dashed border-neutral-900 dark:border-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <ScanFace className="h-4 w-4" />
                    <span>تسجيل سريع بالوجه (Face Kiosk)</span>
                  </button>
                </div>
              </div>

              {/* Sub Actions */}
              <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => setIsLeaveModalOpen(true)}
                  className="flex-1 rounded-xl border border-neutral-300 px-3 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 text-center"
                >
                  طلب إجازة
                </button>
                <button
                  onClick={() => setIsCorrectionModalOpen(true)}
                  className="flex-1 rounded-xl border border-neutral-300 px-3 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 text-center"
                >
                  تصحيح بصمة
                </button>
              </div>
            </div>

            {/* My Status Details Card */}
            <div className="lg:col-span-2 rounded-2xl border border-neutral-300 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <span>بطاقة حالتي اليوم</span>
                    <span className="text-xs font-normal text-neutral-500">({user?.name})</span>
                  </h2>

                  {/* Status Badge */}
                  {hasCheckedOut ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-400 bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-700 dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-300">
                      <span className="h-2 w-2 rounded-full bg-neutral-400" />
                      مغادر (تم الانصراف)
                    </span>
                  ) : hasCheckedIn ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-neutral-900 bg-black px-3 py-1 text-xs font-black text-white dark:border-white dark:bg-white dark:text-black">
                      <span className="h-2 w-2 rounded-full bg-white dark:bg-black animate-pulse" />
                      متواجد في الدوام
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-neutral-500 bg-transparent px-3 py-1 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                      <span className="h-2 w-2 rounded-full bg-neutral-500" />
                      لم يحضر بعد
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
                  {/* Check-In */}
                  <div className="rounded-xl border border-neutral-300 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/40">
                    <div className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                      <LogIn className="h-4 w-4" />
                      <span>وقت الحضور المسجل</span>
                    </div>
                    <div className="font-mono text-2xl font-black text-neutral-900 dark:text-white">
                      {formatTime(myStatus?.checkIn)}
                    </div>
                  </div>

                  {/* Check-Out */}
                  <div className="rounded-xl border border-neutral-300 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/40">
                    <div className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                      <LogOut className="h-4 w-4" />
                      <span>وقت الانصراف المسجل</span>
                    </div>
                    <div className="font-mono text-2xl font-black text-neutral-900 dark:text-white">
                      {formatTime(myStatus?.checkOut)}
                    </div>
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800 text-center">
                    <div className="text-[11px] text-neutral-500 font-bold">ساعات العمل اليوم</div>
                    <div className="font-mono font-black text-lg text-neutral-900 dark:text-white">
                      {myStatus ? Math.floor(((myStatus as any).workedMinutes || 0) / 60) : 0} س
                    </div>
                  </div>
                  <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800 text-center">
                    <div className="text-[11px] text-neutral-500 font-bold">التأخير المسجل</div>
                    <div className="font-mono font-black text-lg text-neutral-900 dark:text-white">
                      {myStatus ? (myStatus as any).lateMinutes || 0 : 0} د
                    </div>
                  </div>
                  <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800 text-center">
                    <div className="text-[11px] text-neutral-500 font-bold">الانصراف المبكر</div>
                    <div className="font-mono font-black text-lg text-neutral-900 dark:text-white">
                      {myStatus ? (myStatus as any).earlyLeaveMinutes || 0 : 0} د
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                <span>تاريخ اليوم: {format(new Date(), 'yyyy-MM-dd')}</span>
                <span>نظام التوثيق: IP + بصمة بيومترية</span>
              </div>
            </div>
          </div>

          {/* Monthly Heatmap Calendar */}
          <div className="rounded-2xl border border-neutral-300 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  <span>تقويم الحضور الشهري (Heatmap) لشهر {selectedMonth}</span>
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  تدرج لوني أبيض وأسود يعبر عن التزام الحضور، الغياب، والتأخيرات على مدار الشهر.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="rounded-xl border border-neutral-300 bg-transparent px-3 py-1.5 text-xs font-bold text-neutral-900 dark:border-neutral-700 dark:text-white"
                />

                <div className="flex items-center gap-2 text-xs font-bold text-neutral-600 dark:text-neutral-400">
                  <span className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded-xs bg-black dark:bg-white" /> حضور
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded-xs bg-neutral-400" /> تأخير
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded-xs border border-dashed border-neutral-400" /> غياب
                  </span>
                </div>
              </div>
            </div>

            {/* Heatmap Grid */}
            <div className="grid grid-cols-7 gap-2 pt-2">
              {['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map((d) => (
                <div key={d} className="text-center text-[11px] font-bold text-neutral-400 pb-1">
                  {d}
                </div>
              ))}

              {daysInMonth.map((dayDate) => {
                const dateStr = format(dayDate, 'yyyy-MM-dd');
                const rec = monthlyRecords.find((r) => r.date === dateStr);
                const isPresent = Boolean(rec?.checkIn);
                const isLate = Boolean((rec as any)?.lateMinutes && (rec as any).lateMinutes > 0);
                const isAbsent = (rec as any)?.status === 'absent';
                const isToday = isSameDay(dayDate, new Date());

                return (
                  <div
                    key={dateStr}
                    className={`h-16 rounded-xl p-2 border flex flex-col justify-between transition-all ${
                      isToday ? 'ring-2 ring-neutral-900 dark:ring-white' : ''
                    } ${
                      isPresent && !isLate
                        ? 'border-neutral-900 bg-black text-white dark:border-white dark:bg-white dark:text-black font-bold'
                        : isLate
                        ? 'border-neutral-500 bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-white font-bold'
                        : isAbsent
                        ? 'border-dashed border-neutral-400 bg-neutral-50 text-neutral-400 dark:bg-neutral-950/40'
                        : 'border-neutral-200 bg-white text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span>{format(dayDate, 'd')}</span>
                      {isLate && <span className="text-[10px] font-mono">{(rec as any).lateMinutes}د</span>}
                    </div>

                    <div className="text-[10px] truncate">
                      {isPresent ? (isLate ? 'متأخر' : 'حاضر') : isAbsent ? 'غائب' : '—'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Team Live Attendance Table */}
          <div className="rounded-2xl border border-neutral-300 bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                    حالة تواجد أعضاء الفريق اليوم (مباشر)
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    تحديث لحظي عبر WebSocket يوضح من سجّل حضوره وانصرافه اليوم من كل الفريق.
                  </p>
                </div>
              </div>

              <span className="rounded-full border border-neutral-900 bg-neutral-100 dark:border-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold px-3 py-1 text-xs">
                {teamAttendance.length} مسجلين اليوم
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-neutral-50 text-xs font-semibold uppercase text-neutral-500 dark:bg-neutral-800/50 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700">
                  <tr>
                    <th className="px-6 py-4">اسم الموظف</th>
                    <th className="px-6 py-4">الدور</th>
                    <th className="px-6 py-4">وقت الحضور</th>
                    <th className="px-6 py-4">وقت الانصراف</th>
                    <th className="px-6 py-4">الحالة الحالية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {teamAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-neutral-400">
                        لم يقم أي موظف بتسجيل الحضور اليوم بعد.
                      </td>
                    </tr>
                  ) : (
                    teamAttendance.map((record) => {
                      const isPresent = record.checkIn && !record.checkOut;
                      const isDeparted = Boolean(record.checkOut);

                      return (
                        <tr key={record.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-neutral-900 dark:text-white flex items-center gap-2.5">
                            {record.user?.photoUrl ? (
                              <img
                                src={record.user.photoUrl}
                                alt={record.user.name}
                                className="h-8 w-8 rounded-full object-cover border border-neutral-300 dark:border-neutral-600 grayscale shrink-0"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full border border-neutral-300 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white flex items-center justify-center font-bold text-xs shrink-0">
                                {record.user?.name ? record.user.name.charAt(0) : '؟'}
                              </div>
                            )}
                            <div>
                              <div>{record.user?.name || 'موظف'}</div>
                              <div className="text-xs text-neutral-400 font-normal">{record.user?.email}</div>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-neutral-600 dark:text-neutral-300">
                            <span className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 text-xs font-medium">
                              {record.user?.role === 'admin' ? 'مدير' : 'موظف'}
                            </span>
                          </td>

                          <td className="px-6 py-4 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                            {formatTime(record.checkIn)}
                          </td>

                          <td className="px-6 py-4 font-mono text-neutral-600 dark:text-neutral-400">
                            {formatTime(record.checkOut)}
                          </td>

                          <td className="px-6 py-4">
                            {isPresent && (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-900 bg-black text-white dark:border-white dark:bg-white dark:text-black px-2.5 py-1 text-xs font-bold">
                                <span className="h-2 w-2 rounded-full bg-white dark:bg-black animate-pulse" />
                                حاضر الآن
                              </span>
                            )}
                            {isDeparted && (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-400 bg-neutral-100 px-2.5 py-1 text-xs font-bold text-neutral-600 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300">
                                <span className="h-2 w-2 rounded-full bg-neutral-400" />
                                انصرف
                              </span>
                            )}
                            {!isPresent && !isDeparted && (
                              <span className="text-xs text-neutral-400">غير محدد</span>
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
        </div>
      )}

      {/* TAB 2: MY REQUESTS (Leaves + Corrections) */}
      {activeTab === 'requests' && (
        <div className="space-y-8">
          {/* Leaves Table */}
          <div className="rounded-2xl border border-neutral-300 bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
            <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span>طلبات الإجازات ({leaves.length})</span>
                </h3>
              </div>
              <button
                onClick={() => setIsLeaveModalOpen(true)}
                className="rounded-xl bg-neutral-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-neutral-800 dark:bg-white dark:text-black"
              >
                تقديم طلب إجازة جديد
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-neutral-50 text-xs font-bold uppercase text-neutral-500 dark:bg-neutral-800/50 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700">
                  <tr>
                    <th className="px-5 py-3.5">النوع</th>
                    <th className="px-5 py-3.5">من تاريخ</th>
                    <th className="px-5 py-3.5">إلى تاريخ</th>
                    <th className="px-5 py-3.5">السبب</th>
                    <th className="px-5 py-3.5">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {leaves.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-neutral-400">
                        لم تقم بتقديم أي طلبات إجازة حتى الآن.
                      </td>
                    </tr>
                  ) : (
                    leaves.map((leave) => (
                      <tr key={leave.id}>
                        <td className="px-5 py-4 font-bold text-neutral-900 dark:text-white">
                          {leave.type === 'annual'
                            ? 'إجازة سنوية'
                            : leave.type === 'sick'
                            ? 'إجازة مرضية'
                            : leave.type === 'unpaid'
                            ? 'إجازة غير مدفوعة'
                            : 'إجازة اضطرارية'}
                        </td>
                        <td className="px-5 py-4 font-mono text-xs">{leave.startDate}</td>
                        <td className="px-5 py-4 font-mono text-xs">{leave.endDate}</td>
                        <td className="px-5 py-4 text-xs text-neutral-600 dark:text-neutral-300">{leave.reason || '—'}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                              leave.status === 'approved'
                                ? 'border-neutral-900 bg-black text-white dark:border-white dark:bg-white dark:text-black'
                                : leave.status === 'rejected'
                                ? 'border-neutral-300 bg-neutral-100 text-neutral-400 line-through dark:border-neutral-700 dark:bg-neutral-800'
                                : 'border-dashed border-neutral-400 text-neutral-700 dark:text-neutral-300'
                            }`}
                          >
                            {leave.status === 'approved' ? 'مقبول' : leave.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Corrections Table */}
          <div className="rounded-2xl border border-neutral-300 bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
            <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <RotateCcw className="h-5 w-5" />
                  <span>طلبات تصحيح البصمة ({corrections.length})</span>
                </h3>
              </div>
              <button
                onClick={() => setIsCorrectionModalOpen(true)}
                className="rounded-xl bg-neutral-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-neutral-800 dark:bg-white dark:text-black"
              >
                تقديم طلب تصحيح بصمة
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-neutral-50 text-xs font-bold uppercase text-neutral-500 dark:bg-neutral-800/50 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700">
                  <tr>
                    <th className="px-5 py-3.5">تاريخ الحركة</th>
                    <th className="px-5 py-3.5">وقت الحضور المطلوب</th>
                    <th className="px-5 py-3.5">وقت الانصراف المطلوب</th>
                    <th className="px-5 py-3.5">سبب التصحيح</th>
                    <th className="px-5 py-3.5">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {corrections.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-neutral-400">
                        لا توجد طلبات تصحيح بصمة مقدمة.
                      </td>
                    </tr>
                  ) : (
                    corrections.map((corr) => (
                      <tr key={corr.id}>
                        <td className="px-5 py-4 font-mono text-xs">{corr.date}</td>
                        <td className="px-5 py-4 font-mono text-xs">{corr.requestedCheckIn || '—'}</td>
                        <td className="px-5 py-4 font-mono text-xs">{corr.requestedCheckOut || '—'}</td>
                        <td className="px-5 py-4 text-xs text-neutral-600 dark:text-neutral-300">{corr.reason}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                              corr.status === 'approved'
                                ? 'border-neutral-900 bg-black text-white dark:border-white dark:bg-white dark:text-black'
                                : corr.status === 'rejected'
                                ? 'border-neutral-300 bg-neutral-100 text-neutral-400 line-through dark:border-neutral-700 dark:bg-neutral-800'
                                : 'border-dashed border-neutral-400 text-neutral-700 dark:text-neutral-300'
                            }`}
                          >
                            {corr.status === 'approved' ? 'معتمد' : corr.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                          </span>
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

      {/* TAB 3: ADMIN PANEL */}
      {activeTab === 'admin' && user?.role === 'admin' && (
        <div className="space-y-8">
          {/* Admin Fast Actions */}
          <div className="p-5 rounded-2xl border border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900/50 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                إجراءات الرقابة الإدارية اليومية
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                تشغيل محرك الغياب الآلي Idempotent ومراجعة طلبات الإجازات وتصحيحات الدوام.
              </p>
            </div>

            <button
              onClick={() => triggerAbsenceJobMutation.mutate()}
              disabled={triggerAbsenceJobMutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-black"
            >
              <Play className="h-4 w-4" />
              <span>{triggerAbsenceJobMutation.isPending ? 'جاري الفحص...' : 'تشغيل فحص الغياب الآلي اليوم'}</span>
            </button>
          </div>

          {/* Pending Leaves Review */}
          <div className="rounded-2xl border border-neutral-300 bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
            <div className="p-5 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                مراجعة طلبات الإجازات المعلقة
              </h3>
            </div>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {leaves.filter((l) => l.status === 'pending').length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-400">لا توجد طلبات إجازة معلقة للمراجعة.</div>
              ) : (
                leaves
                  .filter((l) => l.status === 'pending')
                  .map((leave) => (
                    <div key={leave.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="font-bold text-sm text-neutral-900 dark:text-white">
                          {leave.user?.name} — {leave.type} ({leave.startDate} إلى {leave.endDate})
                        </div>
                        <div className="text-xs text-neutral-600 dark:text-neutral-300">السبب: {leave.reason || '—'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => reviewLeaveMutation.mutate({ id: leave.id, decision: 'approved' })}
                          className="rounded-lg bg-black px-3 py-1.5 text-xs font-bold text-white hover:bg-neutral-800 dark:bg-white dark:text-black"
                        >
                          موافقة
                        </button>
                        <button
                          onClick={() => reviewLeaveMutation.mutate({ id: leave.id, decision: 'rejected' })}
                          className="rounded-lg border border-neutral-900 px-3 py-1.5 text-xs font-bold text-neutral-900 hover:bg-neutral-100 dark:border-white dark:text-white"
                        >
                          رفض
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Pending Corrections Review */}
          <div className="rounded-2xl border border-neutral-300 bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
            <div className="p-5 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                مراجعة طلبات تصحيح البصمة المعلقة
              </h3>
            </div>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {corrections.filter((c) => c.status === 'pending').length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-400">لا توجد طلبات تصحيح بصمة معلقة.</div>
              ) : (
                corrections
                  .filter((c) => c.status === 'pending')
                  .map((corr) => (
                    <div key={corr.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="font-bold text-sm text-neutral-900 dark:text-white">
                          {corr.user?.name} — تاريخ: {corr.date}
                        </div>
                        <div className="text-xs text-neutral-600 dark:text-neutral-300">
                          حضور: {corr.requestedCheckIn || '—'} | انصراف: {corr.requestedCheckOut || '—'} <br />
                          السبب: {corr.reason}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => reviewCorrectionMutation.mutate({ id: corr.id, decision: 'approved' })}
                          className="rounded-lg bg-black px-3 py-1.5 text-xs font-bold text-white hover:bg-neutral-800 dark:bg-white dark:text-black"
                        >
                          موافقة وتحديث
                        </button>
                        <button
                          onClick={() => reviewCorrectionMutation.mutate({ id: corr.id, decision: 'rejected' })}
                          className="rounded-lg border border-neutral-900 px-3 py-1.5 text-xs font-bold text-neutral-900 hover:bg-neutral-100 dark:border-white dark:text-white"
                        >
                          رفض
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Request Leave */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-300 bg-white p-6 shadow-2xl dark:border-neutral-700 dark:bg-neutral-900 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-neutral-900 dark:text-white mb-4">
              تقديم طلب إجازة
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  نوع الإجازة
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as any)}
                  className="w-full rounded-xl border border-neutral-300 bg-transparent p-2.5 text-sm font-bold text-neutral-900 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:text-white dark:bg-neutral-800"
                >
                  <option value="annual">إجازة سنوية</option>
                  <option value="sick">إجازة مرضية</option>
                  <option value="unpaid">إجازة غير مدفوعة (خصم من الراتب)</option>
                  <option value="emergency">إجازة اضطرارية</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    من تاريخ
                  </label>
                  <input
                    type="date"
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-transparent p-2.5 text-xs font-mono font-bold text-neutral-900 outline-none dark:border-neutral-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    إلى تاريخ
                  </label>
                  <input
                    type="date"
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-transparent p-2.5 text-xs font-mono font-bold text-neutral-900 outline-none dark:border-neutral-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  السبب أو البيان
                </label>
                <textarea
                  rows={3}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="بيان سبب طلب الإجازة..."
                  className="w-full rounded-xl border border-neutral-300 bg-transparent p-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={leaveMutation.isPending}
                  onClick={() => leaveMutation.mutate()}
                  className="rounded-xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-black"
                >
                  {leaveMutation.isPending ? 'جاري الإرسال...' : 'إرسال الطلب'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Request Correction */}
      {isCorrectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-300 bg-white p-6 shadow-2xl dark:border-neutral-700 dark:bg-neutral-900 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-neutral-900 dark:text-white mb-4">
              طلب تصحيح بصمة دوام
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  تاريخ اليوم المطلوب تصحيحه
                </label>
                <input
                  type="date"
                  value={correctionDate}
                  onChange={(e) => setCorrectionDate(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-transparent p-2.5 text-xs font-mono font-bold text-neutral-900 outline-none dark:border-neutral-700 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    وقت الحضور الصحيح
                  </label>
                  <input
                    type="time"
                    value={correctionCheckIn}
                    onChange={(e) => setCorrectionCheckIn(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-transparent p-2.5 text-xs font-mono font-bold text-neutral-900 outline-none dark:border-neutral-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    وقت الانصراف الصحيح
                  </label>
                  <input
                    type="time"
                    value={correctionCheckOut}
                    onChange={(e) => setCorrectionCheckOut(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-transparent p-2.5 text-xs font-mono font-bold text-neutral-900 outline-none dark:border-neutral-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  سبب الخطأ في التسجيل (إلزامي للرقابة)
                </label>
                <textarea
                  rows={3}
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="مثال: عطل في شبكة الإنترنت بالفرع أثناء البصمة..."
                  className="w-full rounded-xl border border-neutral-300 bg-transparent p-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCorrectionModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={!correctionReason.trim() || correctionMutation.isPending}
                  onClick={() => correctionMutation.mutate()}
                  className="rounded-xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-black"
                >
                  {correctionMutation.isPending ? 'جاري الإرسال...' : 'إرسال طلب التصحيح'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Face Biometrics Modal */}
      <FaceBiometricsModal
        isOpen={isFaceModalOpen}
        onClose={() => setIsFaceModalOpen(false)}
        mode="verify_attendance"
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['attendance'] });
          addToast('تم تسجيل الحركة بنجاح بالتعرف على الوجه', 'success');
        }}
      />
    </MotionPage>
  );
};

export default AttendancePage;
