import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, LoginPayload, SignupPayload } from '../types/auth';
import {
  getCurrentUser,
  login as apiLogin,
  signup as apiSignup,
  logout as apiLogout,
} from '../api/auth';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { success, error } = useToast();

  const refreshUser = useCallback(async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const res = await apiLogin(payload);
      await refreshUser();
      success(res.message || 'Welcome back!', `Logged in as ${payload.username}`);
    } catch (err: any) {
      setIsLoading(false);
      const msg = err?.message || 'Login failed. Please check your credentials.';
      error('Authentication Error', msg);
      throw err;
    }
  };

  const signup = async (payload: SignupPayload) => {
    setIsLoading(true);
    try {
      const res = await apiSignup(payload);
      // Automatically log in after signup
      await apiLogin({ username: payload.username, password: payload.password });
      await refreshUser();
      success(res.messages || 'Account created successfully!', `Welcome to ConvergeDesk, ${payload.username}`);
    } catch (err: any) {
      setIsLoading(false);
      const msg = err?.message || 'Failed to create account.';
      error('Sign Up Error', msg);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
      setUser(null);
      success('Logged out successfully');
    } catch {
      // Even if network failed, clear local state
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
