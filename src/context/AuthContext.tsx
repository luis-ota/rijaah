import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

interface AuthContextType {
  user: { id: string; email: string } | null;
  session: { access_token: string; user: { id: string; email: string } } | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: { message: string } | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: { message: string } | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [session, setSession] = useState<{ access_token: string; user: { id: string; email: string } } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId: string) {
    const { data } = await supabase.from<Profile>('profiles').select('*').eq('id', userId);
    if (data && data[0]) setProfile(data[0]);
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user.id);
  }

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 5000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      clearTimeout(timeout);
      setSession(session as { access_token: string; user: { id: string; email: string } } | null);
      setUser(session?.user as { id: string; email: string } | null);
      if (session?.user) fetchProfile((session.user as { id: string }).id);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) { clearTimeout(timeout); setLoading(false); }
    });

    const sub = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess as { access_token: string; user: { id: string; email: string } } | null);
      setUser(sess?.user as { id: string; email: string } | null);
      if (sess?.user) {
        fetchProfile((sess.user as { id: string }).id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => { cancelled = true; clearTimeout(timeout); sub.data.subscription.unsubscribe(); };
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? { message: error.message } : null };
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
    return { error: error ? { message: error.message } : null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
