import React from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import { useTheme } from '../contexts/ThemeContext.js';
import { useSocket } from '../contexts/SocketContext.js';
import { Moon, Sun, LogOut, User as UserIcon, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isConnected } = useSocket();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-neutral-200 bg-white/95 px-4 md:px-6 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/95 transition-colors">
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2.5 font-bold text-xl hover:opacity-80 transition-opacity">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-neutral-900 bg-white text-neutral-900 dark:border-white dark:bg-neutral-900 dark:text-white shadow-xs">
            {/* Outline monochrome tiger/chat icon */}
            <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <span className="text-neutral-900 dark:text-white flex items-center gap-1.5 tracking-tight font-black">
            <span>تايجر</span>
            <span className="border border-neutral-900 dark:border-white px-1.5 py-0.5 text-xs rounded-md">CRM</span>
          </span>
        </Link>

        {/* Live WebSocket Indicator - Strict Monochrome */}
        <div
          title={isConnected ? 'متصل لحظياً' : 'جاري إعادة الاتصال...'}
          className="hidden sm:flex items-center gap-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 px-3 py-1 text-[11px] font-bold text-neutral-800 dark:text-neutral-200"
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isConnected
                ? 'bg-neutral-900 dark:bg-white animate-pulse'
                : 'border border-neutral-500 bg-transparent'
            }`}
          />
          <span>{isConnected ? 'بث لحظي (متصل)' : 'إعادة اتصال...'}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="تبديل المظهر"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-300 text-neutral-800 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900 transition-colors"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* User Info & Settings */}
        {user && (
          <div className="flex items-center gap-2">
            <Link
              to="/settings"
              className="flex items-center gap-2 rounded-xl border border-neutral-300 px-3 py-2 text-sm font-bold text-neutral-900 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-900 transition-colors"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-md border border-neutral-400 text-neutral-800 dark:border-neutral-600 dark:text-neutral-200">
                <UserIcon className="h-3.5 w-3.5" />
              </div>
              <span className="max-w-[120px] truncate">{user.name}</span>
              <span className="rounded border border-neutral-400 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-900 px-1.5 py-0.5 text-[10px] font-black uppercase">
                {user.role === 'admin' ? 'مدير' : 'موظف'}
              </span>
            </Link>

            <button
              onClick={() => logout()}
              title="تسجيل الخروج"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-300 text-neutral-800 hover:bg-neutral-900 hover:text-white dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-white dark:hover:text-neutral-900 transition-all"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
