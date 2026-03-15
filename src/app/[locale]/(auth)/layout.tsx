import type { ReactNode } from 'react';

import { HeroHighlight } from '@/components/ui/hero-highlight';
import { AuthToast } from '@/features/auth/components/common/auth-toast';
import { Navbar } from '@/features/auth/components/layout/navbar';

interface AuthGroupLayoutProps {
  children: ReactNode;
}

const AuthGroupLayout = ({ children }: AuthGroupLayoutProps) => {
  return (
    <HeroHighlight
      containerClassName="bg-background min-h-screen w-full overflow-x-hidden"
      className="flex w-full flex-col"
      navbar={<Navbar />}
      showDotsOnMobile={false}
    >
      <div className="pointer-events-none relative flex min-h-screen w-full flex-col *:pointer-events-auto">
        <main
          id="main-content"
          className="flex min-h-0 flex-1 flex-col items-center overflow-auto px-6 pt-22 pb-12 md:pt-32"
        >
          <div className="mx-auto w-full md:max-w-[600px]">
            <div className="lg:border-border/50 lg:bg-card/80 w-full rounded-lg sm:p-4 lg:border lg:p-8 lg:shadow-xl lg:backdrop-blur-sm">
              <AuthToast showNoScriptFallback />
              <div className="flex flex-col space-y-6">{children}</div>
            </div>

            <div className="h-32 shrink-0 md:h-16" aria-hidden="true" />
          </div>
        </main>
      </div>
    </HeroHighlight>
  );
};

export default AuthGroupLayout;
