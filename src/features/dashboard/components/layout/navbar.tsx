'use client';

import { Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { UserMenu } from '@/features/auth/components/common/user-menu';
import { usePathname } from '@/i18n/routing';
import { cn } from '@/lib/common/utils';

import { Breadcrumbs } from './breadcrumbs';
import { ProjectSelector } from './project-selector';
import { useSidebar } from './sidebar-provider';

const Navbar = () => {
  const { setMobileOpen, isDesktop } = useSidebar();
  const t = useTranslations('navbar');
  const pathname = usePathname();
  const isDashboard = pathname.startsWith('/dashboard');
  const isSettings = pathname.startsWith('/settings');
  const hasSidebar = isDashboard || isSettings;

  return (
    <nav className="bg-background/80 border-border dashboard:border-b fixed inset-x-0 top-0 z-50 backdrop-blur-md">
      <div className="dashboard:pl-3 dashboard:pr-4 flex h-14 items-center gap-3 px-4">
        {hasSidebar && (
          <Button
            variant="ghost"
            size="icon-md"
            className={cn('-ml-2', 'dashboard:hidden')}
            onClick={() => setMobileOpen(true)}
            aria-label={t('openMenu')}
          >
            <Menu className="size-5" />
          </Button>
        )}

        {isDesktop && (
          <div
            className="dashboard:flex hidden shrink-0"
            style={{ width: 'calc(var(--sidebar-width-expanded) - 0.75rem)' }}
          >
            <ProjectSelector className="w-full" />
          </div>
        )}

        <div className="min-w-0 flex-1 pl-1">
          <Breadcrumbs />
        </div>

        <UserMenu />
      </div>
    </nav>
  );
};

export { Navbar };
