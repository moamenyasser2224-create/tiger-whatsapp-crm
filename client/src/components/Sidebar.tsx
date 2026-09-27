import React from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import type { Settings } from '../types/index.js';
import {
  Users,
  Clock,
  MessageSquare,
  LayoutDashboard,
  MessageSquareQuote,
  Settings as SettingsIcon,
} from 'lucide-react';
import { cn } from '../lib/utils.js';
import { useAuth } from '../contexts/AuthContext.js';

export const navItems = [
  { name: 'العملاء (CRM)', href: '/customers', icon: Users },
  { name: 'الحضور والانصراف', href: '/attendance', icon: Clock },
  { name: 'الشات الداخلي', href: '/chat', icon: MessageSquare },
  { name: 'لوحة الإحصائيات', href: '/', icon: LayoutDashboard },
  { name: 'قوالب الرسائل', href: '/templates', icon: MessageSquareQuote },
  { name: 'الإعدادات', href: '/settings', icon: SettingsIcon },
];

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const { data: settings } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data.data;
    },
    staleTime: 60000,
  });

  const orgName = settings?.orgName || 'تايجر CRM';

  return (
    <>
      {/* Desktop Vertical Sidebar */}
      <aside className="w-64 flex-shrink-0 border-l border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 min-h-[calc(100vh-4rem)] p-4 hidden md:flex flex-col justify-between transition-colors">
        <div className="space-y-6">
          <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-900">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block mb-1">
              مساحة العمل
            </span>
            <div className="text-sm font-extrabold text-neutral-900 dark:text-white truncate">
              {orgName}
            </div>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-150 border',
                      isActive
                        ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:border-white shadow-xs'
                        : 'border-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-white'
                    )
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span>{item.name}</span>
                  </div>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3">
          {user && (
            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-3 px-2 flex items-center gap-3">
              {user.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt={user.name}
                  className="w-9 h-9 rounded-lg object-cover border border-neutral-400 dark:border-neutral-600 grayscale"
                />
              ) : (
                <div className="w-9 h-9 rounded-lg border border-neutral-400 dark:border-neutral-600 flex items-center justify-center font-bold text-xs bg-neutral-100 dark:bg-neutral-900">
                  {user.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold truncate text-neutral-900 dark:text-white">{user.name}</div>
                <div className="text-[10px] text-neutral-500 font-mono truncate">{user.role === 'admin' ? 'مدير النظام' : 'موظف'}</div>
              </div>
            </div>
          )}

          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-3 px-3 text-xs text-neutral-400 dark:text-neutral-600 flex items-center justify-between">
            <span>نظام أحادي اللون</span>
            <span className="font-mono text-[10px] uppercase font-bold">Monochrome</span>
          </div>
        </div>
      </aside>

      {/* Mobile Horizontal Scrollable Tab Bar */}
      <div className="md:hidden border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 px-2 py-2 overflow-x-auto flex gap-1.5 scrollbar-none sticky top-16 z-20">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-all border',
                  isActive
                    ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white'
                    : 'border-transparent text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900'
                )
              }
            >
              <Icon className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </>
  );
};
