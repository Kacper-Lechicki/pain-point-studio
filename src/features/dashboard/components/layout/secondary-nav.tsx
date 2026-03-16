'use client';

import { useSearchParams } from 'next/navigation';

import { NotebookPen } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { SIDEBAR_NAV_ITEM_CLASSES } from '@/features/dashboard/config/nav-styles';
import type { SubNavConfig } from '@/features/dashboard/config/navigation';
import { useHashSync } from '@/features/dashboard/hooks/use-hash-sync';
import { useProjectsSubNavGroups } from '@/features/dashboard/hooks/use-projects-sub-nav-groups';
import {
  collectSearchParamKeys,
  findDynamicTab,
  getSubItemHref,
  isSubItemActive,
  resolveDynamicLabel,
} from '@/features/dashboard/lib/nav-utils';
import { useBreadcrumbContext } from '@/hooks/common/use-breadcrumb';
import { useRecentItems } from '@/hooks/common/use-recent-items';
import { useSubPanelItems } from '@/hooks/common/use-sub-panel-items';
import { Link, usePathname } from '@/i18n/routing';
import type { MessageKey } from '@/i18n/types';
import { getSurveyStatsUrl } from '@/lib/common/urls/survey-urls';
import { cn } from '@/lib/common/utils';

function SecondaryNavSkeleton() {
  return (
    <>
      <div className="flex flex-col gap-1.5 px-2 pt-4">
        <div className="flex min-h-8 items-center gap-2 px-2.5">
          <div className="bg-sidebar-foreground/10 size-4 shrink-0 animate-pulse rounded" />
          <div className="bg-sidebar-foreground/10 h-3.5 w-24 animate-pulse rounded" />
        </div>
      </div>

      <div className="shrink-0 pt-2">
        <div className="flex min-h-8 items-center px-3">
          <div className="bg-sidebar-foreground/10 h-3.5 w-28 animate-pulse rounded" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 px-2 pt-1.5">
        <div className="flex min-h-8 items-center gap-2 px-2.5">
          <div className="bg-sidebar-foreground/10 size-4 shrink-0 animate-pulse rounded" />
          <div className="bg-sidebar-foreground/10 h-3.5 w-32 animate-pulse rounded" />
        </div>
      </div>
    </>
  );
}

function SubPanelLinkItem({
  link,
  isActive,
}: {
  link: {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    disabled?: boolean;
  };
  isActive?: boolean;
}) {
  if (link.disabled) {
    return (
      <span
        data-state="inactive"
        className={cn(SIDEBAR_NAV_ITEM_CLASSES, 'pointer-events-none opacity-50')}
      >
        <link.icon className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{link.label}</span>
      </span>
    );
  }

  return (
    <Link
      href={link.href}
      data-state={isActive ? 'active' : 'inactive'}
      className={SIDEBAR_NAV_ITEM_CLASSES}
    >
      <link.icon className="size-4 shrink-0" aria-hidden />
      <span className="truncate">{link.label}</span>
    </Link>
  );
}

interface SecondaryNavProps {
  titleKey: MessageKey;
  groups: SubNavConfig['groups'];
  parentHref?: string | undefined;
}

export function SecondaryNav({ titleKey, groups, parentHref }: SecondaryNavProps) {
  const pathname = usePathname();
  const nextSearchParams = useSearchParams();
  const hash = useHashSync();
  const t = useTranslations();
  const breadcrumb = useBreadcrumbContext();
  const subPanelItems = useSubPanelItems();
  const enhancedGroups = useProjectsSubNavGroups(groups, titleKey === 'sidebar.projects');
  const searchString = nextSearchParams.toString();
  const currentSearchParams = new URLSearchParams(searchString);
  const searchParamKeys = collectSearchParamKeys(enhancedGroups);
  const dynamicTab = findDynamicTab(parentHref, pathname);

  const dynamicLabel = resolveDynamicLabel(dynamicTab, pathname, breadcrumb?.segments);

  const dynamicProjectId =
    dynamicTab != null && dynamicTab.prefix === '/dashboard/projects'
      ? pathname.slice(dynamicTab.prefix.length + 1).split('/')[0]
      : undefined;

  const { items: recentSurveys } = useRecentItems('survey', {
    limit: 10,
    projectId: dynamicProjectId,
  });

  const isDynamicPending =
    dynamicTab != null &&
    (dynamicLabel == null || !subPanelItems || subPanelItems.links.length === 0);

  if (isDynamicPending) {
    return <SecondaryNavSkeleton />;
  }

  const isDynamicActive = dynamicTab != null && dynamicLabel != null;

  const hasActiveBottomLink =
    isDynamicActive &&
    (subPanelItems?.bottomLinks.some((l) => !l.disabled && pathname === l.href) ?? false);

  const resolvedTitleKey = isDynamicActive && dynamicTab.titleKey ? dynamicTab.titleKey : titleKey;

  if (isDynamicActive) {
    return (
      <>
        {subPanelItems && subPanelItems.links.length > 0 && (
          <div className="flex flex-col gap-1.5 px-2 pt-4">
            {subPanelItems.links.map((link) => (
              <SubPanelLinkItem key={link.href} link={link} />
            ))}
          </div>
        )}

        <div className={cn('shrink-0', subPanelItems?.links.length ? 'pt-2' : 'pt-4')}>
          <div className="flex min-h-8 items-center px-3">
            <h2 className="text-sidebar-foreground decoration-sidebar-foreground/35 text-sm font-semibold underline underline-offset-4">
              {t(resolvedTitleKey)}
            </h2>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-2 pt-1.5 pb-3">
          <div className="flex flex-col gap-1.5">
            <Link
              href={
                hasActiveBottomLink
                  ? `${dynamicTab.prefix}/${pathname.slice(dynamicTab.prefix.length + 1).split('/')[0]}`
                  : pathname
              }
              data-state={hasActiveBottomLink ? 'inactive' : 'active'}
              className={SIDEBAR_NAV_ITEM_CLASSES}
            >
              <dynamicTab.icon className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{dynamicLabel}</span>
            </Link>
          </div>

          {subPanelItems && subPanelItems.bottomLinks.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {subPanelItems.bottomLinks.map((link) => (
                <SubPanelLinkItem
                  key={link.href + link.label}
                  link={link}
                  isActive={!link.disabled && pathname === link.href}
                />
              ))}
            </div>
          )}

          {dynamicProjectId && (
            <div>
              <div className="text-sidebar-foreground decoration-sidebar-foreground/35 mt-4 mb-1 px-2.5 text-sm font-semibold underline underline-offset-4">
                {t('sidebar.recentSurveys' as MessageKey)}
              </div>

              {recentSurveys.length === 0 ? (
                <p className="text-sidebar-foreground/40 px-2.5 py-1 text-xs">
                  {t('sidebar.noRecentSurveys' as MessageKey)}
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {recentSurveys.map((survey) => (
                    <SubPanelLinkItem
                      key={survey.id}
                      link={{
                        label: survey.label,
                        href: getSurveyStatsUrl(survey.id),
                        icon: NotebookPen,
                      }}
                      isActive={pathname === getSurveyStatsUrl(survey.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {subPanelItems && subPanelItems.footerLinks.length > 0 && (
            <div className="mt-auto flex flex-col gap-1.5 pt-4">
              {subPanelItems.footerLinks.map((link) => (
                <SubPanelLinkItem
                  key={link.href + link.label}
                  link={link}
                  isActive={!link.disabled && pathname === link.href}
                />
              ))}
            </div>
          )}
        </nav>
      </>
    );
  }

  return (
    <>
      <div className="shrink-0 pt-4">
        <div className="flex min-h-8 items-center px-3">
          <h2 className="text-sidebar-foreground decoration-sidebar-foreground/35 text-sm font-semibold underline underline-offset-4">
            {t(resolvedTitleKey)}
          </h2>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-2 pt-1.5 pb-3">
        {enhancedGroups.map((group, gi) => (
          <div key={gi}>
            {group.headingKey && (
              <div
                className={cn(
                  'text-sidebar-foreground decoration-sidebar-foreground/35 mb-1 px-2.5 text-sm font-semibold underline underline-offset-4',
                  gi === 0 ? 'mt-0' : 'mt-4'
                )}
              >
                {t(group.headingKey)}
              </div>
            )}

            {group.items.length === 0 && group.emptyMessageKey && (
              <p className="text-sidebar-foreground/40 px-2.5 py-1 text-xs">
                {t(group.emptyMessageKey)}
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              {group.items.map((item) => {
                const href = getSubItemHref(item);
                const itemLabel = item.label ?? t(item.labelKey!);

                if (item.disabled) {
                  return (
                    <span
                      key={href}
                      data-state="inactive"
                      className={cn(SIDEBAR_NAV_ITEM_CLASSES, 'pointer-events-none opacity-50')}
                    >
                      <item.icon className="size-4 shrink-0" aria-hidden />
                      <span className="truncate">{itemLabel}</span>
                    </span>
                  );
                }

                const isActive = isSubItemActive(
                  item,
                  pathname,
                  hash,
                  currentSearchParams,
                  searchParamKeys
                );

                if (item.hash) {
                  return (
                    <a
                      key={href}
                      href={`#${item.hash}`}
                      data-state={isActive ? 'active' : 'inactive'}
                      className={SIDEBAR_NAV_ITEM_CLASSES}
                    >
                      <item.icon className="size-4 shrink-0" aria-hidden />
                      <span className="truncate">{itemLabel}</span>
                    </a>
                  );
                }

                return (
                  <Link
                    key={href}
                    href={href}
                    data-state={isActive ? 'active' : 'inactive'}
                    className={SIDEBAR_NAV_ITEM_CLASSES}
                  >
                    <item.icon className="size-4 shrink-0" aria-hidden />
                    <span className="truncate">{itemLabel}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </>
  );
}
