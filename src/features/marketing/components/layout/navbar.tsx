'use client';

import { useEffect, useState } from 'react';

import { Globe, Menu, User as UserIcon, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { LoadingLink } from '@/components/ui/loading-link';
import { BRAND, ROUTES, getCopyrightText } from '@/config';
import { NAV_LINKS } from '@/features/marketing/config';
import { useBreakpoint } from '@/hooks/common/use-breakpoint';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/common/utils';

const Navbar = () => {
  const t = useTranslations();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isDesktop = useBreakpoint('lg');
  const showMobileMenu = !isDesktop && isMobileMenuOpen;
  const brandName = t(BRAND.name);
  const copyrightText = getCopyrightText(t);
  const exploreLabel = t('common.explore');

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showMobileMenu]);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 backdrop-blur-md transition-colors duration-300',
        showMobileMenu ? 'bg-background' : 'bg-background/80'
      )}
    >
      <nav className="container mx-auto flex h-16 items-center px-6 sm:px-4 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center justify-start">
          <Link
            href={ROUTES.common.home}
            className="truncate text-lg font-semibold tracking-tight"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {brandName}
          </Link>
        </div>

        <div className="hidden flex-1 items-center justify-center lg:flex">
          <div className="flex items-center gap-6">
            {NAV_LINKS.map((link, index) =>
              link.disabled ? (
                <span
                  key={`nav-link-disabled-${index}`}
                  className="text-disabled-foreground cursor-not-allowed text-sm font-medium"
                >
                  {t(link.label)}
                </span>
              ) : (
                <Link
                  key={`nav-link-${index}`}
                  href={link.href}
                  className="text-muted-foreground md:hover:text-foreground text-sm font-medium transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t(link.label)}
                </Link>
              )
            )}
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end gap-4">
          <div className="hidden items-center gap-4 lg:flex">
            <Button asChild>
              <LoadingLink
                href={ROUTES.auth.signIn}
                icon={<UserIcon className="size-4" aria-hidden="true" />}
              >
                {t('common.signIn')}
              </LoadingLink>
            </Button>

            <Button className="group gap-2" variant="secondary" asChild>
              <LoadingLink href={ROUTES.auth.signIn}>
                {exploreLabel}
                <Globe
                  className="size-4 transition-transform duration-300 md:group-hover:rotate-12"
                  aria-hidden="true"
                />
              </LoadingLink>
            </Button>
          </div>

          <div className="flex lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              aria-label={t('common.aria.toggleMenu')}
            >
              {showMobileMenu ? (
                <X className="size-6" aria-hidden="true" />
              ) : (
                <Menu className="size-6" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </nav>

      <div
        className={cn(
          'bg-background fixed top-16 right-0 left-0 z-50 flex h-[calc(100dvh-4rem)] flex-col transition-all duration-300 ease-in-out lg:hidden',
          showMobileMenu
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none -translate-y-4 opacity-0'
        )}
      >
        <div className="px-6 pt-6 pb-4">
          <div className="flex gap-3">
            <Button asChild className="flex-1 justify-center">
              <LoadingLink
                href={ROUTES.auth.signIn}
                icon={<UserIcon className="size-4" aria-hidden="true" />}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('common.signIn')}
              </LoadingLink>
            </Button>

            <Button variant="secondary" className="flex-1 justify-center gap-2" asChild>
              <LoadingLink href={ROUTES.auth.signIn} onClick={() => setIsMobileMenuOpen(false)}>
                {exploreLabel}
                <Globe className="size-4" aria-hidden="true" />
              </LoadingLink>
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="flex flex-col items-start gap-2">
            {NAV_LINKS.map((link, index) =>
              link.disabled ? (
                <span
                  key={`mobile-nav-disabled-${index}`}
                  className="text-disabled-foreground cursor-not-allowed py-2 text-lg font-medium"
                >
                  {t(link.label)}
                </span>
              ) : (
                <Link
                  key={`mobile-nav-${index}`}
                  href={link.href}
                  className="text-muted-foreground md:hover:text-foreground py-2 text-lg font-medium transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t(link.label)}
                </Link>
              )
            )}
          </div>
        </div>

        <div className="mt-auto border-t p-6">
          <p className="text-muted-foreground text-center text-sm">{copyrightText}</p>
        </div>
      </div>
    </header>
  );
};

export { Navbar };
