import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import { UserPlus, User, Mail, Lock, Loader2 } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await registerUser({ name, email, password });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'فشل إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-950 transition-colors">
      <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-whatsapp text-white shadow-lg shadow-whatsapp/30 mb-4">
            <UserPlus className="h-7 w-7" />
          </div>
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <span className="text-2xl font-black text-amber-500">تايجر</span>
            <span className="text-xl font-extrabold text-whatsapp">CRM</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            إنشاء حساب جديد
          </h1>
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            انضم لنظام تايجر لإدارة العملاء والمحادثات بأعلى درجات الأمان والسرعة
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              الاسم الكامل
            </label>
            <div className="relative">
              <User className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أحمد المحمد"
                className="w-full rounded-xl border border-gray-300 pr-9 pl-3 py-2.5 text-sm focus:border-whatsapp focus:outline-none focus:ring-1 focus:ring-whatsapp dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

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
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              كلمة المرور (8 أحرف، أرقام وحروف كبيرة وصغيرة)
            </label>
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

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-whatsapp py-3 text-sm font-bold text-white hover:bg-whatsapp-dark shadow-md shadow-whatsapp/20 disabled:opacity-50 transition-colors mt-2"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span>إنشاء الحساب</span>}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-gray-600 dark:text-gray-400">
          لديك حساب بالفعل؟{' '}
          <Link to="/login" className="font-bold text-whatsapp hover:underline">
            تسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
};
