'use client';

import { BackButton } from '@/components/ui/back-button';
import { getDashboardBackConfig } from '@/features/dashboard/config/layout';
import { usePathname } from '@/i18n/routing';

/**
 * Renders the dashboard back button when the current route is configured for it.
 * Use at the top of page content so it appears together with the page (avoids layout shift).
 */
export function DashboardPageBack() {
  const pathname = usePathname();
  const config = getDashboardBackConfig(pathname ?? null);

  if (config == null) {
    return null;
  }

  return (
    <div className="mb-2 flex h-9 items-center">
      <BackButton fallbackHref={config.fallbackHref} className="h-9 pl-0" />
    </div>
  );
}
