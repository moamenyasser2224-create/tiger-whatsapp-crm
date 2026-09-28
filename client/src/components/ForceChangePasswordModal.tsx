import React, { useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.js';
import { KeyRound, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const ForceChangePasswordModal: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!user || !user.mustChangePassword) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      setSuccess(true);
      setTimeout(() => {
        updateUser({ mustChangePassword: false });
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" dir="ltr">
      <div className="w-full max-w-md bg-white dark:bg-black border-2 border-black dark:border-white shadow-2xl p-6 rounded-none text-black dark:text-white">
        <div className="flex items-center gap-3 border-b-2 border-black dark:border-white pb-4 mb-5">
          <div className="p-2 border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black">Mandatory Password Update</h2>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 font-bold">
              New account — please replace your temporary password to continue
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 border-2 border-black dark:border-white bg-neutral-100 dark:bg-neutral-900 flex items-center gap-2 text-sm font-bold">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="p-6 text-center border-2 border-black dark:border-white bg-neutral-100 dark:bg-neutral-900">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3" />
            <h3 className="text-lg font-black">Password Changed Successfully!</h3>
            <p className="text-sm font-bold text-neutral-600 dark:text-neutral-400 mt-1">
              Entering Tiger workspace...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase mb-1">
                Current Temporary Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3 py-2 border-2 border-black dark:border-white bg-transparent text-sm focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase mb-1">
                New Password (minimum 8 characters)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter strong new password"
                className="w-full px-3 py-2 border-2 border-black dark:border-white bg-transparent text-sm focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-3 py-2 border-2 border-black dark:border-white bg-transparent text-sm focus:outline-none font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-wider text-xs border-2 border-black dark:border-white hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Updating...' : 'Set Password & Enter Workspace'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
