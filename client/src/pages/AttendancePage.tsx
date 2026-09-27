import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useSocket } from '../contexts/SocketContext.js';
import { useAuth } from '../contexts/AuthContext.js';
import type { Attendance } from '../types/index.js';
import {
  Clock,
  CheckCircle2,
  LogOut,
  LogIn,
  AlertCircle,
  Users,
  Calendar,
  Briefcase,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch my status for today
  const { data: myStatus, isLoading: isMyStatusLoading } = useQuery<Attendance | null>({
    queryKey: ['attendance', 'my-status'],
    queryFn: async () => {
      const res = await api.get('/attendance/my-status');
      return res.data.data;
    },
  });

  // Fetch today's team attendance
  const { data: teamAttendance = [], isLoading: isTeamLoading } = useQuery<Attendance[]>({
    queryKey: ['attendance', 'today'],
    queryFn: async () => {
      const res = await api.get('/attendance/today');
      return res.data.data;
    },
  });

  // Socket.io Real-time listener for live updates
  useEffect(() => {
    if (!socket) return;

    const handleAttendanceUpdate = (payload: { action: string; record: Attendance }) => {
      // Invalidate queries so React Query updates instantly
      queryClient.invalidateQueries({ queryKey: ['attendance', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'my-status'] });
    };

    socket.on('attendance_update', handleAttendanceUpdate);

    return () => {
      socket.off('attendance_update', handleAttendanceUpdate);
    };
  }, [socket, queryClient]);

  // Check-in Mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      setActionError(null);
      const res = await api.post('/attendance/check-in');
      return res.data;
    },
    onSuccess: (data) => {
      setSuccessMessage(data.message || 'تم تسجيل حضورك بنجاح!');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      setTimeout(() => setSuccessMessage(null), 4000);
    },
    onError: (err: any) => {
      setActionError(err.response?.data?.error || 'فشل في تسجيل الحضور');
    },
  });

  // Check-out Mutation
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      setActionError(null);
      const res = await api.post('/attendance/check-out');
      return res.data;
    },
    onSuccess: (data) => {
      setSuccessMessage(data.message || 'تم تسجيل انصرافك بنجاح!');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      setTimeout(() => setSuccessMessage(null), 4000);
    },
    onError: (err: any) => {
      setActionError(err.response?.data?.error || 'فشل في تسجيل الانصراف');
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
        second: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white flex items-center gap-2.5">
            <Clock className="h-7 w-7 text-neutral-900 dark:text-white" />
            <span>نظام الحضور والانصراف الذكي</span>
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            سجّل حضورك وانصرافك بضغطة زر، وتابع تواجد أعضاء الفريق لحظياً عبر البث المباشر.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 shadow-xs">
          <Calendar className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
          <span>{format(new Date(), 'EEEE، d MMMM yyyy', { locale: ar })}</span>
        </div>
      </div>

      {/* Notifications */}
      {actionError && (
        <div className="rounded-xl border border-neutral-900 bg-neutral-100 p-4 text-sm text-neutral-900 dark:border-white dark:bg-neutral-800 dark:text-white flex items-center gap-3 font-bold">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-neutral-900 bg-neutral-100 p-4 text-sm text-neutral-900 dark:border-white dark:bg-neutral-800 dark:text-white flex items-center gap-3 font-bold">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Grid: My Status & Action Buttons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Action Controls Card */}
        <div className="lg:col-span-1 rounded-2xl border border-neutral-300 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-neutral-900 dark:text-white" />
              <span>إجراءات الدوام</span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6">
              اضغط على الإجراء المناسب. يتم قفل الأزرار آلياً بعد تسجيل الحركة لمنع التكرار.
            </p>

            <div className="space-y-4">
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
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-400 dark:text-neutral-500 text-center">
            يتم توثيق كل حركة بعنوان الـ IP والطابع الزمني في سجل الرقابة
          </div>
        </div>

        {/* My Status Details Card */}
        <div className="lg:col-span-2 rounded-2xl border border-neutral-300 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <span>بطاقة حالتي اليوم</span>
                <span className="text-xs font-normal text-neutral-500">({user?.name})</span>
              </h2>

              {/* Current Status Badge */}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
              {/* Check-In Time Block */}
              <div className="rounded-xl border border-neutral-300 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/40">
                <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                  <LogIn className="h-4 w-4" />
                  <span>وقت الحضور المسجل</span>
                </div>
                <div className="font-mono text-2xl font-black text-neutral-900 dark:text-white">
                  {formatTime(myStatus?.checkIn)}
                </div>
              </div>

              {/* Check-Out Time Block */}
              <div className="rounded-xl border border-neutral-300 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/40">
                <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                  <LogOut className="h-4 w-4" />
                  <span>وقت الانصراف المسجل</span>
                </div>
                <div className="font-mono text-2xl font-black text-neutral-900 dark:text-white">
                  {formatTime(myStatus?.checkOut)}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/60 p-4 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>تاريخ السجل: {myStatus?.date || format(new Date(), 'yyyy-MM-dd')}</span>
            <span>الفرع: المقر الرئيسي (عن بُعد)</span>
          </div>
        </div>
      </div>

      {/* Team Live Attendance Table */}
      <div className="rounded-2xl border border-neutral-300 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white">
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
                    <tr
                      key={record.id}
                      className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-neutral-900 dark:text-white flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full border border-neutral-300 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white flex items-center justify-center font-bold text-xs">
                          {record.user?.name ? record.user.name.charAt(0) : '؟'}
                        </div>
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
  );
};
