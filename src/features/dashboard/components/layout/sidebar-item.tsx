'use client';

import { ChevronRight, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { AppRoute } from '@/config/routes';
import { Link, usePathname } from '@/i18n/routing';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

const BASE_CLASSES =
  'flex items-center rounded-lg border border-transparent text-sm font-medium whitespace-nowrap transition-all duration-200 ease-in-out ' +
  'text-sidebar-foreground/70 ' +
  'data-[state=active]:bg-sidebar-primary-active data-[state=active]:text-sidebar-primary-foreground ' +
  'data-[state=inactive]:md:hover:text-sidebar-foreground data-[state=inactive]:md:hover:border-sidebar-foreground/25 data-[state=inactive]:md:hover:border-dashed';

interface SidebarItemProps {
  labelKey: MessageKey;
  icon: LucideIcon;
  href: AppRoute;
  activePrefix?: string | undefined;
  additionalPrefixes?: readonly string[] | undefined;
  isExpanded: boolean;
  hasSubNav?: boolean | undefined;
  showChevron?: boolean | undefined;
  disabled?: boolean | undefined;
}

export function SidebarItem({
  labelKey,
  icon: Icon,
  href,
  activePrefix,
  additionalPrefixes,
  isExpanded,
  hasSubNav,
  showChevron,
  disabled,
}: SidebarItemProps) {
  const pathname = usePathname();
  const t = useTranslations();
  const matchPath = activePrefix ?? href;

  let isActive = hasSubNav
    ? pathname === matchPath || pathname.startsWith(matchPath + '/')
    : pathname === matchPath;

  if (!isActive && hasSubNav && additionalPrefixes) {
    isActive = additionalPrefixes.some((p) => pathname === p || pathname.startsWith(p + '/'));
  }

  const label = t(labelKey);

  const classes = cn(
    BASE_CLASSES,
    'h-8 min-h-8',
    isExpanded
      ? 'w-full justify-start gap-2 px-2.5'
      : 'w-8 min-w-8 shrink-0 justify-center gap-0 px-0',
    disabled && 'opacity-50 pointer-events-none'
  );

  const content = (
    <>
      <Icon className="size-4 shrink-0" aria-hidden />

      <span
        className={cn(
          'min-w-0 truncate transition-opacity duration-200',
          isExpanded ? 'flex-1 opacity-100' : 'w-0 flex-none opacity-0'
        )}
      >
        {label}
      </span>

      {isExpanded && (hasSubNav || showChevron) && (
        <ChevronRight className="size-4 shrink-0 opacity-50" aria-hidden />
      )}
    </>
  );

  if (disabled) {
    return (
      <span data-state="inactive" className={classes} aria-label={label}>
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      data-state={isActive ? 'active' : 'inactive'}
      className={classes}
      aria-label={label}
    >
      {content}
    </Link>
  );
}
