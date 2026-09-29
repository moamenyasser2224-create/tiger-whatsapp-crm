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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" dir="ltr">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-lg p-6 text-text">
        <div className="flex items-center gap-3 border-b border-border pb-4 mb-5">
          <div className="p-2.5 rounded-lg border border-accent/20 bg-accent-soft text-accent">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text">Mandatory Password Update</h2>
            <p className="text-xs text-muted">
              New account — please replace your temporary password to continue
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg border border-danger/30 bg-danger-soft text-danger flex items-center gap-2 text-xs font-medium">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="p-6 text-center rounded-lg border border-border bg-bg">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-accent" />
            <h3 className="text-base font-semibold text-text">Password Changed Successfully!</h3>
            <p className="text-xs text-muted mt-1">
              Entering Tiger workspace...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                Current Temporary Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3.5 py-2 rounded-lg border border-border bg-bg text-text text-xs focus:border-accent focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                New Password (minimum 8 characters)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter strong new password"
                className="w-full px-3.5 py-2 rounded-lg border border-border bg-bg text-text text-xs focus:border-accent focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-3.5 py-2 rounded-lg border border-border bg-bg text-text text-xs focus:border-accent focus:outline-none font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 rounded-lg bg-accent text-white font-medium text-xs hover:bg-accent-hover transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Updating...' : 'Set Password & Enter Workspace'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
