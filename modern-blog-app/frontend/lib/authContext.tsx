'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from './supabaseClient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: 'admin' | 'author' | 'user' | null;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<unknown>;
  signIn: (email: string, password: string) => Promise<unknown>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<unknown>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getConfiguredAdminEmails(): string[] {
  return (process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return getConfiguredAdminEmails().includes(email.trim().toLowerCase());
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'author' | 'user' | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      if (!isSupabaseConfigured) {
        setLoading(false);
        setSession(null);
        setUser(null);
        setUserRole(null);
        return;
      }

      try {
        const { data } = await supabase.auth.refreshSession();
        const currentSession: Session | null = data.session;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.access_token) {
          await fetchUserRole(currentSession.access_token);
        } else {
          setUserRole(null);
        }
      } catch (err) {
        setSession(null);
        setUser(null);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    loadSession();

    if (!isSupabaseConfigured) {
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, newSession: Session | null) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.access_token) {
          await fetchUserRole(newSession.access_token);
        } else {
          setUserRole(null);
        }
        setLoading(false);
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const fetchUserRole = async (accessToken: string) => {
    try {
      const response = await fetch('/api/auth/role', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        setUserRole('user');
        return;
      }

      const result = await response.json();
      const role = result.role;
      if (role === 'admin' || role === 'author' || role === 'user') {
        setUserRole(role === 'admin' || isAdminEmail((await supabase.auth.getUser(accessToken)).data.user?.email) ? 'admin' : role);
        return;
      }

      const { data } = await supabase.auth.getUser(accessToken);
      setUserRole(isAdminEmail(data.user?.email) ? 'admin' : 'user');
    } catch (err) {
      try {
        const { data } = await supabase.auth.getUser(accessToken);
        setUserRole(isAdminEmail(data.user?.email) ? 'admin' : 'user');
      } catch {
        setUserRole('user');
      }
    }
  };

  const signUp: AuthContextType['signUp'] = async (email, password, metadata) => {
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase is not configured');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata || {},
        },
      });

      if (error) throw error;

      if (data.user) {
        await supabase.from('user_roles').insert([
          {
            user_id: data.user.id,
            role: 'user',
            created_at: new Date(),
          },
        ] as never);
      }

      return data as unknown;
    } catch (err) {
      throw err;
    }
  };

  const signIn: AuthContextType['signIn'] = async (email, password) => {
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase is not configured');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return data as unknown;
    } catch (err) {
      throw err;
    }
  };

  const signOut: AuthContextType['signOut'] = async () => {
    try {
      if (!isSupabaseConfigured) {
        setSession(null);
        setUser(null);
        setUserRole(null);
        return;
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      throw err;
    }
  };

  const resetPassword: AuthContextType['resetPassword'] = async (email) => {
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase is not configured');
      }

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;
      return data as unknown;
    } catch (err) {
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, userRole, signUp, signIn, signOut, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
