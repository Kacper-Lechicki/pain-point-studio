import { ReactNode } from 'react';

import { HeroHighlight } from '@/components/ui/hero-highlight';
import { PageTransition } from '@/components/ui/page-transition';
import Navbar from '@/features/auth/components/layout/navbar';

interface AuthGroupLayoutProps {
  children: ReactNode;
}

const AuthGroupLayout = ({ children }: AuthGroupLayoutProps) => {
  return (
    <HeroHighlight
      containerClassName="dark bg-background min-h-screen w-full overflow-hidden"
      className="w-full"
      showDotsOnMobile={false}
    >
      <div className="pointer-events-none relative z-10 flex min-h-screen w-full flex-col *:pointer-events-auto">
        <Navbar />

        <main className="page-top-spacing flex flex-1 flex-col items-center px-6 pb-12">
          <PageTransition className="w-full">
            <div className="lg:border-border/50 lg:bg-card/80 mx-auto w-full rounded-xl sm:p-4 md:w-[600px] lg:border lg:p-8 lg:shadow-xl lg:backdrop-blur-sm">
              <div className="flex flex-col space-y-6">{children}</div>
            </div>
          </PageTransition>
        </main>
      </div>
    </HeroHighlight>
  );
};

export default AuthGroupLayout;
