import { ReactNode } from 'react';

import { HeroHighlight } from '@/components/ui/hero-highlight';
import { PageTransition } from '@/components/ui/page-transition';
import Navbar from '@/features/auth/components/layout/navbar';

interface AuthGroupLayoutProps {
  children: ReactNode;
}

export default function AuthGroupLayout({ children }: AuthGroupLayoutProps) {
  return (
    <HeroHighlight containerClassName="dark bg-background min-h-screen w-full overflow-hidden">
      <div className="pointer-events-none relative z-10 flex min-h-screen w-full flex-col *:pointer-events-auto">
        <Navbar />

        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <PageTransition>
            <div className="lg:border-border/50 lg:bg-card/80 mx-auto w-full max-w-[420px] rounded-xl p-2 sm:p-4 lg:border lg:p-8 lg:shadow-xl lg:backdrop-blur-sm">
              <div className="flex flex-col space-y-6">{children}</div>
            </div>
          </PageTransition>
        </div>
      </div>
    </HeroHighlight>
  );
}
