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
import { StatusBadge } from '../components/common/StatusBadge.js';
import { Camera, Calendar, Clock, Edit2, Plus, Users, CheckCircle, XCircle } from 'lucide-react';
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

  // Check In Mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/attendance/check-in', {});
      return res.data;
    },
    onSuccess: (data) => {
      addToast(data.message || 'Clock In timestamp registered', 'success');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || 'Failed to record Clock In', 'error');
    },
  });

  // Check Out Mutation
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/attendance/check-out', {});
      return res.data;
    },
    onSuccess: (data) => {
      addToast(data.message || 'Clock Out timestamp registered', 'success');
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
      addToast('Correction request submitted for manager review', 'success');
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

  const hasCheckedIn = Boolean(myStatus?.checkIn);
  const hasCheckedOut = Boolean(myStatus?.checkOut);

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return format(d, 'HH:mm:ss');
    } catch {
      return '';
    }
  };

  const selectedMonthDate = new Date(`${selectedMonth}-01`);
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(selectedMonthDate),
    end: endOfMonth(selectedMonthDate),
  });

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted font-medium">
            <span>Workforce Management</span>
            <span>/</span>
            <span>Time &amp; Attendance</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-text mt-1">
            Workforce Shifts &amp; Time Tracking
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Transparent work logs, shift verification, leaves workflow, and timestamp dispute management.
          </p>
        </div>

        {/* View Tab Switchers */}
        <div className="inline-flex rounded-lg border border-border bg-bg p-0.5">
          <button
            onClick={() => setActiveTab('card')}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
              activeTab === 'card'
                ? 'bg-card text-text font-semibold shadow-subtle'
                : 'text-muted hover:text-text font-normal'
            }`}
          >
            Time Card
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
              activeTab === 'monthly'
                ? 'bg-card text-text font-semibold shadow-subtle'
                : 'text-muted hover:text-text font-normal'
            }`}
          >
            Monthly Log
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-card text-text font-semibold shadow-subtle'
                : 'text-muted hover:text-text font-normal'
            }`}
          >
            Requests ({leaves.length + corrections.length})
          </button>
          {user?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-card text-text font-semibold shadow-subtle'
                  : 'text-muted hover:text-text font-normal'
              }`}
            >
              Manager Audit
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: TIME CARD & TEAM PRESENCE */}
      {activeTab === 'card' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* The Time Card */}
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
              <div className="flex flex-col gap-2 max-w-md">
                <LedgerButton
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsFaceModalOpen(true)}
                  className="w-full"
                >
                  <Camera className="w-4 h-4 text-muted" />
                  <span>Facial Biometric Punch</span>
                </LedgerButton>

                <div className="grid grid-cols-2 gap-2">
                  <LedgerButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsLeaveModalOpen(true)}
                  >
                    <Calendar className="w-3.5 h-3.5 text-muted" />
                    <span>Request Leave</span>
                  </LedgerButton>
                  <LedgerButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsCorrectionModalOpen(true)}
                  >
                    <Edit2 className="w-3.5 h-3.5 text-muted" />
                    <span>Correct Punch</span>
                  </LedgerButton>
                </div>
              </div>
            </div>

            {/* Today's Presence Ledger Table */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-accent" />
                  <h3 className="font-semibold text-sm text-text">
                    Team Presence Log Today (Live Sync)
                  </h3>
                </div>
                <span className="text-xs text-muted font-medium px-2 py-0.5 rounded-full bg-bg border border-border">
                  {teamAttendance.length} registered
                </span>
              </div>

              <LedgerTable>
                <thead>
                  <tr className="bg-bg text-muted font-medium text-xs border-b border-border">
                    <th className="p-3">Employee</th>
                    <th className="p-3">Clock In</th>
                    <th className="p-3">Clock Out</th>
                    <th className="p-3">Late Mins</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {teamAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted">
                        No team members have registered attendance today yet.
                      </td>
                    </tr>
                  ) : (
                    teamAttendance.map((record) => {
                      const isPresent = record.checkIn && !record.checkOut;
                      const isDeparted = Boolean(record.checkOut);
                      const isLate = Boolean((record as any).lateMinutes && (record as any).lateMinutes > 0);

                      return (
                        <tr key={record.id} className="hover:bg-bg/40 transition-colors">
                          <td className="p-3 font-semibold text-text">
                            <div>{record.user?.name || 'Staff'}</div>
                            <div className="text-[11px] font-normal text-muted">{record.user?.email}</div>
                          </td>
                          <td className="p-3 font-mono tabular-nums text-text">
                            {formatTime(record.checkIn) || '—'}
                          </td>
                          <td className="p-3 font-mono tabular-nums text-muted">
                            {formatTime(record.checkOut) || '—'}
                          </td>
                          <td className="p-3 font-mono tabular-nums">
                            {isLate ? <span className="text-danger font-medium">{(record as any).lateMinutes} min</span> : '—'}
                          </td>
                          <td className="p-3 text-center">
                            {isDeparted ? (
                              <StatusBadge label="Departed" statusKey="departed" tone="muted" />
                            ) : isLate ? (
                              <StatusBadge label={`Late ${(record as any).lateMinutes}m`} statusKey="late" tone="danger" />
                            ) : isPresent ? (
                              <StatusBadge label="Present" statusKey="present" tone="accent" />
                            ) : (
                              <span className="text-xs text-muted">—</span>
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

      {/* VIEW 2: MONTHLY ATTENDANCE LOG */}
      {activeTab === 'monthly' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" />
              <h3 className="font-semibold text-sm text-text">
                Monthly Attendance Log for {selectedMonth}
              </h3>
            </div>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-card border border-border rounded-lg px-2.5 py-1 text-xs text-text shadow-subtle outline-none focus:border-accent"
            />
          </div>

          <LedgerTable>
            <thead>
              <tr className="bg-bg text-muted font-medium text-xs border-b border-border">
                <th className="p-3">Date</th>
                <th className="p-3">Clock In</th>
                <th className="p-3">Clock Out</th>
                <th className="p-3">Worked Hours</th>
                <th className="p-3">Lateness</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs font-mono">
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
                    className={`hover:bg-bg/40 transition-colors ${
                      isToday ? 'bg-accent-soft/30 font-medium' : ''
                    }`}
                  >
                    <td className="p-3 tabular-nums text-text">{dateStr}</td>
                    <td className="p-3 tabular-nums text-text">{formatTime(rec?.checkIn) || '—'}</td>
                    <td className="p-3 tabular-nums text-muted">{formatTime(rec?.checkOut) || '—'}</td>
                    <td className="p-3 tabular-nums text-text">
                      {(rec as any)?.workedMinutes ? `${Math.floor((rec as any).workedMinutes / 60)}h ${(rec as any).workedMinutes % 60}m` : '—'}
                    </td>
                    <td className="p-3 tabular-nums">
                      {isLate ? <span className="text-danger font-medium">{(rec as any).lateMinutes} min</span> : '—'}
                    </td>
                    <td className="p-3 text-center">
                      {isPresent && !isLate ? (
                        <StatusBadge label="Present" statusKey="present" tone="accent" />
                      ) : isLate ? (
                        <StatusBadge label={`Late ${(rec as any).lateMinutes}m`} statusKey="late" tone="danger" />
                      ) : isAbsent ? (
                        <StatusBadge label="Absent" statusKey="absent" tone="danger" />
                      ) : isExcused ? (
                        <StatusBadge label="Leave (Approved)" statusKey="leave" tone="muted" />
                      ) : (
                        <span className="text-xs text-muted">—</span>
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
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-semibold text-sm text-text">Leave Requests Log ({leaves.length})</h3>
              <LedgerButton size="sm" variant="primary" onClick={() => setIsLeaveModalOpen(true)}>
                <Plus className="w-3.5 h-3.5" />
                <span>New Leave Request</span>
              </LedgerButton>
            </div>

            <LedgerTable>
              <thead>
                <tr className="bg-bg text-muted font-medium text-xs border-b border-border">
                  <th className="p-3">Type</th>
                  <th className="p-3">From Date</th>
                  <th className="p-3">To Date</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs font-mono">
                {leaves.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted">
                      No leave requests recorded.
                    </td>
                  </tr>
                ) : (
                  leaves.map((l) => (
                    <tr key={l.id}>
                      <td className="p-3 font-semibold text-text">
                        {l.type === 'annual' ? 'Annual Leave' : l.type === 'sick' ? 'Sick Leave' : l.type === 'unpaid' ? 'Unpaid Leave' : 'Emergency Leave'}
                      </td>
                      <td className="p-3 tabular-nums text-text">{l.startDate}</td>
                      <td className="p-3 tabular-nums text-text">{l.endDate}</td>
                      <td className="p-3 text-muted font-sans">{l.reason || '—'}</td>
                      <td className="p-3 text-center">
                        <StatusBadge
                          label={l.status.toUpperCase()}
                          statusKey={l.status}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </LedgerTable>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-semibold text-sm text-text">Punch Corrections Log ({corrections.length})</h3>
              <LedgerButton size="sm" variant="secondary" onClick={() => setIsCorrectionModalOpen(true)}>
                <Plus className="w-3.5 h-3.5" />
                <span>Submit Correction</span>
              </LedgerButton>
            </div>

            <LedgerTable>
              <thead>
                <tr className="bg-bg text-muted font-medium text-xs border-b border-border">
                  <th className="p-3">Shift Date</th>
                  <th className="p-3">Corrected Check In</th>
                  <th className="p-3">Corrected Check Out</th>
                  <th className="p-3">Explanation</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs font-mono">
                {corrections.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted">
                      No timestamp corrections recorded.
                    </td>
                  </tr>
                ) : (
                  corrections.map((c) => (
                    <tr key={c.id}>
                      <td className="p-3 tabular-nums text-text">{c.date}</td>
                      <td className="p-3 tabular-nums text-text">{formatTime(c.requestedCheckIn) || '—'}</td>
                      <td className="p-3 tabular-nums text-muted">{formatTime(c.requestedCheckOut) || '—'}</td>
                      <td className="p-3 text-muted font-sans">{c.reason}</td>
                      <td className="p-3 text-center">
                        <StatusBadge
                          label={c.status.toUpperCase()}
                          statusKey={c.status}
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

      {/* VIEW 4: ADMIN AUDIT */}
      {activeTab === 'admin' && user?.role === 'admin' && (
        <div className="space-y-6">
          <div className="border-b border-border pb-3">
            <h3 className="text-base font-semibold text-text">Manager Attendance Reviews</h3>
            <p className="text-xs text-muted">Review leave submissions and punch timestamp modifications.</p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-text">Pending Leave Requests</h4>
            <LedgerTable>
              <thead>
                <tr className="bg-bg text-muted font-medium text-xs border-b border-border">
                  <th className="p-3">Employee</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Dates</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {leaves.filter((l) => l.status === 'pending').length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted">
                      No pending leave reviews at this time.
                    </td>
                  </tr>
                ) : (
                  leaves.filter((l) => l.status === 'pending').map((l) => (
                    <tr key={l.id}>
                      <td className="p-3 font-semibold text-text">{(l as any).user?.name || 'Staff'}</td>
                      <td className="p-3 font-medium text-text">{l.type}</td>
                      <td className="p-3 font-mono tabular-nums text-text">{l.startDate} to {l.endDate}</td>
                      <td className="p-3 text-muted">{l.reason || '—'}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <LedgerButton
                            size="sm"
                            variant="primary"
                            onClick={() => reviewLeaveMutation.mutate({ id: l.id, decision: 'approved' })}
                          >
                            Approve
                          </LedgerButton>
                          <LedgerButton
                            size="sm"
                            variant="danger"
                            onClick={() => reviewLeaveMutation.mutate({ id: l.id, decision: 'rejected' })}
                          >
                            Reject
                          </LedgerButton>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </LedgerTable>
          </div>
        </div>
      )}

      {/* Leave Modal */}
      <LedgerModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title="Submit Leave Request"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text mb-1">Leave Type</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as any)}
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs sm:text-sm text-text outline-none focus:border-accent shadow-subtle"
            >
              <option value="annual">Annual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="emergency">Emergency Leave</option>
              <option value="unpaid">Unpaid Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text mb-1">Start Date</label>
              <input
                type="date"
                value={leaveStartDate}
                onChange={(e) => setLeaveStartDate(e.target.value)}
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs sm:text-sm font-mono text-text outline-none focus:border-accent shadow-subtle"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text mb-1">End Date</label>
              <input
                type="date"
                value={leaveEndDate}
                onChange={(e) => setLeaveEndDate(e.target.value)}
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs sm:text-sm font-mono text-text outline-none focus:border-accent shadow-subtle"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1">Reason / Statement</label>
            <textarea
              rows={3}
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              placeholder="Provide context for the requested leave duration..."
              className="w-full bg-card border border-border rounded-lg p-3 text-xs sm:text-sm text-text placeholder:text-muted outline-none focus:border-accent shadow-subtle"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <LedgerButton variant="secondary" size="sm" onClick={() => setIsLeaveModalOpen(false)}>
              Cancel
            </LedgerButton>
            <LedgerButton
              variant="primary"
              size="sm"
              disabled={leaveMutation.isPending || !leaveStartDate || !leaveEndDate}
              onClick={() => leaveMutation.mutate()}
            >
              {leaveMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </LedgerButton>
          </div>
        </div>
      </LedgerModal>

      {/* Correction Modal */}
      <LedgerModal
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        title="Submit Timestamp Correction"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text mb-1">Shift Date</label>
            <input
              type="date"
              value={correctionDate}
              onChange={(e) => setCorrectionDate(e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs sm:text-sm font-mono text-text outline-none focus:border-accent shadow-subtle"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text mb-1">Corrected Check In</label>
              <input
                type="time"
                value={correctionCheckIn}
                onChange={(e) => setCorrectionCheckIn(e.target.value)}
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs sm:text-sm font-mono text-text outline-none focus:border-accent shadow-subtle"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text mb-1">Corrected Check Out</label>
              <input
                type="time"
                value={correctionCheckOut}
                onChange={(e) => setCorrectionCheckOut(e.target.value)}
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs sm:text-sm font-mono text-text outline-none focus:border-accent shadow-subtle"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1">Reason for Modification</label>
            <textarea
              rows={3}
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              placeholder="State the exact reason for the punch timestamp discrepancy..."
              className="w-full bg-card border border-border rounded-lg p-3 text-xs sm:text-sm text-text placeholder:text-muted outline-none focus:border-accent shadow-subtle"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <LedgerButton variant="secondary" size="sm" onClick={() => setIsCorrectionModalOpen(false)}>
              Cancel
            </LedgerButton>
            <LedgerButton
              variant="primary"
              size="sm"
              disabled={correctionMutation.isPending || !correctionReason.trim()}
              onClick={() => correctionMutation.mutate()}
            >
              {correctionMutation.isPending ? 'Submitting...' : 'Submit Correction'}
            </LedgerButton>
          </div>
        </div>
      </LedgerModal>

      {/* Face Biometrics Modal */}
      {isFaceModalOpen && (
        <FaceBiometricsModal
          isOpen={isFaceModalOpen}
          onClose={() => setIsFaceModalOpen(false)}
          mode="verify_attendance"
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] });
            setIsFaceModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
