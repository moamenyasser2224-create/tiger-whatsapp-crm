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

  // 3. My monthly attendance records
  const { data: monthlyRecords = [] } = useQuery<Attendance[]>({
    queryKey: ['attendance', 'monthly', selectedMonth],
    queryFn: async () => {
      const res = await api.get(`/attendance/monthly?month=${selectedMonth}`);
      return res.data.data;
    },
  });

  // 4. Leaves List
  const { data: leaves = [] } = useQuery<LeaveRequest[]>({
    queryKey: ['attendance', 'leaves'],
    queryFn: async () => {
      const res = await api.get('/attendance/leaves');
      return res.data.data;
    },
  });

  // 5. Corrections List
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
      // Audio context disabled
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
      addToast(data.message || 'Time card stamped for Clock In', 'success');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || 'Failed to record Clock In', 'error');
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
      addToast(data.message || 'Time card stamped for Clock Out', 'success');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || 'Failed to record Clock Out', 'error');
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
      addToast('Leave request submitted to administrative records', 'success');
      setIsLeaveModalOpen(false);
      setLeaveReason('');
      queryClient.invalidateQueries({ queryKey: ['attendance', 'leaves'] });
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || 'Failed to submit leave request', 'error');
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
      addToast('Punch correction request escalated for manager review', 'success');
      setIsCorrectionModalOpen(false);
      setCorrectionReason('');
      queryClient.invalidateQueries({ queryKey: ['attendance', 'corrections'] });
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || 'Failed to submit correction request', 'error');
    },
  });

  // Admin: Review Leave Mutation
  const reviewLeaveMutation = useMutation({
    mutationFn: async ({ id, decision }: { id: string; decision: 'approved' | 'rejected' }) => {
      const res = await api.put(`/attendance/leaves/${id}/review`, { decision });
      return res.data;
    },
    onSuccess: (data) => {
      addToast(data.message || 'Leave request status updated', 'success');
      queryClient.invalidateQueries({ queryKey: ['attendance', 'leaves'] });
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || 'Failed to process leave request', 'error');
    },
  });

  // Admin: Review Correction Mutation
  const reviewCorrectionMutation = useMutation({
    mutationFn: async ({ id, decision }: { id: string; decision: 'approved' | 'rejected' }) => {
      const res = await api.put(`/attendance/corrections/${id}/review`, { decision });
      return res.data;
    },
    onSuccess: (data) => {
      addToast(data.message || 'Correction request processed', 'success');
      queryClient.invalidateQueries({ queryKey: ['attendance', 'corrections'] });
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || 'Failed to process correction request', 'error');
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
      addToast(`Absence check finished: recorded ${data.data?.absencesRecorded || 0} absences`, 'success');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || 'Failed to trigger absence job', 'error');
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

  const currentMonthDate = new Date(`${selectedMonth}-01`);
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonthDate),
    end: endOfMonth(currentMonthDate),
  });

  return (
    <div className="space-y-8" dir="ltr">
      {/* Page Header */}
      <div className="border-b-2 border-neutral-900 dark:border-white pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 border border-neutral-900 dark:border-white">
              TIGER TIME &amp; ATTENDANCE
            </span>
            <span className="text-xs font-mono text-neutral-500">Record #ATT-2026</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-950 dark:text-white">
            Workforce Shifts &amp; Time Tracking
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Physical-style time cards, facial biometric verification, leave workflows, and punch dispute resolutions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold border-2 border-neutral-900 dark:border-white transition-colors cursor-pointer ${
              isSoundEnabled ? 'bg-neutral-900 text-white dark:bg-white dark:text-black' : 'bg-white dark:bg-neutral-900'
            }`}
            title="Toggle mechanical punch sound effect"
          >
            <LedgerIcon name={isSoundEnabled ? 'sound-on' : 'sound-off'} size={14} />
            <span>Sound FX: {isSoundEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* View Tab Switchers */}
          <div className="flex border-2 border-neutral-900 dark:border-white font-mono text-xs">
            <button
              onClick={() => setActiveTab('card')}
              className={`px-3 py-1 font-bold cursor-pointer ${
                activeTab === 'card'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-black'
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              Time Card
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`px-3 py-1 font-bold border-l border-neutral-900 dark:border-white cursor-pointer ${
                activeTab === 'monthly'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-black'
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              Monthly Log
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-3 py-1 font-bold border-l border-neutral-900 dark:border-white cursor-pointer ${
                activeTab === 'requests'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-black'
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              Requests ({leaves.length + corrections.length})
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-1 font-bold border-l border-neutral-900 dark:border-white cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-black'
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                Manager Audit
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
                employeeName={user?.name || 'Staff'}
                employeeId={user?.id || 'EMP-001'}
                date={format(new Date(), 'yyyy-MM-dd')}
                shiftHours="09:00 - 17:00"
                punches={[
                  {
                    type: 'Clock In',
                    time: formatTime(myStatus?.checkIn),
                    isPunched: hasCheckedIn,
                    statusBadge: (myStatus as any)?.lateMinutes && (myStatus as any).lateMinutes > 0 ? `Late ${(myStatus as any).lateMinutes}m` : hasCheckedIn ? 'On Time' : undefined,
                  },
                  {
                    type: 'Clock Out',
                    time: formatTime(myStatus?.checkOut),
                    isPunched: hasCheckedOut,
                    statusBadge: hasCheckedOut ? 'Clocked Out' : undefined,
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
                  Quick Facial Punch (Face Kiosk)
                </LedgerButton>

                <div className="grid grid-cols-2 gap-2">
                  <LedgerButton
                    variant="ghost"
                    icon="calendar"
                    size="sm"
                    onClick={() => setIsLeaveModalOpen(true)}
                  >
                    Request Leave
                  </LedgerButton>
                  <LedgerButton
                    variant="ghost"
                    icon="edit"
                    size="sm"
                    onClick={() => setIsCorrectionModalOpen(true)}
                  >
                    Correct Punch
                  </LedgerButton>
                </div>
              </div>
            </div>

            {/* Today's Presence Ledger Table */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-300 dark:border-neutral-700 pb-2">
                <div className="flex items-center gap-2">
                  <LedgerIcon name="users" size={16} />
                  <h3 className="font-bold text-base text-neutral-950 dark:text-white">
                    Team Presence Log Today (Live Sync)
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold border border-neutral-900 dark:border-white px-2 py-0.5">
                  {teamAttendance.length} registered
                </span>
              </div>

              <LedgerTable>
                <thead>
                  <tr className="border-b-2 border-neutral-900 dark:border-white font-bold bg-neutral-100 dark:bg-neutral-900">
                    <th className="p-3">Employee</th>
                    <th className="p-3">Clock In</th>
                    <th className="p-3">Clock Out</th>
                    <th className="p-3">Late Mins</th>
                    <th className="p-3">Status Stamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono">
                  {teamAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-xs text-neutral-500">
                        No team members have stamped their time card yet today.
                      </td>
                    </tr>
                  ) : (
                    teamAttendance.map((record) => {
                      const isPresent = record.checkIn && !record.checkOut;
                      const isDeparted = Boolean(record.checkOut);
                      const isLate = Boolean((record as any).lateMinutes && (record as any).lateMinutes > 0);

                      return (
                        <tr key={record.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                          <td className="p-3 font-bold text-neutral-900 dark:text-white">
                            <div>{record.user?.name || 'Staff'}</div>
                            <div className="text-[10px] font-mono text-neutral-500">{record.user?.email}</div>
                          </td>
                          <td className="p-3 font-mono font-bold tabular-nums">
                            {formatTime(record.checkIn) || '—'}
                          </td>
                          <td className="p-3 font-mono tabular-nums text-neutral-600 dark:text-neutral-400">
                            {formatTime(record.checkOut) || '—'}
                          </td>
                          <td className="p-3 font-mono tabular-nums">
                            {isLate ? `${(record as any).lateMinutes} min` : '—'}
                          </td>
                          <td className="p-3">
                            {isDeparted ? (
                              <RubberStamp label="DEPARTED" recordId={record.id} />
                            ) : isLate ? (
                              <RubberStamp label={`LATE ${(record as any).lateMinutes}M`} recordId={record.id} />
                            ) : isPresent ? (
                              <RubberStamp label="PRESENT" recordId={record.id} subtext="ON DUTY" />
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
              <h3 className="font-bold text-base text-neutral-950 dark:text-white">
                My Attendance Log for {selectedMonth}
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
                <th className="p-3">Date</th>
                <th className="p-3">Clock In</th>
                <th className="p-3">Clock Out</th>
                <th className="p-3">Worked Hours</th>
                <th className="p-3">Lateness</th>
                <th className="p-3">Status Stamp</th>
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
                      {(rec as any)?.workedMinutes ? `${Math.floor((rec as any).workedMinutes / 60)}h ${(rec as any).workedMinutes % 60}m` : '—'}
                    </td>
                    <td className="p-3 tabular-nums">
                      {isLate ? `${(rec as any).lateMinutes} min` : '—'}
                    </td>
                    <td className="p-3">
                      {isPresent && !isLate ? (
                        <RubberStamp label="PRESENT" recordId={dateStr} />
                      ) : isLate ? (
                        <RubberStamp label={`LATE ${(rec as any).lateMinutes}M`} recordId={dateStr} />
                      ) : isAbsent ? (
                        <RubberStamp label="ABSENT" recordId={dateStr} subtext="UNEXCUSED" />
                      ) : isExcused ? (
                        <RubberStamp label="LEAVE" recordId={dateStr} subtext="APPROVED" />
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
              <h3 className="font-bold text-base">Leave Requests Log ({leaves.length})</h3>
              <LedgerButton size="sm" icon="plus" onClick={() => setIsLeaveModalOpen(true)}>
                New Leave Request
              </LedgerButton>
            </div>

            <LedgerTable>
              <thead>
                <tr className="border-b-2 border-neutral-900 dark:border-white font-bold bg-neutral-100 dark:bg-neutral-900">
                  <th className="p-3">Type</th>
                  <th className="p-3">From Date</th>
                  <th className="p-3">To Date</th>
                  <th className="p-3">Reason / Statement</th>
                  <th className="p-3">Official Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono">
                {leaves.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-xs text-neutral-500">
                      No leave requests recorded.
                    </td>
                  </tr>
                ) : (
                  leaves.map((l) => (
                    <tr key={l.id}>
                      <td className="p-3 font-bold">
                        {l.type === 'annual' ? 'Annual Leave' : l.type === 'sick' ? 'Sick Leave' : l.type === 'unpaid' ? 'Unpaid Leave' : 'Emergency Leave'}
                      </td>
                      <td className="p-3 tabular-nums">{l.startDate}</td>
                      <td className="p-3 tabular-nums">{l.endDate}</td>
                      <td className="p-3 text-xs">{l.reason || '—'}</td>
                      <td className="p-3">
                        <RubberStamp
                          label={l.status === 'approved' ? 'APPROVED' : l.status === 'rejected' ? 'REJECTED' : 'PENDING'}
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
              <h3 className="font-bold text-base">Punch Correction Requests ({corrections.length})</h3>
              <LedgerButton size="sm" icon="plus" onClick={() => setIsCorrectionModalOpen(true)}>
                New Correction Request
              </LedgerButton>
            </div>

            <LedgerTable>
              <thead>
                <tr className="border-b-2 border-neutral-900 dark:border-white font-bold bg-neutral-100 dark:bg-neutral-900">
                  <th className="p-3">Date</th>
                  <th className="p-3">Requested In</th>
                  <th className="p-3">Requested Out</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono">
                {corrections.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-xs text-neutral-500">
                      No punch corrections recorded.
                    </td>
                  </tr>
                ) : (
                  corrections.map((c) => (
                    <tr key={c.id}>
                      <td className="p-3 tabular-nums font-bold">{c.date}</td>
                      <td className="p-3 tabular-nums">{c.requestedCheckIn || '—'}</td>
                      <td className="p-3 tabular-nums">{c.requestedCheckOut || '—'}</td>
                      <td className="p-3 text-xs">{c.reason}</td>
                      <td className="p-3">
                        <RubberStamp
                          label={c.status === 'approved' ? 'APPROVED' : c.status === 'rejected' ? 'REJECTED' : 'PENDING'}
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
              <h3 className="font-bold text-base">Administrative Operations</h3>
              <p className="text-xs text-neutral-500 font-mono">Execute Idempotent Absence Verification Job</p>
            </div>
            <LedgerButton
              onClick={() => triggerAbsenceJobMutation.mutate()}
              disabled={triggerAbsenceJobMutation.isPending}
              icon="punch-card"
            >
              {triggerAbsenceJobMutation.isPending ? 'Checking...' : 'Run Automated Absence Check Now'}
            </LedgerButton>
          </div>

          {/* Pending Leaves Review */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm">Pending Leave Requests Awaiting Review</h4>
            <LedgerTable>
              <thead>
                <tr className="border-b-2 border-neutral-900 dark:border-white font-bold bg-neutral-100 dark:bg-neutral-900">
                  <th className="p-3">Employee</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono text-xs">
                {leaves.filter((l) => l.status === 'pending').length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-neutral-500">No pending leave requests.</td>
                  </tr>
                ) : (
                  leaves
                    .filter((l) => l.status === 'pending')
                    .map((l) => (
                      <tr key={l.id}>
                        <td className="p-3 font-bold">{l.user?.name}</td>
                        <td className="p-3">{l.type}</td>
                        <td className="p-3 tabular-nums">{l.startDate} to {l.endDate}</td>
                        <td className="p-3">{l.reason || '—'}</td>
                        <td className="p-3 text-right space-x-2">
                          <LedgerButton size="sm" onClick={() => reviewLeaveMutation.mutate({ id: l.id, decision: 'approved' })}>
                            Approve
                          </LedgerButton>
                          <LedgerButton size="sm" variant="danger" onClick={() => reviewLeaveMutation.mutate({ id: l.id, decision: 'rejected' })}>
                            Reject
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
        title="Submit Official Leave Request"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1">Leave Category</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as any)}
              className="w-full bg-white dark:bg-neutral-900 border-2 border-neutral-900 dark:border-white p-2 text-xs sm:text-sm font-bold"
            >
              <option value="annual">Annual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="unpaid">Unpaid Leave</option>
              <option value="emergency">Emergency Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <LedgerInput
              label="Start Date"
              type="date"
              value={leaveStartDate}
              onChange={(e) => setLeaveStartDate(e.target.value)}
              isMono
            />
            <LedgerInput
              label="End Date"
              type="date"
              value={leaveEndDate}
              onChange={(e) => setLeaveEndDate(e.target.value)}
              isMono
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Reason &amp; Documentation</label>
            <textarea
              rows={3}
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              placeholder="State reason for absence..."
              className="w-full bg-white dark:bg-neutral-900 border-2 border-neutral-900 dark:border-white p-2 text-xs sm:text-sm outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <LedgerButton variant="ghost" size="sm" onClick={() => setIsLeaveModalOpen(false)}>
              Cancel
            </LedgerButton>
            <LedgerButton
              size="sm"
              disabled={leaveMutation.isPending}
              onClick={() => leaveMutation.mutate()}
            >
              {leaveMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </LedgerButton>
          </div>
        </div>
      </LedgerModal>

      {/* MODAL: Attendance Correction */}
      <LedgerModal
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        title="Request Time Punch Correction"
      >
        <div className="space-y-4">
          <LedgerInput
            label="Date to Correct"
            type="date"
            value={correctionDate}
            onChange={(e) => setCorrectionDate(e.target.value)}
            isMono
          />

          <div className="grid grid-cols-2 gap-3">
            <LedgerInput
              label="Actual In Time"
              type="time"
              value={correctionCheckIn}
              onChange={(e) => setCorrectionCheckIn(e.target.value)}
              isMono
            />
            <LedgerInput
              label="Actual Out Time"
              type="time"
              value={correctionCheckOut}
              onChange={(e) => setCorrectionCheckOut(e.target.value)}
              isMono
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Justification Reason (Audit Required)</label>
            <textarea
              rows={3}
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              placeholder="Explain why the physical punch was missed..."
              className="w-full bg-white dark:bg-neutral-900 border-2 border-neutral-900 dark:border-white p-2 text-xs sm:text-sm outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <LedgerButton variant="ghost" size="sm" onClick={() => setIsCorrectionModalOpen(false)}>
              Cancel
            </LedgerButton>
            <LedgerButton
              size="sm"
              disabled={!correctionReason.trim() || correctionMutation.isPending}
              onClick={() => correctionMutation.mutate()}
            >
              {correctionMutation.isPending ? 'Submitting...' : 'Submit Correction'}
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
          addToast('Verified and stamped via facial biometrics', 'success');
        }}
      />
    </div>
  );
};

export default AttendancePage;
