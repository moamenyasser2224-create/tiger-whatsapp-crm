import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  MessageSquareQuote,
  Settings,
} from 'lucide-react';
import { cn } from '../lib/utils.js';

const navItems = [
  { name: 'لوحة التحكم', href: '/', icon: LayoutDashboard },
  { name: 'إدارة العملاء', href: '/customers', icon: Users },
  { name: 'قوالب الرسائل', href: '/templates', icon: MessageSquareQuote },
  { name: 'إعدادات الحساب والأمان', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 flex-shrink-0 border-l border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 min-h-[calc(100vh-4rem)] p-4 hidden md:block transition-colors">
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
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-150',
                  isActive
                    ? 'bg-whatsapp text-white shadow-md shadow-whatsapp/20'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800/60'
                )
              }
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};
