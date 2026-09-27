import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import { api } from '../lib/api.js';
import {
  ShieldCheck,
  ShieldAlert,
  QrCode,
  KeyRound,
  Download,
  Trash2,
  Lock,
  User,
  Mail,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal.js';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();

  // 2FA Setup State
  const [is2FASetupOpen, setIs2FASetupOpen] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState<{ secret: string; qrCodeDataUrl: string } | null>(null);
  const [totpVerifyCode, setTotpVerifyCode] = useState('');
  const [setupError, setSetupError] = useState<string | null>(null);
  const [setupSuccess, setSetupSuccess] = useState<string | null>(null);
  const [disabling2FA, setDisabling2FA] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');

  // Delete Account State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Start 2FA Setup
  const handleStart2FASetup = async () => {
    setSetupError(null);
    try {
      const { data } = await api.post('/auth/2fa/setup');
      setTwoFactorData(data.data);
      setIs2FASetupOpen(true);
    } catch (err: any) {
      setSetupError(err.response?.data?.error || 'فشل توليد مفتاح 2FA');
    }
  };

  // Confirm and Enable 2FA
  const handleEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorData) return;
    setSetupError(null);

    try {
      await api.post('/auth/2fa/enable', {
        code: totpVerifyCode,
        secret: twoFactorData.secret,
      });
      setSetupSuccess('تم تفعيل التحقق الثنائي (2FA) بنجاح على حسابك');
      setIs2FASetupOpen(false);
      setTwoFactorData(null);
      await refreshUser();
    } catch (err: any) {
      setSetupError(err.response?.data?.error || 'رمز التحقق غير صحيح');
    }
  };

  // Disable 2FA
  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError(null);
    try {
      await api.post('/auth/2fa/disable', { password: disablePassword });
      setSetupSuccess('تم إلغاء تفعيل التحقق الثنائي');
      setDisabling2FA(false);
      setDisablePassword('');
      await refreshUser();
    } catch (err: any) {
      setSetupError(err.response?.data?.error || 'كلمة المرور غير صحيحة');
    }
  };

  // Export all user data JSON
  const handleExportAllData = async () => {
    try {
      const response = await api.get('/users/export-data', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `my_whatsapp_crm_data_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Data export error:', err);
    }
  };

  // Permanently delete account
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError('يرجى إدخال كلمة المرور لتأكيد الحذف');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await api.delete('/users/delete-account', {
        data: { password: deletePassword },
      });
      await logout();
    } catch (err: any) {
      setDeleteError(err.response?.data?.error || 'فشلت عملية حذف الحساب');
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">إعدادات الحساب والأمان</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          إدارة الملف الشخصي، التحقق الثنائي (2FA)، وتصدير أو حذف البيانات
        </p>
      </div>

      {setupSuccess && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{setupSuccess}</span>
        </div>
      )}

      {/* Profile Overview */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-4">
        <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <User className="h-5 w-5 text-whatsapp" />
          <span>بيانات المستخدم</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-200 p-3.5 dark:border-gray-800">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">الاسم:</span>
            <p className="font-bold text-sm text-gray-900 dark:text-white">{user?.name}</p>
          </div>

          <div className="rounded-xl border border-gray-200 p-3.5 dark:border-gray-800">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">البريد الإلكتروني:</span>
            <p className="font-mono text-sm text-gray-900 dark:text-white" dir="ltr">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication (2FA) */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-whatsapp" />
              <span>التحقق بخطوتين (TOTP 2FA)</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xl">
              إضافة طبقة أمان قوية لحسابك عبر توليد رمز دخول متغير من تطبيقات المصادقة (Google Authenticator، 1Password، Authy).
            </p>
          </div>

          <div>
            {user?.isTwoFactorEnabled ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>مفعّل</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                <span>معطّل</span>
              </span>
            )}
          </div>
        </div>

        {setupError && (
          <div className="rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            {setupError}
          </div>
        )}

        {!user?.isTwoFactorEnabled ? (
          <div>
            {!is2FASetupOpen ? (
              <button
                onClick={handleStart2FASetup}
                className="flex items-center gap-2 rounded-xl bg-whatsapp px-5 py-2.5 text-xs font-bold text-white hover:bg-whatsapp-dark shadow-md shadow-whatsapp/20 transition-colors"
              >
                <QrCode className="h-4 w-4" />
                <span>بدء إعداد التحقق الثنائي</span>
              </button>
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-5 dark:border-gray-700 dark:bg-gray-800/40 space-y-4">
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  1. امسح رمز الـ QR التالي عبر تطبيق المصادقة الخاص بك:
                </p>

                {twoFactorData && (
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="rounded-2xl bg-white p-3 shadow-md">
                      <img
                        src={twoFactorData.qrCodeDataUrl}
                        alt="2FA QR Code"
                        className="h-44 w-44"
                      />
                    </div>
                    <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                      <p>أو أدخل المفتاح السري يدويًا في تطبيقك:</p>
                      <code className="block rounded-lg bg-gray-200 p-2 font-mono text-xs font-bold dark:bg-gray-900 select-all">
                        {twoFactorData.secret}
                      </code>
                    </div>
                  </div>
                )}

                <form onSubmit={handleEnable2FA} className="space-y-3 pt-2">
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    2. أدخل الرمز المكون من 6 أرقام لتأكيد التفعيل:
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={totpVerifyCode}
                      onChange={(e) => setTotpVerifyCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      dir="ltr"
                      className="w-40 rounded-xl border border-gray-300 px-3 py-2 text-center font-mono text-sm tracking-widest focus:border-whatsapp dark:border-gray-700 dark:bg-gray-800"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-whatsapp px-5 py-2 text-xs font-bold text-white hover:bg-whatsapp-dark shadow-sm shadow-whatsapp/20"
                    >
                      تأكيد وتفعيل 2FA
                    </button>
                    <button
                      type="button"
                      onClick={() => setIs2FASetupOpen(false)}
                      className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        ) : (
          <div>
            {!disabling2FA ? (
              <button
                onClick={() => setDisabling2FA(true)}
                className="rounded-xl border border-rose-200 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950"
              >
                إلغاء تفعيل التحقق الثنائي
              </button>
            ) : (
              <form onSubmit={handleDisable2FA} className="flex items-center gap-3">
                <input
                  type="password"
                  required
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="أدخل كلمة المرور لتأكيد الإلغاء"
                  className="w-64 rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-whatsapp dark:border-gray-700 dark:bg-gray-800"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700"
                >
                  تأكيد الإلغاء
                </button>
                <button
                  type="button"
                  onClick={() => setDisabling2FA(false)}
                  className="rounded-xl border border-gray-300 px-3 py-2 text-xs font-semibold"
                >
                  تراجع
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Data Privacy & Export */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-3">
        <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Download className="h-5 w-5 text-blue-600" />
          <span>تصدير بياناتي كاملة (GDPR & Data Privacy)</span>
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          يمكنك تحميل نسخة كاملة من جميع بياناتك المسجلة (الملف الشخصي، قائمة العملاء ببياناتهم المفكوكة التشفير، قوالب الرسائل، وسجل العمليات) بصيغة JSON.
        </p>
        <button
          onClick={handleExportAllData}
          className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>تصدير الملف الشامل (.json)</span>
        </button>
      </div>

      {/* Danger Zone: Permanent Account Deletion */}
      <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-6 dark:border-rose-900/40 dark:bg-rose-950/20 space-y-4">
        <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
          <AlertTriangle className="h-5 w-5" />
          <h2 className="text-base font-bold">منطقة الخطر: حذف الحساب نهائياً</h2>
        </div>
        <p className="text-xs text-rose-900/80 dark:text-rose-300/80">
          سيؤدي هذا الإجراء إلى مسح حسابك وكافة بيانات العملاء وقوالب الرسائل وسجلات الدخول نهائياً من قاعدة البيانات ولا يمكن استرجاعها بأي شكل.
        </p>

        <button
          onClick={() => {
            setDeletePassword('');
            setDeleteError(null);
            setIsDeleteModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-700 shadow-md shadow-rose-600/20 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          <span>حذف حسابي وبياناتي نهائياً</span>
        </button>
      </div>

      {/* Delete Confirmation Dialog */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-rose-200 dark:border-rose-900">
            <h3 className="text-base font-bold text-rose-600 mb-2">
              تأكيد حذف الحساب نهائياً
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 mb-4">
              أدخل كلمة المرور الخاصة بحسابك للتأكيد النهائي. لن تتمكن من التراجع عن هذه الخطوة:
            </p>

            {deleteError && (
              <div className="mb-3 rounded-lg bg-rose-50 p-2.5 text-xs font-bold text-rose-700">
                {deleteError}
              </div>
            )}

            <div className="relative mb-4">
              <Lock className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="password"
                required
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="كلمة المرور الحالية"
                dir="ltr"
                className="w-full rounded-xl border border-gray-300 pr-9 pl-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-800"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300"
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || !deletePassword}
                className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {isDeleting ? 'جاري الحذف...' : 'تأكيد الحذف النهائي'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
