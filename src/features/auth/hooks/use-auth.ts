'use client';

import { useEffect, useRef, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import type { AppUser } from '@/lib/supabase/helpers';
import { mapSupabaseUser } from '@/lib/supabase/user-mapper';

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const supabase = supabaseRef.current;

    void supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ? mapSupabaseUser(user) : null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? mapSupabaseUser(session.user) : null);
      setLoading(false);
    });

    const handleRefresh = () => {
      void supabase.auth
        .getUser()
        .then(({ data: { user } }) => setUser(user ? mapSupabaseUser(user) : null));
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
