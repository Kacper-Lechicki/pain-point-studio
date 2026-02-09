'use client';

import { BackButton } from '@/components/ui/back-button';
import { UserMenu } from '@/features/auth/components/common/user-menu';
import { usePathname } from '@/i18n/routing';

const Navbar = () => {
  const pathname = usePathname();

  const showBackButton = pathname !== '/dashboard';

  return (
    <nav className="bg-background/80 sticky top-0 z-50 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-6 sm:px-4 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center">{showBackButton && <BackButton />}</div>

        <UserMenu />
      </div>
    </nav>
  );
};

export { Navbar };
