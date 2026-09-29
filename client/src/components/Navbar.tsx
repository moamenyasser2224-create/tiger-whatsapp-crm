import React from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import { useTheme } from '../contexts/ThemeContext.js';
import { useSocket } from '../contexts/SocketContext.js';
import { Moon, Sun, LogOut, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isConnected } = useSocket();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-card/95 px-4 md:px-6 backdrop-blur-md transition-colors text-text">
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2.5 font-semibold text-lg hover:opacity-85 transition-opacity">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent/20 bg-accent-soft text-accent">
            <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <span className="text-text flex items-center gap-1.5 tracking-tight font-bold">
            <span>Tiger</span>
            <span className="border border-border px-1.5 py-0.5 text-[10px] rounded text-muted font-normal">CRM</span>
          </span>
        </Link>

        {/* Live WebSocket Indicator - Quiet Pill */}
        <div
          title={isConnected ? 'Connected in real-time' : 'Attempting to reconnect...'}
          className="hidden sm:flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs text-muted"
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isConnected
                ? 'bg-accent'
                : 'bg-muted'
            }`}
          />
          <span>{isConnected ? 'Real-Time Sync' : 'Reconnecting...'}</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle visual theme"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted hover:text-text hover:bg-bg transition-colors"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* User Info & Settings */}
        {user && (
          <div className="flex items-center gap-2">
            <Link
              to="/settings"
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-bg transition-colors"
            >
              {user.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt={user.name}
                  className="h-5 w-5 rounded object-cover border border-border"
                />
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded border border-border text-muted bg-bg">
                  <UserIcon className="h-3 w-3" />
                </div>
              )}
              <span className="max-w-[120px] truncate">{user.name}</span>
              <span className="rounded border border-border bg-bg px-1.5 py-0.2 text-[10px] text-muted uppercase">
                {user.role === 'admin' ? 'Admin' : 'Staff'}
              </span>
            </Link>

            <button
              onClick={() => logout()}
              title="Sign Out"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted hover:text-danger hover:border-danger/30 hover:bg-danger-soft transition-all"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
