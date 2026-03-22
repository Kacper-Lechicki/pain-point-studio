'use client';

import React from 'react';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FlaskConical } from 'lucide-react';

import {
  SIDEBAR_NAV_ACTIVE,
  SIDEBAR_NAV_INACTIVE,
  SIDEBAR_NAV_ITEM_BASE,
  SIDEBAR_NAV_ITEM_CLASSES,
} from '@/features/dashboard/config/nav-styles';
import type { SubNavGroup } from '@/features/dashboard/config/navigation';
import {
  DYNAMIC_SIDEBAR_ITEMS,
  type NavItem,
  SIDEBAR_BOTTOM_ITEM,
  SIDEBAR_GIVE_FEEDBACK_ITEM,
  SIDEBAR_NAV,
  SIDEBAR_PROFILE_ITEM,
} from '@/features/dashboard/config/navigation';
import { useProjectsSubNavGroups } from '@/features/dashboard/hooks/use-projects-sub-nav-groups';
import {
  collectSearchParamKeys,
  findDynamicTab,
  findMostSpecificActiveHref,
  getSubItemHref,
  isSubItemActive,
  matchesNavItem,
  resolveDynamicLabel,
} from '@/features/dashboard/lib/nav-utils';
import { useRecentItems } from '@/hooks/common/use-recent-items';
import type { SubPanelAction, SubPanelLink } from '@/hooks/common/use-sub-panel-items';
import { Link } from '@/i18n/routing';
import type { MessageKey } from '@/i18n/types';
import { getSurveyStatsUrl } from '@/lib/common/urls/survey-urls';
import { cn } from '@/lib/common/utils';

const MOBILE_ACTION_VARIANT_CLASSES: Record<string, string | undefined> = {
  default: undefined,
  destructive: 'text-red-600/70 dark:text-red-400/70',
  warning: 'text-amber-700/70 dark:text-amber-400/70',
  accent: 'text-violet-600/70 dark:text-violet-400/70',
};

interface SubNavItemsProps {
  groups: SubNavGroup[];
  pathname: string;
  clientState: { search: string; hash: string } | null;
  t: (key: MessageKey) => string;
  onNavigate: () => void;
  parentHref?: string | undefined;
  breadcrumbSegments?: Record<string, string> | undefined;
  isDynamicItemActive?: boolean;
}

function SubNavItems({
  groups,
  pathname,
  clientState,
  t,
  onNavigate,
  parentHref,
  breadcrumbSegments,
  isDynamicItemActive = true,
}: SubNavItemsProps) {
  const searchParamKeys = collectSearchParamKeys(groups);
  const currentSearchParams = clientState ? new URLSearchParams(clientState.search) : null;
  const hash = clientState?.hash ?? '';
  const dynamicTab = findDynamicTab(parentHref, pathname);
  const dynamicLabel = resolveDynamicLabel(dynamicTab, pathname, breadcrumbSegments);
  const isDynamicActive = dynamicTab != null && dynamicLabel != null;
  const dynamicEntityId =
    dynamicTab != null ? pathname.slice(dynamicTab.prefix.length + 1).split('/')[0] : undefined;
  const dynamicBaseHref =
    dynamicTab != null && dynamicEntityId ? `${dynamicTab.prefix}/${dynamicEntityId}` : pathname;

  return (
    <nav className="flex flex-col gap-2 p-2" onClick={onNavigate}>
      {isDynamicActive ? (
        <div className="flex flex-col gap-2">
          <Link
            href={isDynamicItemActive ? pathname : dynamicBaseHref}
            className={cn(
              SIDEBAR_NAV_ITEM_BASE,
              isDynamicItemActive ? SIDEBAR_NAV_ACTIVE : SIDEBAR_NAV_INACTIVE
            )}
          >
            <dynamicTab.icon className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{dynamicLabel}</span>
          </Link>
        </div>
      ) : (
        groups.map((group, gi) => (
          <React.Fragment key={gi}>
            {group.headingKey && (
              <div className="flex min-h-8 items-center px-1">
                <span className="decoration-muted-foreground/50 text-sm font-semibold underline underline-offset-4">
                  {t(group.headingKey)}
                </span>
              </div>
            )}

            {group.items.length === 0 && group.emptyMessageKey && (
              <p className="text-muted-foreground/60 px-3 py-1 text-xs">
                {t(group.emptyMessageKey)}
              </p>
            )}

            <div className="flex flex-col gap-2">
              {group.items.map((subItem) => {
                const href = getSubItemHref(subItem);
                const itemLabel = subItem.label ?? t(subItem.labelKey!);

                if (subItem.disabled) {
                  return (
                    <span
                      key={href}
                      data-state="inactive"
                      className={cn(
                        SIDEBAR_NAV_ITEM_BASE,
                        SIDEBAR_NAV_INACTIVE,
                        'pointer-events-none opacity-50'
                      )}
                    >
                      <subItem.icon className="size-4 shrink-0" aria-hidden />
                      <span className="truncate">{itemLabel}</span>
                    </span>
                  );
                }

                const isActive =
                  clientState && currentSearchParams
                    ? isSubItemActive(subItem, pathname, hash, currentSearchParams, searchParamKeys)
                    : false;

                const stateClasses = isActive ? SIDEBAR_NAV_ACTIVE : SIDEBAR_NAV_INACTIVE;

                if (subItem.hash) {
                  return (
                    <a
                      key={href}
                      href={`#${subItem.hash}`}
                      className={cn(SIDEBAR_NAV_ITEM_BASE, stateClasses)}
                    >
                      <subItem.icon className="size-4 shrink-0" aria-hidden />
                      <span className="truncate">{itemLabel}</span>
                    </a>
                  );
                }

                return (
                  <Link key={href} href={href} className={cn(SIDEBAR_NAV_ITEM_BASE, stateClasses)}>
                    <subItem.icon className="size-4 shrink-0" aria-hidden />
                    <span className="truncate">{itemLabel}</span>
                  </Link>
                );
              })}
            </div>
          </React.Fragment>
        ))
      )}
    </nav>
  );
}

function MobileNavItem({
  item,
  isActive,
  t,
  onSubNavClick,
  onLinkClick,
}: {
  item: NavItem;
  isActive: boolean;
  t: (key: MessageKey) => string;
  onSubNavClick?: () => void;
  onLinkClick?: () => void;
}) {
  if (item.disabled) {
    return (
      <span
        data-state="inactive"
        className={cn(SIDEBAR_NAV_ITEM_CLASSES, 'pointer-events-none opacity-50')}
      >
        <item.icon className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{t(item.labelKey)}</span>
      </span>
    );
  }

  if (item.subNav) {
    return (
      <button
        type="button"
        data-state={isActive ? 'active' : 'inactive'}
        onClick={onSubNavClick}
        className={SIDEBAR_NAV_ITEM_CLASSES}
      >
        <item.icon className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{t(item.labelKey)}</span>
        <ChevronRight className="ml-auto size-4 opacity-50" />
      </button>
    );
  }

  return (
    <Link
      href={item.href}
      data-state={isActive ? 'active' : 'inactive'}
      onClick={onLinkClick}
      className={SIDEBAR_NAV_ITEM_CLASSES}
    >
      <item.icon className="size-4 shrink-0" aria-hidden />
      <span className="truncate">{t(item.labelKey)}</span>
    </Link>
  );
}

interface MobileNavMainLevelProps {
  pathname: string;
  t: (key: MessageKey) => string;
  onItemClick: (item: NavItem) => void;
  onClose: () => void;
}

export function MobileNavMainLevel({ pathname, t, onItemClick, onClose }: MobileNavMainLevelProps) {
  return (
    <>
      <nav className="flex flex-1 flex-col gap-2 px-2 pt-4">
        {SIDEBAR_NAV.map((group, gi) => (
          <div key={gi} className="flex flex-col gap-2">
            {group.items.map((item) => {
              const isActive = item.subNav
                ? matchesNavItem(pathname, item)
                : pathname === (item.activePrefix ?? item.href);

              return (
                <MobileNavItem
                  key={item.labelKey}
                  item={item}
                  isActive={isActive}
                  t={t}
                  onSubNavClick={() => onItemClick(item)}
                  onLinkClick={() => onItemClick(item)}
                />
              );
            })}
          </div>
        ))}

        {DYNAMIC_SIDEBAR_ITEMS.some((di) => pathname === di.path) && (
          <div className="mt-2 flex flex-col gap-2">
            {DYNAMIC_SIDEBAR_ITEMS.filter((di) => pathname === di.path).map((di) => (
              <Link
                key={di.path}
                href={di.path}
                data-state="active"
                onClick={() => onClose()}
                className={SIDEBAR_NAV_ITEM_CLASSES}
              >
                <di.icon className="size-4 shrink-0" aria-hidden />
                <span className="truncate">{t(di.labelKey)}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>

      <div className="mt-auto flex flex-col gap-2 px-2 pt-4 pb-6">
        {[SIDEBAR_PROFILE_ITEM, SIDEBAR_BOTTOM_ITEM, SIDEBAR_GIVE_FEEDBACK_ITEM].map((item) => {
          const isActive =
            pathname === (item.activePrefix ?? item.href) ||
            (item.activePrefix != null && pathname.startsWith(item.activePrefix + '/'));

          return (
            <MobileNavItem
              key={item.labelKey}
              item={item}
              isActive={isActive}
              t={t}
              onSubNavClick={() => onItemClick(item)}
              onLinkClick={() => onClose()}
            />
          );
        })}
      </div>
    </>
  );
}

interface MobileNavSubLevelProps {
  selectedItem: NavItem;
  pathname: string;
  clientState: { search: string; hash: string } | null;
  t: (key: MessageKey) => string;
  onBack: () => void;
  onNavigate: () => void;
  breadcrumbSegments?: Record<string, string> | undefined;
  subPanelLinks?: SubPanelLink[] | undefined;
  subPanelBottomLinks?: SubPanelLink[] | undefined;
  subPanelFooterLinks?: SubPanelLink[] | undefined;
  subPanelActions?: SubPanelAction[] | undefined;
  subPanelTitleKey?: MessageKey | undefined;
}

function MobileSubNavSkeleton() {
  return (
    <>
      <div className="px-2 pt-4">
        <div className="flex min-h-8 items-center gap-2 px-2.5">
          <div className="bg-muted size-4 shrink-0 animate-pulse rounded" />
          <div className="bg-muted h-3.5 w-24 animate-pulse rounded" />
        </div>
      </div>

      <div className="flex min-h-8 items-center px-3 pt-2">
        <div className="bg-muted h-3.5 w-28 animate-pulse rounded" />
      </div>

      <div className="flex flex-col gap-2 p-2">
        <div className="flex min-h-8 items-center gap-2 px-2.5">
          <div className="bg-muted size-4 shrink-0 animate-pulse rounded" />
          <div className="bg-muted h-3.5 w-32 animate-pulse rounded" />
        </div>
      </div>
    </>
  );
}

export function MobileNavSubLevel({
  selectedItem,
  pathname,
  clientState,
  t,
  onBack,
  onNavigate,
  breadcrumbSegments,
  subPanelLinks,
  subPanelBottomLinks,
  subPanelFooterLinks,
  subPanelActions,
  subPanelTitleKey,
}: MobileNavSubLevelProps) {
  const parentHref = selectedItem.activePrefix ?? selectedItem.href;
  const isProjectsNav = selectedItem.subNav?.titleKey === 'sidebar.projects';
  const enhancedGroups = useProjectsSubNavGroups(selectedItem.subNav!.groups, isProjectsNav);
  const dynamicTab = findDynamicTab(parentHref, pathname);
  const dynamicLabel = resolveDynamicLabel(dynamicTab, pathname, breadcrumbSegments);
  const dynamicProjectId =
    dynamicTab != null && dynamicTab.prefix === '/dashboard/projects'
      ? pathname.slice(dynamicTab.prefix.length + 1).split('/')[0]
      : undefined;
  const { items: recentSurveys } = useRecentItems('survey', {
    limit: 10,
    projectId: dynamicProjectId,
  });

  const isDynamicPending =
    dynamicTab != null && (dynamicLabel == null || !subPanelLinks || subPanelLinks.length === 0);

  if (isDynamicPending) {
    return <MobileSubNavSkeleton />;
  }

  const isDynamicActive = dynamicTab != null && dynamicLabel != null;
  const hasCustomTitle = isDynamicActive && subPanelTitleKey != null;
  const enabledBottomLinkHrefs =
    subPanelBottomLinks?.filter((link) => !link.disabled).map((link) => link.href) ?? [];
  const enabledFooterLinkHrefs =
    subPanelFooterLinks?.filter((link) => !link.disabled).map((link) => link.href) ?? [];
  const activeBottomHref = findMostSpecificActiveHref(pathname, enabledBottomLinkHrefs);
  const activeFooterHref = findMostSpecificActiveHref(pathname, enabledFooterLinkHrefs);
  const hasActiveBottomLink =
    isDynamicActive && (activeBottomHref != null || activeFooterHref != null);
  const resolvedTitleKey = hasCustomTitle
    ? subPanelTitleKey
    : isDynamicActive && dynamicTab.titleKey
      ? dynamicTab.titleKey
      : selectedItem.subNav!.titleKey;

  const renderSubPanelLink = (link: SubPanelLink, isActive = false) =>
    link.disabled ? (
      <span
        key={link.href + link.label}
        data-state="inactive"
        className={cn(SIDEBAR_NAV_ITEM_CLASSES, 'pointer-events-none opacity-50')}
      >
        <link.icon className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{link.label}</span>
      </span>
    ) : (
      <Link
        key={link.href + link.label}
        href={link.href}
        data-state={isActive ? 'active' : 'inactive'}
        className={SIDEBAR_NAV_ITEM_CLASSES}
        onClick={onNavigate}
      >
        <link.icon className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{link.label}</span>
      </Link>
    );

  return (
    <>
      <div className="px-2 pt-4">
        {isDynamicActive && subPanelLinks && subPanelLinks.length > 0 ? (
          <div className="flex flex-col gap-2">
            {subPanelLinks.map((link) => renderSubPanelLink(link))}
          </div>
        ) : (
          <button
            type="button"
            onClick={onBack}
            data-state="inactive"
            className={SIDEBAR_NAV_ITEM_CLASSES}
          >
            <ChevronLeft className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{t('common.actions.back')}</span>
          </button>
        )}
      </div>

      <div className="flex min-h-8 items-center px-3 pt-2">
        <h3 className="decoration-muted-foreground/50 text-sm font-semibold underline underline-offset-4">
          {t(resolvedTitleKey)}
        </h3>
      </div>

      {isDynamicActive ? (
        !hasCustomTitle && (
          <SubNavItems
            groups={enhancedGroups}
            pathname={pathname}
            clientState={clientState}
            t={t}
            onNavigate={onNavigate}
            parentHref={parentHref}
            breadcrumbSegments={breadcrumbSegments}
            isDynamicItemActive={!hasActiveBottomLink}
          />
        )
      ) : (
        <SubNavItems
          groups={enhancedGroups}
          pathname={pathname}
          clientState={clientState}
          t={t}
          onNavigate={onNavigate}
          parentHref={parentHref}
          breadcrumbSegments={breadcrumbSegments}
        />
      )}

      {isDynamicActive && subPanelBottomLinks && subPanelBottomLinks.length > 0 && (
        <div className="flex flex-col gap-2 px-2">
          {subPanelBottomLinks.map((link) =>
            renderSubPanelLink(link, !link.disabled && activeBottomHref === link.href)
          )}
        </div>
      )}

      {isDynamicActive && subPanelActions && subPanelActions.length > 0 && (
        <div className="flex flex-col gap-2 px-2 pt-2">
          <div className="flex min-h-8 items-center px-1">
            <span className="decoration-muted-foreground/50 text-sm font-semibold underline underline-offset-4">
              {t('sidebar.quickActions' as MessageKey)}
            </span>
          </div>

          <div className="flex flex-col gap-2" onClick={onNavigate}>
            {subPanelActions.map((action) => (
              <button
                key={action.label}
                type="button"
                data-state="inactive"
                className={cn(
                  SIDEBAR_NAV_ITEM_CLASSES,
                  MOBILE_ACTION_VARIANT_CLASSES[action.variant ?? 'default']
                )}
                onClick={action.onClick}
                disabled={action.disabled}
              >
                <action.icon className="size-4 shrink-0" aria-hidden />
                <span className="truncate">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {isDynamicActive && !hasCustomTitle && dynamicProjectId && (
        <div className="flex flex-col gap-2 px-2 pt-2">
          <div className="flex min-h-8 items-center px-1">
            <span className="decoration-muted-foreground/50 text-sm font-semibold underline underline-offset-4">
              {t('sidebar.recentSurveys' as MessageKey)}
            </span>
          </div>

          {recentSurveys.length === 0 ? (
            <p className="text-muted-foreground/60 px-3 py-1 text-xs">
              {t('sidebar.noRecentSurveys' as MessageKey)}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {recentSurveys.map((survey) =>
                renderSubPanelLink(
                  {
                    label: survey.label,
                    href: getSurveyStatsUrl(survey.id),
                    icon: FlaskConical,
                  },
                  pathname === getSurveyStatsUrl(survey.id)
                )
              )}
            </div>
          )}
        </div>
      )}

      {isDynamicActive && subPanelFooterLinks && subPanelFooterLinks.length > 0 && (
        <div className="mt-auto flex flex-col gap-2 px-2 pt-4 pb-6">
          {subPanelFooterLinks.map((link) =>
            renderSubPanelLink(link, !link.disabled && activeFooterHref === link.href)
          )}
        </div>
      )}
    </>
  );
}
