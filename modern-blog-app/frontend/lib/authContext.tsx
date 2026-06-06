'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'author' | 'user' | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      const currentSession: Session | null = data.session;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        await fetchUserRole(currentSession.user.id);
      }
      setLoading(false);
    };

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, newSession: Session | null) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          await fetchUserRole(newSession.user.id);
        } else {
          setUserRole(null);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) {
        setUserRole('user');
      } else {
        setUserRole((data as any)?.role ?? 'user');
      }
    } catch (err) {
      setUserRole('user');
    }
  };

  const signUp: AuthContextType['signUp'] = async (email, password, metadata) => {
    try {
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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      throw err;
    }
  };

  const resetPassword: AuthContextType['resetPassword'] = async (email) => {
    try {
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
