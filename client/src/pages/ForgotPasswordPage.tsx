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
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12 dark:bg-neutral-950 transition-colors">
      <div className="w-full max-w-md rounded-3xl border border-neutral-300 bg-white p-8 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white dark:bg-white dark:text-black border border-neutral-900 dark:border-white shadow-sm mb-4">
            <HelpCircle className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white">
            استعادة كلمة المرور
          </h1>
          <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            أدخل بريدك الإلكتروني لإرسال رابط إعادة تعيين كلمة المرور
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-neutral-900 bg-neutral-100 p-3.5 text-xs font-bold text-neutral-900 dark:border-white dark:bg-neutral-800 dark:text-white">
            {error}
          </div>
        )}

        {submitted ? (
          <div className="space-y-4 text-center">
            <div className="rounded-2xl border border-neutral-900 bg-neutral-100 p-4 dark:border-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold">
              <CheckCircle2 className="mx-auto h-8 w-8 mb-2 text-neutral-900 dark:text-white" />
              <p className="text-sm font-black">تم إرسال تعليمات الاستعادة بنجاح</p>
              <p className="mt-1 text-xs opacity-80 font-normal">
                الرابط صالح للاستخدام مرة واحدة ولمدة 15 دقيقة فقط.
              </p>
            </div>

            {resetLink && (
              <div className="rounded-xl border border-neutral-300 bg-neutral-100 p-3 text-right text-xs dark:border-neutral-700 dark:bg-neutral-800">
                <p className="font-bold mb-1 text-neutral-800 dark:text-neutral-200">رابط الاستعادة التجريبي المباشر:</p>
                <a
                  href={resetLink}
                  className="font-mono text-[11px] text-neutral-900 dark:text-white underline break-all font-bold"
                >
                  {resetLink}
                </a>
              </div>
            )}

            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-bold text-neutral-900 dark:text-white underline hover:opacity-75 mt-4"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              <span>العودة لصفحة تسجيل الدخول</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 border border-neutral-900 dark:border-white py-3 text-sm font-bold disabled:opacity-50 transition-colors mt-2"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span>إرسال رابط الاستعادة</span>}
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
