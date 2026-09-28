import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext.js';
import { api } from '../lib/api.js';
import type { ListOption, Settings } from '../types/index.js';
import { ProfilePhotoModal } from '../components/ProfilePhotoModal.js';
import { FaceBiometricsModal } from '../components/FaceBiometricsModal.js';
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
  Users,
  UserPlus,
  Camera,
  ScanFace,
  Copy,
  Check,
  Key,
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
      setSettingsSuccess('Organization name updated successfully!');
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

  return (
    <MotionPage className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-neutral-900 dark:text-white">System & Account Settings</h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          Manage Tiger system parameters, team accounts, dynamic options, security (2FA), and data privacy
        </p>
      </div>

      {setupSuccess && (
        <div className="rounded-2xl border border-neutral-900 bg-neutral-100 p-4 text-xs font-bold text-neutral-900 dark:border-white dark:bg-neutral-800 dark:text-white flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{setupSuccess}</span>
        </div>
      )}

      {/* Admin Section: Employee Accounts Management */}
      {isAdmin && (
        <div className="rounded-2xl border border-neutral-300 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-neutral-900 dark:text-white" />
                <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                  Employee Accounts Management
                </h2>
                <span className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-[11px] font-bold text-neutral-800 dark:text-neutral-200">
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Create new staff credentials with temporary passwords required to be reset on first sign-in.
              </p>
            </div>

            <button
              onClick={() => {
                setEmployeeError(null);
                setIsAddEmployeeOpen(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 border border-neutral-900 dark:border-white px-4 py-2 text-xs font-bold transition-colors shrink-0"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add New Employee</span>
            </button>
          </div>

          {/* Employees Table */}
          <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="p-3 font-black">Employee</th>
                  <th className="p-3 font-black">Email</th>
                  <th className="p-3 font-black">Role</th>
                  <th className="p-3 font-black">Biometric Face</th>
                  <th className="p-3 font-black">Password Status</th>
                  <th className="p-3 font-black">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {loadingEmployees ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-neutral-500 font-bold">
                      Loading employee directory...
                    </td>
                  </tr>
                ) : employeesData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-neutral-500 font-bold">
                      No staff members registered yet.
                    </td>
                  </tr>
                ) : (
                  employeesData.map((emp: any) => (
                    <tr key={emp.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                      <td className="p-3 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full border border-neutral-400 bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center overflow-hidden shrink-0">
                          {emp.photoUrl ? (
                            <img src={emp.photoUrl} alt={emp.name} className="w-full h-full object-cover grayscale" />
                          ) : (
                            <span className="font-bold text-xs">{emp.name?.[0]?.toUpperCase()}</span>
                          )}
                        </div>
                        <span className="font-bold text-neutral-900 dark:text-white">{emp.name}</span>
                      </td>
                      <td className="p-3 font-mono">{emp.email}</td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold ${
                          emp.role === 'admin'
                            ? 'bg-black text-white dark:bg-white dark:text-black border-neutral-900 dark:border-white'
                            : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700'
                        }`}>
                          {emp.role === 'admin' ? 'Administrator' : 'Staff'}
                        </span>
                      </td>
                      <td className="p-3">
                        {emp.hasFaceEnrolled ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-black dark:text-white">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Enrolled</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-neutral-400">
                            Not Enrolled
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {emp.mustChangePassword ? (
                          <span className="inline-block px-2 py-0.5 rounded border border-neutral-400 bg-neutral-100 dark:bg-neutral-800 text-[10px] font-bold text-neutral-800 dark:text-neutral-200">
                            Temporary (Reset Required)
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-black dark:text-white">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-neutral-500 font-mono text-[11px]">
                        {new Date(emp.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
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
        <div className="rounded-2xl border border-neutral-300 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Building className="h-5 w-5 text-neutral-900 dark:text-white" />
              <span>Organization Identity</span>
            </h2>
            <span className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-[11px] font-bold text-neutral-800 dark:text-neutral-200">
              Admin Only
            </span>
          </div>

          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            This name appears across the masthead, header, and official documents for all system users.
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
              placeholder="e.g. Tiger"
              className="flex-1 rounded-xl border border-neutral-300 px-3.5 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-white dark:focus:ring-white"
            />
            <button
              onClick={() => updateSettingsMutation.mutate(orgNameInput)}
              disabled={updateSettingsMutation.isPending || !orgNameInput.trim()}
              className="flex items-center gap-2 rounded-xl bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 border border-neutral-900 dark:border-white px-5 py-2 text-xs font-bold transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{updateSettingsMutation.isPending ? 'Saving...' : 'Save Name'}</span>
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
              <span>Dynamic Pipeline & Source Options</span>
            </h2>
            <span className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-[11px] font-bold text-neutral-800 dark:text-neutral-200">
              Database
            </span>
          </div>

          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Add and modify pipeline stages or customer lead sources. Updates reflect instantly across tables and filters.
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
              Customer Stages (Status)
            </button>
            <button
              onClick={() => setOptionTypeTab('source')}
              className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all ${
                optionTypeTab === 'source'
                  ? 'bg-black text-white dark:bg-white dark:text-black border border-neutral-900 dark:border-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700'
              }`}
            >
              Lead Sources
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
                      Default
                    </span>
                  )}
                </div>

                <button
                  onClick={() => deleteOptionMutation.mutate(opt.id)}
                  disabled={deleteOptionMutation.isPending}
                  className="rounded-lg border border-neutral-300 p-1.5 text-neutral-600 hover:bg-neutral-200 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors"
                  title="Delete option"
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
              placeholder={`Enter new ${optionTypeTab === 'status' ? 'stage' : 'source'} name...`}
              className="flex-1 w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-xs focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-white dark:focus:ring-white"
            />

            <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={newOptionIsDefault}
                onChange={(e) => setNewOptionIsDefault(e.target.checked)}
                className="rounded border-neutral-300 text-black focus:ring-black dark:border-neutral-700"
              />
              <span>Set as Default</span>
            </label>

            <button
              type="submit"
              disabled={addOptionMutation.isPending || !newOptionLabel.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 border border-neutral-900 dark:border-white px-4 py-2 text-xs font-bold transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span>Add Option</span>
            </button>
          </form>
        </div>
      )}

      {/* Profile Overview */}
      <div className="rounded-2xl border border-neutral-300 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
        <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <User className="h-5 w-5 text-neutral-900 dark:text-white" />
          <span>User Profile</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-neutral-200 p-3.5 dark:border-neutral-800">
            <span className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1">Full Name:</span>
            <p className="font-bold text-sm text-neutral-900 dark:text-white">{user?.name}</p>
          </div>

          <div className="rounded-xl border border-neutral-200 p-3.5 dark:border-neutral-800">
            <span className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1">Email Address:</span>
            <p className="font-mono text-sm text-neutral-900 dark:text-white">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Profile Photo & Biometric Face Authentication */}
      <div className="rounded-2xl border border-neutral-300 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-6">
        {/* Photo subsection */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full border-2 border-black dark:border-white overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 relative shadow-inner">
              {user?.photoUrl ? (
                <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover grayscale" />
              ) : (
                <span className="text-2xl font-black text-neutral-400">{user?.name?.[0]?.toUpperCase()}</span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
                <Camera className="w-4 h-4" />
                <span>Profile Photo</span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-md">
                Your portrait appears alongside your name in team chats, attendance logs, and mastheads.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsPhotoModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 border border-neutral-900 dark:border-white px-4 py-2 text-xs font-bold transition-colors"
          >
            <Camera className="w-4 h-4" />
            <span>Update Photo</span>
          </button>
        </div>

        {/* Biometrics Face Recognition subsection */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <ScanFace className="h-5 w-5 text-neutral-900 dark:text-white" />
                <span>Facial Biometrics Authentication</span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xl">
                Encrypted biometric facial vector (AES-256-GCM) with liveness detection used for rapid time-clock check-in and 2FA fallback.
              </p>
            </div>

            <div>
              {user?.hasFaceEnrolled ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-neutral-900 bg-black px-3 py-1 text-xs font-black text-white dark:border-white dark:bg-white dark:text-black">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Enrolled & Active</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-neutral-400 bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                  <span>Not Enrolled</span>
                </span>
              )}
            </div>
          </div>

          {faceDeleteSuccess && (
            <div className="rounded-xl border border-neutral-900 bg-neutral-100 p-3 text-xs font-bold text-neutral-900 dark:border-white dark:bg-neutral-800 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>{faceDeleteSuccess}</span>
            </div>
          )}

          {user?.hasFaceEnrolled ? (
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
                <p className="font-bold text-neutral-900 dark:text-white">
                  Biometric mathematical vector is fully encrypted. You can revoke consent and purge vectors anytime.
                </p>
                <p>Purging deletes the mathematical embedding permanently without residual backups.</p>
              </div>

              <button
                onClick={handleDeleteFaceData}
                disabled={isDeletingFace}
                className="flex items-center gap-2 rounded-xl border border-neutral-400 px-4 py-2 text-xs font-bold text-neutral-800 hover:bg-neutral-200 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800 transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeletingFace ? 'Purging...' : 'Delete Biometrics & Revoke Consent'}</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-neutral-600 dark:text-neutral-400">
                <p className="font-bold text-neutral-900 dark:text-white mb-1">
                  You have not enrolled your face biometrics yet.
                </p>
                <p>Enrollment requires explicit legal consent and an active camera liveness challenge.</p>
              </div>

              <button
                onClick={() => setIsFaceModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 border border-neutral-900 dark:border-white px-5 py-2.5 text-xs font-bold transition-colors shrink-0"
              >
                <ScanFace className="w-4 h-4" />
                <span>Enroll Face Biometrics</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Two-Factor Authentication (2FA) */}
      <div className="rounded-2xl border border-neutral-300 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-neutral-900 dark:text-white" />
              <span>Two-Factor Authentication (TOTP 2FA)</span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xl">
              Add a defense layer using time-based one-time passcodes from apps like Google Authenticator, 1Password, or Authy.
            </p>
          </div>

          <div>
            {user?.isTwoFactorEnabled ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-neutral-900 bg-black px-3 py-1 text-xs font-black text-white dark:border-white dark:bg-white dark:text-black">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Enabled</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-neutral-400 bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                <span>Disabled</span>
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
                <span>Begin 2FA Setup</span>
              </button>
            ) : (
              <div className="rounded-2xl border border-neutral-300 bg-neutral-50/50 p-5 dark:border-neutral-700 dark:bg-neutral-800/40 space-y-4">
                <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  1. Scan this QR code using your authenticator application:
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
                      <p>Or manually enter this secret setup key:</p>
                      <code className="block rounded-lg bg-neutral-200 p-2 font-mono text-xs font-bold dark:bg-neutral-900 select-all">
                        {twoFactorData.secret}
                      </code>
                    </div>
                  </div>
                )}

                <form onSubmit={handleEnable2FA} className="space-y-3 pt-2">
                  <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
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
                      className="w-40 rounded-xl border border-neutral-300 px-3 py-2 text-center font-mono text-sm tracking-widest focus:border-black dark:border-neutral-700 dark:bg-neutral-800"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 border border-neutral-900 dark:border-white px-5 py-2 text-xs font-bold"
                    >
                      Verify & Activate 2FA
                    </button>
                    <button
                      type="button"
                      onClick={() => setIs2FASetupOpen(false)}
                      className="rounded-xl border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 dark:border-neutral-700 dark:text-neutral-300"
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
                className="rounded-xl border border-neutral-400 px-4 py-2 text-xs font-bold text-neutral-800 hover:bg-neutral-200 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
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
                  className="w-64 rounded-xl border border-neutral-300 px-3 py-2 text-xs focus:border-black dark:border-neutral-700 dark:bg-neutral-800"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 border border-neutral-900 dark:border-white px-4 py-2 text-xs font-bold"
                >
                  Confirm Disable
                </button>
                <button
                  type="button"
                  onClick={() => setDisabling2FA(false)}
                  className="rounded-xl border border-neutral-300 px-3 py-2 text-xs font-semibold"
                >
                  Cancel
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
          <span>Export All Data (GDPR & Data Portability)</span>
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Download a comprehensive machine-readable archive (.json) containing your profile records, customer ledger entries, WhatsApp templates, and audit logs.
        </p>
        <button
          onClick={handleExportAllData}
          className="flex items-center gap-2 rounded-xl border border-neutral-400 bg-neutral-100 px-4 py-2 text-xs font-bold text-neutral-800 hover:bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Export JSON Archive</span>
        </button>
      </div>

      {/* Danger Zone: Permanent Account Deletion */}
      <div className="rounded-2xl border-2 border-neutral-900 dark:border-neutral-400 bg-neutral-50/60 p-6 dark:bg-neutral-900/40 space-y-4">
        <div className="flex items-center gap-2 text-neutral-900 dark:text-white">
          <AlertTriangle className="h-5 w-5" />
          <h2 className="text-base font-black">Danger Zone: Permanent Account Deletion</h2>
        </div>
        <p className="text-xs text-neutral-700 dark:text-neutral-300">
          This operation will permanently purge your user profile, customer entries, message drafts, and credentials from the system. This cannot be undone.
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
          <span>Delete Account Permanently</span>
        </button>
      </div>

      {/* Delete Confirmation Dialog */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900 border-2 border-neutral-900 dark:border-neutral-400">
            <h3 className="text-base font-black text-neutral-900 dark:text-white mb-2">
              Confirm Account Deletion
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 mb-4">
              Enter your current password to authorize final deletion. You cannot revert this action:
            </p>

            {deleteError && (
              <div className="mb-3 rounded-lg border border-neutral-900 bg-neutral-100 p-2.5 text-xs font-bold text-neutral-900 dark:border-white dark:bg-neutral-800 dark:text-white">
                {deleteError}
              </div>
            )}

            <div className="relative mb-4">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <input
                type="password"
                required
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Current Password"
                className="w-full rounded-xl border border-neutral-300 pl-9 pr-3 py-2 text-xs focus:border-black focus:ring-1 focus:ring-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-xl border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 dark:border-neutral-700 dark:text-neutral-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || !deletePassword}
                className="rounded-xl bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 border-2 border-neutral-900 dark:border-white px-5 py-2 text-xs font-bold disabled:opacity-50 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900 border-2 border-black dark:border-white text-black dark:text-white">
            <div className="flex items-center justify-between border-b-2 border-black dark:border-white pb-3 mb-4">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                <h3 className="font-black text-base">Add New Staff Member</h3>
              </div>
              <button
                onClick={() => setIsAddEmployeeOpen(false)}
                className="text-xs font-bold p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                ✕
              </button>
            </div>

            {employeeError && (
              <div className="mb-4 p-3 border-2 border-black dark:border-white bg-neutral-100 dark:bg-neutral-800 text-xs font-bold">
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
                <label className="block font-black uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newEmployeeName}
                  onChange={(e) => setNewEmployeeName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div>
                <label className="block font-black uppercase mb-1">Corporate Email</label>
                <input
                  type="email"
                  required
                  value={newEmployeeEmail}
                  onChange={(e) => setNewEmployeeEmail(e.target.value)}
                  placeholder="john@tiger.com"
                  className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white font-mono"
                />
              </div>

              <div className="p-3 border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl space-y-1">
                <p className="font-bold">Security Notice:</p>
                <p className="text-neutral-600 dark:text-neutral-400">
                  The system generates a secure temporary password. The employee will be prompted to reset their credentials upon first sign-in, upload their photo, and enroll biometric verification.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddEmployeeOpen(false)}
                  className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createEmployeeMutation.isPending}
                  className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black font-black rounded-xl border border-black dark:border-white disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900 border-2 border-black dark:border-white text-black dark:text-white space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-black dark:border-white pb-3">
              <CheckCircle2 className="w-6 h-6 text-black dark:text-white" />
              <div>
                <h3 className="font-black text-base">Employee Account Created!</h3>
                <p className="text-[11px] text-neutral-500 font-bold">Copy these temporary credentials and provide them securely to the employee</p>
              </div>
            </div>

            <div className="space-y-3 p-4 border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-neutral-500">Employee Name:</span>
                <span className="font-black">{createdEmployeeCreds.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-neutral-500">Email:</span>
                <span className="font-mono font-bold">{createdEmployeeCreds.email}</span>
              </div>
              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700">
                <span className="font-bold text-neutral-500 block mb-1">Temporary Password:</span>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-black text-white dark:bg-white dark:text-black p-2 rounded-lg font-mono text-sm font-bold text-center tracking-wider select-all">
                    {createdEmployeeCreds.temporaryPassword}
                  </code>
                  <button
                    onClick={handleCopyPassword}
                    className="p-2 border-2 border-black dark:border-white rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1 font-bold text-xs"
                    title="Copy password"
                  >
                    {copiedPass ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedPass ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 font-bold">
              * The employee will be forced to change this password on their initial login.
            </p>

            <button
              onClick={() => setCreatedEmployeeCreds(null)}
              className="w-full py-2.5 bg-black dark:bg-white text-white dark:text-black font-black text-xs uppercase rounded-xl border border-black dark:border-white"
            >
              Done & Close
            </button>
          </div>
        </div>
      )}
    </MotionPage>
  );
};
