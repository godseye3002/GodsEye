"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface UserProfile {
  id: string;
  user_name: string | null;
  email: string;
  credits: number;
  subscription_tier: string;
  total_products_analyzed: number;
  created_at: string;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: unknown }>;
  signUpWithEmail: (email: string, password: string, userName?: string) => Promise<{ error: unknown; alreadyExists: boolean }>;
  signInWithGoogle: () => Promise<{ error: unknown }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: unknown) {
      const errorCode = error && typeof error === 'object' ? (error as Record<string, unknown>).code : undefined;
      const errorMessage = error && typeof error === 'object' ? (error as Record<string, unknown>).message : undefined;
      const isMissingProfile =
        errorCode === 'PGRST116' ||
        errorCode === 'PGRST101' ||
        errorCode === 'PGRST103' ||
        (typeof errorMessage === 'string' && errorMessage.toLowerCase().includes('no rows')) ||
        (typeof errorMessage === 'string' && errorMessage.toLowerCase().includes('not found'));

      if (isMissingProfile) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[AuthService] Profile not found for user. Clearing session.', {
            userId: session?.user?.id,
            timestamp: new Date().toISOString()
          });
        }
        setProfile(null);
        setUser(null);
        setSession(null);
        await supabase.auth.signOut();
        return;
      }

      if (process.env.NODE_ENV !== 'production') {
        console.error('[AuthService] Error fetching profile:', {
          error,
          timestamp: new Date().toISOString()
        });
      }
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[AuthService] Failed to get initial session:', error.message);
        }
        // Force cleanup if session is invalid
        signOut();
        setLoading(false);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Do not block loading on profile fetch; run in background
        fetchProfile(session.user.id).catch((e) => {
          if (process.env.NODE_ENV !== 'production') {
            console.error('[AuthService] Background profile fetch failed:', {
              error: e,
              userId: session?.user?.id,
              timestamp: new Date().toISOString()
            });
          }
        });

        // Update last_login on SIGNED_IN event (includes OAuth)
        if (event === 'SIGNED_IN') {
          try {
            await fetch('/api/auth/update-login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: session.user.id }),
            });
          } catch (loginError) {
            if (process.env.NODE_ENV !== 'production') {
              console.error('[AuthService] Failed to update last login:', {
                error: loginError,
                userId: session?.user?.id,
                timestamp: new Date().toISOString()
              });
            }
          }
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Update last_login on successful sign-in
    if (!error && data.user) {
      try {
        await fetch('/api/auth/update-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: data.user.id }),
        });
      } catch (loginError) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[AuthService] Failed to update last login:', {
            error: loginError,
            userId: data?.user?.id,
            timestamp: new Date().toISOString()
          });
        }
        // Don't block sign-in if this fails
      }
    }

    return { error };
  };

  const signUpWithEmail = async (email: string, password: string, userName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth` : undefined,
        data: {
          user_name: userName,
        },
      },
    });

    // Supabase quirk: if email already exists, `data.user.identities` may be [] with no error
    const userObj = data?.user ? data.user as unknown : {};
    const identities = userObj && typeof userObj === 'object' ? (userObj as Record<string, unknown>).identities : undefined;
    const alreadyExists = !!(data?.user && Array.isArray(identities) && identities.length === 0);
    return { error, alreadyExists } as { error: unknown, alreadyExists: boolean };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' as any });
    } catch { }

    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const m = url.match(/https:\/\/(.*?)\.supabase\.co/i);
      if (m && typeof window !== 'undefined') {
        const ref = m[1];
        const keys = [
          `sb-${ref}-auth-token`,
          `sb-${ref}-auth-token#D`,
        ];
        keys.forEach((k) => {
          try { localStorage.removeItem(k); } catch { }
          try { sessionStorage.removeItem(k); } catch { }
        });
      }
    } catch { }

    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
