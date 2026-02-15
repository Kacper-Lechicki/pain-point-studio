'use client';

import { useEffect, useState } from 'react';

/** Return the current URL hash without the leading '#', or '' on the server. */
export function getHash(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.location.hash.replace('#', '');
}

/** Reactive hook that tracks the URL hash fragment. Listens to hashchange and popstate events. */
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
