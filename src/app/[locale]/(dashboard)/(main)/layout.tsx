import type { ReactNode } from 'react';

import { BackButton } from '@/components/ui/back-button';

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex-1">
      <div className="container mx-auto px-6 pt-6 pb-8 sm:px-4 md:pt-10 lg:px-8">
        <div className="mb-6 md:mb-10 lg:hidden">
          <BackButton />
        </div>

        {children}
      </div>
    </main>
  );
}
