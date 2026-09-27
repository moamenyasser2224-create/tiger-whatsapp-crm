import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { KeyRound, Lock, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }

    if (!token) {
      setError('رمز الاستعادة غير صالح أو مفقود من الرابط');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        token,
        password,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'فشلت عملية تغيير كلمة المرور');
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
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white">
            تعيين كلمة مرور جديدة
          </h1>
          <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            أدخل كلمة المرور الجديدة لحسابك (8 أحرف على الأقل، حروف وأرقام)
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-neutral-900 bg-neutral-100 p-3.5 text-xs font-bold text-neutral-900 dark:border-white dark:bg-neutral-800 dark:text-white">
            {error}
          </div>
        )}

        {success ? (
          <div className="rounded-2xl border border-neutral-900 bg-neutral-100 p-5 text-center dark:border-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold">
            <CheckCircle2 className="mx-auto h-10 w-10 text-neutral-900 dark:text-white mb-2" />
            <h3 className="text-base font-black">تم تعيين كلمة المرور بنجاح!</h3>
            <p className="mt-1 text-xs opacity-80 font-normal">
              سيتم نقلك تلقائياً إلى صفحة تسجيل الدخول...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                كلمة المرور الجديدة
              </label>
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

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                تأكيد كلمة المرور الجديدة
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-3 h-4 w-4 text-neutral-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full rounded-xl border border-neutral-300 pr-9 pl-3 py-2.5 text-sm text-left focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-white dark:focus:ring-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 border border-neutral-900 dark:border-white py-3 text-sm font-bold disabled:opacity-50 transition-colors mt-2"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span>حفظ وتغيير كلمة المرور</span>}
            </button>

            <div className="mt-4 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white"
              >
                <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                <span>العودة لتسجيل الدخول</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
