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
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
            <Clock className="h-7 w-7 text-whatsapp" />
            <span>نظام الحضور والانصراف الذكي</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            سجّل حضورك وانصرافك بضغطة زر، وتابع تواجد أعضاء الفريق لحظياً عبر البث المباشر.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 shadow-xs">
          <Calendar className="h-4 w-4 text-whatsapp" />
          <span>{format(new Date(), 'EEEE، d MMMM yyyy', { locale: ar })}</span>
        </div>
      </div>

      {/* Notifications */}
      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Grid: My Status & Action Buttons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Action Controls Card */}
        <div className="lg:col-span-1 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-whatsapp" />
              <span>إجراءات الدوام</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              اضغط على الإجراء المناسب. يتم قفل الأزرار آلياً بعد تسجيل الحركة لمنع التكرار.
            </p>

            <div className="space-y-4">
              {/* Check-In Button */}
              <button
                onClick={() => checkInMutation.mutate()}
                disabled={hasCheckedIn || checkInMutation.isPending || isMyStatusLoading}
                className={`w-full flex items-center justify-center gap-3 rounded-xl py-3.5 px-4 text-sm font-bold transition-all shadow-md ${
                  hasCheckedIn
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500 shadow-none'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.99] shadow-emerald-500/20'
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
                className={`w-full flex items-center justify-center gap-3 rounded-xl py-3.5 px-4 text-sm font-bold transition-all shadow-md ${
                  !hasCheckedIn || hasCheckedOut
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500 shadow-none'
                    : 'bg-amber-600 text-white hover:bg-amber-700 active:scale-[0.99] shadow-amber-500/20'
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

          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500 text-center">
            يتم توثيق كل حركة بعنوان الـ IP والطابع الزمني في سجل الرقابة
          </div>
        </div>

        {/* My Status Details Card */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>بطاقة حالتي اليوم</span>
                <span className="text-xs font-normal text-gray-500">({user?.name})</span>
              </h2>

              {/* Current Status Badge */}
              {hasCheckedOut ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  <span className="h-2 w-2 rounded-full bg-gray-400" />
                  مغادر (تم الانصراف)
                </span>
              ) : hasCheckedIn ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  متواجد في الدوام
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  لم يحضر بعد
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
              {/* Check-In Time Block */}
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/20">
                <div className="text-xs font-medium text-emerald-800 dark:text-emerald-300 mb-1 flex items-center gap-1.5">
                  <LogIn className="h-4 w-4" />
                  <span>وقت الحضور المسجل</span>
                </div>
                <div className="text-2xl font-black text-emerald-950 dark:text-emerald-100">
                  {formatTime(myStatus?.checkIn)}
                </div>
              </div>

              {/* Check-Out Time Block */}
              <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
                <div className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-1.5">
                  <LogOut className="h-4 w-4" />
                  <span>وقت الانصراف المسجل</span>
                </div>
                <div className="text-2xl font-black text-amber-950 dark:text-amber-100">
                  {formatTime(myStatus?.checkOut)}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-4 border border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>تاريخ السجل: {myStatus?.date || format(new Date(), 'yyyy-MM-dd')}</span>
            <span>الفرع: المقر الرئيسي (عن بُعد)</span>
          </div>
        </div>
      </div>

      {/* Team Live Attendance Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-whatsapp/10 text-whatsapp dark:bg-whatsapp/20">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                حالة تواجد أعضاء الفريق اليوم (مباشر)
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                تحديث لحظي عبر WebSocket يوضح من سجّل حضوره وانصرافه اليوم من كل الفريق.
              </p>
            </div>
          </div>

          <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold px-3 py-1 text-xs">
            {teamAttendance.length} مسجلين اليوم
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
              <tr>
                <th className="px-6 py-4">اسم الموظف</th>
                <th className="px-6 py-4">الدور</th>
                <th className="px-6 py-4">وقت الحضور</th>
                <th className="px-6 py-4">وقت الانصراف</th>
                <th className="px-6 py-4">الحالة الحالية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {teamAttendance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
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
                      className="hover:bg-gray-50/70 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-whatsapp/15 text-whatsapp flex items-center justify-center font-bold text-xs">
                          {record.user?.name ? record.user.name.charAt(0) : '؟'}
                        </div>
                        <div>
                          <div>{record.user?.name || 'موظف'}</div>
                          <div className="text-xs text-gray-400 font-normal">{record.user?.email}</div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        <span className="rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-1 text-xs font-medium">
                          {record.user?.role === 'admin' ? 'مدير' : 'موظف'}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatTime(record.checkIn)}
                      </td>

                      <td className="px-6 py-4 font-semibold text-amber-600 dark:text-amber-400">
                        {formatTime(record.checkOut)}
                      </td>

                      <td className="px-6 py-4">
                        {isPresent && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            حاضر الآن
                          </span>
                        )}
                        {isDeparted && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                            <span className="h-2 w-2 rounded-full bg-gray-400" />
                            انصرف
                          </span>
                        )}
                        {!isPresent && !isDeparted && (
                          <span className="text-xs text-gray-400">غير محدد</span>
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
