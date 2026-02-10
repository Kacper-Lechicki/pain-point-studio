'use client';

import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { AppRoute } from '@/config/routes';
import { Link, usePathname } from '@/i18n/routing';
import type { MessageKey } from '@/i18n/types';

interface SidebarItemProps {
  labelKey: MessageKey;
  icon: LucideIcon;
  href: AppRoute;
  isExpanded: boolean;
}

export function SidebarItem({ labelKey, icon: Icon, href, isExpanded }: SidebarItemProps) {
  const pathname = usePathname();
  const t = useTranslations();
  const isActive = pathname === href;
  const label = t(labelKey);

  const color = isActive
    ? 'bg-sidebar-accent text-sidebar-foreground border-sidebar-primary border-solid'
    : 'border-transparent text-sidebar-foreground/70 md:hover:border-dashed md:hover:border-sidebar-foreground/25 md:hover:text-sidebar-foreground';

  const link = (
    <Link
      href={href}
      className={`flex min-h-10 w-full items-center ${isExpanded ? 'justify-start' : 'justify-center'} rounded-lg border text-sm font-medium transition-colors md:min-h-9 ${color}`}
    >
      <div className="flex w-9 shrink-0 items-center justify-center">
        <Icon className="size-4 shrink-0" />
      </div>
      <span
        className={`truncate whitespace-nowrap transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}
      >
        {label}
      </span>
    </Link>
  );

  if (isExpanded) {
    return link;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
