'use client';

import { Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { UserMenu } from '@/features/auth/components/common/user-menu';
import { Breadcrumbs } from '@/features/dashboard/components/layout/breadcrumbs';
import { ProjectSelector } from '@/features/dashboard/components/layout/project-selector';
import { useSidebar } from '@/features/dashboard/components/layout/sidebar-provider';
import { usePathname } from '@/i18n/routing';
import { cn } from '@/lib/common/utils';

const Navbar = () => {
  const { setMobileOpen, isDesktop } = useSidebar();
  const t = useTranslations();
  const pathname = usePathname();
  const isDashboard = pathname.startsWith('/dashboard');
  const isSettings = pathname.startsWith('/settings');
  const hasSidebar = isDashboard || isSettings;

  return (
    <nav className="bg-background/80 border-border/80 dashboard:border-b fixed inset-x-0 top-0 z-50 backdrop-blur-md transition-colors duration-300">
      <div className="dashboard:pl-3 dashboard:pr-4 flex h-14 items-center gap-3 px-4">
        {hasSidebar && (
          <Button
            variant="ghost"
            size="icon-md"
            className={cn('-ml-2', 'dashboard:hidden')}
            onClick={() => setMobileOpen(true)}
            aria-label={t('navbar.openMenu')}
          >
            <Menu className="size-5" />
          </Button>
        )}

        {isDesktop && (
          <div
            className="dashboard:flex -ml-1 hidden shrink-0"
            style={{ width: 'calc(var(--sidebar-width-expanded) - 1rem)' }}
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
