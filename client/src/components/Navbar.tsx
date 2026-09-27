import React from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import { useTheme } from '../contexts/ThemeContext.js';
import { Moon, Sun, LogOut, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white/90 px-6 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/90 transition-colors">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-whatsapp hover:opacity-90">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-whatsapp text-white shadow-md shadow-whatsapp/20">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.696c1.004.57 1.93.87 2.806.87 3.18 0 5.767-2.587 5.767-5.766.001-3.187-2.575-5.753-5.767-5.753zm3.421 8.136c-.144.406-.833.774-1.172.824-.34.05-1.748.263-3.69-1.68-1.554-1.554-1.734-2.96-1.784-3.3-.05-.339.288-1.028.694-1.172.144-.05.312-.022.427.093l.805 1.096c.114.156.114.341.012.493l-.361.542c-.062.093-.062.203 0 .296.347.525.792.97 1.317 1.317.093.062.203.062.296 0l.542-.361c.152-.102.337-.102.493.012l1.096.805c.115.115.143.283.093.427z"/>
            </svg>
          </div>
          <span className="text-gray-900 dark:text-white flex items-center gap-1.5">
            <span className="text-amber-500 font-extrabold text-2xl">تايجر</span>
            <span className="text-whatsapp font-extrabold text-xl">CRM</span>
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="تبديل المظهر"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-slate-700" />}
        </button>

        {/* User Info & Settings */}
        {user && (
          <div className="flex items-center gap-3">
            <Link
              to="/settings"
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
            >
              <UserIcon className="h-4 w-4 text-whatsapp" />
              <span>{user.name}</span>
            </Link>

            <button
              onClick={() => logout()}
              title="تسجيل الخروج"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
