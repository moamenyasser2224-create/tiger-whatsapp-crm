import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { useTheme } from '../../contexts/ThemeContext.js';
import {
  Users,
  Clock,
  Receipt,
  MessageSquare,
  BarChart3,
  FileText,
  Palette,
  Settings as SettingsIcon,
  Search,
  Bell,
  HelpCircle,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { CommandPalette } from './CommandPalette.js';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal.js';
import { NotificationsCenter } from './NotificationsCenter.js';
import { TigerAiWidget } from '../TigerAiWidget.js';

interface NavItem {
  id: string;
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const LEDGER_NAV_ITEMS: NavItem[] = [
  { id: 'customers', name: 'Customers', href: '/customers', icon: Users },
  { id: 'attendance', name: 'Attendance', href: '/attendance', icon: Clock },
  { id: 'deductions', name: 'Payroll & Slips', href: '/deductions', icon: Receipt },
  { id: 'chat', name: 'Team Chat', href: '/chat', icon: MessageSquare },
  { id: 'dashboard', name: 'Metrics & KPIs', href: '/dashboard', icon: BarChart3 },
  { id: 'templates', name: 'WhatsApp Templates', href: '/templates', icon: FileText },
  { id: 'design-lab', name: 'Design Tokens', href: '/design-lab', icon: Palette },
  { id: 'settings', name: 'Settings', href: '/settings', icon: SettingsIcon },
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
          navigate('/dashboard');
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
  }).format(now);

  const orgName = settings?.orgName || 'Tiger';

  const userShiftText = myStatus?.checkOut
    ? 'Clocked Out'
    : myStatus?.checkIn
    ? 'On Duty'
    : 'Not Started';

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col font-sans antialiased" dir="ltr">
      {/* TOP HEADER */}
      <header className="sticky top-0 z-30 bg-card border-b border-border shadow-subtle px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Workspace Title */}
          <div className="flex items-center gap-3">
            <NavLink to="/dashboard" className="flex items-center gap-2 group">
              <span className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-subtle">
                T
              </span>
              <div>
                <div className="font-semibold text-base sm:text-lg text-text tracking-tight group-hover:text-accent transition-colors">
                  {orgName}
                </div>
                <div className="text-[11px] text-muted -mt-0.5">
                  Management &amp; Financial Platform
                </div>
              </div>
            </NavLink>

            <a
              href="/"
              className="hidden lg:inline-flex items-center gap-1 text-xs text-muted hover:text-accent transition-colors ml-4 px-2 py-1 rounded-md hover:bg-bg"
              title="View Public Showcase"
            >
              <span>Public Showcase</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3 sm:gap-4 text-xs">
            {/* System Date & Shift */}
            <div className="hidden sm:flex items-center gap-2.5 border-r border-border pr-4 text-muted">
              <span className="font-medium text-text">{formattedDate}</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-card border border-border text-[11px]">
                <span
                  className={`w-[6px] h-[6px] rounded-full ${
                    myStatus?.checkIn && !myStatus?.checkOut ? 'bg-accent' : 'bg-muted'
                  }`}
                />
                <span className="text-text font-medium">{userShiftText}</span>
              </span>
            </div>

            {/* Quick Search Trigger (Ctrl+K) */}
            <button
              type="button"
              onClick={() => setIsPaletteOpen(true)}
              title="Quick Search (Ctrl+K)"
              className="flex items-center gap-1.5 bg-card border border-border hover:border-accent text-muted hover:text-text px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-subtle"
            >
              <Search className="w-3.5 h-3.5 text-muted" />
              <span className="hidden md:inline font-normal">Search</span>
              <kbd className="hidden md:inline bg-bg border border-border px-1.5 py-0.2 rounded text-[10px] text-muted font-mono">
                ⌘K
              </kbd>
            </button>

            {/* Tiger AI Copilot Trigger (Alt+A) */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-tiger-ai'))}
              title="Tiger AI Assistant (Alt+A)"
              className="flex items-center gap-1.5 bg-accent-soft border border-accent/20 hover:border-accent text-accent px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-subtle font-medium"
            >
              <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
              <span className="hidden sm:inline">Tiger AI</span>
              <kbd className="hidden lg:inline bg-card border border-accent/20 px-1 py-0.2 rounded text-[9px] text-accent font-mono">
                Alt+A
              </kbd>
            </button>

            {/* Notifications Button */}
            <button
              type="button"
              onClick={() => setIsNotificationsOpen(true)}
              title="Notifications"
              className="relative p-2 rounded-lg text-muted hover:text-text hover:bg-bg border border-border transition-colors cursor-pointer shadow-subtle"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Help / Shortcuts */}
            <button
              type="button"
              onClick={() => setIsShortcutsOpen(true)}
              title="Keyboard Shortcuts (?)"
              className="hidden sm:inline-flex p-2 rounded-lg text-muted hover:text-text hover:bg-bg border border-border transition-colors cursor-pointer shadow-subtle"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title="Toggle Theme"
              className="p-2 rounded-lg text-muted hover:text-text hover:bg-bg border border-border transition-colors cursor-pointer shadow-subtle"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <div className="hidden md:block text-right">
                <div className="font-semibold text-xs text-text">{user?.name}</div>
                <div className="text-[10px] text-muted capitalize">{user?.role}</div>
              </div>
              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                className="p-2 rounded-lg text-muted hover:text-danger hover:bg-danger-soft transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* BODY WITH FIXED SIDEBAR + COMFORTABLE CONTENT AREA */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* DESKTOP SIDEBAR */}
        <aside className="w-60 shrink-0 bg-card border-r border-border p-4 hidden md:flex flex-col justify-between sticky top-[57px] h-[calc(100vh-57px)]">
          <div className="space-y-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted px-3">
              Navigation
            </div>

            <nav className="space-y-1">
              {LEDGER_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.href ||
                  (item.href !== '/' && location.pathname.startsWith(item.href));

                return (
                  <NavLink
                    key={item.id}
                    to={item.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs transition-colors duration-150 ${
                      isActive
                        ? 'bg-accent-soft text-accent font-semibold border-s-2 border-accent'
                        : 'text-muted hover:bg-bg hover:text-text font-normal'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 stroke-[1.5]" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer info */}
          <div className="border-t border-border pt-4 px-2 text-[11px] text-muted space-y-1">
            <div className="font-medium text-text">Tiger Workspace</div>
            <div className="text-[10px]">Version 2.4.0 &bull; Financial Standard</div>
          </div>
        </aside>

        {/* MAIN COMFORTABLE CONTENT AREA */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border py-2 px-3 flex items-center justify-around shadow-subtle">
        {LEDGER_NAV_ITEMS.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.id}
              to={item.href}
              className={`flex flex-col items-center py-1 px-2 text-[10px] transition-colors ${
                isActive ? 'text-accent font-semibold' : 'text-muted hover:text-text'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="mt-1">{item.name.split(' ')[0]}</span>
            </NavLink>
          );
        })}

        {/* More Button */}
        <button
          type="button"
          onClick={() => setIsMobileMoreOpen(!isMobileMoreOpen)}
          className="flex flex-col items-center py-1 px-2 text-[10px] text-muted hover:text-text cursor-pointer"
        >
          {isMobileMoreOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span className="mt-1">More</span>
        </button>
      </nav>

      {/* Mobile More Popout Sheet */}
      {isMobileMoreOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40 flex flex-col justify-end p-4">
          <div className="bg-card border border-border rounded-xl shadow-subtle p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="font-semibold text-sm text-text">All Navigation</span>
              <button
                type="button"
                onClick={() => setIsMobileMoreOpen(false)}
                className="p-1 rounded-lg text-muted hover:text-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {LEDGER_NAV_ITEMS.slice(4).map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.id}
                    to={item.href}
                    onClick={() => setIsMobileMoreOpen(false)}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-card text-muted hover:text-text hover:bg-bg font-medium transition-colors"
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Global Command Palette & Modals */}
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
      <TigerAiWidget />
    </div>
  );
};
