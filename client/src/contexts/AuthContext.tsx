import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

interface UserData {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  currency: string;
  timezone: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    compactMode: boolean;
    weekStartsOn: number;
  };
  createdAt: string;
}

interface AuthContextValue {
  user: UserData | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchUser() {
    try {
      const res = await api.get<{ data: UserData }>('/api/auth/me');
      setUser(res.data.data ?? null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    try {
      await api.post('/api/auth/logout');
    } finally {
      setUser(null);
      window.location.href = '/login';
    }
  }

  useEffect(() => { void fetchUser(); }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, logout, refetchUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
