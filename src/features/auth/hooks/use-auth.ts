'use client';

import { useEffect, useRef, useState } from 'react';

import { createBrowserAuthProvider } from '@/lib/providers/client';
import type { AppUser } from '@/lib/providers/types';

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const authRef = useRef(createBrowserAuthProvider());

  useEffect(() => {
    const auth = authRef.current;

    void auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = auth.onAuthStateChange!((_event, user) => {
      setUser(user);
      setLoading(false);
    });

    const handleRefresh = () => {
      void auth.getUser().then(({ data }) => setUser(data?.user ?? null));
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
