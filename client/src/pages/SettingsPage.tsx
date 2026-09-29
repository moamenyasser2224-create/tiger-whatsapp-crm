import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext.js';
import { api } from '../lib/api.js';
import type { ListOption, Settings } from '../types/index.js';
import { ProfilePhotoModal } from '../components/ProfilePhotoModal.js';
import { FaceBiometricsModal } from '../components/FaceBiometricsModal.js';
import { OnboardingModal } from '../components/OnboardingModal.js';
import { OffboardModal } from '../components/OffboardModal.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
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
  Plus,
  Layers,
  Save,
  Users,
  UserPlus,
  Camera,
  ScanFace,
  Copy,
  Check,
  X,
  UserCheck,
  UserMinus,
  Mail,
  MessageSquareCode,
  Send,
  ExternalLink,
} from 'lucide-react';
import { MotionPage } from '../components/motion/MotionPage.js';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser, updateUser, logout } = useAuth();
  const queryClient = useQueryClient();

  // Photo & Biometrics Modals
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [faceDeleteSuccess, setFaceDeleteSuccess] = useState<string | null>(null);
  const [isDeletingFace, setIsDeletingFace] = useState(false);

  // Employee Management State (Admin)
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeEmail, setNewEmployeeEmail] = useState('');
  const [employeeError, setEmployeeError] = useState<string | null>(null);
  const [createdEmployeeCreds, setCreatedEmployeeCreds] = useState<{
    name: string;
    email: string;
    temporaryPassword: string;
  } | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);

  // Employee Lifecycle States (Onboarding & Offboarding)
  const [selectedEmployeeForOnboarding, setSelectedEmployeeForOnboarding] = useState<any | null>(null);
  const [selectedEmployeeForOffboarding, setSelectedEmployeeForOffboarding] = useState<any | null>(null);
  const [offboardToast, setOffboardToast] = useState<string | null>(null);

  // SMTP Testing State
  const [smtpTestEmail, setSmtpTestEmail] = useState('');
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpFeedback, setSmtpFeedback] = useState<{ success: boolean; message: string } | null>(null);

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
      setSettingsSuccess('Organization name updated successfully');
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
      setOptionError(err.response?.data?.error || 'Failed to add option');
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
      setOptionError(err.response?.data?.error || 'Failed to delete option');
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
      setSetupError(err.response?.data?.error || 'Failed to generate 2FA key');
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
      setSetupSuccess('Two-factor authentication (2FA) enabled successfully.');
      setIs2FASetupOpen(false);
      setTwoFactorData(null);
      await refreshUser();
    } catch (err: any) {
      setSetupError(err.response?.data?.error || 'Invalid verification code');
    }
  };

  // Disable 2FA
  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError(null);
    try {
      await api.post('/auth/2fa/disable', { password: disablePassword });
      setSetupSuccess('Two-factor authentication has been disabled.');
      setDisabling2FA(false);
      setDisablePassword('');
      await refreshUser();
    } catch (err: any) {
      setSetupError(err.response?.data?.error || 'Incorrect password');
    }
  };

  // Export all user data JSON
  const handleExportAllData = async () => {
    try {
      const response = await api.get('/users/export-data', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tiger_crm_data_${new Date().toISOString().split('T')[0]}.json`);
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
      setDeleteError('Please enter your password to confirm deletion');
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
      setDeleteError(err.response?.data?.error || 'Account deletion failed');
      setIsDeleting(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  // Employees Query (Admin Only)
  const { data: employeesData = [], refetch: refetchEmployees, isLoading: loadingEmployees } = useQuery<any[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await api.get('/users/employees');
      return res.data.data;
    },
    enabled: isAdmin,
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (payload: { name: string; email: string }) => {
      setEmployeeError(null);
      const res = await api.post('/users/employee', payload);
      return res.data;
    },
    onSuccess: (data) => {
      setCreatedEmployeeCreds({
        name: data.user.name,
        email: data.user.email,
        temporaryPassword: data.temporaryPassword,
      });
      setNewEmployeeName('');
      setNewEmployeeEmail('');
      setIsAddEmployeeOpen(false);
      refetchEmployees();
    },
    onError: (err: any) => {
      setEmployeeError(err.response?.data?.error || 'Failed to create employee account');
    },
  });

  const handleDeleteFaceData = async () => {
    if (!window.confirm('Are you sure you want to permanently delete your facial biometric data and revoke biometric consent?')) {
      return;
    }
    setIsDeletingFace(true);
    setFaceDeleteSuccess(null);
    try {
      await api.delete('/auth/face');
      updateUser({ hasFaceEnrolled: false });
      setFaceDeleteSuccess('Facial biometric vectors and consent records have been purged from the database.');
      setTimeout(() => setFaceDeleteSuccess(null), 4000);
      await refreshUser();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete facial biometric data');
    } finally {
      setIsDeletingFace(false);
    }
  };

  const handleCopyPassword = () => {
    if (createdEmployeeCreds?.temporaryPassword) {
      navigator.clipboard.writeText(createdEmployeeCreds.temporaryPassword);
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2500);
    }
  };

  // WhatsApp Integration Query (Admin)
  const { data: whatsappStatus } = useQuery({
    queryKey: ['whatsappStatus'],
    queryFn: async () => {
      const res = await api.get('/whatsapp/status');
      return res.data;
    },
    enabled: isAdmin,
  });

  // SMTP Test Dispatcher
  const handleTestSmtp = async () => {
    setIsTestingSmtp(true);
    setSmtpFeedback(null);
    try {
      const res = await api.post('/settings/test-email', { email: smtpTestEmail || user?.email });
      setSmtpFeedback({ success: res.data.success, message: res.data.message });
    } catch (err: any) {
      setSmtpFeedback({
        success: false,
        message: err.response?.data?.error || err.message || 'SMTP test connection failed.',
      });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  return (
    <MotionPage className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-text">System &amp; Account Settings</h1>
        <p className="text-xs text-muted mt-1">
          Manage Tiger system parameters, team accounts, dynamic options, security (2FA), and data privacy
        </p>
      </div>

      {setupSuccess && (
        <div className="rounded-xl border border-accent/20 bg-accent-soft p-3 text-xs font-medium text-accent flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{setupSuccess}</span>
        </div>
      )}

      {/* Admin Section: Employee Accounts Management */}
      {isAdmin && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-subtle space-y-4 text-text">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-accent" />
                <h2 className="text-sm font-semibold text-text">
                  Employee Accounts Management
                </h2>
                <span className="rounded-full border border-border bg-bg px-2 py-0.5 text-[10px] text-muted">
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-muted mt-1">
                Create new staff credentials with temporary passwords required to be reset on first sign-in.
              </p>
            </div>

            <button
              onClick={() => {
                setEmployeeError(null);
                setIsAddEmployeeOpen(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-accent text-white hover:bg-accent-hover px-3.5 py-2 text-xs font-medium transition-colors shrink-0 cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add New Employee</span>
            </button>
          </div>

          {offboardToast && (
            <div className="p-3 rounded-lg border border-accent/20 bg-accent-soft text-accent text-xs font-medium flex items-center justify-between">
              <span>{offboardToast}</span>
              <button type="button" onClick={() => setOffboardToast(null)} className="cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Employees Table */}
          <div className="overflow-x-auto border border-border rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-bg border-b border-border text-muted font-medium">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Biometrics</th>
                  <th className="p-3">Password Status</th>
                  <th className="p-3">Created Date</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loadingEmployees ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-muted">
                      Loading employee directory...
                    </td>
                  </tr>
                ) : employeesData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-muted">
                      No staff members registered yet.
                    </td>
                  </tr>
                ) : (
                  employeesData.map((emp: any) => (
                    <tr key={emp.id} className="hover:bg-bg/50 transition-colors">
                      <td className="p-3 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full border border-border bg-bg flex items-center justify-center overflow-hidden shrink-0">
                          {emp.photoUrl ? (
                            <img src={emp.photoUrl} alt={emp.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-medium text-xs text-muted">{emp.name?.[0]?.toUpperCase()}</span>
                          )}
                        </div>
                        <span className="font-medium text-text">{emp.name}</span>
                      </td>
                      <td className="p-3 font-mono text-muted">{emp.email}</td>
                      <td className="p-3">
                        <StatusBadge
                          label={emp.role === 'admin' ? 'Administrator' : 'Staff'}
                          variant={emp.role === 'admin' ? 'positive' : 'muted'}
                        />
                      </td>
                      <td className="p-3">
                        <StatusBadge
                          label={emp.hasFaceEnrolled ? 'Enrolled' : 'Not Enrolled'}
                          variant={emp.hasFaceEnrolled ? 'positive' : 'muted'}
                        />
                      </td>
                      <td className="p-3">
                        <StatusBadge
                          label={emp.mustChangePassword ? 'Reset Required' : 'Active'}
                          variant={emp.mustChangePassword ? 'negative' : 'positive'}
                        />
                      </td>
                      <td className="p-3 text-muted font-mono tabular-nums text-[11px]">
                        {new Date(emp.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedEmployeeForOnboarding(emp)}
                            title="View Onboarding Progress"
                            className="p-1.5 rounded-lg border border-border text-muted hover:text-text hover:bg-bg transition-colors cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-accent" />
                          </button>

                          {emp.id !== user?.id && emp.role !== 'admin' && (
                            <button
                              type="button"
                              onClick={() => setSelectedEmployeeForOffboarding(emp)}
                              title="Offboard Employee & Reassign Leads"
                              className="p-1.5 rounded-lg border border-border text-muted hover:text-danger hover:bg-danger-soft transition-colors cursor-pointer"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin Section: Organization Identity */}
      {isAdmin && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-subtle space-y-4 text-text">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text flex items-center gap-2">
              <Building className="h-4 w-4 text-accent" />
              <span>Organization Identity</span>
            </h2>
            <span className="rounded-full border border-border bg-bg px-2 py-0.5 text-[10px] text-muted">
              Admin Only
            </span>
          </div>

          <p className="text-xs text-muted">
            This name appears across the masthead, header, and official documents for all system users.
          </p>

          {settingsSuccess && (
            <div className="rounded-lg border border-accent/20 bg-accent-soft p-3 text-xs font-medium text-accent">
              {settingsSuccess}
            </div>
          )}

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={orgNameInput}
              onChange={(e) => setOrgNameInput(e.target.value)}
              placeholder="e.g. Tiger"
              className="flex-1 rounded-lg border border-border px-3.5 py-2 text-xs bg-bg text-text focus:border-accent focus:outline-none"
            />
            <button
              onClick={() => updateSettingsMutation.mutate(orgNameInput)}
              disabled={updateSettingsMutation.isPending || !orgNameInput.trim()}
              className="flex items-center gap-2 rounded-lg bg-accent text-white hover:bg-accent-hover px-4 py-2 text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{updateSettingsMutation.isPending ? 'Saving...' : 'Save Name'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Admin Section: WhatsApp Integration & Webhook */}
      {isAdmin && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-subtle space-y-4 text-text">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text flex items-center gap-2">
              <MessageSquareCode className="h-4 w-4 text-accent" />
              <span>WhatsApp Integration &amp; Webhooks</span>
            </h2>
            <StatusBadge
              label={whatsappStatus?.isCloudConfigured ? 'Meta Cloud API Connected' : 'Direct Link Mode (wa.me)'}
              variant={whatsappStatus?.isCloudConfigured ? 'positive' : 'muted'}
            />
          </div>

          <p className="text-xs text-muted leading-relaxed">
            Configure your official Meta WhatsApp Business Cloud API. When enabled, incoming customer replies are automatically captured into customer notes and timelines via webhooks. When unconfigured, the system automatically falls back to instant <code>wa.me</code> direct messaging without requiring API credentials.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-lg border border-border bg-bg/50 space-y-1">
              <span className="text-[11px] text-muted block font-medium">Meta Webhook Endpoint (Callback URL)</span>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-[11px] text-text bg-card p-1.5 rounded border border-border truncate select-all">
                  {typeof window !== 'undefined' ? `${window.location.origin.replace(/:\d+$/, ':5000')}/api/whatsapp/webhook` : '/api/whatsapp/webhook'}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin.replace(/:\d+$/, ':5000')}/api/whatsapp/webhook`);
                  }}
                  title="Copy Webhook URL"
                  className="p-1.5 rounded border border-border bg-card hover:bg-bg text-muted hover:text-text cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border bg-bg/50 space-y-1">
              <span className="text-[11px] text-muted block font-medium">Webhook Verify Token</span>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-[11px] text-text bg-card p-1.5 rounded border border-border truncate select-all">
                  {whatsappStatus?.webhookVerifyToken || 'tiger_webhook_verify_token_2026'}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(whatsappStatus?.webhookVerifyToken || 'tiger_webhook_verify_token_2026');
                  }}
                  title="Copy Verify Token"
                  className="p-1.5 rounded border border-border bg-card hover:bg-bg text-muted hover:text-text cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Section: SMTP Email Delivery & Connection Testing */}
      {isAdmin && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-subtle space-y-4 text-text">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text flex items-center gap-2">
              <Mail className="h-4 w-4 text-accent" />
              <span>Email Delivery &amp; SMTP Verification</span>
            </h2>
            <span className="rounded-full border border-border bg-bg px-2 py-0.5 text-[10px] text-muted">
              Transactional Dispatcher
            </span>
          </div>

          <p className="text-xs text-muted leading-relaxed">
            The notification dispatcher powers password resets, temporary staff onboarding credentials, and new-device security alerts on privileged accounts. Test your live SMTP server configuration below.
          </p>

          {smtpFeedback && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                smtpFeedback.success
                  ? 'border-accent/30 bg-accent-soft text-accent'
                  : 'border-danger/30 bg-danger-soft text-danger'
              }`}
            >
              {smtpFeedback.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{smtpFeedback.message}</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <input
              type="email"
              value={smtpTestEmail}
              onChange={(e) => setSmtpTestEmail(e.target.value)}
              placeholder={`Send test email to (default: ${user?.email || 'admin email'})...`}
              className="flex-1 rounded-lg border border-border px-3.5 py-2 text-xs bg-bg text-text focus:border-accent focus:outline-none"
            />
            <button
              type="button"
              onClick={handleTestSmtp}
              disabled={isTestingSmtp}
              className="flex items-center gap-2 rounded-lg bg-accent text-white hover:bg-accent-hover px-4 py-2 text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isTestingSmtp ? 'Sending Test...' : 'Test SMTP Connection'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Admin Section: Dynamic List Options Manager */}
      {isAdmin && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-subtle space-y-4 text-text">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text flex items-center gap-2">
              <Layers className="h-4 w-4 text-accent" />
              <span>Dynamic Pipeline &amp; Source Options</span>
            </h2>
            <span className="rounded-full border border-border bg-bg px-2 py-0.5 text-[10px] text-muted">
              Database
            </span>
          </div>

          <p className="text-xs text-muted">
            Add and modify pipeline stages or customer lead sources. Updates reflect instantly across tables and filters.
          </p>

          {/* Option Type Switcher */}
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <button
              onClick={() => setOptionTypeTab('status')}
              className={`rounded-full px-3.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                optionTypeTab === 'status'
                  ? 'bg-accent text-white'
                  : 'text-muted hover:text-text hover:bg-bg'
              }`}
            >
              Customer Stages (Status)
            </button>
            <button
              onClick={() => setOptionTypeTab('source')}
              className={`rounded-full px-3.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                optionTypeTab === 'source'
                  ? 'bg-accent text-white'
                  : 'text-muted hover:text-text hover:bg-bg'
              }`}
            >
              Lead Sources
            </button>
          </div>

          {optionError && (
            <div className="rounded-lg border border-danger/30 bg-danger-soft p-3 text-xs font-medium text-danger">
              {optionError}
            </div>
          )}

          {/* Options List */}
          <div className="space-y-2">
            {currentOptions.map((opt) => (
              <div
                key={opt.id}
                className="flex items-center justify-between rounded-lg border border-border p-3 bg-bg"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-xs text-text">{opt.label}</span>
                  {opt.isDefault && (
                    <span className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px] text-muted">
                      Default
                    </span>
                  )}
                </div>

                <button
                  onClick={() => deleteOptionMutation.mutate(opt.id)}
                  disabled={deleteOptionMutation.isPending}
                  className="rounded-lg border border-border p-1.5 text-muted hover:text-danger hover:border-danger/30 hover:bg-danger-soft transition-colors cursor-pointer"
                  title="Delete option"
                >
                  <Trash2 className="h-3.5 w-3.5" />
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
              placeholder={`Enter new ${optionTypeTab === 'status' ? 'stage' : 'source'} name...`}
              className="flex-1 w-full rounded-lg border border-border px-3.5 py-2 text-xs bg-bg text-text focus:border-accent focus:outline-none"
            />

            <label className="flex items-center gap-2 text-xs text-muted cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={newOptionIsDefault}
                onChange={(e) => setNewOptionIsDefault(e.target.checked)}
                className="rounded border-border text-accent focus:ring-accent"
              />
              <span>Set as Default</span>
            </label>

            <button
              type="submit"
              disabled={addOptionMutation.isPending || !newOptionLabel.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-accent text-white hover:bg-accent-hover px-4 py-2 text-xs font-medium transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Option</span>
            </button>
          </form>
        </div>
      )}

      {/* Profile Overview */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-subtle space-y-4 text-text">
        <h2 className="text-sm font-semibold text-text flex items-center gap-2">
          <User className="h-4 w-4 text-accent" />
          <span>User Profile</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border p-3.5 bg-bg">
            <span className="text-xs text-muted block mb-1">Full Name:</span>
            <p className="font-semibold text-sm text-text">{user?.name}</p>
          </div>

          <div className="rounded-lg border border-border p-3.5 bg-bg">
            <span className="text-xs text-muted block mb-1">Email Address:</span>
            <p className="font-mono text-sm text-text">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Profile Photo & Biometric Face Authentication */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-subtle space-y-6 text-text">
        {/* Photo subsection */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full border border-border overflow-hidden bg-bg flex items-center justify-center shrink-0 relative">
              {user?.photoUrl ? (
                <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-semibold text-muted">{user?.name?.[0]?.toUpperCase()}</span>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-sm text-text flex items-center gap-2">
                <Camera className="w-4 h-4 text-accent" />
                <span>Profile Photo</span>
              </h3>
              <p className="text-xs text-muted mt-1 max-w-md">
                Your portrait appears alongside your name in team chats, attendance logs, and mastheads.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsPhotoModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-accent text-white hover:bg-accent-hover px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Update Photo</span>
          </button>
        </div>

        {/* Biometrics Face Recognition subsection */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-text flex items-center gap-2">
                <ScanFace className="h-4 w-4 text-accent" />
                <span>Facial Biometrics Authentication</span>
              </h3>
              <p className="text-xs text-muted max-w-xl">
                Encrypted biometric facial vector (AES-256-GCM) with liveness detection used for rapid time-clock check-in and 2FA fallback.
              </p>
            </div>

            <div>
              <StatusBadge
                label={user?.hasFaceEnrolled ? 'Enrolled & Active' : 'Not Enrolled'}
                variant={user?.hasFaceEnrolled ? 'positive' : 'muted'}
              />
            </div>
          </div>

          {faceDeleteSuccess && (
            <div className="rounded-lg border border-accent/20 bg-accent-soft p-3 text-xs font-medium text-accent flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>{faceDeleteSuccess}</span>
            </div>
          )}

          {user?.hasFaceEnrolled ? (
            <div className="p-4 rounded-lg border border-border bg-bg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-muted space-y-1">
                <p className="font-medium text-text">
                  Biometric mathematical vector is fully encrypted. You can revoke consent and purge vectors anytime.
                </p>
                <p>Purging deletes the mathematical embedding permanently without residual backups.</p>
              </div>

              <button
                onClick={handleDeleteFaceData}
                disabled={isDeletingFace}
                className="flex items-center gap-2 rounded-lg border border-border px-3.5 py-2 text-xs font-medium text-muted hover:text-danger hover:border-danger/30 hover:bg-danger-soft transition-colors shrink-0 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingFace ? 'Purging...' : 'Delete Biometrics & Revoke Consent'}</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-lg border border-border bg-bg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-muted">
                <p className="font-medium text-text mb-1">
                  You have not enrolled your face biometrics yet.
                </p>
                <p>Enrollment requires explicit legal consent and an active camera liveness challenge.</p>
              </div>

              <button
                onClick={() => setIsFaceModalOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-accent text-white hover:bg-accent-hover px-4 py-2 text-xs font-medium transition-colors shrink-0 cursor-pointer"
              >
                <ScanFace className="w-3.5 h-3.5" />
                <span>Enroll Face Biometrics</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Two-Factor Authentication (2FA) */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-subtle space-y-4 text-text">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-text flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-accent" />
              <span>Two-Factor Authentication (TOTP 2FA)</span>
            </h2>
            <p className="text-xs text-muted max-w-xl">
              Add a defense layer using time-based one-time passcodes from apps like Google Authenticator, 1Password, or Authy.
            </p>
          </div>

          <div>
            <StatusBadge
              label={user?.isTwoFactorEnabled ? 'Enabled' : 'Disabled'}
              variant={user?.isTwoFactorEnabled ? 'positive' : 'muted'}
            />
          </div>
        </div>

        {setupError && (
          <div className="rounded-lg border border-danger/30 bg-danger-soft p-3 text-xs font-medium text-danger">
            {setupError}
          </div>
        )}

        {!user?.isTwoFactorEnabled ? (
          <div>
            {!is2FASetupOpen ? (
              <button
                onClick={handleStart2FASetup}
                className="flex items-center gap-2 rounded-lg bg-accent text-white hover:bg-accent-hover px-4 py-2 text-xs font-medium transition-colors cursor-pointer"
              >
                <QrCode className="h-3.5 w-3.5" />
                <span>Begin 2FA Setup</span>
              </button>
            ) : (
              <div className="rounded-xl border border-border bg-bg p-5 space-y-4">
                <p className="text-xs font-medium text-text">
                  1. Scan this QR code using your authenticator application:
                </p>

                {twoFactorData && (
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="rounded-xl bg-white p-3 shadow-sm border border-border">
                      <img
                        src={twoFactorData.qrCodeDataUrl}
                        alt="2FA QR Code"
                        className="h-40 w-40"
                      />
                    </div>
                    <div className="space-y-2 text-xs text-muted">
                      <p>Or manually enter this secret setup key:</p>
                      <code className="block rounded-lg bg-card border border-border p-2 font-mono text-xs font-medium text-text select-all">
                        {twoFactorData.secret}
                      </code>
                    </div>
                  </div>
                )}

                <form onSubmit={handleEnable2FA} className="space-y-3 pt-2">
                  <p className="text-xs font-medium text-text">
                    2. Enter the 6-digit verification code to activate:
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={totpVerifyCode}
                      onChange={(e) => setTotpVerifyCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-36 rounded-lg border border-border bg-card px-3 py-2 text-center font-mono text-sm tracking-widest text-text focus:border-accent focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-accent text-white hover:bg-accent-hover px-4 py-2 text-xs font-medium transition-colors cursor-pointer"
                    >
                      Verify &amp; Activate 2FA
                    </button>
                    <button
                      type="button"
                      onClick={() => setIs2FASetupOpen(false)}
                      className="rounded-lg border border-border px-3.5 py-2 text-xs font-medium text-muted hover:text-text hover:bg-card transition-colors cursor-pointer"
                    >
                      Cancel
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
                className="rounded-lg border border-border px-3.5 py-2 text-xs font-medium text-muted hover:text-danger hover:border-danger/30 hover:bg-danger-soft transition-colors cursor-pointer"
              >
                Disable Two-Factor Authentication
              </button>
            ) : (
              <form onSubmit={handleDisable2FA} className="flex items-center gap-3">
                <input
                  type="password"
                  required
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="Enter password to confirm"
                  className="w-60 rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text focus:border-accent focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-accent text-white hover:bg-accent-hover px-4 py-2 text-xs font-medium cursor-pointer"
                >
                  Confirm Disable
                </button>
                <button
                  type="button"
                  onClick={() => setDisabling2FA(false)}
                  className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted hover:text-text hover:bg-bg cursor-pointer"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Data Privacy & Export */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-subtle space-y-3 text-text">
        <h2 className="text-sm font-semibold text-text flex items-center gap-2">
          <Download className="h-4 w-4 text-accent" />
          <span>Export All Data (GDPR &amp; Data Portability)</span>
        </h2>
        <p className="text-xs text-muted">
          Download a comprehensive machine-readable archive (.json) containing your profile records, customer ledger entries, WhatsApp templates, and audit logs.
        </p>
        <button
          onClick={handleExportAllData}
          className="flex items-center gap-2 rounded-lg border border-border bg-card hover:bg-bg px-4 py-2 text-xs font-medium text-text transition-colors cursor-pointer"
        >
          <Download className="h-3.5 w-3.5 text-muted" />
          <span>Export JSON Archive</span>
        </button>
      </div>

      {/* Danger Zone: Permanent Account Deletion */}
      <div className="rounded-xl border border-danger/30 bg-danger-soft/30 p-6 space-y-4 text-text">
        <div className="flex items-center gap-2 text-danger">
          <AlertTriangle className="h-4 w-4" />
          <h2 className="text-sm font-semibold">Danger Zone: Permanent Account Deletion</h2>
        </div>
        <p className="text-xs text-muted">
          This operation will permanently purge your user profile, customer entries, message drafts, and credentials from the system. This cannot be undone.
        </p>

        <button
          onClick={() => {
            setDeletePassword('');
            setDeleteError(null);
            setIsDeleteModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-danger text-white hover:bg-red-700 px-4 py-2 text-xs font-medium transition-colors cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete Account Permanently</span>
        </button>
      </div>

      {/* Delete Confirmation Dialog */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-card border border-border p-6 shadow-lg text-text">
            <h3 className="text-base font-semibold text-text mb-2">
              Confirm Account Deletion
            </h3>
            <p className="text-xs text-muted mb-4">
              Enter your current password to authorize final deletion. You cannot revert this action:
            </p>

            {deleteError && (
              <div className="mb-3 rounded-lg border border-danger/30 bg-danger-soft p-2.5 text-xs font-medium text-danger">
                {deleteError}
              </div>
            )}

            <div className="relative mb-4">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
              <input
                type="password"
                required
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Current Password"
                className="w-full rounded-lg border border-border bg-bg pl-9 pr-3 py-2 text-xs text-text focus:border-accent focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-lg border border-border px-3.5 py-2 text-xs font-medium text-muted hover:text-text hover:bg-bg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || !deletePassword}
                className="rounded-lg bg-danger text-white hover:bg-red-700 px-4 py-2 text-xs font-medium disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Photo Modal */}
      <ProfilePhotoModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
      />

      {/* Face Biometrics Enrollment Modal */}
      <FaceBiometricsModal
        isOpen={isFaceModalOpen}
        onClose={() => setIsFaceModalOpen(false)}
        mode="enroll"
        onSuccess={() => {
          refreshUser();
        }}
      />

      {/* Add Employee Modal (Admin Only) */}
      {isAddEmployeeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-card border border-border p-6 shadow-lg text-text">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg border border-accent/20 bg-accent-soft text-accent">
                  <UserPlus className="w-4 h-4" />
                </span>
                <h3 className="font-semibold text-base text-text">Add New Staff Member</h3>
              </div>
              <button
                onClick={() => setIsAddEmployeeOpen(false)}
                className="p-1 rounded-lg border border-border hover:bg-bg text-muted hover:text-text cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {employeeError && (
              <div className="mb-4 p-3 rounded-lg border border-danger/30 bg-danger-soft text-danger text-xs font-medium">
                {employeeError}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newEmployeeName.trim() || !newEmployeeEmail.trim()) return;
                createEmployeeMutation.mutate({
                  name: newEmployeeName.trim(),
                  email: newEmployeeEmail.trim(),
                });
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-medium text-muted mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newEmployeeName}
                  onChange={(e) => setNewEmployeeName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full rounded-lg border border-border bg-bg px-3.5 py-2 text-xs text-text focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-muted mb-1">Corporate Email</label>
                <input
                  type="email"
                  required
                  value={newEmployeeEmail}
                  onChange={(e) => setNewEmployeeEmail(e.target.value)}
                  placeholder="john@tiger.com"
                  className="w-full rounded-lg border border-border bg-bg px-3.5 py-2 text-xs text-text focus:border-accent focus:outline-none font-mono"
                />
              </div>

              <div className="p-3 border border-border bg-bg rounded-lg space-y-1">
                <p className="font-medium text-text">Security Notice:</p>
                <p className="text-muted">
                  The system generates a secure temporary password. The employee will be prompted to reset their credentials upon first sign-in, upload their photo, and enroll biometric verification.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddEmployeeOpen(false)}
                  className="px-3.5 py-2 border border-border rounded-lg text-muted hover:text-text hover:bg-bg font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createEmployeeMutation.isPending}
                  className="px-4 py-2 bg-accent text-white font-medium rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {createEmployeeMutation.isPending ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Created Employee Credentials Modal */}
      {createdEmployeeCreds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-card border border-border p-6 shadow-lg text-text space-y-4">
            <div className="flex items-center gap-2.5 border-b border-border pb-3">
              <span className="p-1.5 rounded-lg border border-accent/20 bg-accent-soft text-accent">
                <CheckCircle2 className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-semibold text-base text-text">Employee Account Created!</h3>
                <p className="text-xs text-muted">Copy these temporary credentials and provide them securely to the employee</p>
              </div>
            </div>

            <div className="space-y-3 p-4 border border-border bg-bg rounded-lg text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted">Employee Name:</span>
                <span className="font-semibold text-text">{createdEmployeeCreds.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted">Email:</span>
                <span className="font-mono text-text">{createdEmployeeCreds.email}</span>
              </div>
              <div className="pt-2 border-t border-border">
                <span className="text-muted block mb-1">Temporary Password:</span>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-card border border-border p-2 rounded-lg font-mono text-xs font-semibold text-text text-center tracking-wider select-all">
                    {createdEmployeeCreds.temporaryPassword}
                  </code>
                  <button
                    onClick={handleCopyPassword}
                    className="p-2 border border-border rounded-lg bg-card hover:bg-bg text-text transition-colors flex items-center gap-1 font-medium text-xs cursor-pointer"
                    title="Copy password"
                  >
                    {copiedPass ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5 text-muted" />}
                    <span>{copiedPass ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted">
              * The employee will be forced to change this password on their initial login.
            </p>

            <button
              onClick={() => setCreatedEmployeeCreds(null)}
              className="w-full py-2.5 bg-accent text-white font-medium text-xs rounded-lg hover:bg-accent-hover transition-colors cursor-pointer"
            >
              Done &amp; Close
            </button>
          </div>
        </div>
      )}

      {/* Onboarding Checklist Modal */}
      <OnboardingModal
        isOpen={!!selectedEmployeeForOnboarding}
        onClose={() => setSelectedEmployeeForOnboarding(null)}
        employee={selectedEmployeeForOnboarding}
      />

      {/* Offboard Employee Modal */}
      <OffboardModal
        isOpen={!!selectedEmployeeForOffboarding}
        onClose={() => setSelectedEmployeeForOffboarding(null)}
        onSuccess={(summary) => {
          setOffboardToast(summary);
          refetchEmployees();
        }}
        employee={selectedEmployeeForOffboarding}
        activeEmployees={employeesData}
      />
    </MotionPage>
  );
};
