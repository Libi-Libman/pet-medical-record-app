import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// A fully-fake session for local development only, so the app can be built
// and clicked through without going through real Supabase Auth every time.
// __DEV__ is false in any production build, so signInAsMockUser is never
// reachable there — see login.tsx. RLS-backed screens (pet-list) won't
// return real data under this session since it has no real Supabase JWT;
// that's expected, everything else in the app is still mock data anyway.
const MOCK_SESSION = {
  user: { id: 'dev-mock-user', email: 'dev@example.com' },
} as unknown as Session;

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  sendCode: (email: string) => Promise<{ error: string | null }>;
  verifyCode: (email: string, code: string) => Promise<{ error: string | null }>;
  signInAsMockUser: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMockSession, setIsMockSession] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setIsMockSession(false);
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Passwordless sign-in: email a 6-digit code (no deep-link / redirect handling needed,
  // which is what makes magic-link auth annoying on native).
  const sendCode = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    return { error: error?.message ?? null };
  };

  const verifyCode = async (email: string, code: string) => {
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
    return { error: error?.message ?? null };
  };

  const signInAsMockUser = () => {
    setIsMockSession(true);
    setSession(MOCK_SESSION);
  };

  const signOut = async () => {
    if (isMockSession) {
      setIsMockSession(false);
      setSession(null);
      return;
    }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ session, loading, sendCode, verifyCode, signInAsMockUser, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
