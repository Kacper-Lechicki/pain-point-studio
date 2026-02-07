'use client';

import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ROUTES } from '@/config';
import { UserMenu } from '@/features/auth/components/common/user-menu';
import { Link, usePathname } from '@/i18n/routing';

const Navbar = () => {
  const t = useTranslations('settings');
  const pathname = usePathname();

  const isSettings = pathname === '/settings';

  return (
    <nav className="bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-6 sm:px-4 lg:px-8">
        <div className="flex items-center">
          {isSettings && (
            <Link
              href={ROUTES.common.dashboard}
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
            >
              <ArrowLeft className="size-4" />
              {t('backToDashboard')}
            </Link>
          )}
        </div>

        <UserMenu />
      </div>
    </nav>
  );
};

export { Navbar };
