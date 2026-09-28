import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { useTheme } from '../../contexts/ThemeContext.js';
import { LedgerIcon, LedgerIconName } from '../icons/LedgerIcons.js';
import { OdometerClock } from './OdometerClock.js';
import { CommandPalette } from './CommandPalette.js';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal.js';
import { NotificationsCenter } from './NotificationsCenter.js';

interface NavItem {
  id: string;
  name: string;
  href: string;
  icon: LedgerIconName;
}

export const LEDGER_NAV_ITEMS: NavItem[] = [
  { id: 'customers', name: 'Customers Ledger', href: '/customers', icon: 'users' },
  { id: 'attendance', name: 'Time Clock', href: '/attendance', icon: 'punch-card' },
  { id: 'deductions', name: 'Payroll & Slips', href: '/deductions', icon: 'receipt' },
  { id: 'chat', name: 'Team Chat', href: '/chat', icon: 'chat' },
  { id: 'dashboard', name: 'Metrics & KPIs', href: '/dashboard', icon: 'dashboard' },
  { id: 'templates', name: 'WhatsApp Templates', href: '/templates', icon: 'template' },
  { id: 'design-lab', name: 'Design Tokens', href: '/design-lab', icon: 'stamp' },
  { id: 'settings', name: 'System Settings', href: '/settings', icon: 'settings' },
];

export const LedgerLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Fetch unread notifications count
  const { data: notifications = [] } = useQuery<{ id: string; readAt: string | null }[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data.data || [];
    },
    refetchInterval: 30000,
  });
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  // Global hotkeys listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
        return;
      }

      if (e.key === '?' && !isInput && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      if (e.altKey) {
        if (e.key === '1') {
          e.preventDefault();
          navigate('/customers');
        } else if (e.key === '2') {
          e.preventDefault();
          navigate('/attendance');
        } else if (e.key === '3') {
          e.preventDefault();
          navigate('/deductions');
        } else if (e.key === '4') {
          e.preventDefault();
          navigate('/chat');
        } else if (e.key === '5') {
          e.preventDefault();
          navigate('/');
        } else if (e.key.toLowerCase() === 't') {
          e.preventDefault();
          toggleTheme();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, toggleTheme]);

  // Fetch settings for org name
  const { data: settings } = useQuery<{ orgName?: string }>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data.data;
    },
    staleTime: 60000,
  });

  // Current active shift for user
  const { data: myStatus } = useQuery<{ checkIn?: string; checkOut?: string; status?: string }>({
    queryKey: ['attendance', 'my-status'],
    queryFn: async () => {
      const res = await api.get('/attendance/my-status');
      return res.data.data;
    },
    staleTime: 15000,
  });

  const now = new Date();
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(now);

  const orgName = settings?.orgName || 'Tiger';

  const userShiftText = myStatus?.checkOut
    ? 'Clocked Out'
    : myStatus?.checkIn
    ? 'On Duty'
    : 'Not Started';

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#111111] dark:bg-[#0d0d0d] dark:text-[#f5f5f5] flex flex-col font-sans antialiased selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black bg-industrial-grid" dir="ltr">
      {/* Hidden SVG Filters for rubber stamp distress edge effect */}
      <svg width="0" height="0" className="hidden absolute pointer-events-none">
        <defs>
          <filter id="stampDistressFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.2" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* TOP MASTHEAD */}
      <header className="border-b-2 border-neutral-900 dark:border-neutral-100 bg-[#ffffff] dark:bg-[#141414] px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Masthead Title & Ledger Subtext */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 border border-neutral-900 dark:border-white font-bold bg-white dark:bg-black">
                CORE SYSTEM // TIGER-OS
              </span>
              <a
                href="/"
                className="text-[11px] font-mono underline font-bold hover:text-purple-600 transition-colors"
                title="View Public Company Site & Video Showcase"
              >
                [Company Site &amp; Videos ↗]
              </a>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 dark:text-white tracking-tight">
              {orgName}
            </h1>
          </div>

          {/* Dates & Mechanical Live Clock & Shift Badge */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs font-mono">
            {/* System Date */}
            <div className="border-l-2 border-neutral-300 dark:border-neutral-700 pl-3 sm:pl-4 space-y-0.5 text-left">
              <div className="font-bold text-neutral-900 dark:text-neutral-100">
                {formattedDate}
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 tabular-nums">
                UTC +03:00 / RIYADH
              </div>
            </div>

            {/* Odometer Clock */}
            <div className="flex items-center gap-2">
              <OdometerClock />
            </div>

            {/* Shift Status & User Details */}
            <div className="flex items-center gap-2.5 pr-1">
              <div className="text-left">
                <div className="font-bold text-neutral-900 dark:text-white text-xs">
                  {user?.name}
                </div>
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                  <span className={`h-1.5 w-1.5 rounded-full ${myStatus?.checkIn && !myStatus?.checkOut ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'}`} />
                  <span>{userShiftText}</span>
                </div>
              </div>

              {/* Quick Search & Palette Trigger */}
              <button
                type="button"
                onClick={() => setIsPaletteOpen(true)}
                title="Quick Search & Commands (Ctrl+K)"
                className="flex items-center gap-1.5 border border-neutral-900 dark:border-white px-2 py-1 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors font-mono cursor-pointer"
              >
                <LedgerIcon name="search" size={13} />
                <span className="hidden sm:inline font-bold">Search</span>
                <kbd className="hidden md:inline border border-neutral-400 dark:border-neutral-600 px-1 text-[10px]">⌘K</kbd>
              </button>

              {/* Notifications Button */}
              <button
                type="button"
                onClick={() => setIsNotificationsOpen(true)}
                title="System Notifications"
                className="relative flex items-center justify-center border border-neutral-900 dark:border-white p-1.5 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors font-mono cursor-pointer"
              >
                <LedgerIcon name="bell" size={14} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-neutral-950 text-white dark:bg-white dark:text-black text-[9px] font-mono font-bold px-1 border border-white dark:border-black min-w-[16px] text-center">
                    {unreadCount > 9 ? '+9' : unreadCount}
                  </span>
                )}
              </button>

              {/* Theme Toggle, Help & Logout */}
              <div className="flex items-center border border-neutral-900 dark:border-white">
                <button
                  type="button"
                  onClick={() => setIsShortcutsOpen(true)}
                  title="Keyboard Shortcuts (?)"
                  className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <LedgerIcon name="help" size={15} />
                </button>
                <button
                  type="button"
                  onClick={toggleTheme}
                  title="Toggle Theme (Light / Dark)"
                  className="p-1.5 border-l border-neutral-900 dark:border-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <LedgerIcon name={theme === 'dark' ? 'eye' : 'eye-off'} size={15} />
                </button>
                <button
                  type="button"
                  onClick={logout}
                  title="Sign Out"
                  className="p-1.5 border-l border-neutral-900 dark:border-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <LedgerIcon name="lock" size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* DESKTOP TAB NAVIGATION */}
      <nav className="hidden md:block bg-[#f0f0f0] dark:bg-[#111111] border-b-2 border-neutral-900 dark:border-neutral-100 px-6 pt-2">
        <div className="max-w-7xl mx-auto flex items-end gap-1.5">
          {LEDGER_NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
            return (
              <NavLink
                key={item.id}
                to={item.href}
                className={`relative px-4 py-2 text-xs font-bold transition-all border-t-2 border-x-2 select-none flex items-center gap-2 ${
                  isActive
                    ? 'bg-[#ffffff] text-neutral-950 dark:bg-[#141414] dark:text-white border-neutral-900 dark:border-neutral-100 translate-y-[2px] z-10'
                    : 'bg-[#e5e5e5] text-neutral-600 dark:bg-[#1c1c1c] dark:text-neutral-400 border-neutral-400 dark:border-neutral-700 hover:bg-[#ebebeb] dark:hover:bg-[#262626] hover:text-neutral-900 dark:hover:text-white'
                }`}
                style={{
                  clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
                }}
              >
                <LedgerIcon name={item.icon} size={15} />
                <span>{item.name}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 bg-neutral-900 dark:bg-white" />
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 bg-[#ffffff] dark:bg-[#141414] ledger-notebook-spine my-4 border-y border-neutral-200 dark:border-neutral-800 shadow-solid-sm sm:shadow-solid">
        <Outlet />
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#ffffff] dark:bg-[#141414] border-t-2 border-neutral-900 dark:border-neutral-100 py-1 px-2 flex items-center justify-around">
        {LEDGER_NAV_ITEMS.slice(0, 4).map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.id}
              to={item.href}
              className={`flex flex-col items-center py-1 px-2 text-[10px] font-bold ${
                isActive
                  ? 'text-neutral-950 dark:text-white border-t-2 border-neutral-900 dark:border-white -mt-1'
                  : 'text-neutral-500 dark:text-neutral-400'
              }`}
            >
              <LedgerIcon name={item.icon} size={18} />
              <span className="mt-0.5">{item.name.split(' ')[0]}</span>
            </NavLink>
          );
        })}

        {/* More Button */}
        <button
          type="button"
          onClick={() => setIsMobileMoreOpen(!isMobileMoreOpen)}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-bold cursor-pointer ${
            isMobileMoreOpen ? 'text-neutral-950 dark:text-white' : 'text-neutral-500 dark:text-neutral-400'
          }`}
        >
          <LedgerIcon name="more-horizontal" size={18} />
          <span className="mt-0.5">More</span>
        </button>
      </nav>

      {/* Mobile More Popout Sheet */}
      {isMobileMoreOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-diagonal-hatch flex flex-col justify-end p-4">
          <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-900 dark:border-white p-4 space-y-3">
            <div className="flex items-center justify-between border-b-2 border-neutral-900 pb-2">
              <span className="font-bold text-sm">System Navigation</span>
              <button
                type="button"
                onClick={() => setIsMobileMoreOpen(false)}
                className="p-1 border border-neutral-900"
              >
                <LedgerIcon name="x" size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {LEDGER_NAV_ITEMS.slice(4).map((item) => (
                <NavLink
                  key={item.id}
                  to={item.href}
                  onClick={() => setIsMobileMoreOpen(false)}
                  className="flex items-center gap-2 p-2 border border-neutral-300 dark:border-neutral-700 font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <LedgerIcon name={item.icon} size={16} />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Ledger Footer */}
      <footer className="border-t border-neutral-300 dark:border-neutral-800 py-3 px-6 text-center text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
        Tiger Internal Business OS &bull; Authenticated &amp; Encrypted
      </footer>

      {/* Global Command Palette & Mechanical Shortcuts Modals */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
      <NotificationsCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </div>
  );
};
