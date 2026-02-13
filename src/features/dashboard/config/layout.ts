import type { AppRoute } from '@/config/routes';
import { ROUTES } from '@/config/routes';
import { locales } from '@/i18n/constants';

/** Path prefix for survey builder (edit questions). Builder uses a standalone full-screen layout. */
export const BUILDER_PATH_PREFIX = '/dashboard/surveys/new/';

export function isBuilderPath(pathname: string | null): boolean {
  return (
    pathname?.startsWith(BUILDER_PATH_PREFIX) === true &&
    pathname.length > BUILDER_PATH_PREFIX.length
  );
}

export interface DashboardBackConfig {
  fallbackHref: AppRoute;
}

/**
 * Central config: which dashboard (and related) pages show a back button in the top-left.
 * Back button is rendered at the same vertical height as the first sidebar item.
 */
export function getDashboardBackConfig(pathname: string | null): DashboardBackConfig | null {
  if (!pathname) {
    return null;
  }

  if (pathname.startsWith('/dashboard/surveys/stats/')) {
    return { fallbackHref: ROUTES.dashboard.surveys };
  }

  if (/^\/dashboard\/surveys\/[^/]+$/.test(pathname)) {
    return { fallbackHref: ROUTES.dashboard.surveys };
  }

  if (pathname === '/profile/preview') {
    return { fallbackHref: ROUTES.settings.profile };
  }

  return null;
}

// ── Sidebar / panel widths ──────────────────────────────────────────
// Single source of truth. Actual pixel values live in CSS vars (globals.css):
//   --sidebar-width-collapsed: 48px
//   --sidebar-width-expanded:  224px
//   --sidebar-sub-panel-width: 224px

/** Tailwind class for sidebar sub-panel width. */
export const SIDEBAR_SUB_PANEL_WIDTH_CLASS = 'w-[var(--sidebar-sub-panel-width)]';

/** Builder side-panels share the same width for visual symmetry. */
export const BUILDER_PANEL_WIDTH_CLASS = 'min-w-72 max-w-72';

/** Right-hand settings panel in builder is wider for editing comfort. */
export const BUILDER_SETTINGS_PANEL_WIDTH_CLASS = 'min-w-72 max-w-72';

// ── Content area ────────────────────────────────────────────────────

export const DASHBOARD_CONTENT_PADDING = 'px-4 pt-6 pb-20 sm:px-6 md:pb-8 lg:px-8';
export const DASHBOARD_CONTENT_MAX_WIDTH = 'max-w-7xl';
export const DASHBOARD_PAGE_BODY_GAP = 'mb-8';
export const DASHBOARD_PAGE_BODY_GAP_TOP = 'mt-8';

export type DashboardContentWidth = 'narrow' | 'content' | 'full';

function pathWithoutLocale(pathname: string): string {
  const segment = pathname.split('/')[1];

  if (segment && (locales as readonly string[]).includes(segment)) {
    return '/' + pathname.split('/').slice(2).join('/') || '/';
  }

  return pathname;
}

function isFullWidthPath(pathname: string): boolean {
  const path = pathWithoutLocale(pathname);

  return (
    path === '/dashboard/surveys' ||
    path === '/dashboard/surveys/archive' ||
    path.startsWith('/dashboard/surveys/archive/')
  );
}

function isNarrowPath(pathname: string): boolean {
  const path = pathWithoutLocale(pathname);

  if (path === '/dashboard/surveys/new' || path.startsWith('/dashboard/surveys/new/')) {
    return true;
  }

  if (/^\/dashboard\/surveys\/[^/]+$/.test(path) && path !== '/dashboard/surveys/archive') {
    return true;
  }

  if (
    path === '/settings' ||
    path.startsWith('/settings/') ||
    path === '/profile' ||
    path.startsWith('/profile/')
  ) {
    return true;
  }

  return false;
}

/**
 * Content width per route: full (list views, archive), content (default), narrow (forms/settings).
 * Used by DashboardContent to wrap children in DashboardContentArea with the right max-width.
 */
export function getDashboardContentMaxWidth(pathname: string | null): DashboardContentWidth {
  if (!pathname) {
    return 'content';
  }

  if (isNarrowPath(pathname)) {
    return 'narrow';
  }

  if (isFullWidthPath(pathname)) {
    return 'full';
  }

  return 'content';
}
