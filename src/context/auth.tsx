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
  isMockSession: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>;
  completePasswordReset: (newPassword: string) => Promise<{ error: string | null }>;
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

  // Password-based account creation. If your Supabase project has "Confirm
  // email" turned on (Authentication settings), signUp succeeds but returns
  // no session until the person clicks the confirmation link in their inbox
  // — needsConfirmation tells the UI to show that message instead of
  // treating this as already signed in.
  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null, needsConfirmation: !error && !data.session };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  // Sends a password-reset email with a link back into the app
  // (petapp://reset-password). The link carries short-lived recovery
  // tokens; reset-password.tsx turns them into a real session.
  const requestPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'petapp://reset-password',
    });
    return { error: error?.message ?? null };
  };

  // Called from reset-password.tsx once a recovery session is active.
  const completePasswordReset = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
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
      value={{
        session,
        loading,
        isMockSession,
        signUp,
        signIn,
        requestPasswordReset,
        completePasswordReset,
        signInAsMockUser,
        signOut,
      }}
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
