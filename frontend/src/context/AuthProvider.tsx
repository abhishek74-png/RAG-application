import React, { createContext, useEffect, useState, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { authService } from '../services/auth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: typeof authService.signIn;
  signUp: typeof authService.signUp;
  signInWithOAuth: typeof authService.signInWithOAuth;
  signInWithOtp: typeof authService.signInWithOtp;
  signOut: typeof authService.signOut;
  forgotPassword: typeof authService.forgotPassword;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { session: currentSession, error } = await authService.getSession();
        if (error) throw error;

        setSession(currentSession);
        setUser(currentSession?.user || null);
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const subscription = authService.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user || null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    session,
    loading,
    signIn: authService.signIn,
    signUp: authService.signUp,
    signInWithOAuth: authService.signInWithOAuth,
    signInWithOtp: authService.signInWithOtp,
    signOut: authService.signOut,
    forgotPassword: authService.forgotPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
