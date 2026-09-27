import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Users,
  Clock,
  MessageSquare,
  LayoutDashboard,
  MessageSquareQuote,
  Settings,
} from 'lucide-react';
import { cn } from '../lib/utils.js';

export const navItems = [
  { name: 'العملاء (CRM)', href: '/customers', icon: Users, badge: 'رئيسي' },
  { name: 'الحضور والانصراف', href: '/attendance', icon: Clock, badge: 'فوري' },
  { name: 'الشات الداخلي', href: '/chat', icon: MessageSquare, badge: 'مباشر' },
  { name: 'لوحة الإحصائيات', href: '/', icon: LayoutDashboard },
  { name: 'قوالب الرسائل', href: '/templates', icon: MessageSquareQuote },
  { name: 'إعدادات الحساب', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <>
      {/* Desktop Vertical Sidebar */}
      <aside className="w-64 flex-shrink-0 border-l border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 min-h-[calc(100vh-4rem)] p-4 hidden md:flex flex-col justify-between transition-colors shadow-sm">
        <div className="space-y-6">
          <div className="px-3 py-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              أقسام العمل
            </span>
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
                      'flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-150',
                      isActive
                        ? 'bg-whatsapp text-white shadow-md shadow-whatsapp/25 translate-x-1'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800/70 dark:hover:text-white'
                    )
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="rounded-full bg-whatsapp-light/20 px-2 py-0.5 text-[10px] font-bold text-whatsapp dark:bg-whatsapp-dark/30 dark:text-emerald-300">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 pt-4 px-3 text-xs text-gray-400 dark:text-gray-500">
          <span>تايجر ورك سبيس v2.0 • جاهز للإنتاج</span>
        </div>
      </aside>

      {/* Mobile Horizontal Scrollable Tab Bar */}
      <div className="md:hidden border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 px-2 py-2 overflow-x-auto flex gap-1.5 scrollbar-none sticky top-16 z-20 shadow-xs">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-all',
                  isActive
                    ? 'bg-whatsapp text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                )
              }
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </>
  );
};
