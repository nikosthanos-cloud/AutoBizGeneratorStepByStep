'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { getStoredAdminUser, STORAGE_KEY } from '@/lib/auth-storage';

export type UserRole = 'ADMIN' | 'OPERATOR' | 'VIEW_ONLY';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (user: User) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
  hasAdminOrOperatorRole: () => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ALLOWED_ROLES: UserRole[] = ['ADMIN', 'OPERATOR'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
  });

  useEffect(() => {
    const stored = getStoredAdminUser();
    if (stored && ALLOWED_ROLES.includes(stored.role as UserRole)) {
      setState({ user: stored as User, isLoading: false });
    } else {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  const login = useCallback((user: User) => {
    setState({ user, isLoading: false });
  }, []);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY);
    setState((prev) => ({ ...prev, user: null }));
  }, []);

  const setUser = useCallback((user: User | null) => {
    setState((prev) => ({ ...prev, user }));
  }, []);

  const hasAdminOrOperatorRole = useCallback(() => {
    return state.user != null && ALLOWED_ROLES.includes(state.user.role);
  }, [state.user]);

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    setUser,
    hasAdminOrOperatorRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
