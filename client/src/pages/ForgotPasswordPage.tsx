import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { HelpCircle, Mail, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
      if (data.resetLink) {
        setResetLink(data.resetLink);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'فشل إرسال الرابط');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-950 transition-colors">
      <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/30 mb-4">
            <HelpCircle className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            استعادة كلمة المرور
          </h1>
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            أدخل بريدك الإلكتروني لإرسال رابط إعادة تعيين كلمة المرور
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </div>
        )}

        {submitted ? (
          <div className="space-y-4 text-center">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="mx-auto h-8 w-8 mb-2 text-emerald-600" />
              <p className="text-sm font-bold">تم إرسال تعليمات الاستعادة بنجاح</p>
              <p className="mt-1 text-xs opacity-90">
                الرابط صالح للاستخدام مرة واحدة ولمدة 15 دقيقة فقط.
              </p>
            </div>

            {resetLink && (
              <div className="rounded-xl bg-gray-100 p-3 text-right text-xs dark:bg-gray-800">
                <p className="font-bold mb-1 text-gray-700 dark:text-gray-300">رابط الاستعادة التجريبي المباشر:</p>
                <a
                  href={resetLink}
                  className="font-mono text-[11px] text-whatsapp hover:underline break-all"
                >
                  {resetLink}
                </a>
              </div>
            )}

            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-bold text-whatsapp hover:underline mt-4"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              <span>العودة لصفحة تسجيل الدخول</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-whatsapp py-3 text-sm font-bold text-white hover:bg-whatsapp-dark shadow-md shadow-whatsapp/20 disabled:opacity-50 transition-colors mt-2"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span>إرسال رابط الاستعادة</span>}
            </button>

            <div className="mt-4 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
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
