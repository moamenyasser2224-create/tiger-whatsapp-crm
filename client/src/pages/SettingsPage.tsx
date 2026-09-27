import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext.js';
import { api } from '../lib/api.js';
import type { ListOption, Settings } from '../types/index.js';
import {
  ShieldCheck,
  QrCode,
  Download,
  Trash2,
  Lock,
  User,
  CheckCircle2,
  AlertTriangle,
  Building,
  ListPlus,
  Plus,
  Layers,
  Save,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const queryClient = useQueryClient();

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

  // Organization Settings (Admin)
  const [orgNameInput, setOrgNameInput] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);

  const { data: settingsData } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data.data;
    },
  });

  useEffect(() => {
    if (settingsData?.orgName) {
      setOrgNameInput(settingsData.orgName);
    }
  }, [settingsData?.orgName]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (orgName: string) => {
      const res = await api.put('/settings', { orgName });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSettingsSuccess('تم تحديث اسم المنظومة بنجاح!');
      setTimeout(() => setSettingsSuccess(null), 3000);
    },
  });

  // Dynamic Options (Admin)
  const [optionTypeTab, setOptionTypeTab] = useState<'source' | 'status'>('status');
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [newOptionIsDefault, setNewOptionIsDefault] = useState(false);
  const [optionError, setOptionError] = useState<string | null>(null);

  const { data: currentOptions = [] } = useQuery<ListOption[]>({
    queryKey: ['options', optionTypeTab],
    queryFn: async () => {
      const res = await api.get(`/options?type=${optionTypeTab}`);
      return res.data.data;
    },
  });

  const addOptionMutation = useMutation({
    mutationFn: async (payload: { type: string; label: string; isDefault: boolean; order?: number }) => {
      setOptionError(null);
      const res = await api.post('/options', payload);
      return res.data.data;
    },
    onSuccess: () => {
      setNewOptionLabel('');
      setNewOptionIsDefault(false);
      queryClient.invalidateQueries({ queryKey: ['options'] });
    },
    onError: (err: any) => {
      setOptionError(err.response?.data?.error || 'فشل في إضافة الخيار');
    },
  });

  const deleteOptionMutation = useMutation({
    mutationFn: async (id: string) => {
      setOptionError(null);
      await api.delete(`/options/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['options'] });
    },
    onError: (err: any) => {
      setOptionError(err.response?.data?.error || 'فشل في حذف الخيار');
    },
  });

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

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-neutral-900 dark:text-white">إعدادات النظام والحساب</h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          إدارة هوية المنظومة، القوائم الديناميكية، الأمان (2FA)، وتصدير البيانات
        </p>
      </div>

      {setupSuccess && (
        <div className="rounded-2xl border border-neutral-900 bg-neutral-100 p-4 text-xs font-bold text-neutral-900 dark:border-white dark:bg-neutral-800 dark:text-white flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{setupSuccess}</span>
        </div>
      )}

      {/* Admin Section: Organization Identity */}
      {isAdmin && (
        <div className="rounded-2xl border border-neutral-300 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Building className="h-5 w-5 text-neutral-900 dark:text-white" />
              <span>هوية المنظومة (Organization Name)</span>
            </h2>
            <span className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-[11px] font-bold text-neutral-800 dark:text-neutral-200">
              إدارة فقط
            </span>
          </div>

          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            يظهر هذا الاسم في أعلى الشريط الجانبي والترويسة لجميع مستخدمي المنظومة.
          </p>

          {settingsSuccess && (
            <div className="rounded-xl border border-neutral-900 bg-neutral-100 p-3 text-xs font-bold text-neutral-900 dark:border-white dark:bg-neutral-800 dark:text-white">
              {settingsSuccess}
            </div>
          )}

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={orgNameInput}
              onChange={(e) => setOrgNameInput(e.target.value)}
              placeholder="اسم المنظومة (مثال: تايجر CRM)"
              className="flex-1 rounded-xl border border-neutral-300 px-3.5 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-white dark:focus:ring-white"
            />
            <button
              onClick={() => updateSettingsMutation.mutate(orgNameInput)}
              disabled={updateSettingsMutation.isPending || !orgNameInput.trim()}
              className="flex items-center gap-2 rounded-xl bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 border border-neutral-900 dark:border-white px-5 py-2 text-xs font-bold transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{updateSettingsMutation.isPending ? 'جاري الحفظ...' : 'حفظ الاسم'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Admin Section: Dynamic List Options Manager */}
      {isAdmin && (
        <div className="rounded-2xl border border-neutral-300 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-neutral-900 dark:text-white" />
              <span>إدارة الحالات ومصادر العملاء (Dynamic List Options)</span>
            </h2>
            <span className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-[11px] font-bold text-neutral-800 dark:text-neutral-200">
              قاعدة بيانات
            </span>
          </div>

          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            أضف وعدّل الحالات أو مصادر العملاء بحرية. يتم حفظ التغييرات وتطبيقها فوراً في كل جداول ونماذج العملاء.
          </p>

          {/* Option Type Switcher */}
          <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
            <button
              onClick={() => setOptionTypeTab('status')}
              className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all ${
                optionTypeTab === 'status'
                  ? 'bg-black text-white dark:bg-white dark:text-black border border-neutral-900 dark:border-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700'
              }`}
            >
              حالات العملاء (Statuses)
            </button>
            <button
              onClick={() => setOptionTypeTab('source')}
              className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all ${
                optionTypeTab === 'source'
                  ? 'bg-black text-white dark:bg-white dark:text-black border border-neutral-900 dark:border-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700'
              }`}
            >
              مصادر العملاء (Sources)
            </button>
          </div>

          {optionError && (
            <div className="rounded-xl border border-neutral-900 bg-neutral-100 p-3 text-xs font-bold text-neutral-900 dark:border-white dark:bg-neutral-800 dark:text-white">
              {optionError}
            </div>
          )}

          {/* Options List */}
          <div className="space-y-2">
            {currentOptions.map((opt) => (
              <div
                key={opt.id}
                className="flex items-center justify-between rounded-xl border border-neutral-200 dark:border-neutral-800 p-3 bg-neutral-50/50 dark:bg-neutral-800/30"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-neutral-900 dark:text-white">{opt.label}</span>
                  {opt.isDefault && (
                    <span className="rounded border border-neutral-400 bg-neutral-200 px-1.5 py-0.5 text-[10px] font-bold text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200">
                      افتراضي
                    </span>
                  )}
                </div>

                <button
                  onClick={() => deleteOptionMutation.mutate(opt.id)}
                  disabled={deleteOptionMutation.isPending}
                  className="rounded-lg border border-neutral-300 p-1.5 text-neutral-600 hover:bg-neutral-200 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors"
                  title="حذف هذا الخيار"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Option Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newOptionLabel.trim()) return;
              addOptionMutation.mutate({
                type: optionTypeTab,
                label: newOptionLabel.trim(),
                isDefault: newOptionIsDefault,
                order: currentOptions.length + 1,
              });
            }}
            className="flex flex-col sm:flex-row items-center gap-3 pt-2"
          >
            <input
              type="text"
              required
              value={newOptionLabel}
              onChange={(e) => setNewOptionLabel(e.target.value)}
              placeholder={`أدخل اسم ${optionTypeTab === 'status' ? 'الحالة' : 'المصدر'} الجديد...`}
              className="flex-1 w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-xs focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-white dark:focus:ring-white"
            />

            <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={newOptionIsDefault}
                onChange={(e) => setNewOptionIsDefault(e.target.checked)}
                className="rounded border-neutral-300 text-black focus:ring-black dark:border-neutral-700"
              />
              <span>تعيين كافتراضي</span>
            </label>

            <button
              type="submit"
              disabled={addOptionMutation.isPending || !newOptionLabel.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 border border-neutral-900 dark:border-white px-4 py-2 text-xs font-bold transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span>إضافة الخيار</span>
            </button>
          </form>
        </div>
      )}

      {/* Profile Overview */}
      <div className="rounded-2xl border border-neutral-300 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
        <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <User className="h-5 w-5 text-neutral-900 dark:text-white" />
          <span>بيانات المستخدم</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-neutral-200 p-3.5 dark:border-neutral-800">
            <span className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1">الاسم:</span>
            <p className="font-bold text-sm text-neutral-900 dark:text-white">{user?.name}</p>
          </div>

          <div className="rounded-xl border border-neutral-200 p-3.5 dark:border-neutral-800">
            <span className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1">البريد الإلكتروني:</span>
            <p className="font-mono text-sm text-neutral-900 dark:text-white" dir="ltr">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication (2FA) */}
      <div className="rounded-2xl border border-neutral-300 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-neutral-900 dark:text-white" />
              <span>التحقق بخطوتين (TOTP 2FA)</span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xl">
              إضافة طبقة أمان قوية لحسابك عبر توليد رمز دخول متغير من تطبيقات المصادقة (Google Authenticator، 1Password، Authy).
            </p>
          </div>

          <div>
            {user?.isTwoFactorEnabled ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-neutral-900 bg-black px-3 py-1 text-xs font-black text-white dark:border-white dark:bg-white dark:text-black">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>مفعّل</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-neutral-400 bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                <span>معطّل</span>
              </span>
            )}
          </div>
        </div>

        {setupError && (
          <div className="rounded-xl border border-neutral-900 bg-neutral-100 p-3 text-xs font-bold text-neutral-900 dark:border-white dark:bg-neutral-800 dark:text-white">
            {setupError}
          </div>
        )}

        {!user?.isTwoFactorEnabled ? (
          <div>
            {!is2FASetupOpen ? (
              <button
                onClick={handleStart2FASetup}
                className="flex items-center gap-2 rounded-xl bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 border border-neutral-900 dark:border-white px-5 py-2.5 text-xs font-bold transition-colors"
              >
                <QrCode className="h-4 w-4" />
                <span>بدء إعداد التحقق الثنائي</span>
              </button>
            ) : (
              <div className="rounded-2xl border border-neutral-300 bg-neutral-50/50 p-5 dark:border-neutral-700 dark:bg-neutral-800/40 space-y-4">
                <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  1. امسح رمز الـ QR التالي عبر تطبيق المصادقة الخاص بك:
                </p>

                {twoFactorData && (
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="rounded-2xl bg-white p-3 shadow-md border border-neutral-200">
                      <img
                        src={twoFactorData.qrCodeDataUrl}
                        alt="2FA QR Code"
                        className="h-44 w-44"
                      />
                    </div>
                    <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
                      <p>أو أدخل المفتاح السري يدويًا في تطبيقك:</p>
                      <code className="block rounded-lg bg-neutral-200 p-2 font-mono text-xs font-bold dark:bg-neutral-900 select-all">
                        {twoFactorData.secret}
                      </code>
                    </div>
                  </div>
                )}

                <form onSubmit={handleEnable2FA} className="space-y-3 pt-2">
                  <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
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
                      className="w-40 rounded-xl border border-neutral-300 px-3 py-2 text-center font-mono text-sm tracking-widest focus:border-black dark:border-neutral-700 dark:bg-neutral-800"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 border border-neutral-900 dark:border-white px-5 py-2 text-xs font-bold"
                    >
                      تأكيد وتفعيل 2FA
                    </button>
                    <button
                      type="button"
                      onClick={() => setIs2FASetupOpen(false)}
                      className="rounded-xl border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 dark:border-neutral-700 dark:text-neutral-300"
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
                className="rounded-xl border border-neutral-400 px-4 py-2 text-xs font-bold text-neutral-800 hover:bg-neutral-200 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
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
                  className="w-64 rounded-xl border border-neutral-300 px-3 py-2 text-xs focus:border-black dark:border-neutral-700 dark:bg-neutral-800"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 border border-neutral-900 dark:border-white px-4 py-2 text-xs font-bold"
                >
                  تأكيد الإلغاء
                </button>
                <button
                  type="button"
                  onClick={() => setDisabling2FA(false)}
                  className="rounded-xl border border-neutral-300 px-3 py-2 text-xs font-semibold"
                >
                  تراجع
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Data Privacy & Export */}
      <div className="rounded-2xl border border-neutral-300 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-3">
        <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <Download className="h-5 w-5 text-neutral-900 dark:text-white" />
          <span>تصدير بياناتي كاملة (GDPR & Data Privacy)</span>
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          يمكنك تحميل نسخة كاملة من جميع بياناتك المسجلة (الملف الشخصي، قائمة العملاء ببياناتهم المفكوكة التشفير، قوالب الرسائل، وسجل العمليات) بصيغة JSON.
        </p>
        <button
          onClick={handleExportAllData}
          className="flex items-center gap-2 rounded-xl border border-neutral-400 bg-neutral-100 px-4 py-2 text-xs font-bold text-neutral-800 hover:bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>تصدير الملف الشامل (.json)</span>
        </button>
      </div>

      {/* Danger Zone: Permanent Account Deletion */}
      <div className="rounded-2xl border-2 border-neutral-900 dark:border-neutral-400 bg-neutral-50/60 p-6 dark:bg-neutral-900/40 space-y-4">
        <div className="flex items-center gap-2 text-neutral-900 dark:text-white">
          <AlertTriangle className="h-5 w-5" />
          <h2 className="text-base font-black">منطقة الخطر: حذف الحساب نهائياً</h2>
        </div>
        <p className="text-xs text-neutral-700 dark:text-neutral-300">
          سيؤدي هذا الإجراء إلى مسح حسابك وكافة بيانات العملاء وقوالب الرسائل وسجلات الدخول نهائياً من قاعدة البيانات ولا يمكن استرجاعها بأي شكل.
        </p>

        <button
          onClick={() => {
            setDeletePassword('');
            setDeleteError(null);
            setIsDeleteModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 border-2 border-neutral-900 dark:border-white px-5 py-2.5 text-xs font-extrabold transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          <span>حذف حسابي وبياناتي نهائياً</span>
        </button>
      </div>

      {/* Delete Confirmation Dialog */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900 border-2 border-neutral-900 dark:border-neutral-400">
            <h3 className="text-base font-black text-neutral-900 dark:text-white mb-2">
              تأكيد حذف الحساب نهائياً
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 mb-4">
              أدخل كلمة المرور الخاصة بحسابك للتأكيد النهائي. لن تتمكن من التراجع عن هذه الخطوة:
            </p>

            {deleteError && (
              <div className="mb-3 rounded-lg border border-neutral-900 bg-neutral-100 p-2.5 text-xs font-bold text-neutral-900 dark:border-white dark:bg-neutral-800 dark:text-white">
                {deleteError}
              </div>
            )}

            <div className="relative mb-4">
              <Lock className="absolute right-3 top-2.5 h-4 w-4 text-neutral-400" />
              <input
                type="password"
                required
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="كلمة المرور الحالية"
                dir="ltr"
                className="w-full rounded-xl border border-neutral-300 pr-9 pl-3 py-2 text-xs focus:border-black focus:ring-1 focus:ring-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-xl border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 dark:border-neutral-700 dark:text-neutral-300"
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || !deletePassword}
                className="rounded-xl bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 border-2 border-neutral-900 dark:border-white px-5 py-2 text-xs font-bold disabled:opacity-50 transition-colors"
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
