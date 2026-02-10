'use client';

import { Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { UserMenu } from '@/features/auth/components/common/user-menu';
import { usePathname } from '@/i18n/routing';

import { Breadcrumbs } from './breadcrumbs';
import { ProjectSelector } from './project-selector';
import { useSidebar } from './sidebar-provider';

const Navbar = () => {
  const { setMobileOpen } = useSidebar();
  const t = useTranslations('navbar');
  const pathname = usePathname();
  const hasSidebar = pathname.startsWith('/dashboard');

  return (
    <nav className="bg-background/80 border-border fixed inset-x-0 top-0 z-50 backdrop-blur-md lg:border-b">
      <div
        className={`flex h-14 items-center gap-3 px-4 ${!hasSidebar ? 'container mx-auto sm:px-4 lg:px-8' : ''}`}
      >
        {hasSidebar && (
          <Button
            variant="ghost"
            size="icon-md"
            className="-ml-2 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label={t('openMenu')}
          >
            <Menu className="size-5" />
          </Button>
        )}

        <div className="hidden sm:flex">
          <ProjectSelector />
        </div>

        <Separator orientation="vertical" className="hidden h-5! sm:block" />

        <div className="min-w-0 flex-1">
          <Breadcrumbs />
        </div>

        <UserMenu />
      </div>
    </nav>
  );
};

export { Navbar };
