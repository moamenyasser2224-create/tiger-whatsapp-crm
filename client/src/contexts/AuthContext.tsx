import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setAccessToken } from '../lib/api.js';
import type { User } from '../types/index.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: any) => Promise<{ requires2FA?: boolean; userId?: string }>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (partial: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    try {
      // First attempt to refresh token via cookie
      const { data: refreshRes } = await api.post('/auth/refresh');
      if (refreshRes.data?.accessToken) {
        setAccessToken(refreshRes.data.accessToken);
        setUser(refreshRes.data.user);
      }
    } catch {
      setUser(null);
      setAccessToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials: any) => {
    const { data } = await api.post('/auth/login', credentials);
    if (data.requires2FA) {
      return { requires2FA: true, userId: data.userId };
    }

    if (data.data?.accessToken) {
      setAccessToken(data.data.accessToken);
      setUser(data.data.user);
    }
    return { requires2FA: false };
  };

  const register = async (userData: any) => {
    const { data } = await api.post('/auth/register', userData);
    if (data.data?.accessToken) {
      setAccessToken(data.data.accessToken);
      setUser(data.data.user);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const updateUser = (partial: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...partial } : null));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
