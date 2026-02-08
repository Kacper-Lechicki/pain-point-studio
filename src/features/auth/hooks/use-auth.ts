'use client';

import { useEffect, useRef, useState } from 'react';

import { User } from '@supabase/supabase-js';

import { createClient } from '@/lib/supabase/client';

/**
 * Client-side hook to access the current authenticated user.
 * Subscribes to Supabase auth state changes in real-time.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const supabase = supabaseRef.current;

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const handleRefresh = () => {
      supabase.auth.getUser().then(({ data }) => setUser(data.user));
    };

    window.addEventListener('auth:refresh', handleRefresh);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('auth:refresh', handleRefresh);
    };
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
  };
}
