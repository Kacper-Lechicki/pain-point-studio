'use client';

import { useEffect, useState } from 'react';

import { BREAKPOINTS } from '@/config';
import { type Breakpoint } from '@/config';

/**
 * Hook to check if the current window width is at least the given breakpoint
 */
export function useBreakpoint(breakpoint: Breakpoint) {
  const [isAbove, setIsAbove] = useState<boolean>(false);

  useEffect(() => {
    const checkBreakpoint = () => {
      setIsAbove(window.innerWidth >= BREAKPOINTS[breakpoint]);
    };

    // Initial check
    checkBreakpoint();

    window.addEventListener('resize', checkBreakpoint);

    return () => window.removeEventListener('resize', checkBreakpoint);
  }, [breakpoint]);

  return isAbove;
}

/**
 * Hook to get the current window width (for cases where simple breakpoint check isn't enough)
 */
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}
