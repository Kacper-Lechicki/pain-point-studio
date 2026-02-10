'use client';

import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { AppRoute } from '@/config/routes';
import { Link, usePathname } from '@/i18n/routing';
import { cn } from '@/lib/common/utils';

/** Known URL segments → breadcrumbs namespace keys */
const SEGMENT_KEYS: Record<string, string> = {
  dashboard: 'dashboard',
  surveys: 'surveys',
  analytics: 'analytics',
  settings: 'settings',
  profile: 'profile',
  preview: 'preview',
};

/**
 * Multi-segment paths that should collapse into a single breadcrumb.
 * E.g. "/profile/preview" → single "Profile" crumb instead of "Profile > Preview".
 */
const COLLAPSED_PATHS: Record<string, string> = {
  'profile/preview': 'profile',
};

interface Crumb {
  label: string;
  href: string;
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const t = useTranslations('breadcrumbs');

  // Split pathname into segments, e.g. "/dashboard/surveys" → ["dashboard", "surveys"]
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  type BreadcrumbKey = Parameters<typeof t>[0];

  // Build crumbs, collapsing known multi-segment paths
  const crumbs: Crumb[] = [];
  let i = 0;

  while (i < segments.length) {
    const segment = segments[i] as string;

    // Check if the next two segments should collapse
    if (i < segments.length - 1) {
      const pair = `${segment}/${segments[i + 1]}`;
      const collapsedKey = COLLAPSED_PATHS[pair];

      if (collapsedKey) {
        const href = '/' + segments.slice(0, i + 2).join('/');
        crumbs.push({ label: t(collapsedKey as BreadcrumbKey), href });
        i += 2;
        continue;
      }
    }

    const href = '/' + segments.slice(0, i + 1).join('/');
    const key = SEGMENT_KEYS[segment];
    const label = key ? t(key as BreadcrumbKey) : segment;
    crumbs.push({ label, href });
    i++;
  }

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1 text-sm">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <li key={crumb.href} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="text-muted-foreground size-3.5 shrink-0" />}
              {isLast ? (
                <span className="text-foreground font-medium">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href as AppRoute}
                  className={cn(
                    'text-muted-foreground hover:text-foreground transition-colors',
                    index === 0 ? 'inline' : 'hidden sm:inline'
                  )}
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
