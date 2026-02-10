'use client';

import { useEffect, useState } from 'react';

import { BREAKPOINTS } from '@/config';
import { type Breakpoint } from '@/config';

export function useBreakpoint(breakpoint: Breakpoint) {
  const [isAbove, setIsAbove] = useState<boolean>(false);

  useEffect(() => {
    const checkBreakpoint = () => {
      setIsAbove(window.innerWidth >= BREAKPOINTS[breakpoint]);
    };

    checkBreakpoint();

    window.addEventListener('resize', checkBreakpoint);

    return () => window.removeEventListener('resize', checkBreakpoint);
  }, [breakpoint]);

  return isAbove;
}
