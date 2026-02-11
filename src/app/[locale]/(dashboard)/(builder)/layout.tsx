import type { ReactNode } from 'react';

import { MobileNav } from '@/features/dashboard/components/layout/mobile-nav';

export default function BuilderLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <MobileNav />
      <main className="min-w-0 flex-1">{children}</main>
    </>
  );
}
