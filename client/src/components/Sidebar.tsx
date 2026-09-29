import React from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import type { Settings } from '../types/index.js';
import {
  Users,
  Clock,
  MessageSquare,
  BarChart3,
  FileText,
  Settings as SettingsIcon,
  Receipt,
  Palette,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.js';

export const navItems = [
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Attendance', href: '/attendance', icon: Clock },
  { name: 'Payroll & Slips', href: '/deductions', icon: Receipt },
  { name: 'Team Chat', href: '/chat', icon: MessageSquare },
  { name: 'Metrics & KPIs', href: '/dashboard', icon: BarChart3 },
  { name: 'WhatsApp Templates', href: '/templates', icon: FileText },
  { name: 'Design Tokens', href: '/design-lab', icon: Palette },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
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

  const orgName = settings?.orgName || 'Tiger';

  return (
    <aside className="w-60 flex-shrink-0 border-r border-border bg-card min-h-[calc(100vh-4rem)] p-4 hidden md:flex flex-col justify-between transition-colors">
      <div className="space-y-4">
        <div className="px-3 py-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted block mb-1">
            Workspace
          </span>
          <div className="text-sm font-semibold text-text truncate">
            {orgName}
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs transition-colors duration-150 ${
                    isActive
                      ? 'bg-accent-soft text-accent font-semibold border-s-2 border-accent'
                      : 'text-muted hover:bg-bg hover:text-text font-normal'
                  }`
                }
              >
                <Icon className="h-4 w-4 flex-shrink-0 stroke-[1.5]" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {user && (
        <div className="border-t border-border pt-3 px-2 flex items-center gap-3">
          {user.photoUrl ? (
            <img
              src={user.photoUrl}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover border border-border"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-accent-soft text-accent font-bold text-xs flex items-center justify-center border border-border">
              {user.name.charAt(0)}
            </div>
          )}
          <div className="truncate">
            <div className="text-xs font-semibold text-text truncate">{user.name}</div>
            <div className="text-[10px] text-muted truncate">{user.email}</div>
          </div>
        </div>
      )}
    </aside>
  );
};
