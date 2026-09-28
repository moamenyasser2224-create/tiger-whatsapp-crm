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
      navigate('/customers');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Account registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12 dark:bg-neutral-950 transition-colors">
      <div className="w-full max-w-md rounded-3xl border border-neutral-300 bg-white p-8 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white dark:bg-white dark:text-black border border-neutral-900 dark:border-white shadow-sm mb-4">
            <UserPlus className="h-7 w-7" />
          </div>
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <span className="text-2xl font-black text-neutral-900 dark:text-white">Tiger</span>
            <span className="text-xs uppercase px-2 py-0.5 font-black border border-neutral-900 dark:border-white rounded-md text-neutral-900 dark:text-white">CRM</span>
          </div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white">
            Create an Account
          </h1>
          <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            Join Tiger for enterprise machine workflow & customer ledger management
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-neutral-900 bg-neutral-100 p-3.5 text-xs font-bold text-neutral-900 dark:border-white dark:bg-neutral-800 dark:text-white">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full rounded-xl border border-neutral-300 pl-9 pr-3 py-2.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-white dark:focus:ring-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-neutral-300 pl-9 pr-3 py-2.5 text-sm text-left focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-white dark:focus:ring-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Password (min 8 chars, uppercase, lowercase & digits)
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-neutral-300 pl-9 pr-3 py-2.5 text-sm text-left focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-white dark:focus:ring-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 border border-neutral-900 dark:border-white py-3 text-sm font-bold disabled:opacity-50 transition-colors mt-2"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span>Create Account</span>}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-neutral-600 dark:text-neutral-400">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-neutral-900 dark:text-white underline hover:opacity-75">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
