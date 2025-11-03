import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export function useSupabaseAuth() {
  const supabase = getSupabaseClient();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const session = supabase.auth.getSession();
    // supabase.auth.getSession() returns a promise in v2
    session.then(res => {
      // @ts-ignore
      setUser(res?.data?.session?.user ?? null);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      // @ts-ignore
      setUser(session?.user ?? null);
    });

    return () => {
      try { data.subscription.unsubscribe(); } catch { }
    };
  }, [supabase]);

  async function signInWithEmail(email: string) {
    return supabase.auth.signInWithOtp({ email });
  }

  async function signOut() {
    return supabase.auth.signOut();
  }

  return {
    user,
    signInWithEmail,
    signOut,
  };
}
