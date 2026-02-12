'use client';

import { useEffect, useState } from 'react';

import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ROUTES } from '@/config';
import type { AppRoute } from '@/config/routes';
import { useRouter } from '@/i18n/routing';

const NAV_DEPTH_KEY = '__nav_depth';

function getNavDepth(): number {
  try {
    return Number(sessionStorage.getItem(NAV_DEPTH_KEY)) || 0;
  } catch {
    return 0;
  }
}

function setNavDepth(n: number) {
  try {
    sessionStorage.setItem(NAV_DEPTH_KEY, String(Math.max(0, n)));
  } catch {}
}

if (typeof window !== 'undefined' && !('navigation' in window)) {
  const originalPushState = history.pushState.bind(history);

  history.pushState = function (...args: Parameters<typeof history.pushState>) {
    const currentPath = location.pathname;

    originalPushState(...args);

    if (location.pathname !== currentPath) {
      setNavDepth(getNavDepth() + 1);
    }
  };

  let lastPathname = location.pathname;

  window.addEventListener('popstate', () => {
    if (location.pathname !== lastPathname) {
      setNavDepth(getNavDepth() - 1);
      lastPathname = location.pathname;
    }
  });

  const navEntry = performance.getEntriesByType('navigation')[0] as
    | PerformanceNavigationTiming
    | undefined;

  if (navEntry && navEntry.type !== 'back_forward') {
    setNavDepth(0);
  }
}

function canGoBack(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  if ('navigation' in window) {
    return Boolean((window.navigation as { canGoBack?: boolean }).canGoBack);
  }

  return getNavDepth() > 0;
}

interface BackButtonProps {
  fallbackHref?: AppRoute;
}

const BackButton = ({ fallbackHref }: BackButtonProps) => {
  const t = useTranslations();
  const router = useRouter();
  const [goBack, setGoBack] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setGoBack(canGoBack()));

    return () => cancelAnimationFrame(raf);
  }, []);

  const handleClick = () => {
    if (goBack) {
      router.back();
    } else {
      router.push(fallbackHref ?? ROUTES.common.dashboard);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-muted-foreground md:hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      {t('common.goBack')}
    </button>
  );
};

export { BackButton };
