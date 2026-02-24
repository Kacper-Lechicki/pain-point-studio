'use client';

import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { AppRoute } from '@/config/routes';
import { useBreadcrumbContext } from '@/features/dashboard/components/layout/breadcrumb-context';
import { Link, usePathname } from '@/i18n/routing';
import { cn } from '@/lib/common/utils';

const SEGMENT_KEYS: Record<string, string> = {
  dashboard: 'dashboard',
  research: 'research',
  projects: 'projects',
  settings: 'settings',
  profile: 'profile',
  preview: 'preview',
  new: 'new',
  create: 'create',
  archive: 'archive',
};

const COLLAPSED_PATHS: Record<string, string> = {
  'profile/preview': 'profile',
};

interface Crumb {
  label: string;
  href: string;
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const t = useTranslations();
  const breadcrumbCtx = useBreadcrumbContext();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  const crumbs: Crumb[] = [];
  let i = 0;

  while (i < segments.length) {
    const segment = segments[i] as string;

    if (i < segments.length - 1) {
      const pair = `${segment}/${segments[i + 1]}`;
      const collapsedKey = COLLAPSED_PATHS[pair];

      if (collapsedKey) {
        const href = '/' + segments.slice(0, i + 2).join('/');

        crumbs.push({ label: t(`breadcrumbs.${collapsedKey}` as Parameters<typeof t>[0]), href });
        i += 2;

        continue;
      }
    }

    const href = '/' + segments.slice(0, i + 1).join('/');
    const key = SEGMENT_KEYS[segment];

    if (key) {
      crumbs.push({ label: t(`breadcrumbs.${key}` as Parameters<typeof t>[0]), href });
    } else {
      const dynamicLabel = breadcrumbCtx?.segments[segment];

      if (dynamicLabel) {
        crumbs.push({ label: dynamicLabel, href });
      }
    }

    i++;
  }

  return (
    <div className={cn('min-w-0 overflow-hidden', 'hidden sm:block')}>
      <nav aria-label="Breadcrumb">
        <ol className="flex min-w-0 items-center gap-1.5 text-sm sm:gap-1 sm:text-sm">
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;

            return (
              <li
                key={crumb.href}
                className={cn(
                  'flex items-center gap-1.5 sm:gap-1',
                  isLast ? 'min-w-0' : 'shrink-0'
                )}
              >
                {index > 0 && (
                  <ChevronRight
                    className="text-muted-foreground size-4 shrink-0 sm:size-3.5"
                    aria-hidden="true"
                  />
                )}
                {isLast ? (
                  <span className="text-foreground truncate font-medium">{crumb.label}</span>
                ) : (
                  <Link
                    href={crumb.href as AppRoute}
                    className="text-muted-foreground hover:text-foreground shrink-0 whitespace-nowrap transition-colors"
                  >
                    {crumb.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
