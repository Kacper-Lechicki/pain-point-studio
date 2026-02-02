'use client';

import { useEffect, useState } from 'react';

import { Globe, Menu, User, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { BRAND, getCopyrightText } from '@/config/brand';
import { NAV_LINKS, NavLink } from '@/config/marketing';
import { ROUTES } from '@/config/routes';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';

const Navbar = () => {
  const t = useTranslations();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isDesktop = useBreakpoint('lg');

  const brandName = t(BRAND.name);
  const copyrightText = getCopyrightText(t);
  const signInLabel = t('Common.signIn');
  const exploreLabel = t('Common.explore');

  if (isDesktop && isMobileMenuOpen) {
    setIsMobileMenuOpen(false);
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <nav
      className={cn(
        'sticky top-0 z-50 border-b backdrop-blur-md transition-colors duration-300',
        isMobileMenuOpen ? 'bg-background' : 'bg-background/80'
      )}
    >
      <div className="container mx-auto flex h-16 items-center px-6 sm:px-4 lg:px-8">
        <div className="flex flex-1 items-center justify-start">
          <Link href={ROUTES.marketing.home} className="text-lg font-semibold tracking-tight">
            {brandName}
          </Link>
        </div>

        <div className="hidden flex-1 items-center justify-center lg:flex">
          <div className="flex items-center gap-6">
            {NAV_LINKS.map((link: NavLink, index: number) =>
              link.disabled ? (
                <span
                  key={`nav-link-disabled-${index}`}
                  className="text-muted-foreground/50 cursor-not-allowed text-sm font-medium"
                >
                  {t(link.label)}
                </span>
              ) : (
                <Link
                  key={`nav-link-${index}`}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
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
            <Button className="gap-2" asChild>
              <Link href={ROUTES.auth.signIn}>
                {signInLabel}
                <User className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>

            <Button className="group gap-2" variant="secondary" asChild>
              <Link href={ROUTES.app.explore}>
                {exploreLabel}
                <Globe
                  className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12"
                  aria-hidden="true"
                />
              </Link>
            </Button>
          </div>

          <div className="flex lg:hidden">
            <Button
              variant="ghost"
              size="icon-lg"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="size-6" aria-hidden="true" />
              ) : (
                <Menu className="size-6" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'bg-background fixed top-16 right-0 left-0 z-50 flex h-[calc(100dvh-4rem)] flex-col overflow-y-auto p-6 transition-all duration-300 ease-in-out lg:hidden',
          isMobileMenuOpen
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none -translate-y-4 opacity-0'
        )}
      >
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <Button className="w-full justify-center gap-2" size="lg" asChild>
              <Link href={ROUTES.auth.signIn} onClick={() => setIsMobileMenuOpen(false)}>
                {signInLabel}
                <User className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>

            <Button variant="secondary" className="w-full justify-center gap-2" size="lg" asChild>
              <Link href={ROUTES.app.explore} onClick={() => setIsMobileMenuOpen(false)}>
                {exploreLabel}
                <Globe className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <div className="flex flex-col items-start gap-4">
            {NAV_LINKS.map((link: NavLink, index: number) =>
              link.disabled ? (
                <span
                  key={`mobile-nav-disabled-${index}`}
                  className="text-muted-foreground/50 cursor-not-allowed py-2 text-lg font-medium"
                >
                  {t(link.label)}
                </span>
              ) : (
                <Link
                  key={`mobile-nav-${index}`}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground py-2 text-lg font-medium transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t(link.label)}
                </Link>
              )
            )}
          </div>
        </div>

        <div className="mt-auto border-t pt-6">
          <p className="text-muted-foreground text-center text-sm">{copyrightText}</p>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
