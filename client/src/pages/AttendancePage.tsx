import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useSocket } from '../contexts/SocketContext.js';
import { useAuth } from '../contexts/AuthContext.js';
import { useToast } from '../components/motion/Toast.js';
import { FaceBiometricsModal } from '../components/FaceBiometricsModal.js';
import {
  LedgerButton,
  LedgerInput,
  LedgerTable,
  LedgerModal,
  PunchedCard,
} from '../components/common/LedgerComponents.js';
import { RubberStamp } from '../components/common/RubberStamp.js';
import { OdometerClock } from '../components/common/OdometerClock.js';
import { LedgerIcon } from '../components/icons/LedgerIcons.js';
import type { Attendance, LeaveRequest, AttendanceCorrection } from '../types/index.js';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

export const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'card' | 'monthly' | 'requests' | 'admin'>('card');
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);

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

  // 3. My monthly attendance records (for calendar ledger)
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

  // Subtle punch sound synthesis using Web Audio API (No external sound file needed)
  const playPunchSound = () => {
    if (!isSoundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Audio context disabled or unavailable
    }
  };

  // Check-In Mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/attendance/check-in');
      return res.data;
    },
    onSuccess: (data) => {
      playPunchSound();
      addToast(data.message || 'تم تسجيل الحضور وتثقيب البطاقة', 'success');
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
      playPunchSound();
      addToast(data.message || 'تم تسجيل الانصراف وتثقيب البطاقة', 'success');
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
      addToast('تم تقديم طلب الإجازة وقيده في السجلات', 'success');
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
      addToast('تم رفع طلب تصحيح البصمة للمراجعة الإدارية', 'success');
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
      addToast(`اكتمل فحص الغياب: رُصد ${data.data?.absencesRecorded || 0} غياب`, 'success');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || 'فشل تنفيذ فحص الغياب', 'error');
    },
  });

  const hasCheckedIn = Boolean(myStatus?.checkIn);
  const hasCheckedOut = Boolean(myStatus?.checkOut);

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toTimeString().split(' ')[0];
    } catch {
      return '';
    }
  };

  // Calendar Heatmap Days Calculation
  const currentMonthDate = new Date(`${selectedMonth}-01`);
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonthDate),
    end: endOfMonth(currentMonthDate),
  });

  return (
    <div className="space-y-8">
      {/* Page Header (ترويسة السجل) */}
      <div className="border-b-2 border-neutral-900 dark:border-white pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 border border-neutral-900 dark:border-white">
              دفتر الحضور والانصراف الرسمي
            </span>
            <span className="text-xs font-mono text-neutral-500">سجل الدوام #ATT-2026</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-neutral-950 dark:text-white">
            نظام الحضور والانصراف والورديات
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            كارت دوام مثقوب، توثيق فوري بالبصمة البيومترية، وإدارة شاملة لطلبات الإجازات وتصحيح القيود.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold border-2 border-neutral-900 dark:border-white transition-colors ${
              isSoundEnabled ? 'bg-neutral-900 text-white dark:bg-white dark:text-black' : 'bg-white dark:bg-neutral-900'
            }`}
            title="تشغيل/إيقاف صوت تثقيب الكارت الميكانيكي"
          >
            <LedgerIcon name={isSoundEnabled ? 'sound-on' : 'sound-off'} size={14} />
            <span>صوت التثقيب: {isSoundEnabled ? 'مفعل' : 'مطفأ'}</span>
          </button>

          {/* View Tab Switchers */}
          <div className="flex border-2 border-neutral-900 dark:border-white font-mono text-xs">
            <button
              onClick={() => setActiveTab('card')}
              className={`px-3 py-1 font-bold ${
                activeTab === 'card'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-black'
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              كارت الدوام
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`px-3 py-1 font-bold border-r border-neutral-900 dark:border-white ${
                activeTab === 'monthly'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-black'
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              سجل الشهر
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-3 py-1 font-bold border-r border-neutral-900 dark:border-white ${
                activeTab === 'requests'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-black'
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              الطلبات ({leaves.length + corrections.length})
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-1 font-bold border-r border-neutral-900 dark:border-white ${
                  activeTab === 'admin'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-black'
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                رقابة المشرف
              </button>
            )}
          </div>
        </div>
      </div>

      {/* VIEW 1: PUNCH CARD & TEAM LEDGER */}
      {activeTab === 'card' && (
        <div className="space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* The Punched Card */}
            <div className="lg:col-span-1 space-y-4">
              <PunchedCard
                employeeName={user?.name || 'الموظف'}
                employeeId={user?.id || 'EMP-001'}
                date={format(new Date(), 'yyyy-MM-dd')}
                shiftHours="09:00 - 17:00"
                punches={[
                  {
                    type: 'حضور',
                    time: formatTime(myStatus?.checkIn),
                    isPunched: hasCheckedIn,
                    statusBadge: (myStatus as any)?.lateMinutes && (myStatus as any).lateMinutes > 0 ? `متأخر ${(myStatus as any).lateMinutes}د` : hasCheckedIn ? 'في الموعد' : undefined,
                  },
                  {
                    type: 'انصراف',
                    time: formatTime(myStatus?.checkOut),
                    isPunched: hasCheckedOut,
                    statusBadge: hasCheckedOut ? 'تم الانصراف' : undefined,
                  },
                ]}
                onPunchClick={() => {
                  if (!hasCheckedIn) {
                    checkInMutation.mutate();
                  } else if (!hasCheckedOut) {
                    checkOutMutation.mutate();
                  }
                }}
                isPunching={checkInMutation.isPending || checkOutMutation.isPending || isMyStatusLoading}
              />

              {/* Action Buttons: Face Scan, Leave, Correction */}
              <div className="flex flex-col gap-2 max-w-sm font-mono text-xs">
                <LedgerButton
                  variant="secondary"
                  icon="camera"
                  onClick={() => setIsFaceModalOpen(true)}
                  className="w-full text-center"
                >
                  بصمة سريعة بالوجه (Face Kiosk)
                </LedgerButton>

                <div className="grid grid-cols-2 gap-2">
                  <LedgerButton
                    variant="ghost"
                    icon="calendar"
                    size="sm"
                    onClick={() => setIsLeaveModalOpen(true)}
                  >
                    طلب إجازة
                  </LedgerButton>
                  <LedgerButton
                    variant="ghost"
                    icon="edit"
                    size="sm"
                    onClick={() => setIsCorrectionModalOpen(true)}
                  >
                    تصحيح بصمة
                  </LedgerButton>
                </div>
              </div>
            </div>

            {/* Today's Presence Ledger Table */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-300 dark:border-neutral-700 pb-2">
                <div className="flex items-center gap-2">
                  <LedgerIcon name="users" size={16} />
                  <h3 className="font-display font-bold text-base text-neutral-950 dark:text-white">
                    دفتر حضور الفريق اليوم (بث لحظي)
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold border border-neutral-900 dark:border-white px-2 py-0.5">
                  {teamAttendance.length} مسجلين
                </span>
              </div>

              <LedgerTable>
                <thead>
                  <tr className="border-b-2 border-neutral-900 dark:border-white font-bold bg-neutral-100 dark:bg-neutral-900">
                    <th className="p-3">الموظف</th>
                    <th className="p-3">وقت الحضور</th>
                    <th className="p-3">وقت الانصراف</th>
                    <th className="p-3">دقائق التأخير</th>
                    <th className="p-3">ختم الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono">
                  {teamAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-xs text-neutral-500 font-ledger">
                        لم يقم أي موظف بتثقيب كارت الحضور اليوم بعد.
                      </td>
                    </tr>
                  ) : (
                    teamAttendance.map((record) => {
                      const isPresent = record.checkIn && !record.checkOut;
                      const isDeparted = Boolean(record.checkOut);
                      const isLate = Boolean((record as any).lateMinutes && (record as any).lateMinutes > 0);

                      return (
                        <tr key={record.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                          <td className="p-3 font-ledger font-bold text-neutral-900 dark:text-white">
                            <div>{record.user?.name || 'موظف'}</div>
                            <div className="text-[10px] font-mono text-neutral-500">{record.user?.email}</div>
                          </td>
                          <td className="p-3 font-mono font-bold tabular-nums">
                            {formatTime(record.checkIn) || '—'}
                          </td>
                          <td className="p-3 font-mono tabular-nums text-neutral-600 dark:text-neutral-400">
                            {formatTime(record.checkOut) || '—'}
                          </td>
                          <td className="p-3 font-mono tabular-nums">
                            {isLate ? `${(record as any).lateMinutes} دقيقة` : '—'}
                          </td>
                          <td className="p-3">
                            {isDeparted ? (
                              <RubberStamp label="انصرف" recordId={record.id} />
                            ) : isLate ? (
                              <RubberStamp label={`متأخر ${(record as any).lateMinutes}د`} recordId={record.id} />
                            ) : isPresent ? (
                              <RubberStamp label="حاضر" recordId={record.id} subtext="على رأس العمل" />
                            ) : (
                              <span className="text-xs text-neutral-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </LedgerTable>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: MONTHLY ATTENDANCE LEDGER */}
      {activeTab === 'monthly' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-300 dark:border-neutral-700 pb-2">
            <div className="flex items-center gap-2">
              <LedgerIcon name="calendar" size={16} />
              <h3 className="font-display font-bold text-base text-neutral-950 dark:text-white">
                سجل دوامي لشهر {selectedMonth}
              </h3>
            </div>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white dark:bg-neutral-900 border-2 border-neutral-900 dark:border-white px-2.5 py-1 text-xs font-mono font-bold"
            />
          </div>

          <LedgerTable>
            <thead>
              <tr className="border-b-2 border-neutral-900 dark:border-white font-bold bg-neutral-100 dark:bg-neutral-900">
                <th className="p-3">التاريخ</th>
                <th className="p-3">وقت الحضور</th>
                <th className="p-3">وقت الانصراف</th>
                <th className="p-3">ساعات العمل</th>
                <th className="p-3">التأخير المسجل</th>
                <th className="p-3">ختم الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono">
              {daysInMonth.map((dayDate) => {
                const dateStr = format(dayDate, 'yyyy-MM-dd');
                const rec = monthlyRecords.find((r) => r.date === dateStr);
                const isPresent = Boolean(rec?.checkIn);
                const isLate = Boolean((rec as any)?.lateMinutes && (rec as any).lateMinutes > 0);
                const isAbsent = (rec as any)?.status === 'absent_unexcused' || (rec as any)?.status === 'absent';
                const isExcused = (rec as any)?.status === 'absent_excused';
                const isToday = isSameDay(dayDate, new Date());

                return (
                  <tr
                    key={dateStr}
                    className={`hover:bg-neutral-50 dark:hover:bg-neutral-900/50 ${
                      isToday ? 'bg-neutral-100 dark:bg-neutral-900 font-bold' : ''
                    }`}
                  >
                    <td className="p-3 tabular-nums">{dateStr}</td>
                    <td className="p-3 tabular-nums">{formatTime(rec?.checkIn) || '—'}</td>
                    <td className="p-3 tabular-nums">{formatTime(rec?.checkOut) || '—'}</td>
                    <td className="p-3 tabular-nums">
                      {(rec as any)?.workedMinutes ? `${Math.floor((rec as any).workedMinutes / 60)} س ${(rec as any).workedMinutes % 60} د` : '—'}
                    </td>
                    <td className="p-3 tabular-nums">
                      {isLate ? `${(rec as any).lateMinutes} دقيقة` : '—'}
                    </td>
                    <td className="p-3">
                      {isPresent && !isLate ? (
                        <RubberStamp label="حاضر" recordId={dateStr} />
                      ) : isLate ? (
                        <RubberStamp label={`متأخر ${(rec as any).lateMinutes}د`} recordId={dateStr} />
                      ) : isAbsent ? (
                        <RubberStamp label="غياب" recordId={dateStr} subtext="غير مبرر" />
                      ) : isExcused ? (
                        <RubberStamp label="إجازة" recordId={dateStr} subtext="معتمدة" />
                      ) : (
                        <span className="text-xs text-neutral-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </LedgerTable>
        </div>
      )}

      {/* VIEW 3: REQUESTS (Leaves & Corrections) */}
      {activeTab === 'requests' && (
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-300 dark:border-neutral-700 pb-2">
              <h3 className="font-display font-bold text-base">سجل طلبات الإجازات ({leaves.length})</h3>
              <LedgerButton size="sm" icon="plus" onClick={() => setIsLeaveModalOpen(true)}>
                تقديم طلب إجازة
              </LedgerButton>
            </div>

            <LedgerTable>
              <thead>
                <tr className="border-b-2 border-neutral-900 dark:border-white font-bold bg-neutral-100 dark:bg-neutral-900">
                  <th className="p-3">النوع</th>
                  <th className="p-3">من تاريخ</th>
                  <th className="p-3">إلى تاريخ</th>
                  <th className="p-3">السبب والبيان</th>
                  <th className="p-3">الحالة الرسمية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono">
                {leaves.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-xs text-neutral-500 font-ledger">
                      لا توجد طلبات إجازة مسجلة.
                    </td>
                  </tr>
                ) : (
                  leaves.map((l) => (
                    <tr key={l.id}>
                      <td className="p-3 font-ledger font-bold">
                        {l.type === 'annual' ? 'إجازة سنوية' : l.type === 'sick' ? 'إجازة مرضية' : l.type === 'unpaid' ? 'إجازة غير مدفوعة' : 'إجازة اضطرارية'}
                      </td>
                      <td className="p-3 tabular-nums">{l.startDate}</td>
                      <td className="p-3 tabular-nums">{l.endDate}</td>
                      <td className="p-3 font-ledger text-xs">{l.reason || '—'}</td>
                      <td className="p-3">
                        <RubberStamp
                          label={l.status === 'approved' ? 'مقبول' : l.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                          recordId={l.id}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </LedgerTable>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-300 dark:border-neutral-700 pb-2">
              <h3 className="font-display font-bold text-base">سجل تصحيحات البصمة ({corrections.length})</h3>
              <LedgerButton size="sm" icon="plus" onClick={() => setIsCorrectionModalOpen(true)}>
                تقديم طلب تصحيح بصمة
              </LedgerButton>
            </div>

            <LedgerTable>
              <thead>
                <tr className="border-b-2 border-neutral-900 dark:border-white font-bold bg-neutral-100 dark:bg-neutral-900">
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">الحضور المطلوب</th>
                  <th className="p-3">الانصراف المطلوب</th>
                  <th className="p-3">السبب</th>
                  <th className="p-3">القرار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono">
                {corrections.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-xs text-neutral-500 font-ledger">
                      لا توجد طلبات تصحيح بصمة مسجلة.
                    </td>
                  </tr>
                ) : (
                  corrections.map((c) => (
                    <tr key={c.id}>
                      <td className="p-3 tabular-nums font-bold">{c.date}</td>
                      <td className="p-3 tabular-nums">{c.requestedCheckIn || '—'}</td>
                      <td className="p-3 tabular-nums">{c.requestedCheckOut || '—'}</td>
                      <td className="p-3 font-ledger text-xs">{c.reason}</td>
                      <td className="p-3">
                        <RubberStamp
                          label={c.status === 'approved' ? 'معتمد' : c.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                          recordId={c.id}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </LedgerTable>
          </div>
        </div>
      )}

      {/* VIEW 4: ADMIN AUDIT & APPROVALS */}
      {activeTab === 'admin' && user?.role === 'admin' && (
        <div className="space-y-6">
          <div className="p-4 border-2 border-neutral-900 dark:border-white bg-[#fafafa] dark:bg-[#151515] flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-bold text-base">إجراءات الرقابة الإدارية</h3>
              <p className="text-xs text-neutral-500 font-mono">تشغيل محرك رصد الغياب الآلي (Idempotent Cron Job)</p>
            </div>
            <LedgerButton
              onClick={() => triggerAbsenceJobMutation.mutate()}
              disabled={triggerAbsenceJobMutation.isPending}
              icon="punch-card"
            >
              {triggerAbsenceJobMutation.isPending ? 'جاري الفحص...' : 'تشغيل فحص الغياب الآلي الآن'}
            </LedgerButton>
          </div>

          {/* Pending Leaves Review */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-sm">طلبات إجازة تنتظر المراجعة</h4>
            <LedgerTable>
              <thead>
                <tr className="border-b-2 border-neutral-900 dark:border-white font-bold bg-neutral-100 dark:bg-neutral-900">
                  <th className="p-3">الموظف</th>
                  <th className="p-3">النوع</th>
                  <th className="p-3">المدة</th>
                  <th className="p-3">السبب</th>
                  <th className="p-3 text-left">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono text-xs">
                {leaves.filter((l) => l.status === 'pending').length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-neutral-500 font-ledger">لا توجد طلبات إجازة معلقة.</td>
                  </tr>
                ) : (
                  leaves
                    .filter((l) => l.status === 'pending')
                    .map((l) => (
                      <tr key={l.id}>
                        <td className="p-3 font-ledger font-bold">{l.user?.name}</td>
                        <td className="p-3">{l.type}</td>
                        <td className="p-3 tabular-nums">{l.startDate} إلى {l.endDate}</td>
                        <td className="p-3 font-ledger">{l.reason || '—'}</td>
                        <td className="p-3 text-left space-x-2 space-x-reverse">
                          <LedgerButton size="sm" onClick={() => reviewLeaveMutation.mutate({ id: l.id, decision: 'approved' })}>
                            اعتماد
                          </LedgerButton>
                          <LedgerButton size="sm" variant="danger" onClick={() => reviewLeaveMutation.mutate({ id: l.id, decision: 'rejected' })}>
                            رفض
                          </LedgerButton>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </LedgerTable>
          </div>
        </div>
      )}

      {/* MODAL: Leave Request */}
      <LedgerModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title="تقديم طلب إجازة رسمي"
      >
        <div className="space-y-4 font-ledger">
          <div>
            <label className="block text-xs font-bold mb-1">نوع الإجازة</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as any)}
              className="w-full bg-white dark:bg-neutral-900 border-2 border-neutral-900 dark:border-white p-2 text-xs sm:text-sm font-bold"
            >
              <option value="annual">إجازة سنوية</option>
              <option value="sick">إجازة مرضية</option>
              <option value="unpaid">إجازة غير مدفوعة (خصم من الراتب)</option>
              <option value="emergency">إجازة اضطرارية</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <LedgerInput
              label="من تاريخ"
              type="date"
              value={leaveStartDate}
              onChange={(e) => setLeaveStartDate(e.target.value)}
              isMono
            />
            <LedgerInput
              label="إلى تاريخ"
              type="date"
              value={leaveEndDate}
              onChange={(e) => setLeaveEndDate(e.target.value)}
              isMono
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">السبب أو البيان</label>
            <textarea
              rows={3}
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              placeholder="اكتب بيان سبب الإجازة..."
              className="w-full bg-white dark:bg-neutral-900 border-2 border-neutral-900 dark:border-white p-2 text-xs sm:text-sm outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <LedgerButton variant="ghost" size="sm" onClick={() => setIsLeaveModalOpen(false)}>
              إلغاء
            </LedgerButton>
            <LedgerButton
              size="sm"
              disabled={leaveMutation.isPending}
              onClick={() => leaveMutation.mutate()}
            >
              {leaveMutation.isPending ? 'جاري القيد...' : 'توثيق الطلب'}
            </LedgerButton>
          </div>
        </div>
      </LedgerModal>

      {/* MODAL: Attendance Correction */}
      <LedgerModal
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        title="طلب تصحيح بصمة في الدفتر"
      >
        <div className="space-y-4 font-ledger">
          <LedgerInput
            label="تاريخ اليوم المراد تصحيحه"
            type="date"
            value={correctionDate}
            onChange={(e) => setCorrectionDate(e.target.value)}
            isMono
          />

          <div className="grid grid-cols-2 gap-3">
            <LedgerInput
              label="وقت الحضور الفعلي"
              type="time"
              value={correctionCheckIn}
              onChange={(e) => setCorrectionCheckIn(e.target.value)}
              isMono
            />
            <LedgerInput
              label="وقت الانصراف الفعلي"
              type="time"
              value={correctionCheckOut}
              onChange={(e) => setCorrectionCheckOut(e.target.value)}
              isMono
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">سبب الخطأ في التسجيل (إلزامي للرقابة)</label>
            <textarea
              rows={3}
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              placeholder="بيان سبب تعذر البصمة في وقتها..."
              className="w-full bg-white dark:bg-neutral-900 border-2 border-neutral-900 dark:border-white p-2 text-xs sm:text-sm outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <LedgerButton variant="ghost" size="sm" onClick={() => setIsCorrectionModalOpen(false)}>
              إلغاء
            </LedgerButton>
            <LedgerButton
              size="sm"
              disabled={!correctionReason.trim() || correctionMutation.isPending}
              onClick={() => correctionMutation.mutate()}
            >
              {correctionMutation.isPending ? 'جاري الإرسال...' : 'رفع طلب التصحيح'}
            </LedgerButton>
          </div>
        </div>
      </LedgerModal>

      {/* Face Biometrics Modal */}
      <FaceBiometricsModal
        isOpen={isFaceModalOpen}
        onClose={() => setIsFaceModalOpen(false)}
        mode="verify_attendance"
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['attendance'] });
          playPunchSound();
          addToast('تم توثيق الحضور ببصمة الوجه المعتمدة', 'success');
        }}
      />
    </div>
  );
};

export default AttendancePage;
