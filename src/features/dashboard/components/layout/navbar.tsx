'use client';

import { Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { BRAND, ROUTES } from '@/config';
import { UserMenu } from '@/features/auth/components/common/user-menu';
import { CommandPalette } from '@/features/command-palette/components/command-palette';
import { CommandPaletteTrigger } from '@/features/command-palette/components/command-palette-trigger';
import { useCommandPalette } from '@/features/command-palette/hooks/use-command-palette';
import { Breadcrumbs } from '@/features/dashboard/components/layout/breadcrumbs';
import { useSidebar } from '@/features/dashboard/components/layout/sidebar-provider';
import { DYNAMIC_SIDEBAR_ITEMS } from '@/features/dashboard/config/navigation';
import Link from '@/i18n/link';
import { usePathname } from '@/i18n/routing';
import { cn } from '@/lib/common/utils';

const Navbar = () => {
  const { setMobileOpen } = useSidebar();
  const t = useTranslations();
  const pathname = usePathname();
  const { open, setOpen } = useCommandPalette();

  const hasSidebar =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/settings') ||
    DYNAMIC_SIDEBAR_ITEMS.some((item) => pathname === item.path);

  return (
    <>
      <nav className="bg-background/80 border-border/80 dashboard:border-b fixed inset-x-0 top-0 z-50 backdrop-blur-md transition-colors duration-300">
        <div className="dashboard:px-4 flex h-14 items-center gap-3 px-4">
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

          <Link
            href={ROUTES.common.dashboard}
            className="text-foreground hover:text-foreground/90 xs:block hidden shrink-0 truncate text-lg font-semibold tracking-tight transition-colors"
          >
            {t(BRAND.name)}
          </Link>

          <div className="min-w-0 flex-1 pl-[17px]">
            <Breadcrumbs />
          </div>

          <CommandPaletteTrigger onOpen={() => setOpen(true)} />

          <UserMenu />
        </div>
      </nav>

      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  );
};

export { Navbar };
