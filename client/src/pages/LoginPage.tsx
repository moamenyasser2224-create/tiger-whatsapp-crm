import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import { KeyRound, Mail, Lock, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login({
        email,
        password,
        ...(requires2FA ? { twoFactorCode } : {}),
      });

      if (res?.requires2FA) {
        setRequires2FA(true);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12 dark:bg-neutral-950 transition-colors">
      <div className="w-full max-w-md rounded-3xl border border-neutral-300 bg-white p-8 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white dark:bg-white dark:text-black border border-neutral-900 dark:border-white shadow-sm mb-4">
            <KeyRound className="h-7 w-7" />
          </div>
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <span className="text-2xl font-black text-neutral-900 dark:text-white">تايجر</span>
            <span className="text-xl font-extrabold text-neutral-500 dark:text-neutral-400">CRM</span>
          </div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white">
            {requires2FA ? 'التحقق بخطوتين (2FA)' : 'تسجيل الدخول'}
          </h1>
          <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            {requires2FA
              ? 'أدخل رمز التحقق المكون من 6 أرقام من تطبيق Authenticator'
              : 'نظام تايجر لإدارة ومتابعة عملاء واتساب باحترافية'}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-neutral-900 bg-neutral-100 p-3.5 text-xs font-bold text-neutral-900 dark:border-white dark:bg-neutral-800 dark:text-white">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!requires2FA ? (
            <>
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3 h-4 w-4 text-neutral-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    dir="ltr"
                    className="w-full rounded-xl border border-neutral-300 pr-9 pl-3 py-2.5 text-sm text-left focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-white dark:focus:ring-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    كلمة المرور
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-neutral-900 dark:text-white underline hover:opacity-75"
                  >
                    نسيت كلمة المرور؟
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 h-4 w-4 text-neutral-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full rounded-xl border border-neutral-300 pr-9 pl-3 py-2.5 text-sm text-left focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-white dark:focus:ring-white"
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                رمز التحقق الثنائي (TOTP)
              </label>
              <div className="relative">
                <ShieldCheck className="absolute right-3 top-3 h-4 w-4 text-neutral-900 dark:text-white" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  autoFocus
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  dir="ltr"
                  className="w-full rounded-xl border border-neutral-300 pr-9 pl-3 py-2.5 text-center font-mono text-lg tracking-widest focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-white dark:focus:ring-white"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 border border-neutral-900 dark:border-white py-3 text-sm font-bold disabled:opacity-50 transition-colors mt-2"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <span>{requires2FA ? 'تحقق ومتابعة' : 'دخول إلى الحساب'}</span>
            )}
          </button>
        </form>

        {requires2FA ? (
          <button
            onClick={() => setRequires2FA(false)}
            className="mt-4 flex w-full items-center justify-center gap-1.5 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
          >
            <ArrowRight className="h-3.5 w-3.5 rotate-180" />
            <span>العودة لإدخال كلمة المرور</span>
          </button>
        ) : (
          <div className="mt-8 text-center text-xs text-neutral-600 dark:text-neutral-400">
            ليس لديك حساب بعد؟{' '}
            <Link to="/register" className="font-bold text-neutral-900 dark:text-white underline hover:opacity-75">
              إنشاء حساب جديد
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
