'use client';

import dynamic from 'next/dynamic';

export const BackgroundRippleEffect = dynamic(
  () =>
    import('@/components/ui/background-ripple-effect').then((mod) => ({
      default: mod.BackgroundRippleEffect,
    })),
  { ssr: false }
);
