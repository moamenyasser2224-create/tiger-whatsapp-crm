import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import { useSocket } from '../../contexts/SocketContext.js';
import { LedgerIcon } from '../icons/LedgerIcons.js';
import { formatDate } from '../../lib/utils.js';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  payload?: any;
  readAt: string | null;
  createdAt: string;
}

interface NotificationsCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsCenter: React.FC<NotificationsCenterProps> = ({
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  // Fetch notifications
  const { data: notifications = [] } = useQuery<NotificationItem[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data.data;
    },
    refetchInterval: 30000,
  });

  // Listen for real-time notifications via Socket.io
  React.useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notif: NotificationItem) => {
      queryClient.setQueryData<NotificationItem[]>(['notifications'], (old = []) => [
        notif,
        ...old,
      ]);
    };

    socket.on('new_notification', handleNewNotification);
    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket, queryClient]);

  // Mark single as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.post('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-16 bg-diagonal-hatch bg-black/40"
      onClick={onClose}
      dir="ltr"
    >
      <div
        className="w-full max-w-sm border-2 border-neutral-900 dark:border-white bg-[#ffffff] dark:bg-[#121212] shadow-solid flex flex-col font-sans overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-neutral-900 dark:border-white p-3 bg-neutral-100 dark:bg-neutral-900">
          <div className="flex items-center gap-2">
            <LedgerIcon name="bell" size={16} />
            <span className="font-bold text-sm text-neutral-950 dark:text-white">
              Notifications &amp; Alerts
            </span>
            {unreadCount > 0 && (
              <span className="font-mono text-[10px] font-bold border border-neutral-900 dark:border-white px-1.5 bg-white dark:bg-black tabular-nums">
                {unreadCount} new
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer"
          >
            <LedgerIcon name="x" size={15} />
          </button>
        </div>

        {/* Action bar */}
        {unreadCount > 0 && (
          <div className="border-b border-neutral-200 dark:border-neutral-800 px-3 py-1.5 flex justify-end bg-neutral-50 dark:bg-neutral-950">
            <button
              type="button"
              onClick={() => markAllReadMutation.mutate()}
              className="text-[11px] font-mono font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white underline cursor-pointer"
            >
              Mark all as read
            </button>
          </div>
        )}

        {/* Notification items list */}
        <div className="max-h-96 overflow-y-auto divide-y divide-neutral-200 dark:divide-neutral-800 p-2">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-neutral-500">
              No notifications in your feed.
            </div>
          ) : (
            notifications.map((notif) => {
              const isUnread = !notif.readAt;

              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (isUnread) markReadMutation.mutate(notif.id);
                  }}
                  className={`p-3 text-xs select-none transition-colors cursor-pointer ${
                    isUnread
                      ? 'bg-neutral-50 dark:bg-neutral-900 border-l-4 border-neutral-900 dark:border-white'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="font-bold text-neutral-950 dark:text-white">
                      {notif.title}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500 tabular-nums">
                      {formatDate(notif.createdAt)}
                    </span>
                  </div>

                  <p className="text-neutral-700 dark:text-neutral-300 text-[11px] leading-relaxed">
                    {notif.body}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-neutral-900 dark:border-white p-2 text-center text-[10px] font-mono text-neutral-500 bg-neutral-100 dark:bg-neutral-900">
          Tiger Real-Time Event Dispatcher
        </div>
      </div>
    </div>
  );
};
