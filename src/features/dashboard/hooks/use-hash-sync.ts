'use client';

import { useEffect, useState } from 'react';

export function getHash(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.location.hash.replace('#', '');
}

export function useHashSync(): string {
  const [hash, setHash] = useState('');

  useEffect(() => {
    queueMicrotask(() => setHash(getHash()));

    const sync = () => setHash(getHash());

    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);

    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('popstate', sync);
    };
  }, []);

  return hash;
}
