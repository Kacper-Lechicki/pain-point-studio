'use client';

import { useTranslations } from 'next-intl';

import { getCopyrightText } from '@/config/brand';
import { useSidebar } from '@/features/dashboard/components/layout/sidebar-provider';
import {
  DASHBOARD_FOOTER_HEIGHT_CLASS,
  getDashboardContentMarginLeft,
  isBuilderPath,
} from '@/features/dashboard/config/layout';
import { usePathname } from '@/i18n/routing';
import { cn } from '@/lib/common/utils';

export function DashboardFooter() {
  const t = useTranslations();
  const pathname = usePathname();
  const { isDesktop, isPinned, hasSubPanel } = useSidebar();
  const isBuilder = isBuilderPath(pathname ?? null);
  const copyright = getCopyrightText(t);

  const marginLeft =
    isDesktop && !isBuilder ? getDashboardContentMarginLeft(isPinned, hasSubPanel) : undefined;

  return (
    <footer
      className={cn(
        DASHBOARD_FOOTER_HEIGHT_CLASS,
        'border-border bg-background flex shrink-0 items-center justify-center border-t px-4 transition-[margin-left] duration-200 ease-in-out sm:px-6 lg:px-8'
      )}
      style={marginLeft != null ? { marginLeft } : undefined}
      role="contentinfo"
    >
      <span className="text-muted-foreground text-xs">{copyright}</span>
    </footer>
  );
}
