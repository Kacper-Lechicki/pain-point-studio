'use client';

import type { CSSProperties } from 'react';

import { ChevronRight, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { AppRoute } from '@/config/routes';
import { Link, usePathname } from '@/i18n/routing';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

/**
 * Base styling shared across both collapsed & expanded states.
 * Layout props (width, padding, gap, justify) are set via inline styles
 * so CSS transition can smoothly animate between states.
 */
const BASE_CLASSES =
  'flex items-center rounded-lg border border-transparent text-sm font-medium whitespace-nowrap transition-all duration-200 ease-in-out ' +
  'text-sidebar-foreground/70 ' +
  'data-[state=active]:bg-sidebar-accent data-[state=active]:text-sidebar-foreground data-[state=active]:border-sidebar-primary data-[state=active]:border-solid ' +
  'data-[state=inactive]:md:hover:text-sidebar-foreground data-[state=inactive]:md:hover:border-sidebar-foreground/25 data-[state=inactive]:md:hover:border-dashed';

const EXPANDED_STYLE: CSSProperties = {
  minHeight: undefined, // handled by Tailwind min-h-10 md:min-h-9
  width: '100%',
  paddingLeft: 12,
  paddingRight: 12,
  gap: 10,
  justifyContent: 'flex-start',
};

const COLLAPSED_STYLE: CSSProperties = {
  width: 36,
  height: 36,
  paddingLeft: 0,
  paddingRight: 0,
  gap: 0,
  justifyContent: 'center',
};

interface SidebarItemProps {
  labelKey: MessageKey;
  icon: LucideIcon;
  href: AppRoute;
  isExpanded: boolean;
  hasSubNav?: boolean | undefined;
  disabled?: boolean | undefined;
}

export function SidebarItem({
  labelKey,
  icon: Icon,
  href,
  isExpanded,
  hasSubNav,
  disabled,
}: SidebarItemProps) {
  const pathname = usePathname();
  const t = useTranslations();

  const isActive = hasSubNav
    ? pathname === href || pathname.startsWith(href + '/')
    : pathname === href;

  const label = t(labelKey);

  const classes = cn(
    BASE_CLASSES,
    isExpanded ? 'min-h-10 md:min-h-9' : 'size-9',
    disabled && 'opacity-50 pointer-events-none'
  );

  const style = isExpanded ? EXPANDED_STYLE : COLLAPSED_STYLE;

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
      {isExpanded && hasSubNav && (
        <ChevronRight className="size-4 shrink-0 opacity-50" aria-hidden />
      )}
    </>
  );

  if (disabled) {
    return (
      <span data-state="inactive" className={classes} style={style} aria-label={label}>
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      data-state={isActive ? 'active' : 'inactive'}
      className={classes}
      style={style}
      aria-label={label}
    >
      {content}
    </Link>
  );
}
