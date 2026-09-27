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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-950 transition-colors">
      <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-whatsapp text-white shadow-lg shadow-whatsapp/30 mb-4">
            <KeyRound className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            {requires2FA ? 'التحقق بخطوتين (2FA)' : 'تسجيل الدخول'}
          </h1>
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            {requires2FA
              ? 'أدخل رمز التحقق المكون من 6 أرقام من تطبيق Authenticator'
              : 'أدخل بريدك الإلكتروني وكلمة المرور للوصول إلى لوحة العملاء'}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!requires2FA ? (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    dir="ltr"
                    className="w-full rounded-xl border border-gray-300 pr-9 pl-3 py-2.5 text-sm text-left focus:border-whatsapp focus:outline-none focus:ring-1 focus:ring-whatsapp dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    كلمة المرور
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-whatsapp hover:underline"
                  >
                    نسيت كلمة المرور؟
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full rounded-xl border border-gray-300 pr-9 pl-3 py-2.5 text-sm text-left focus:border-whatsapp focus:outline-none focus:ring-1 focus:ring-whatsapp dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                رمز التحقق الثنائي (TOTP)
              </label>
              <div className="relative">
                <ShieldCheck className="absolute right-3 top-3 h-4 w-4 text-whatsapp" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  autoFocus
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  dir="ltr"
                  className="w-full rounded-xl border border-gray-300 pr-9 pl-3 py-2.5 text-center font-mono text-lg tracking-widest focus:border-whatsapp focus:outline-none focus:ring-1 focus:ring-whatsapp dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-whatsapp py-3 text-sm font-bold text-white hover:bg-whatsapp-dark shadow-md shadow-whatsapp/20 disabled:opacity-50 transition-colors mt-2"
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
            className="mt-4 flex w-full items-center justify-center gap-1.5 text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-whatsapp"
          >
            <ArrowRight className="h-3.5 w-3.5 rotate-180" />
            <span>العودة لإدخال كلمة المرور</span>
          </button>
        ) : (
          <div className="mt-8 text-center text-xs text-gray-600 dark:text-gray-400">
            ليس لديك حساب بعد؟{' '}
            <Link to="/register" className="font-bold text-whatsapp hover:underline">
              إنشاء حساب جديد
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
