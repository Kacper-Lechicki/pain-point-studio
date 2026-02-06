'use client';

import { useTranslations } from 'next-intl';

import { BRAND } from '@/config';
import { ROUTES } from '@/config';
import { UserMenu } from '@/features/auth/components/common/user-menu';
import { Link } from '@/i18n/routing';

const Navbar = () => {
  const t = useTranslations();

  return (
    <nav className="bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-6 sm:px-4 lg:px-8">
        <Link href={ROUTES.common.dashboard} className="text-lg font-semibold tracking-tight">
          {t(BRAND.name)}
        </Link>

        <UserMenu />
      </div>
    </nav>
  );
};

export { Navbar };
